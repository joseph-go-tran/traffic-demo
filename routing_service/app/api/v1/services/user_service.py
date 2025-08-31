import os

from dotenv import dotenv_values
from fastapi import HTTPException, status
from passlib.context import CryptContext
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.orm.exc import NoResultFound

from ..models import User

config = dotenv_values(os.getcwd() + "/.env")
POSTGRES_URL = (
    f"postgresql://{config.get('DB_DEV_USER')}:"
    f"{config.get('DB_DEV_PASSWORD')}@"
    f"{config.get('DB_DEV_HOST')}:"
    f"{config.get('DB_DEV_PORT')}/"
    f"{config.get('DB_DEV_NAME')}"
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str):
    return pwd_context.hash(password)


def create_user(username: str, password: str) -> User:
    password_hash = get_password_hash(password)
    if not POSTGRES_URL:
        return None

    engine = create_engine(POSTGRES_URL)

    user = User(username=username, password=password_hash)

    with Session(engine) as session:
        try:
            session.add(user)
            session.commit()
        except Exception as ex:
            print(ex)
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="create user failed",
            )

    return user


def get_user(username: str) -> User:
    if not POSTGRES_URL:
        return None

    engine = create_engine(POSTGRES_URL)
    user = None
    with Session(engine) as session:
        try:
            user = session.query(User).where(User.username == username).one()
        except NoResultFound as ex:
            print(ex)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="user not found",
            )

    return user
