"""
Management command to generate or regenerate JWT RSA keys
"""

from django.core.management.base import BaseCommand

from authentication.utils import JWTKeyManager


class Command(BaseCommand):
    help = "Generate RSA key pair for JWT authentication"

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Force regeneration of keys even if they already exist",
        )

    def handle(self, *args, **options):
        force = options.get("force", False)

        if force:
            self.stdout.write(
                self.style.WARNING("⚠️  Regenerating keys (--force flag used)")
            )

        try:
            result = JWTKeyManager.generate_rsa_keys(force=force)

            if result["status"] == "exists":
                self.stdout.write(
                    self.style.WARNING(
                        "⚠️  Keys already exist. Use --force to regenerate."
                    )
                )
                self.stdout.write(f"Private key: {result['private_key']}")
                self.stdout.write(f"Public key: {result['public_key']}")
            else:
                self.stdout.write(
                    self.style.SUCCESS("✓ RSA key pair generated successfully!")
                )
                self.stdout.write(f"Private key: {result['private_key']}")
                self.stdout.write(f"Public key: {result['public_key']}")
                self.stdout.write("")
                self.stdout.write(self.style.WARNING("IMPORTANT:"))
                self.stdout.write("- Keep the private key SECRET")
                self.stdout.write(
                    "- Never commit the private key to version control"
                )
                self.stdout.write(
                    "- The public key can be shared for token verification"
                )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"❌ Error generating keys: {str(e)}")
            )
            raise
