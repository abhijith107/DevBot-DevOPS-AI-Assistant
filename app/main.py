from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import chat, logs, commands

app = FastAPI(
    title="DevBot+ API",
    description="AI-Powered ChatOps Assistant API",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(logs.router, prefix="/api/logs", tags=["logs"])
app.include_router(commands.router, prefix="/api/commands", tags=["commands"])

@app.get("/")
async def root():
    return {"message": "Welcome to DevBot+ API"} 