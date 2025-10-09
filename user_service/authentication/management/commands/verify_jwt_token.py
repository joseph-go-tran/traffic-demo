"""
Management command to verify JWT tokens
"""

import json

from django.core.management.base import BaseCommand

from authentication.utils import JWTValidator


class Command(BaseCommand):
    help = "Verify and display information about a JWT token"

    def add_arguments(self, parser):
        parser.add_argument(
            "token",
            type=str,
            help="The JWT token to verify",
        )
        parser.add_argument(
            "--no-verify",
            action="store_true",
            help="Skip signature verification (just decode)",
        )

    def handle(self, *args, **options):
        token = options["token"]
        verify = not options.get("no_verify", False)

        self.stdout.write(self.style.HTTP_INFO("=" * 60))
        self.stdout.write(self.style.HTTP_INFO("JWT Token Verification"))
        self.stdout.write(self.style.HTTP_INFO("=" * 60))
        self.stdout.write("")

        # Get token info (without verification)
        info = JWTValidator.get_token_info(token)

        if not info.get("valid"):
            self.stdout.write(
                self.style.ERROR(f"❌ Invalid token: {info.get('error')}")
            )
            return

        # Display token information
        self.stdout.write(self.style.SUCCESS("Token Header:"))
        self.stdout.write(json.dumps(info["header"], indent=2))
        self.stdout.write("")

        self.stdout.write(self.style.SUCCESS("Token Payload:"))
        self.stdout.write(json.dumps(info["payload"], indent=2))
        self.stdout.write("")

        # Check if expired
        if JWTValidator.is_token_expired(token):
            self.stdout.write(self.style.WARNING("⚠️  Token is EXPIRED"))
        else:
            self.stdout.write(self.style.SUCCESS("✓ Token is NOT expired"))
        self.stdout.write("")

        # Verify signature if requested
        if verify:
            self.stdout.write(self.style.HTTP_INFO("Verifying signature..."))
            decoded = JWTValidator.decode_token(token, verify=True)

            if decoded:
                self.stdout.write(self.style.SUCCESS("✓ Signature is VALID"))
            else:
                self.stdout.write(self.style.ERROR("❌ Signature is INVALID"))
        else:
            self.stdout.write(
                self.style.WARNING(
                    "⚠️  Signature verification skipped (--no-verify)"
                )
            )

        self.stdout.write("")
        self.stdout.write(self.style.HTTP_INFO("=" * 60))
