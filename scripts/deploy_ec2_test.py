import os
import re
import subprocess
import tempfile
import textwrap
import unittest
from pathlib import Path


IMAGE = "ghcr.io/khrnchn/sedekah-je@sha256:" + ("a" * 64)


class DeployEc2Tests(unittest.TestCase):
    def setUp(self) -> None:
        self.repository_root = Path(__file__).resolve().parent.parent
        self.script = self.repository_root / "scripts" / "deploy-ec2.sh"
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary_directory.cleanup)
        self.temp_path = Path(self.temporary_directory.name)
        self.bin_path = self.temp_path / "bin"
        self.bin_path.mkdir()
        self.log_path = self.temp_path / "calls.log"
        self._write_executable(
            "docker",
            """
            #!/usr/bin/env bash
            set -eu
            if [[ $1 == compose && $2 == version && $3 == --short ]]; then
                printf '%s\n' '2.27.1'
                exit 0
            fi
            if [[ $1 == login ]]; then
                IFS= read -r token
                [[ $token == "$EXPECTED_GHCR_TOKEN" ]]
                printf 'docker=%s\n' "$*" >> "$DEPLOY_TEST_LOG"
                printf 'docker_config=%s\n' "$DOCKER_CONFIG" >> "$DEPLOY_TEST_LOG"
                exit 0
            fi
            printf 'unexpected docker invocation: %s\n' "$*" >&2
            exit 97
            """,
        )
        self._write_executable(
            "aws",
            """
            #!/usr/bin/env bash
            set -eu
            printf 'aws=%s\n' "$*" >> "$DEPLOY_TEST_LOG"
            exit 23
            """,
        )

    def _write_executable(self, name: str, contents: str) -> None:
        path = self.bin_path / name
        path.write_text(textwrap.dedent(contents).lstrip(), encoding="utf-8")
        path.chmod(0o755)

    def _run(self, token: str, username: str = "deploy-user") -> subprocess.CompletedProcess:
        environment = os.environ.copy()
        environment.update(
            {
                "DEPLOY_TEST_LOG": str(self.log_path),
                "EXPECTED_GHCR_TOKEN": "read-only-token",
                "GHCR_PULL_USERNAME": username,
                "PATH": f"{self.bin_path}{os.pathsep}{environment['PATH']}",
            }
        )
        return subprocess.run(
            [
                str(self.script),
                "ap-southeast-5",
                "/sedekah-je/prod",
                IMAGE,
            ],
            input=token,
            capture_output=True,
            text=True,
            check=False,
            cwd=self.repository_root,
            env=environment,
        )

    def test_uses_stdin_token_in_temporary_docker_config_and_cleans_up(self) -> None:
        result = self._run("read-only-token\n")

        self.assertEqual(result.returncode, 23)
        self.assertNotIn("read-only-token", result.stdout + result.stderr)
        calls = self.log_path.read_text(encoding="utf-8")
        self.assertIn(
            "docker=login ghcr.io --username deploy-user --password-stdin",
            calls,
        )
        self.assertIn("aws=ssm get-parameters-by-path", calls)
        match = re.search(r"^docker_config=(.+)$", calls, re.MULTILINE)
        self.assertIsNotNone(match)
        docker_config = Path(match.group(1))
        self.assertRegex(docker_config.name, r"^sedekah-je-docker\.")
        self.assertFalse(docker_config.exists())

    def test_rejects_missing_stdin_token_before_registry_or_aws_access(self) -> None:
        result = self._run("")

        self.assertEqual(result.returncode, 64)
        self.assertIn("pull token must be provided", result.stderr)
        self.assertFalse(self.log_path.exists())

    def test_rejects_invalid_registry_username_before_external_access(self) -> None:
        result = self._run("read-only-token\n", username="invalid/user")

        self.assertEqual(result.returncode, 64)
        self.assertIn("valid GitHub username", result.stderr)
        self.assertFalse(self.log_path.exists())


if __name__ == "__main__":
    unittest.main()
