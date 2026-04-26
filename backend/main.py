import os
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="NextGenTra LMS API",
    description="Learning Management System Backend",
    version="1.0.0",
)

# CORS - Read allowed origins from environment
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:3001"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.get("/")
async def root():
    """Root endpoint with API info"""
    return {
        "message": "Welcome to NextGenTra LMS API",
        "docs": "/docs",
        "version": "1.0.0"
    }

# Placeholder endpoints - Add your API routes here
# Example:
# @app.get("/api/v1/courses")
# async def get_courses():
#     return {"courses": []}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
