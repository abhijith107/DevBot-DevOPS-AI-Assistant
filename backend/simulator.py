import asyncio
import random
import json
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv
import httpx
from typing import List, Dict
from pydantic import BaseModel

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store connected WebSocket clients
connected_clients = set()

# Store conversation history
conversation_history: Dict[str, List[Dict]] = {}

class ChatMessage(BaseModel):
    message: str
    session_id: str = "default"

class ChatResponse(BaseModel):
    response: str
    error: str = None

# Sample log messages
LOG_MESSAGES = [
    "System startup completed",
    "Database connection established",
    "User authentication successful",
    "API request received",
    "Cache miss occurred",
    "Memory usage above threshold",
    "Network latency increased",
    "Backup process started",
    "Security scan completed",
    "Performance metrics collected"
]

# Sample error messages
ERROR_MESSAGES = [
    "Database connection failed",
    "Authentication error",
    "API rate limit exceeded",
    "Memory allocation failed",
    "Network timeout",
    "File system error",
    "Invalid configuration",
    "Service unavailable",
    "Permission denied",
    "Resource not found"
]

# Sample warning messages
WARNING_MESSAGES = [
    "High CPU usage detected",
    "Disk space running low",
    "Slow query detected",
    "Connection pool near capacity",
    "Cache hit rate below threshold",
    "Response time degraded",
    "Memory usage increasing",
    "Backup delayed",
    "Security scan overdue",
    "Performance degradation detected"
]

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
GROQ_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'

# System prompt for the AI
SYSTEM_PROMPT = """You are DevBot+, an AI assistant specialized in helping developers with their tasks. 
You can help with coding, debugging, system administration, and general development questions.
Be concise, clear, and provide practical solutions."""

async def generate_log():
    """Generate a random log entry"""
    timestamp = datetime.now().isoformat()
    level = random.choice(['info', 'warning', 'error'])
    
    if level == 'info':
        message = random.choice(LOG_MESSAGES)
    elif level == 'warning':
        message = random.choice(WARNING_MESSAGES)
    else:
        message = random.choice(ERROR_MESSAGES)
    
    return {
        'timestamp': timestamp,
        'level': level,
        'message': message,
        'source': f'service-{random.randint(1, 5)}'
    }

class ConnectionManager:
    def __init__(self):
        self.active_connections: set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except WebSocketDisconnect:
                self.disconnect(connection)
            except Exception as e:
                print(f"Error broadcasting message: {e}")
                self.disconnect(connection)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Generate and send a log every 2-5 seconds
            log = await generate_log()
            await websocket.send_json(log)
            await asyncio.sleep(random.uniform(2, 5))
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)

@app.post("/chat", response_model=ChatResponse)
async def chat(message: ChatMessage):
    """Handle chat messages with conversation history and proper error handling"""
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="Groq API key not configured")
    
    # Initialize conversation history for new sessions
    if message.session_id not in conversation_history:
        conversation_history[message.session_id] = [
            {"role": "system", "content": SYSTEM_PROMPT}
        ]
    
    # Add user message to history
    conversation_history[message.session_id].append({
        "role": "user",
        "content": message.message
    })
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GROQ_API_KEY}",
    }
    
    # Prepare messages for API call
    messages = conversation_history[message.session_id][-5:]  # Keep last 5 messages for context
    
    payload = {
        "model": GROQ_MODEL,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 1000
    }
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(GROQ_API_URL, headers=headers, json=payload, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            
            if 'choices' not in data or not data['choices']:
                raise HTTPException(status_code=500, detail="Invalid response from Groq API")
            
            reply = data['choices'][0]['message']['content']
            
            # Add assistant's reply to conversation history
            conversation_history[message.session_id].append({
                "role": "assistant",
                "content": reply
            })
            
            return ChatResponse(response=reply)
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Request to Groq API timed out")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, 
                          detail=f"Groq API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/logs")
async def get_logs():
    """Return a list of recent logs"""
    logs = []
    for _ in range(20):  # Generate 20 random logs
        logs.append(await generate_log())
    return logs

@app.post("/execute")
async def execute_command(command: dict):
    """Simulate command execution"""
    cmd = command.get("command", "").lower()
    
    # Simulate different command responses
    if "ls" in cmd:
        output = """total 32
drwxr-xr-x  2 user  group  4096 Mar 15 10:00 .
drwxr-xr-x  4 user  group  4096 Mar 15 09:00 ..
-rw-r--r--  1 user  group   123 Mar 15 10:00 file1.txt
-rw-r--r--  1 user  group   456 Mar 15 10:00 file2.txt
drwxr-xr-x  2 user  group  4096 Mar 15 10:00 directory1"""
    elif "ps" in cmd:
        output = """  PID TTY          TIME CMD
 1234 pts/0    00:00:00 bash
 1235 pts/0    00:00:00 python
 1236 pts/0    00:00:00 node"""
    elif "df" in cmd:
        output = """Filesystem     1K-blocks    Used Available Use% Mounted on
/dev/sda1       1048576  524288    524288  50% /
/dev/sda2      2097152 1048576   1048576  50% /home"""
    else:
        output = f"Executed: {cmd}\nCommand completed successfully."
    
    return {"output": output}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, ws="websockets") 