#!/usr/bin/env python3

import json
import re
import sys
from pathlib import Path
from urllib.parse import urlsplit

REQUIRED_KEYS = {
    "DATABASE_URL",
    "R2_ENDPOINT",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET_NAME",
    "R2_PUBLIC_URL",
    "BETTER_AUTH_SECRET",
    "BETTER_AUTH_URL",
    "NEXT_PUBLIC_APP_URL",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "CLOUDFLARE_TURNSTILE_SECRET_KEY",
    "NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY",
}


def load_parameters(payload: object) -> dict[str, str]:
    if not isinstance(payload, dict) or not isinstance(payload.get("Parameters"), list):
        raise ValueError("The AWS response does not contain a Parameters list.")

    values: dict[str, str] = {}
    for parameter in payload["Parameters"]:
        if not isinstance(parameter, dict):
            raise ValueError("Every SSM parameter must be an object.")
        name = parameter.get("Name", "")
        value = parameter.get("Value")
        if not isinstance(name, str):
            raise ValueError("Every SSM parameter must have a string name.")
        key = name.rsplit("/", 1)[-1]
        if not re.fullmatch(r"[A-Z][A-Z0-9_]*", key):
            raise ValueError(f"Invalid environment key derived from SSM parameter: {name}")
        if key in values:
            raise ValueError(f"Duplicate environment key below the SSM path: {key}")
        if not isinstance(value, str) or any(character in value for character in "\x00\r\n"):
            raise ValueError(f"SSM parameter must contain a single-line string: {name}")
        values[key] = value
    return values


def validate_values(values: dict[str, str]) -> None:
    missing = sorted(key for key in REQUIRED_KEYS if not values.get(key))
    if missing:
        raise ValueError("Missing required SSM parameters: " + ", ".join(missing))

    for key in (
        "DATABASE_URL",
        "R2_ENDPOINT",
        "R2_PUBLIC_URL",
        "BETTER_AUTH_URL",
        "NEXT_PUBLIC_APP_URL",
    ):
        parsed = urlsplit(values[key])
        if not parsed.scheme or not parsed.netloc:
            raise ValueError(f"{key} must be an absolute URL.")

    auth_url = urlsplit(values["BETTER_AUTH_URL"])
    public_url = urlsplit(values["NEXT_PUBLIC_APP_URL"])
    if auth_url.scheme not in {"http", "https"} or public_url.scheme not in {"http", "https"}:
        raise ValueError("Authentication URLs must use HTTP or HTTPS.")
    auth_origin = (auth_url.scheme.lower(), auth_url.hostname, auth_url.port)
    public_origin = (public_url.scheme.lower(), public_url.hostname, public_url.port)
    if auth_origin != public_origin:
        raise ValueError("BETTER_AUTH_URL and NEXT_PUBLIC_APP_URL must use the same public origin.")

    if len(values["BETTER_AUTH_SECRET"]) < 32:
        raise ValueError("BETTER_AUTH_SECRET must contain at least 32 characters.")

    telegram_keys = ("TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID", "TELEGRAM_WEBHOOK_SECRET")
    telegram_values = [bool(values.get(key)) for key in telegram_keys]
    if any(telegram_values) and not all(telegram_values):
        raise ValueError(
            "Telegram bot token, chat ID, and webhook secret must be configured together."
        )


def quote_for_compose(value: str) -> str:
    return "'" + value.replace("\\", "\\\\").replace("'", "\\'") + "'"


def convert(payload: object, image_reference: str) -> str:
    if not re.fullmatch(
        r"ghcr\.io/[a-z0-9._/-]+@sha256:[0-9a-f]{64}", image_reference
    ):
        raise ValueError("The image must be an immutable lowercase GHCR digest reference.")

    values = load_parameters(payload)
    validate_values(values)
    values["SEDEKAHJE_IMAGE"] = image_reference
    return "".join(
        f"{key}={quote_for_compose(values[key])}\n" for key in sorted(values)
    )


def main() -> int:
    if len(sys.argv) != 4:
        print(
            "Usage: ssm_to_compose_env.py <parameters.json> <output.env> <image@digest>",
            file=sys.stderr,
        )
        return 64

    source_path, output_path, image_reference = sys.argv[1:]
    try:
        payload = json.loads(Path(source_path).read_text(encoding="utf-8"))
        rendered = convert(payload, image_reference)
        Path(output_path).write_text(rendered, encoding="utf-8", newline="\n")
    except (OSError, ValueError, json.JSONDecodeError) as error:
        print(error, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
