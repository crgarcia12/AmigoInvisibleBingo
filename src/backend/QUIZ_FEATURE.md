# Quiz Feature

## Overview

The quiz feature allows users to answer trivia questions after submitting their predictions. The quiz questions are stored on the server, and each answer is tracked and scored automatically.

## Architecture

### Backend

The backend provides three main endpoints for the quiz feature:

1. **GET /api/quiz/questions**
   - Returns all quiz questions (without correct answers)
   - Used by frontend to display questions to users

2. **POST /api/quiz/answer**
   - Accepts a user's answer for a specific question
   - Validates the answer and stores it in the database
   - Returns whether the answer was correct
   - Request body: `{ userName, questionId, answer }`

3. **GET /api/quiz/score/{userName}**
   - Returns the user's quiz score and all their answers
   - Includes detailed breakdown of correct/incorrect answers

### Data Models

**Question**
```python
{
    "id": "q1",
    "question": "Question text",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswer": "Option 2"
}
```

**QuizAnswer**
```python
{
    "id": "quiz_answer_userName_questionId",
    "userName": "Carlos",
    "questionId": "q1",
    "answer": "Option 2",
    "isCorrect": true,
    "timestamp": "2025-12-21T10:30:00Z"
}
```

### Database

Quiz data is stored in Cosmos DB with the following document types:

- **quiz_question**: Question documents with partition key `"quiz_question"`
- **quiz_answer**: Answer documents with partition key `"quiz_answer"`

Each answer is uniquely identified by the combination of `userName` and `questionId`, allowing users to only submit one answer per question (latest answer overwrites previous).

## Frontend Integration

### Flow

1. User submits predictions
2. Frontend calls `api.getQuizQuestions()` to fetch questions
3. Questions are displayed one at a time
4. When user selects an answer:
   - Frontend calls `api.submitQuizAnswer(userName, questionId, answer)`
   - Server validates and stores the answer
   - Server returns whether answer was correct
   - Frontend updates the score and moves to next question
5. After all questions, final score is displayed

### API Client Methods

```typescript
// Get all quiz questions
const questions = await api.getQuizQuestions()

// Submit an answer
const result = await api.submitQuizAnswer(userName, questionId, answer)
// Returns: { questionId, isCorrect }

// Get user's quiz score
const score = await api.getUserQuizScore(userName)
// Returns: { userName, correctAnswers, totalQuestions, score, answers }
```

## Adding Questions

To add new quiz questions to the database:

1. Edit `backend/seed_quiz_questions.py`
2. Add your questions to the `QUIZ_QUESTIONS` array
3. Run the script:
   ```bash
   cd backend
   python seed_quiz_questions.py
   ```

## Features

- ✅ Questions stored server-side
- ✅ Automatic answer validation
- ✅ Real-time scoring
- ✅ Answer tracking per user
- ✅ One answer per question per user
- ✅ Timestamps for all answers
- ✅ Score calculation and retrieval

## Future Enhancements

Potential improvements:
- Add question categories
- Time limits per question
- Leaderboard for quiz scores
- Multiple quiz types (personality, trivia, etc.)
- Question difficulty levels
- Random question ordering
- Question images/media
