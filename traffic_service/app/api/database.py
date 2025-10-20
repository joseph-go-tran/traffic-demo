import os

from dotenv import dotenv_values
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

config = dotenv_values(".env")

DB_USER = config.get("DB_DEV_USER") or os.getenv("DB_DEV_USER", "admin")
DB_PASSWORD = config.get("DB_DEV_PASSWORD") or os.getenv(
    "DB_DEV_PASSWORD", "admin"
)
DB_HOST = config.get("DB_DEV_HOST") or os.getenv("DB_DEV_HOST", "db")
DB_PORT = config.get("DB_DEV_PORT") or os.getenv("DB_DEV_PORT", "5432")
DB_NAME = config.get("DB_DEV_TRAFFIC_NAME") or os.getenv(
    "DB_DEV_TRAFFIC_NAME", "gos_traffic"
)

DATABASE_URL = (
    f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
    if "sqlite" in DATABASE_URL
    else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
