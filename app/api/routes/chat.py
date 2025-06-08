from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import groq
from app.core.config import settings
from app.core.database import get_database
from datetime import datetime

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

class ChatResponse(BaseModel):
    response: str
    timestamp: datetime

client = groq.Groq(api_key=settings.GROQ_API_KEY)

@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # Convert messages to Groq format
        groq_messages = [
            {"role": msg.role, "content": msg.content}
            for msg in request.messages
        ]
        
        # Get response from Groq
        completion = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=groq_messages,
            temperature=0.7,
            max_tokens=1024,
        )
        
        response = completion.choices[0].message.content
        
        # Store chat history in MongoDB
        db = await get_database()
        chat_history = {
            "messages": [msg.dict() for msg in request.messages],
            "response": response,
            "timestamp": datetime.utcnow()
        }
        await db.chat_history.insert_one(chat_history)
        
        return ChatResponse(
            response=response,
            timestamp=datetime.utcnow()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 