"""
JWT Utilities for RSA key management and token validation
"""

import os
from pathlib import Path
from typing import Dict, Optional

import jwt
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from django.conf import settings


class JWTKeyManager:
    """Manage RSA keys for JWT authentication"""

    @staticmethod
    def get_keys_directory() -> Path:
        """Get the directory where JWT keys are stored"""
        keys_dir = Path(settings.BASE_DIR) / "keys"
        keys_dir.mkdir(exist_ok=True)
        return keys_dir

    @staticmethod
    def generate_rsa_keys(force: bool = False) -> Dict[str, str]:
        """
        Generate RSA key pair for JWT authentication.

        Args:
            force: If True, overwrite existing keys

        Returns:
            Dict with paths to private and public keys
        """
        keys_dir = JWTKeyManager.get_keys_directory()
        private_key_path = keys_dir / "jwt_private_key.pem"
        public_key_path = keys_dir / "jwt_public_key.pem"

        # Check if keys already exist
        if not force and private_key_path.exists() and public_key_path.exists():
            return {
                "private_key": str(private_key_path),
                "public_key": str(public_key_path),
                "status": "exists",
            }

        # Generate private key
        private_key = rsa.generate_private_key(
            public_exponent=65537, key_size=2048, backend=default_backend()
        )

        # Serialize private key
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        )

        # Get public key
        public_key = private_key.public_key()

        # Serialize public key
        public_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )

        # Write keys to files
        with open(private_key_path, "wb") as f:
            f.write(private_pem)

        with open(public_key_path, "wb") as f:
            f.write(public_pem)

        # Set permissions
        os.chmod(private_key_path, 0o600)
        os.chmod(public_key_path, 0o644)

        return {
            "private_key": str(private_key_path),
            "public_key": str(public_key_path),
            "status": "created",
        }

    @staticmethod
    def load_private_key() -> Optional[str]:
        """Load the private key from file"""
        keys_dir = JWTKeyManager.get_keys_directory()
        private_key_path = keys_dir / "jwt_private_key.pem"

        try:
            with open(private_key_path, "r") as f:
                return f.read()
        except FileNotFoundError:
            return None

    @staticmethod
    def load_public_key() -> Optional[str]:
        """Load the public key from file"""
        keys_dir = JWTKeyManager.get_keys_directory()
        public_key_path = keys_dir / "jwt_public_key.pem"

        try:
            with open(public_key_path, "r") as f:
                return f.read()
        except FileNotFoundError:
            return None

    @staticmethod
    def verify_keys_exist() -> bool:
        """Check if both keys exist"""
        keys_dir = JWTKeyManager.get_keys_directory()
        private_key_path = keys_dir / "jwt_private_key.pem"
        public_key_path = keys_dir / "jwt_public_key.pem"

        return private_key_path.exists() and public_key_path.exists()


class JWTValidator:
    """Validate and decode JWT tokens"""

    @staticmethod
    def decode_token(token: str, verify: bool = True) -> Optional[Dict]:
        """
        Decode a JWT token.

        Args:
            token: The JWT token string
            verify: Whether to verify the signature

        Returns:
            Decoded token payload or None if invalid
        """
        try:
            if verify:
                public_key = JWTKeyManager.load_public_key()
                if not public_key:
                    raise ValueError("Public key not found")

                decoded = jwt.decode(
                    token,
                    public_key,
                    algorithms=["RS256"],
                    options={"verify_signature": True},
                )
            else:
                decoded = jwt.decode(token, options={"verify_signature": False})

            return decoded
        except jwt.ExpiredSignatureError:
            print("Token has expired")
            return None
        except jwt.InvalidTokenError as e:
            print(f"Invalid token: {e}")
            return None

    @staticmethod
    def get_token_info(token: str) -> Dict:
        """
        Get information about a token without verifying signature.
        Useful for debugging.

        Args:
            token: The JWT token string

        Returns:
            Dict with token information
        """
        try:
            decoded = jwt.decode(token, options={"verify_signature": False})
            header = jwt.get_unverified_header(token)

            return {
                "valid": True,
                "header": header,
                "payload": decoded,
                "algorithm": header.get("alg"),
                "token_type": decoded.get("token_type"),
                "user_id": decoded.get("user_id"),
                "email": decoded.get("email"),
                "expires_at": decoded.get("exp"),
                "issued_at": decoded.get("iat"),
            }
        except Exception as e:
            return {"valid": False, "error": str(e)}

    @staticmethod
    def is_token_expired(token: str) -> bool:
        """
        Check if a token is expired without full verification.

        Args:
            token: The JWT token string

        Returns:
            True if expired, False otherwise
        """
        try:
            decoded = jwt.decode(token, options={"verify_signature": False})
            exp = decoded.get("exp")
            if exp:
                import time

                return time.time() > exp
            return False
        except Exception:
            return True


def ensure_jwt_keys():
    """
    Ensure JWT keys exist, generate them if they don't.
    This can be called during Django startup.
    """
    if not JWTKeyManager.verify_keys_exist():
        print("JWT keys not found. Generating new keys...")
        result = JWTKeyManager.generate_rsa_keys()
        print(f"✓ JWT keys generated at: {result['private_key']}")
        print("⚠️  IMPORTANT: Keep the private key secret!")
    else:
        print("✓ JWT keys found and loaded")
