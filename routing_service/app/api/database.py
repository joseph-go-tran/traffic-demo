from dotenv import dotenv_values
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

config = dotenv_values(".env")

# Database URL
DATABASE_URL = (
    f"postgresql://{config.get('DB_DEV_USER')}:{config.get('DB_DEV_PASSWORD')}"
    f"@{config.get('DB_DEV_HOST')}:{config.get('DB_DEV_PORT')}"
    f"/{config.get('DB_DEV_ROUTING_NAME')}"
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
