# DevBot+ - AI-Powered ChatOps Assistant

An AI-integrated assistant designed to help IT/DevOps engineers interact with system logs and perform basic operational tasks through a conversational interface.

## Features

- Log Ingestion & Storage (MongoDB)
- Interactive Chat UI
- AI-powered Log Summarization (Groq)
- Simulated Command Execution
- FastAPI Backend

## Setup

1. Clone the repository
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file with your configuration:
   ```
   MONGODB_URI=mongodb://localhost:27017
   GROQ_API_KEY=your_groq_api_key
   ```
5. Start the backend server:
   ```bash
   uvicorn app.main:app --reload
   ```
6. Start the frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Project Structure

```
devbot/
├── app/
│   ├── api/
│   ├── core/
│   ├── models/
│   └── services/
├── frontend/
│   ├── src/
│   └── public/
└── tests/
```

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc 