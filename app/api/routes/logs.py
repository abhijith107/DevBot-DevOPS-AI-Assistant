from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.core.database import get_database
from bson import ObjectId

router = APIRouter()

class LogEntry(BaseModel):
    level: str
    message: str
    service: str
    timestamp: datetime
    metadata: Optional[dict] = None

class LogResponse(BaseModel):
    id: str
    level: str
    message: str
    service: str
    timestamp: datetime
    metadata: Optional[dict] = None

@router.post("/", response_model=LogResponse)
async def create_log(log: LogEntry):
    db = await get_database()
    log_dict = log.dict()
    result = await db.logs.insert_one(log_dict)
    log_dict["id"] = str(result.inserted_id)
    return LogResponse(**log_dict)

@router.get("/", response_model=List[LogResponse])
async def get_logs(
    service: Optional[str] = None,
    level: Optional[str] = None,
    limit: int = 100
):
    db = await get_database()
    query = {}
    if service:
        query["service"] = service
    if level:
        query["level"] = level
    
    cursor = db.logs.find(query).sort("timestamp", -1).limit(limit)
    logs = await cursor.to_list(length=limit)
    
    return [
        LogResponse(**{**log, "id": str(log["_id"])})
        for log in logs
    ]

@router.get("/{log_id}", response_model=LogResponse)
async def get_log(log_id: str):
    db = await get_database()
    log = await db.logs.find_one({"_id": ObjectId(log_id)})
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    return LogResponse(**{**log, "id": str(log["_id"])}) 