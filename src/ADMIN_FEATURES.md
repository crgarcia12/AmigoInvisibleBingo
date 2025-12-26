# Admin Features Documentation

## Overview
The admin functionality allows administrators to set correct answers for both quiz questions and amigo invisible predictions, calculate scores, and display a leaderboard.

## Admin Panel Access
- Navigate to the admin panel by clicking the "Admin" button at the bottom of the main page
- Or manually navigate to `/admin` route (when router is added)

## Admin Features

### 1. Scoreboard
Shows all users ranked by their combined score (quiz + predictions).

**Columns:**
- Rank
- User Name
- Quiz Score (correct/total)
- Predictions Score (correct/total)
- Total Score (correct/total)
- Percentage

### 2. Set Quiz Correct Answers
- Three hardcoded quiz questions
- Admin enters the correct answer for each question
- Answers are saved to database with id="quiz_correct_answers"

### 3. Set Prediction Correct Answers
- Shows all 7 participants
- Admin enters who each person gave their gift to
- Answers are saved to database with id="correct_answers"

## How Scoring Works

### Before Admin Sets Answers
- Users can see their submitted answers
- No indication of correct/incorrect
- No scores displayed
- Summary page shows: "Las respuestas correctas aún no han sido publicadas"

### After Admin Sets Answers
- Users see which answers were correct/incorrect
- Combined score is calculated (quiz + predictions)
- 1 point awarded per correct answer
- Percentage score displayed
- Scoreboard becomes meaningful

## API Endpoints

### Admin Endpoints
```
POST /api/admin/quiz-answers
Body: { answers: { "q1": "answer1", "q2": "answer2", "q3": "answer3" } }
```

```
POST /api/admin/set-correct-answers
Body: { answers: { "Miriam": "Paula", "Paula": "Diego", ... } }
```

### Scoring Endpoints
```
GET /api/combined-score/{userName}
Returns: CombinedScore object with quiz and predictions breakdown
```

```
GET /api/scoreboard
Returns: Array of all users with scores, sorted by total score
```

## Database Schema

### Quiz Correct Answers Document
```json
{
  "id": "quiz_correct_answers",
  "type": "quiz_answers",
  "answers": {
    "q1": "China",
    "q2": "1989",
    "q3": "Pacífico"
  },
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### Predictions Correct Answers Document
```json
{
  "id": "correct_answers",
  "type": "correct_answers",
  "answers": {
    "Miriam": "Paula",
    "Paula": "Diego",
    ...
  },
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

## User Experience Flow

1. **User completes predictions and quiz**
   - User fills in all amigo invisible predictions
   - User answers all 3 quiz questions
   - Summary page shows their answers (no scoring yet)

2. **Admin sets correct answers**
   - Admin accesses admin panel
   - Sets correct quiz answers
   - Sets correct prediction answers (who gave to whom)

3. **Scoring becomes active**
   - Users can now see their score
   - Correct answers are marked with ✅
   - Incorrect answers are marked with ❌
   - Scoreboard shows ranking

## Testing

### Test Admin Functionality
1. Complete all quiz questions and predictions as a user
2. Navigate to admin panel
3. Set quiz correct answers
4. Set prediction correct answers
5. Check scoreboard updates
6. Return to user view and verify score is displayed

### Verify Scoring Logic
- Quiz: 3 questions max
- Predictions: 7 participants max
- Total possible: 10 points
- Score = (correct / total) * 100

## Notes
- Admin panel has no authentication (add in production!)
- Correct answers can be updated multiple times
- Scores recalculate on each scoreboard/combined-score request
- hasAdminAnswers flag requires BOTH quiz and prediction answers to be set
