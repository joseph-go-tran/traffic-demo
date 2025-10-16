import os
import sys
from typing import Any, Generator

import pytest
from dotenv import dotenv_values
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.api.v1.models.route_models import Base
from app.api.v1.routes import users

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# this is to include backend dir in sys.path
# so that we can import from db,main.py


config = dotenv_values(os.getcwd() + "/.env")
SQLALCHEMY_DATABASE_URL = (
    f"postgresql+psycopg2://{config.get('DB_DEV_USER')}:"
    f"{config.get('DB_DEV_PASSWORD')}@{config.get('DB_DEV_HOST')}:"
    f"{config.get('DB_DEV_PORT')}/{config.get('DB_DEV_NAME')}"
)


def start_application():
    app = FastAPI()
    app.include_router(users.router)
    return app


engine = create_engine(SQLALCHEMY_DATABASE_URL)
# Use connect_args parameter only with sqlite
SessionTesting = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    try:
        db = SessionTesting()
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def app() -> Generator[FastAPI, Any, None]:
    """
    Create a fresh database on each test case.
    """
    Base.metadata.create_all(engine)  # Create the tables.
    _app = start_application()
    yield _app
    Base.metadata.drop_all(engine)


@pytest.fixture(scope="function")
def db_session(app: FastAPI) -> Generator[Session, Any, None]:
    connection = engine.connect()
    transaction = connection.begin()
    session = SessionTesting(bind=connection)
    yield session  # use the session in tests.
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(
    app: FastAPI, db_session: Session
) -> Generator[TestClient, Any, None]:
    """
    Create a new FastAPI TestClient that uses the `db_session` fixture
    to override the `get_db` dependency that is injected into routes.
    """

    def _get_test_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _get_test_db
    with TestClient(app) as client:
        yield client
