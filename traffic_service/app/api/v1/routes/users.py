from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from ..schemas.schema import User
from ..services import auth_service, user_service

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


router = APIRouter()


@router.post("/login", status_code=status.HTTP_200_OK)
async def login(user: User):
    username = user.username
    password = user.password
    user_password = (
        user_service.get_user(username).password
        if user_service.get_user(username)
        else ""
    )
    if not auth_service.verify_password(password, user_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    access_token = auth_service.create_jwt_token(user_id=username)
    return {"access_token": access_token, "token_type": "Bearer"}


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(user: User):
    username = user.username
    password = user.password
    user = user_service.create_user(username, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="User name is exist",
        )

    return {"message": "Create user successfully"}


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(token: str = Depends(oauth2_scheme)):
    auth_service.verify_jwt_token(token)
    return {"message": "Logged out successfully"}
