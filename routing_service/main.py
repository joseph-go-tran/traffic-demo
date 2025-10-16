import sentry_sdk
from dotenv import dotenv_values
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.database import engine
from app.api.v1.models.route_models import Base
from app.api.v1.routes import routing

config = dotenv_values(".env")

# Create database tables
Base.metadata.create_all(bind=engine)

sentry_sdk.init(
    dsn=config.get("SENTRY_KEY"),
    # Set traces_sample_rate to 1.0 to capture 100%
    # of transactions for performance monitoring.
    # We recommend adjusting this value in production,
    traces_sample_rate=1.0,
)

app = FastAPI(
    title="TrafficFlow Routing Service",
    description=(
        "Routing service with TomTom API integration for route planning, "
        "traffic information, and place search capabilities"
    ),
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(router=routing.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "TrafficFlow Routing Service", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "TrafficFlow Routing Service"}
