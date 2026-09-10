import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

from scripts.ssm_to_compose_env import (
    convert,
    load_parameters,
    quote_for_compose,
    validate_values,
)

IMAGE = "ghcr.io/khrnchn/sedekah-je@sha256:" + ("a" * 64)


def valid_values() -> dict[str, str]:
    return {
        "DATABASE_URL": "postgresql://user:password@db.example.test/database",
        "R2_ENDPOINT": "https://account.r2.cloudflarestorage.com",
        "R2_ACCESS_KEY_ID": "access-key",
        "R2_SECRET_ACCESS_KEY": "secret with $dollar #hash, backslash \\ and 'quote'",
        "R2_BUCKET_NAME": "bucket",
        "R2_PUBLIC_URL": "https://uploads.example.test",
        "BETTER_AUTH_SECRET": "x" * 32,
        "BETTER_AUTH_URL": "https://sedekah.je/",
        "NEXT_PUBLIC_APP_URL": "https://sedekah.je",
        "GOOGLE_CLIENT_ID": "client-id",
        "GOOGLE_CLIENT_SECRET": "client-secret",
        "CLOUDFLARE_TURNSTILE_SECRET_KEY": "turnstile-secret",
        "NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY": "turnstile-site-key",
    }


def payload(values: dict[str, str]) -> dict[str, list[dict[str, str]]]:
    return {
        "Parameters": [
            {"Name": f"/sedekah-je/prod/{key}", "Value": value}
            for key, value in values.items()
        ]
    }


class SsmToComposeEnvTests(unittest.TestCase):
    def test_converts_valid_values_with_literal_compose_quoting(self) -> None:
        rendered = convert(payload(valid_values()), IMAGE)

        self.assertIn(f'SEDEKAHJE_IMAGE="{IMAGE}"\n', rendered)
        self.assertIn(
            'R2_SECRET_ACCESS_KEY="secret with $$dollar #hash, backslash \\\\ and \'quote\'"\n',
            rendered,
        )

    def test_compose_quoting_does_not_mutate_literal_backslashes(self) -> None:
        self.assertEqual(quote_for_compose("a\\b"), '"a\\\\b"')

    def test_rejects_missing_required_values(self) -> None:
        values = valid_values()
        del values["DATABASE_URL"]

        with self.assertRaisesRegex(ValueError, "DATABASE_URL"):
            validate_values(values)

    def test_rejects_duplicate_parameter_basenames(self) -> None:
        duplicate_payload = payload(valid_values())
        duplicate_payload["Parameters"].append(
            {"Name": "/sedekah-je/prod/nested/DATABASE_URL", "Value": "postgresql://other/db"}
        )

        with self.assertRaisesRegex(ValueError, "Duplicate.*DATABASE_URL"):
            load_parameters(duplicate_payload)

    def test_rejects_multiline_values(self) -> None:
        values = valid_values()
        values["GOOGLE_CLIENT_SECRET"] = "line-one\nline-two"

        with self.assertRaisesRegex(ValueError, "single-line"):
            load_parameters(payload(values))

    def test_rejects_invalid_parameter_names(self) -> None:
        with self.assertRaisesRegex(ValueError, "Invalid environment key"):
            load_parameters({"Parameters": [{"Name": "/path/lowercase", "Value": "value"}]})

    def test_rejects_mismatched_auth_origins(self) -> None:
        values = valid_values()
        values["NEXT_PUBLIC_APP_URL"] = "https://wrong.example.test"

        with self.assertRaisesRegex(ValueError, "same public origin"):
            validate_values(values)

    def test_rejects_partial_telegram_configuration(self) -> None:
        values = valid_values()
        values["TELEGRAM_BOT_TOKEN"] = "token"

        with self.assertRaisesRegex(ValueError, "configured together"):
            validate_values(values)

    def test_rejects_mutable_or_uppercase_image_references(self) -> None:
        for image in ("ghcr.io/khrnchn/sedekah-je:latest", IMAGE.upper()):
            with self.subTest(image=image), self.assertRaisesRegex(ValueError, "immutable"):
                convert(payload(valid_values()), image)

    @unittest.skipUnless(shutil.which("docker"), "Docker is not installed")
    def test_rendered_file_preserves_special_characters_in_compose(self) -> None:
        repository_root = Path(__file__).resolve().parent.parent
        special_values = (
            "plain",
            "a\\b",
            "trailing\\",
            "quote'and\\",
            "backslash-before-quote\\'",
            "dollar$hash#space value",
        )

        for expected in special_values:
            with self.subTest(expected=expected):
                values = valid_values()
                values["R2_SECRET_ACCESS_KEY"] = expected
                with tempfile.NamedTemporaryFile("w", encoding="utf-8") as env_file:
                    env_file.write(convert(payload(values), IMAGE))
                    env_file.flush()
                    result = subprocess.run(
                        [
                            "docker",
                            "compose",
                            "--env-file",
                            env_file.name,
                            "--file",
                            str(repository_root / "compose.yaml"),
                            "config",
                            "--format",
                            "json",
                        ],
                        check=True,
                        capture_output=True,
                        text=True,
                    )

                configuration = json.loads(result.stdout)
                self.assertEqual(
                    configuration["services"]["app"]["environment"][
                        "R2_SECRET_ACCESS_KEY"
                    ],
                    expected.replace("$", "$$"),
                )


if __name__ == "__main__":
    unittest.main()
