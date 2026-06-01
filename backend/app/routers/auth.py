from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.user import LoginRequest, RefreshRequest, TokenResponse, UserOut, UserCreate
from app.repositories.user import UserRepository
from app.auth.jwt import verify_password, get_password_hash, create_access_token, create_refresh_token, verify_token
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.utils.response import ok, fail

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    repo = UserRepository(db)
    user = await repo.get_by_email(body.email)
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account inactive")
    access = create_access_token({"sub": str(user.id)})
    refresh = create_refresh_token({"sub": str(user.id)})
    return ok({
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
        "user": UserOut.model_validate(user).model_dump(),
    }, "Login successful")


@router.post("/refresh")
async def refresh_token(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = verify_token(body.refresh_token, "refresh")
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    repo = UserRepository(db)
    user = await repo.get(int(payload["sub"]))
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    access = create_access_token({"sub": str(user.id)})
    refresh = create_refresh_token({"sub": str(user.id)})
    return ok({
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
        "user": UserOut.model_validate(user).model_dump(),
    })


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return ok(UserOut.model_validate(current_user).model_dump())
