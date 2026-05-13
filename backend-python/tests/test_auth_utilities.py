"""Tests for authentication utilities."""

from jose import jwt

from app.core.auth import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
    ALGORITHM,
    SECRET_KEY,
)


def test_password_hashing():
    """Test password hashing and verification."""
    password = "secure_password_123"
    hashed = get_password_hash(password)

    assert hashed != password
    assert verify_password(password, hashed)
    assert not verify_password("wrong_password", hashed)


def test_create_access_token():
    """Test JWT access token creation and decoding."""
    email = "test@example.com"
    token = create_access_token(data={"sub": email})

    assert isinstance(token, str)
    assert token.count(".") == 2  # JWT has 3 parts

    token_data = decode_token(token)
    assert token_data is not None
    assert token_data.email == email


def test_create_access_token_with_expiry():
    """Test access token with custom expiry."""
    from datetime import timedelta

    email = "test@example.com"
    custom_minutes = 60
    token = create_access_token(
        data={"sub": email},
        expires_delta=timedelta(minutes=custom_minutes)
    )

    token_data = decode_token(token)
    assert token_data is not None
    assert token_data.email == email


def test_decode_invalid_token():
    """Test decoding invalid token returns None."""
    invalid_token = "invalid.token.here"
    token_data = decode_token(invalid_token)
    assert token_data is None


def test_create_refresh_token():
    """Test refresh token creation and decoding."""
    email = "test@example.com"
    token = create_refresh_token(data={"sub": email})

    assert isinstance(token, str)
    token_data = decode_refresh_token(token)
    assert token_data is not None
    assert token_data.email == email


def test_refresh_token_has_type():
    """Test that refresh token includes 'type' claim."""
    email = "test@example.com"
    token = create_refresh_token(data={"sub": email})

    # Decode without verification to check type
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert payload.get("type") == "refresh"


def test_access_token_has_no_type():
    """Test that access token does not have 'type' claim."""
    email = "test@example.com"
    token = create_access_token(data={"sub": email})

    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert "type" not in payload
