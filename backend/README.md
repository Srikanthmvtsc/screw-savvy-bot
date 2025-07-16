# ScrewSavvy Flask Backend

This Flask backend provides API endpoints for the ScrewSavvy chatbot application.

## Features

- **PDF Processing**: Upload and process PDF documents, extract text, create embeddings, and store in Quadrant vector database
- **Chat Query**: Process user queries, search for relevant content, and generate responses using LLaMA 2 7B
- **Feedback System**: Save user feedback for continuous improvement

## Setup

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure API Keys**:
   Edit `app.py` and replace the dummy credentials:
   ```python
   OPENAI_API_KEY = "your-actual-openai-api-key"
   QUADRANT_API_KEY = "your-actual-quadrant-api-key"
   QUADRANT_URL = "your-actual-quadrant-cluster-url"
   REPLICATE_API_TOKEN = "your-actual-replicate-api-token"
   ```

3. **Run the Server**:
   ```bash
   python app.py
   ```

   The server will start on `http://localhost:5000`

## API Endpoints

### 1. Process PDF
- **URL**: `POST /process-pdf`
- **Description**: Upload and process PDF documents
- **Body**: Form data with `file` field containing the PDF
- **Response**: Document metadata and processing status

### 2. Chat Query
- **URL**: `POST /chat-query`
- **Description**: Process user queries and get AI responses
- **Body**: JSON with `query` field
- **Response**: AI-generated response with context information

### 3. Save Feedback
- **URL**: `POST /save-feedback`
- **Description**: Save user feedback for improvements
- **Body**: JSON with `question`, `user_feedback`, and optional `wrong_answer`, `correct_answer`
- **Response**: Success confirmation

### 4. Health Check
- **URL**: `GET /health`
- **Description**: Check if the server is running
- **Response**: Server status

## Usage Flow

1. **Admin uploads PDFs** → `/process-pdf` → Extracts text → Creates embeddings → Stores in Quadrant
2. **User asks question** → `/chat-query` → Embeds query → Searches Quadrant → Gets LLaMA response
3. **User provides feedback** → `/save-feedback` → Saves for knowledge base improvement

## Required API Services

- **OpenAI**: For text embeddings (`text-embedding-ada-002`)
- **Quadrant**: Vector database for storing and searching embeddings
- **Replicate**: For LLaMA 2 7B model access

## Frontend Integration

Update your frontend to call these Flask endpoints instead of Supabase edge functions:

```javascript
// Example: Process PDF
const formData = new FormData();
formData.append('file', pdfFile);

const response = await fetch('http://localhost:5000/process-pdf', {
  method: 'POST',
  body: formData
});

// Example: Chat query
const response = await fetch('http://localhost:5000/chat-query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: 'I need a screw for wood' })
});
```

## Note

This is a development setup. For production:
- Use a proper database instead of JSON files for feedback
- Add authentication and rate limiting
- Configure HTTPS
- Use environment variables for API keys
- Add proper error handling and logging