# Testing the Quiz Feature

## Quick Start Guide

### 1. Start the Backend

```bash
cd backend
python main.py
```

The server will start on `http://localhost:3000` with hardcoded quiz questions ready to use.

### 2. Start the Frontend

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173`

### 3. Test the Quiz Flow

1. **Open browser**: Navigate to `http://localhost:5173`
2. **Select user**: Choose a name from the dropdown (e.g., "Carlos A")
3. **Make predictions**: Drag and drop names to make predictions for each person
4. **Submit**: Click "Guardar" button
5. **Quiz starts**: Questions will load from server automatically
6. **Answer questions**: Click on an option for each question
7. **See results**: Final score will be displayed

## Testing with API Directly

### Get Quiz Questions

```bash
curl http://localhost:3000/api/quiz/questions/Carlos%20A
```

Response (only unanswered questions):
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

### Submit a Quiz Answer

```bash
curl -X POST http://localhost:3000/api/quiz/answer \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "Carlos A",
    "questionId": "q1",
    "answer": "7"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "questionId": "q1",
    "isCorrect": true
  }
}
```

### Get User's Quiz Score

```bash
curl http://localhost:3000/api/quiz/score/Carlos%20A
```

Response:
```json
{
  "success": true,
  "data": {
    "userName": "Carlos A",
    "correctAnswers": 1,
    "totalQuestions": 1,
    "score": 100.0,
    "answers": [
      {
        "questionId": "q1",
        "answer": "7",
        "isCorrect": true,
        "timestamp": "2025-12-21T10:30:00Z"
      }
    ]
  }
}
```

## Verification Checklist

- [ ] Questions are loaded from server (hardcoded in backend)
- [ ] Each answer is sent to server immediately
- [ ] Server validates answer correctness
- [ ] Frontend updates score in real-time
- [ ] Final score is displayed after last question
- [ ] Answers are stored in Cosmos DB
- [ ] User can see their quiz history via score endpoint
- [ ] Multiple users can take quiz independently

## Common Issues

### No Questions Appear

**Problem**: Quiz shows "No hay preguntas disponibles"

**Solution**: Check that `QUIZ_QUESTIONS` is defined in [backend/main.py](backend/main.py) and backend is running

### API Connection Error

**Problem**: "Error al cargar las preguntas del quiz"

**Solution**: 
1. Check backend is running on port 3000
2. Check CORS is enabled
3. Check Cosmos DB connection

### Questions Not Scoring Correctly

**Problem**: All answers show as incorrect

**Solution**: Verify the `correctAnswer` in `QUIZ_QUESTIONS` exactly matches one of the options in [backend/main.py](backend/main.py)

## Testing Different Scenarios

### Scenario 1: Multiple Users

Test with different user names to ensure isolation:
1. Complete quiz as "Carlos A"
2. Complete quiz as "Paula"
3. Verify each has independent score

### Scenario 2: Returning to Complete Quiz

1. Answer only 1 of 3 questions
2. Close browser/refresh page
3. Select same user again
4. Verify only 2 remaining questions are shown
5. Complete remaining questions

### Scenario 3: Attempting Duplicate Answer

1. Answer a question
2. Try to answer the same question again (via API directly)
3. Verify server returns error 400 "already been answered"

## Database Inspection

To verify answers are stored correctly, query Cosmos DB:

**Quiz Answers**:
```sql
SELECT * FROM c WHERE c.type = 'quiz_answer'
```

**User's Answers**:
```sql
SELECT * FROM c WHERE c.type = 'quiz_answer' AND c.userName = 'Carlos A'
```
