#!/usr/bin/env python
"""
Script to generate RSA key pair for JWT authentication.
This creates private and public keys in PEM format.
"""

import os

from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa


def generate_rsa_keys():
    """Generate RSA private and public keys and save them to files."""

    # Create keys directory if it doesn't exist
    keys_dir = os.path.join(os.path.dirname(__file__), "keys")
    os.makedirs(keys_dir, exist_ok=True)

    private_key_path = os.path.join(keys_dir, "jwt_private_key.pem")
    public_key_path = os.path.join(keys_dir, "jwt_public_key.pem")

    # Check if keys already exist
    if os.path.exists(private_key_path) and os.path.exists(public_key_path):
        print("✓ RSA keys already exist. Skipping generation.")
        return

    # Generate private key
    private_key = rsa.generate_private_key(
        public_exponent=65537, key_size=2048, backend=default_backend()
    )

    # Serialize private key to PEM format
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )

    # Get public key from private key
    public_key = private_key.public_key()

    # Serialize public key to PEM format
    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )

    # Write private key to file
    with open(private_key_path, "wb") as f:
        f.write(private_pem)
    print(f"✓ Private key saved to: {private_key_path}")

    # Write public key to file
    with open(public_key_path, "wb") as f:
        f.write(public_pem)
    print(f"✓ Public key saved to: {public_key_path}")

    # Set appropriate permissions (read-only for owner)
    os.chmod(private_key_path, 0o600)
    os.chmod(public_key_path, 0o644)

    print("\n✓ RSA key pair generated successfully!")
    print("\nIMPORTANT:")
    print("- Keep the private key (jwt_private_key.pem) SECRET")
    print("- Never commit the private key to version control")
    print("- Add 'keys/' to your .gitignore file")
    print("- The public key can be shared for JWT verification")


if __name__ == "__main__":
    generate_rsa_keys()
