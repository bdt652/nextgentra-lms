"""Tests for authentication utilities."""

from datetime import timedelta

from app.core.auth import (
    create_access_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.schemas.user import TokenData


class TestPasswordHashing:
    """Test password hashing and verification."""

    def test_get_password_hash_returns_string(self):
        """Should return a hashed password as string."""
        password = "test_password_123"
        hashed = get_password_hash(password)
        assert isinstance(hashed, str)
        assert hashed != password

    def test_verify_password_correct_password(self):
        """Should verify correct password."""
        password = "test_password_123"
        hashed = get_password_hash(password)
        assert verify_password(password, hashed) is True

    def test_verify_password_incorrect_password(self):
        """Should reject incorrect password."""
        password = "test_password_123"
        wrong_password = "wrong_password_456"
        hashed = get_password_hash(password)
        assert verify_password(wrong_password, hashed) is False

    def test_different_passwords_different_hashes(self):
        """Should produce different hashes for same password (due to salt)."""
        password = "test_password_123"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)
        assert hash1 != hash2
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True


class TestAccessToken:
    """Test JWT access token creation and decoding."""

    def test_create_access_token_returns_string(self):
        """Should return a JWT token as string."""
        token = create_access_token(data={"sub": "test@example.com"})
        assert isinstance(token, str)
        assert len(token) > 0

    def test_create_access_token_with_expiry(self):
        """Should create token with custom expiry."""
        custom_delta = timedelta(minutes=30)
        token = create_access_token(
            data={"sub": "test@example.com"}, expires_delta=custom_delta
        )
        assert isinstance(token, str)

    def test_decode_valid_token_returns_token_data(self):
        """Should decode valid token and return TokenData."""
        token = create_access_token(data={"sub": "test@example.com"})
        token_data = decode_token(token)
        assert isinstance(token_data, TokenData)
        assert token_data.email == "test@example.com"

    def test_decode_invalid_token_returns_none(self):
        """Should return None for invalid token."""
        invalid_token = "invalid.jwt.token"
        token_data = decode_token(invalid_token)
        assert token_data is None

    def test_decode_token_without_sub_returns_none(self):
        """Should return None if token has no 'sub' claim."""
        # Create token without 'sub' by directly encoding
        from jose import jwt

        from app.core.auth import ALGORITHM, SECRET_KEY

        token = jwt.encode({"data": "no_sub"}, SECRET_KEY, algorithm=ALGORITHM)
        token_data = decode_token(token)
        assert token_data is None

    def test_token_expiration(self):
        """Should have expiration set correctly."""
        token = create_access_token(data={"sub": "test@example.com"})
        # Decode without verification to check exp
        from jose import jwt

        from app.core.auth import ALGORITHM, SECRET_KEY

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert "exp" in payload
        assert isinstance(payload["exp"], (int, float))
