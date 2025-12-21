# Backend API Specification for Amigo Invisible Bingo

## Overview
RESTful API backend for the Amigo Invisible Bingo application. This service manages user predictions for a Secret Santa guessing game and handles the reveal logic on December 24th.

## Authentication
- **Method**: API Key authentication
- **Header**: `X-API-Key: <api_key>`
- All endpoints require a valid API key in the request header
- Return 401 Unauthorized if the API key is missing or invalid

## Data Models

### Prediction Object
```json
{
  "id": "uuid",
  "userName": "string",
  "predictions": {
    "Miriam": "Paula",
    "Paula": "Diego",
    "Adriana": "Carlos A",
    "Lula": "Padrino",
    "Diego": "Adriana",
    "Carlos A": "Lula",
    "Padrino": "Miriam"
  },
  "timestamp": "2024-12-19T10:30:00Z",
  "createdAt": "2024-12-19T10:30:00Z",
  "updatedAt": "2024-12-19T10:30:00Z"
}
```

### Correct Answers Object (Admin only)
```json
{
  "answers": {
    "Miriam": "Paula",
    "Paula": "Diego",
    "Adriana": "Carlos A",
    "Lula": "Padrino",
    "Diego": "Adriana",
    "Carlos A": "Lula",
    "Padrino": "Miriam"
  },
  "revealDate": "2024-12-24T00:00:00Z",
  "updatedAt": "2024-12-19T10:30:00Z"
}
```

### Score Object
```json
{
  "userName": "string",
  "correctPredictions": 5,
  "totalPredictions": 7,
  "score": 71.43
}
```

## API Endpoints

### 1. Submit or Update Predictions
**POST** `/api/predictions`

Saves or updates a user's predictions. If predictions already exist for the user, they are updated.

**Request Headers:**
```
X-API-Key: <api_key>
Content-Type: application/json
```

**Request Body:**
```json
{
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
}
```

**Response (201 Created or 200 OK):**
```json
{
  "success": true,
  "message": "Predictions saved successfully",
  "data": {
    "id": "uuid",
    "userName": "Paula",
    "predictions": { ... },
    "timestamp": "2024-12-19T10:30:00Z"
  }
}
```

**Validation:**
- `userName` must be one of: "Miriam", "Paula", "Adriana", "Lula", "Diego", "Carlos A", "Padrino"
- `predictions` must contain all 7 participants as keys
- Each prediction value must be a different participant (not the same as the key)
- Return 400 Bad Request for validation errors

---

### 2. Get User's Predictions
**GET** `/api/predictions/{userName}`

Retrieves the predictions for a specific user.

**Request Headers:**
```
X-API-Key: <api_key>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userName": "Paula",
    "predictions": { ... },
    "timestamp": "2024-12-19T10:30:00Z"
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "message": "No predictions found for this user"
}
```

---

### 3. Get All Participants Status
**GET** `/api/predictions/status`

Returns a list of all participants and whether they have submitted predictions.

**Request Headers:**
```
X-API-Key: <api_key>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalParticipants": 7,
    "submittedCount": 5,
    "participants": [
      {
        "userName": "Miriam",
        "hasSubmitted": true,
        "submittedAt": "2024-12-19T10:30:00Z"
      },
      {
        "userName": "Paula",
        "hasSubmitted": true,
        "submittedAt": "2024-12-19T11:00:00Z"
      },
      {
        "userName": "Adriana",
        "hasSubmitted": false,
        "submittedAt": null
      }
      // ... more participants
    ]
  }
}
```

---

### 4. Get All Predictions (After Reveal Date)
**GET** `/api/predictions/all`

Returns all predictions from all users. Should only work if current date >= reveal date (2024-12-24).

**Request Headers:**
```
X-API-Key: <api_key>
```

**Response (200 OK):**
```json
{
  "success": true,
  "canReveal": true,
  "revealDate": "2024-12-24T00:00:00Z",
  "data": [
    {
      "userName": "Miriam",
      "predictions": { ... },
      "timestamp": "2024-12-19T10:30:00Z"
    },
    {
      "userName": "Paula",
      "predictions": { ... },
      "timestamp": "2024-12-19T11:00:00Z"
    }
    // ... more predictions
  ]
}
```

**Response (403 Forbidden - before reveal date):**
```json
{
  "success": false,
  "message": "Results cannot be revealed until December 24th",
  "revealDate": "2024-12-24T00:00:00Z",
  "canReveal": false
}
```

---

### 5. Set Correct Answers (Admin)
**POST** `/api/admin/answers`

Allows setting the correct answers for who gave to whom. This should be protected with an additional admin API key.

**Request Headers:**
```
X-API-Key: <api_key>
X-Admin-Key: <admin_key>
Content-Type: application/json
```

**Request Body:**
```json
{
  "answers": {
    "Miriam": "Paula",
    "Paula": "Diego",
    "Adriana": "Carlos A",
    "Lula": "Padrino",
    "Diego": "Adriana",
    "Carlos A": "Lula",
    "Padrino": "Miriam"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Correct answers saved successfully",
  "data": {
    "answers": { ... },
    "updatedAt": "2024-12-24T00:00:00Z"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid admin API key"
}
```

---

### 6. Get Scores (After Reveal Date)
**GET** `/api/scores`

Calculates and returns scores for all participants based on correct answers. Only works after reveal date and if correct answers have been set.

**Request Headers:**
```
X-API-Key: <api_key>
```

**Response (200 OK):**
```json
{
  "success": true,
  "canReveal": true,
  "hasCorrectAnswers": true,
  "data": [
    {
      "userName": "Miriam",
      "correctPredictions": 5,
      "totalPredictions": 7,
      "score": 71.43
    },
    {
      "userName": "Paula",
      "correctPredictions": 7,
      "totalPredictions": 7,
      "score": 100.0
    }
    // ... sorted by score descending
  ]
}
```

**Response (403 Forbidden):**
```json
{
  "success": false,
  "message": "Scores cannot be revealed until December 24th",
  "canReveal": false
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Correct answers have not been set yet",
  "hasCorrectAnswers": false
}
```

---

### 7. Health Check
**GET** `/api/health`

Simple health check endpoint (no authentication required).

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-19T10:30:00Z",
  "version": "1.0.0"
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "errorCode": "ERROR_CODE",
  "timestamp": "2024-12-19T10:30:00Z"
}
```

### Common Error Codes:
- **400** - Bad Request (validation errors)
- **401** - Unauthorized (missing or invalid API key)
- **403** - Forbidden (action not allowed, e.g., before reveal date)
- **404** - Not Found (resource doesn't exist)
- **500** - Internal Server Error

---

## Quiz Endpoints

### Get Quiz Questions
**GET** `/api/quiz/questions/{userName}`

Returns quiz questions that the user hasn't answered yet.

**Path Parameters**:
- `userName`: Name of the participant

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "q1",
      "question": "¿Cuántas personas participan en el amigo invisible?",
      "options": ["5", "6", "7", "8"]
    }
  ]
}
```

**Note**: Only returns questions the user hasn't answered. If all questions are answered, returns empty array.

---

### Submit Quiz Answer
**POST** `/api/quiz/answer`

Submit an answer for a quiz question.

**Request Body**:
```json
{
  "userName": "Carlos A",
  "questionId": "q1",
  "answer": "7"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "questionId": "q1",
    "isCorrect": true
  }
}
```

**Validation Rules**:
- `userName` must be one of the valid participants
- `questionId` must exist
- User cannot answer the same question twice (returns 400 error)

---

### Get User Quiz Score
**GET** `/api/quiz/score/{userName}`

Get the quiz score and all answers for a specific user.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "userName": "Carlos A",
    "correctAnswers": 2,
    "totalQuestions": 3,
    "score": 66.67,
    "answers": [
      {
        "questionId": "q1",
        "answer": "7",
        "isCorrect": true,
        "timestamp": "2024-12-19T10:30:00Z"
      }
    ]
  }
}
```

---

## Environment Variables

```env
API_KEY=your-secure-api-key-here
ADMIN_API_KEY=your-secure-admin-key-here
REVEAL_DATE=2024-12-24T00:00:00Z
PORT=3000
CORS_ORIGINS=http://localhost:5173,https://yourdomain.com

# Cosmos DB (set via environment variable)
COSMOS_ENDPOINT=https://crgar-bingo-db.documents.azure.com:443/
COSMOS_KEY=your-cosmos-db-key-here
```

---

## Technology Recommendations

- **Language/Framework**: Node.js with Express, Python with FastAPI, or .NET Core
- **Database**: PostgreSQL, MongoDB, or Azure Cosmos DB
- **Hosting**: Azure App Service, Azure Container Instances, or Azure Functions
- **CORS**: Enable CORS for your frontend domain
- **Rate Limiting**: Implement rate limiting per API key to prevent abuse

---

## Additional Notes

1. **Reveal Date Logic**: All reveal-related endpoints should check if current date >= 2024-12-24
2. **Data Persistence**: Store predictions in a database, not just in-memory
3. **API Key Security**: Store API keys securely and hash them in the database
4. **Logging**: Log all API requests with timestamps and user information
5. **Validation**: Validate all inputs thoroughly to prevent injection attacks
6. **HTTPS**: Use HTTPS in production for secure API key transmission
7. **Quiz Data**: Quiz questions can be seeded using the `seed_quiz_questions.py` script
