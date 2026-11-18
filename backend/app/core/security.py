import hashlib
import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union
import jwt
from backend.app.core.config import settings

def hash_password(password: str) -> str:
    salt = os.urandom(16).hex()
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000).hex()
    return f"{salt}:{key}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        salt, key = hashed_password.split(":")
        check_key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), 100000).hex()
        return check_key == key
    except Exception:
        return False

def create_access_token(
    subject: Union[str, Any], 
    role: str,
    agency: Optional[str] = None,
    expires_delta: Optional[timedelta] = None
) -> str:
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode: Dict[str, Any] = {
        "sub": str(subject),
        "role": role,
        "agency": agency or "LIFELANE_EMERGENCY",
        "exp": expire,
        "iat": now
    }
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None
