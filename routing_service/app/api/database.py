import os

from dotenv import dotenv_values
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

config = dotenv_values(".env")

# # Database URL
# DATABASE_URL = (
#     f"postgresql://{config.get('DB_DEV_USER')}:{config.get('DB_DEV_PASSWORD')}"
#     f"@{config.get('DB_DEV_HOST')}:{config.get('DB_DEV_PORT')}"
#     f"/{config.get('DB_DEV_ROUTING_NAME')}"
# )

DB_USER = config.get("DB_DEV_USER") or os.getenv("DB_DEV_USER", "admin")
DB_PASSWORD = config.get("DB_DEV_PASSWORD") or os.getenv(
    "DB_DEV_PASSWORD", "admin"
)
DB_HOST = config.get("DB_DEV_HOST") or os.getenv("DB_DEV_HOST", "db")
DB_PORT = config.get("DB_DEV_PORT") or os.getenv("DB_DEV_PORT", "5432")
DB_NAME = config.get("DB_DEV_ROUTING_NAME") or os.getenv(
    "DB_DEV_ROUTING_NAME", "gos_routing"
)

DATABASE_URL = (
    f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)


# Create engine
engine = create_engine(DATABASE_URL, pool_pre_ping=True, echo=False)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base for models
Base = declarative_base()


# Dependency to get database session
def get_db():
    """
    Database session dependency for FastAPI endpoints.
    Yields a database session and ensures it's closed after use.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
