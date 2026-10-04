from datetime import datetime, timedelta

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError, ExpiredSignatureError


# ================= SECURITY CONFIG =================

SECRET_KEY = "secret123"
ALGORITHM = "HS256"

security = HTTPBearer(auto_error=False)


# ================= TOKEN CREATION =================

def create_token(user_id: int):
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(hours=1),
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


# ================= TOKEN VERIFICATION =================

def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
        )

    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        user_id = payload.get("user_id")

        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token",
            )

        return user_id

    except ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Token expired",
        )

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token",
        )