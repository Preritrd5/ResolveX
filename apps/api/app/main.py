"""
ResolveX FastAPI Application Entrypoint
Autonomous Customer Incident Intelligence Platform
"""

import sys
from pathlib import Path
from contextlib import asynccontextmanager

# Add repository root to python sys.path
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from apps.api.app.core.config import settings
from apps.api.app.core.logging import logger
from apps.api.app.api.v1.router import api_router
from apps.api.app.api.v1.endpoints.health import router as health_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"ResolveX API starting on {settings.API_HOST}:{settings.API_PORT} (Env: {settings.ENVIRONMENT})")
    yield
    logger.info("ResolveX API shutting down.")

app = FastAPI(
    title="ResolveX API",
    description="Autonomous Customer Incident Intelligence Platform — Hack Briven 2026",
    version="1.0.0-phase1",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handlers enforcing standardized JSON error envelope
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    detail = exc.detail
    if isinstance(detail, dict) and "code" in detail:
        code = detail.get("code", "HTTP_ERROR")
        msg = detail.get("message", "An error occurred")
        details = detail.get("details")
    else:
        code = f"HTTP_{exc.status_code}"
        msg = str(detail)
        details = None

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": code,
                "message": msg,
                "details": details
            }
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request payload failed schema validation.",
                "details": {"validation_errors": errors}
            }
        }
    )

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected server error occurred. Please consult system logs.",
                "details": None
            }
        }
    )

# Register health at root level
app.include_router(health_router)

# Register v1 routes
app.include_router(api_router, prefix="/api/v1")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("apps.api.app.main:app", host=settings.API_HOST, port=settings.API_PORT, reload=True)
