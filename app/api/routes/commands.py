from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from app.core.database import get_database

router = APIRouter()

class CommandRequest(BaseModel):
    command: str
    service: str
    parameters: Optional[Dict[str, Any]] = None

class CommandResponse(BaseModel):
    id: str
    command: str
    service: str
    status: str
    output: str
    timestamp: datetime
    parameters: Optional[Dict[str, Any]] = None

# Simulated command handlers
COMMAND_HANDLERS = {
    "restart": lambda service, params: f"Simulated restart of {service} service",
    "status": lambda service, params: f"Simulated status check of {service} service",
    "logs": lambda service, params: f"Simulated log retrieval for {service} service",
}

@router.post("/", response_model=CommandResponse)
async def execute_command(request: CommandRequest):
    try:
        # Extract the base command (first word)
        base_command = request.command.split()[0].lower()
        
        # Check if command is supported
        if base_command not in COMMAND_HANDLERS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported command: {base_command}"
            )
        
        # Execute simulated command
        output = COMMAND_HANDLERS[base_command](
            request.service,
            request.parameters
        )
        
        # Store command execution in database
        db = await get_database()
        command_execution = {
            "command": request.command,
            "service": request.service,
            "status": "success",
            "output": output,
            "timestamp": datetime.utcnow(),
            "parameters": request.parameters
        }
        result = await db.commands.insert_one(command_execution)
        
        return CommandResponse(
            id=str(result.inserted_id),
            **command_execution
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history", response_model=list[CommandResponse])
async def get_command_history(limit: int = 50):
    db = await get_database()
    cursor = db.commands.find().sort("timestamp", -1).limit(limit)
    commands = await cursor.to_list(length=limit)
    
    return [
        CommandResponse(**{**cmd, "id": str(cmd["_id"])})
        for cmd in commands
    ] 