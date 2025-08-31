import sentry_sdk
from dotenv import dotenv_values
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routes import users

config = dotenv_values(".env")

sentry_sdk.init(
    dsn=config.get("SENTRY_KEY"),
    # Set traces_sample_rate to 1.0 to capture 100%
    # of transactions for performance monitoring.
    # We recommend adjusting this value in production,
    traces_sample_rate=1.0,
)

app = FastAPI(
    title="EkAi API Service",
    description=(
        "AI-powered API service with multi-provider support and "
        "content processing capabilities"
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
app.include_router(router=users.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "EkAi API Service", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "EkAi API"}
