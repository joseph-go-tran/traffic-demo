from dotenv import dotenv_values
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

config = dotenv_values(".env")

DB_DEV_TRAFFIC_NAME = config.get("DB_DEV_TRAFFIC_NAME", "traffic_db")
DB_DEV_USER = config.get("DB_DEV_USER", "admin")
DB_DEV_PASSWORD = config.get("DB_DEV_PASSWORD", "")
DB_DEV_HOST = config.get("DB_DEV_HOST", "localhost")
DB_DEV_PORT = config.get("DB_DEV_PORT", 5432)

# Database URL - using SQLite for simplicity, can be changed to PostgreSQL/MySQL
DATABASE_URL = (
    f"postgresql://{DB_DEV_USER}:"
    f"{DB_DEV_PASSWORD}@"
    f"{DB_DEV_HOST}:{DB_DEV_PORT}/"
    f"{DB_DEV_TRAFFIC_NAME}"
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
