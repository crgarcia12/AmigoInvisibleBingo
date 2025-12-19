# Amigo Invisible Bingo - Backend API

RESTful API backend for the Amigo Invisible Bingo application. This service manages user predictions for a Secret Santa guessing game and handles the reveal logic on December 24th.

## Features

- **Authentication**: API key-based authentication
- **Predictions Management**: Submit and retrieve predictions
- **Admin Functions**: Set correct answers (admin only)
- **Reveal Logic**: Automatically enforces reveal date restrictions
- **Score Calculation**: Calculate and rank participants based on correct predictions
- **CORS Support**: Configured for frontend integration
- **File-based Storage**: Persistent JSON storage

## Technology Stack

- **Python 3.11**
- **FastAPI**: Modern, fast web framework
- **Pydantic**: Data validation
- **Uvicorn**: ASGI server
- **Azure Cosmos DB**: Cloud database

## Setup (Windows)

### Quick Start

```batch
REM Simply run the start script
start.bat
```

The script will:
- Create a virtual environment
- Install all dependencies (including Azure Cosmos DB SDK)
- Start the server

The API will be available at `http://localhost:3000`

### Manual Setup

```bash
# 1. Create virtual environment
python -m venv venv

# 2. Activate virtual environment
venv\Scripts\activate.bat

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the server
python main.py

# OR with auto-reload for development
uvicorn main:app --reload --port 3000
```

### Database

The backend uses **Azure Cosmos DB** with hardcoded credentials:
- Database: `AmigoInvisibleDB`
- Container: `Predictions`
- Endpoint: `crgar-bingo-db.documents.azure.com`

The database and container will be created automatically on first run if they don't exist.

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:3000/docs
- **ReDoc**: http://localhost:3000/redoc

## API Endpoints

### Public Endpoint
- `GET /api/health` - Health check (no authentication)

### Authenticated Endpoints (require `X-API-Key` header)
- `POST /api/predictions` - Submit or update predictions
- `GET /api/predictions/{userName}` - Get user's predictions
- `GET /api/predictions/status` - Get all participants' status
- `GET /api/predictions/all` - Get all predictions (only after Dec 24)
- `GET /api/scores` - Get scores (only after Dec 24)

### Admin Endpoints (require `X-API-Key` and `X-Admin-Key` headers)
- `POST /api/admin/answers` - Set correct answers

## Data Storage

Data is stored in the `data/` directory:
- `predictions.json` - User predictions
- `answers.json` - Correct answers

## Example Requests

### Submit Predictions

```bash
curl -X POST http://localhost:3000/api/predictions \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "Paula",
    "predictions": {
      "Miriam": "Paula",
      "Paula": "Diego",
      "Adriana": "Carlos A",
      "Lula": "Padrino",
      "Diego": "Adriana",
      "Carlos A": "Lula",
      "Padrino": "Miriam"
    }
  }'
```

### Get Predictions Status

```bash
curl http://localhost:3000/api/predictions/status \
  -H "X-API-Key: your-api-key"
```

### Set Correct Answers (Admin)

```bash
curl -X POST http://localhost:3000/api/admin/answers \
  -H "X-API-Key: your-api-key" \
  -H "X-Admin-Key: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": {
      "Miriam": "Paula",
      "Paula": "Diego",
      "Adriana": "Carlos A",
      "Lula": "Padrino",
      "Diego": "Adriana",
      "Carlos A": "Lula",
      "Padrino": "Miriam"
    }
  }'
```

## Valid Participants

The following participants are valid:
- Miriam
- Paula
- Adriana
- Lula
- Diego
- Carlos A
- Padrino

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "errorCode": "ERROR_CODE",
  "timestamp": "2024-12-19T10:30:00Z"
}
```

## Security Notes

- Store API keys securely
- Use HTTPS in production
- The API keys in `.env.example` are placeholders - replace with secure values
- Admin key should be different from regular API key
- Keep `.env` file out of version control (already in `.gitignore`)

## Development

To run with auto-reload during development:

```bash
uvicorn main:app --reload --port 3000
```

## License

This project is for private use.
