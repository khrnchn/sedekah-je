#!/usr/bin/env bash

set -Eeuo pipefail

usage() {
	echo "Usage: deploy-ec2.sh <aws-region> <ssm-parameter-path> <image@sha256:digest>" >&2
}

if (( $# != 3 )); then
	usage
	exit 64
fi

aws_region=$1
ssm_parameter_path=$2
image_reference=$3
script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
app_dir=$(cd -- "$script_dir/.." && pwd)
compose_file="$app_dir/compose.yaml"
previous_compose_file="$app_dir/compose.yaml.previous"

[[ $aws_region =~ ^[a-z]{2}(-gov)?-[a-z]+-[0-9]+$ ]] || {
	echo "Invalid AWS region: $aws_region" >&2
	exit 64
}
[[ $ssm_parameter_path =~ ^/[A-Za-z0-9_.~/-]+$ ]] || {
	echo "Invalid SSM parameter path: $ssm_parameter_path" >&2
	exit 64
}
[[ $image_reference =~ ^ghcr\.io/[a-z0-9._/-]+@sha256:[0-9a-f]{64}$ ]] || {
	echo "The image must be an immutable lowercase GHCR digest reference." >&2
	exit 64
}
[[ -f $compose_file ]] || {
	echo "Compose file not found: $compose_file" >&2
	exit 66
}

for command_name in aws docker python3; do
	command -v "$command_name" >/dev/null 2>&1 || {
		echo "Required command is not installed: $command_name" >&2
		exit 69
	}
done

compose_version=$(docker compose version --short | sed 's/^v//')
python3 - "$compose_version" <<'PY'
import re
import sys

match = re.match(r"^(\d+)\.(\d+)\.(\d+)", sys.argv[1])
if not match or tuple(map(int, match.groups())) < (2, 20, 2):
    raise SystemExit("Docker Compose 2.20.2 or newer is required.")
PY

umask 077
parameters_json=$(mktemp /tmp/sedekah-je-ssm.XXXXXX.json)
runtime_env=$(mktemp /tmp/sedekah-je-env.XXXXXX)

cleanup() {
	rm -f -- "$parameters_json" "$runtime_env"
}
trap cleanup EXIT

aws ssm get-parameters-by-path \
	--region "$aws_region" \
	--path "$ssm_parameter_path" \
	--recursive \
	--with-decryption \
	--output json >"$parameters_json"

python3 "$script_dir/ssm_to_compose_env.py" \
	"$parameters_json" "$runtime_env" "$image_reference"

compose() {
	docker compose --env-file "$runtime_env" --file "$compose_file" "$@"
}

compose config --quiet

current_container=$(compose ps --quiet app 2>/dev/null || true)
previous_image=""
if [[ -n $current_container ]]; then
	previous_image=$(docker inspect --format '{{.Config.Image}}' "$current_container")
fi

max_pull_attempts=5
for (( attempt = 1; attempt <= max_pull_attempts; attempt += 1 )); do
	if compose pull app; then
		break
	fi
	if (( attempt == max_pull_attempts )); then
		echo "Image pull failed after $attempt attempts." >&2
		exit 1
	fi
	delay=$((attempt * 10))
	echo "Image pull attempt $attempt failed; retrying in ${delay}s." >&2
	sleep "$delay"
done

if ! compose up --detach --remove-orphans --wait --wait-timeout 180 app; then
	echo "Deployment failed. Recent application logs:" >&2
	compose logs --tail 200 app >&2 || true

	if [[ -n $previous_image && $previous_image != "$image_reference" ]]; then
		echo "Attempting rollback to $previous_image" >&2
		printf "SEDEKAHJE_IMAGE='%s'\n" "$previous_image" >>"$runtime_env"
		if [[ -f $previous_compose_file ]] \
			&& grep -q 'SEDEKAHJE_IMAGE' "$previous_compose_file" \
			&& docker compose --env-file "$runtime_env" --file "$previous_compose_file" config --quiet; then
			compose_file=$previous_compose_file
		fi
		if compose up --detach --remove-orphans --wait --wait-timeout 180 app; then
			echo "Rollback succeeded; the new deployment remains failed." >&2
		else
			echo "Rollback failed. Manual intervention is required." >&2
			compose logs --tail 200 app >&2 || true
		fi
	fi
	exit 1
fi

running_container=$(compose ps --quiet app)
running_image=$(docker inspect --format '{{.Config.Image}}' "$running_container")
if [[ $running_image != "$image_reference" ]]; then
	echo "Running image mismatch: expected $image_reference, found $running_image" >&2
	exit 1
fi

compose ps
