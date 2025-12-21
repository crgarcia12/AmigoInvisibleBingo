from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from typing import Dict

from config import settings
from models import (
    PredictionInput, Prediction, AnswersInput, CorrectAnswers,
    ParticipantStatus, Score, VALID_PARTICIPANTS, Question, QuizAnswerInput, QuizAnswer,
    QuizCorrectAnswersInput, QuizCorrectAnswers, CombinedScore
)
from database import db


# Hardcoded quiz questions
QUIZ_QUESTIONS = [
    Question(
        id="q1",
        question="¿Cuántas personas participan en el amigo invisible?",
        options=["5", "6", "7", "8"],
        correctAnswer="7"
    ),
    Question(
        id="q2",
        question="¿Cuándo se revelan los resultados?",
        options=["23 Dic", "24 Dic", "25 Dic", "31 Dic"],
        correctAnswer="24 Dic"
    ),
    Question(
        id="q3",
        question="¿Cuál es el objetivo del juego?",
        options=[
            "Adivinar quién es el amigo invisible de cada persona",
            "Comprar regalos",
            "Hacer una fiesta",
            "Ninguna"
        ],
        correctAnswer="Adivinar quién es el amigo invisible de cada persona"
    )
]


app = FastAPI(
    title="Amigo Invisible Bingo API",
    description="RESTful API backend for the Amigo Invisible Bingo application",
    version=settings.VERSION
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    """Health check endpoint - no authentication required"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "version": settings.VERSION
    }


@app.post("/api/predictions", status_code=status.HTTP_201_CREATED)
async def submit_predictions(prediction_input: PredictionInput):
    """Submit or update predictions for a user"""
    try:
        # Create prediction object
        prediction = Prediction(
            userName=prediction_input.userName,
            predictions=prediction_input.predictions
        )
        
        # Check if this is an update
        existing = db.get_prediction(prediction_input.userName)
        is_update = existing is not None
        
        # Save to database
        saved_prediction = db.save_prediction(prediction)
        
        return {
            "success": True,
            "message": "Predictions saved successfully",
            "data": {
                "id": saved_prediction.id,
                "userName": saved_prediction.userName,
                "predictions": saved_prediction.predictions,
                "timestamp": saved_prediction.timestamp.isoformat() + "Z"
            }
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@app.get("/api/predictions/{userName}")
async def get_user_predictions(userName: str):
    """Get predictions for a specific user"""
    # Validate userName
    if userName not in VALID_PARTICIPANTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid userName. Must be one of: {', '.join(VALID_PARTICIPANTS)}"
        )
    
    prediction = db.get_prediction(userName)
    
    if not prediction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No predictions found for this user"
        )
    
    return {
        "success": True,
        "data": {
            "id": prediction.id,
            "userName": prediction.userName,
            "predictions": prediction.predictions,
            "timestamp": prediction.timestamp.isoformat() + "Z"
        }
    }


@app.get("/api/predictions/status")
async def get_participants_status():
    """Get status of all participants"""
    status_list = db.get_participants_status()
    submitted_count = sum(1 for s in status_list if s["hasSubmitted"])
    
    # Format timestamps
    for participant in status_list:
        if participant["submittedAt"]:
            participant["submittedAt"] = participant["submittedAt"].isoformat() + "Z"
    
    return {
        "success": True,
        "data": {
            "totalParticipants": len(VALID_PARTICIPANTS),
            "submittedCount": submitted_count,
            "participants": status_list
        }
    }


@app.get("/api/predictions/all")
async def get_all_predictions():
    """Get all predictions - only allowed after reveal date"""
    current_date = datetime.utcnow()
    reveal_date = settings.REVEAL_DATE
    
    if current_date < reveal_date:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "message": "Results cannot be revealed until December 24th",
                "revealDate": reveal_date.isoformat() + "Z",
                "canReveal": False
            }
        )
    
    predictions = db.get_all_predictions()
    
    predictions_list = []
    for user_name, prediction in predictions.items():
        predictions_list.append({
            "userName": prediction.userName,
            "predictions": prediction.predictions,
            "timestamp": prediction.timestamp.isoformat() + "Z"
        })
    
    return {
        "success": True,
        "canReveal": True,
        "revealDate": reveal_date.isoformat() + "Z",
        "data": predictions_list
    }


@app.post("/api/admin/set-correct-answers")
async def set_correct_answers(answers_input: AnswersInput):
    """Set correct answers - admin only"""
    try:
        correct_answers = CorrectAnswers(
            answers=answers_input.answers,
            revealDate=settings.REVEAL_DATE
        )
        
        saved_answers = db.save_correct_answers(correct_answers)
        
        return {
            "success": True,
            "message": "Correct answers saved successfully",
            "data": {
                "answers": saved_answers.answers,
                "updatedAt": saved_answers.updatedAt.isoformat() + "Z"
            }
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@app.get("/api/scores")
async def get_scores():
    """Get scores for all participants - only after reveal date"""
    current_date = datetime.utcnow()
    reveal_date = settings.REVEAL_DATE
    
    if current_date < reveal_date:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "message": "Scores cannot be revealed until December 24th",
                "canReveal": False
            }
        )
    
    correct_answers = db.get_correct_answers()
    
    if not correct_answers:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "message": "Correct answers have not been set yet",
                "hasCorrectAnswers": False
            }
        )
    
    scores = db.calculate_scores()
    
    return {
        "success": True,
        "canReveal": True,
        "hasCorrectAnswers": True,
        "data": scores
    }


@app.get("/api/quiz/questions/{userName}")
async def get_quiz_questions(userName: str):
    """Get quiz questions for a user (only unanswered ones)"""
    # Validate userName
    if userName not in VALID_PARTICIPANTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid userName. Must be one of: {', '.join(VALID_PARTICIPANTS)}"
        )
    
    # Get user's already answered questions
    answered_questions = db.get_user_quiz_answers(userName)
    answered_ids = {answer.questionId for answer in answered_questions}
    
    # Return only unanswered questions without the correct answer
    questions_data = []
    for q in QUIZ_QUESTIONS:
        if q.id not in answered_ids:
            questions_data.append({
                "id": q.id,
                "question": q.question,
                "options": q.options
            })
    
    return {
        "success": True,
        "data": questions_data
    }


@app.post("/api/quiz/answer", status_code=status.HTTP_201_CREATED)
async def submit_quiz_answer(answer_input: QuizAnswerInput):
    """Submit a quiz answer"""
    # Check if user has already answered this question
    existing_answers = db.get_user_quiz_answers(answer_input.userName)
    if any(answer.questionId == answer_input.questionId for answer in existing_answers):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This question has already been answered"
        )
    
    # Get the question to check the correct answer
    question = next((q for q in QUIZ_QUESTIONS if q.id == answer_input.questionId), None)
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    # Check if answer is correct
    is_correct = answer_input.answer == question.correctAnswer
    
    # Create quiz answer
    quiz_answer = QuizAnswer(
        userName=answer_input.userName,
        questionId=answer_input.questionId,
        answer=answer_input.answer,
        isCorrect=is_correct
    )
    
    # Save to database
    saved_answer = db.save_quiz_answer(quiz_answer)
    
    return {
        "success": True,
        "data": {
            "questionId": saved_answer.questionId,
            "isCorrect": saved_answer.isCorrect
        }
    }


@app.get("/api/quiz/score/{userName}")
async def get_user_quiz_score(userName: str):
    """Get quiz score for a specific user"""
    # Validate userName
    if userName not in VALID_PARTICIPANTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid userName. Must be one of: {', '.join(VALID_PARTICIPANTS)}"
        )
    
    # Get user's answers
    answers = db.get_user_quiz_answers(userName)
    
    if not answers:
        return {
            "success": True,
            "data": {
                "userName": userName,
                "correctAnswers": 0,
                "totalQuestions": 0,
                "score": 0.0,
                "answers": []
            }
        }
    
    # Calculate score
    correct_count = sum(1 for a in answers if a.isCorrect)
    total_count = len(answers)
    score = round((correct_count / total_count) * 100, 2) if total_count > 0 else 0.0
    
    # Format answers
    answers_data = []
    for answer in answers:
        answers_data.append({
            "questionId": answer.questionId,
            "answer": answer.answer,
            "isCorrect": answer.isCorrect,
            "timestamp": answer.timestamp.isoformat() + "Z"
        })
    
    return {
        "success": True,
        "data": {
            "userName": userName,
            "correctAnswers": correct_count,
            "totalQuestions": total_count,
            "score": score,
            "answers": answers_data
        }
    }


@app.post("/api/admin/quiz-answers")
async def set_quiz_correct_answers(answers_input: QuizCorrectAnswersInput):
    """Set correct quiz answers - admin only"""
    try:
        correct_answers = QuizCorrectAnswers(
            answers=answers_input.answers
        )
        
        saved_answers = db.save_quiz_correct_answers(correct_answers)
        
        return {
            "success": True,
            "message": "Quiz correct answers saved successfully",
            "data": {
                "answers": saved_answers.answers,
                "updatedAt": saved_answers.updatedAt.isoformat() + "Z"
            }
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@app.get("/api/combined-score/{userName}")
async def get_combined_score(userName: str):
    """Get combined score (quiz + predictions) for a user"""
    # Validate userName
    if userName not in VALID_PARTICIPANTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid userName. Must be one of: {', '.join(VALID_PARTICIPANTS)}"
        )
    
    # Check if admin has set correct answers
    quiz_correct_answers = db.get_quiz_correct_answers()
    predictions_correct_answers = db.get_correct_answers()
    has_admin_answers = quiz_correct_answers is not None and predictions_correct_answers is not None
    
    # Get user's quiz answers
    quiz_answers = db.get_user_quiz_answers(userName)
    quiz_correct = 0
    quiz_total = len(quiz_answers)
    
    if has_admin_answers and quiz_correct_answers:
        for answer in quiz_answers:
            if quiz_correct_answers.answers.get(answer.questionId) == answer.answer:
                quiz_correct += 1
    
    # Get user's predictions
    user_prediction = db.get_prediction(userName)
    predictions_correct = 0
    predictions_total = 0
    
    if user_prediction:
        predictions_total = len(user_prediction.predictions)
        if has_admin_answers and predictions_correct_answers:
            for giver, receiver in user_prediction.predictions.items():
                if predictions_correct_answers.answers.get(giver) == receiver:
                    predictions_correct += 1
    
    # Calculate totals
    total_correct = quiz_correct + predictions_correct
    total_questions = quiz_total + predictions_total
    score = round((total_correct / total_questions) * 100, 2) if total_questions > 0 else 0.0
    
    return {
        "success": True,
        "data": {
            "userName": userName,
            "quizCorrect": quiz_correct,
            "quizTotal": quiz_total,
            "predictionsCorrect": predictions_correct,
            "predictionsTotal": predictions_total,
            "totalCorrect": total_correct,
            "totalQuestions": total_questions,
            "score": score,
            "hasAdminAnswers": has_admin_answers
        }
    }


@app.get("/api/scoreboard")
async def get_scoreboard():
    """Get scoreboard with all users ordered by score"""
    # Check if admin has set correct answers
    quiz_correct_answers = db.get_quiz_correct_answers()
    predictions_correct_answers = db.get_correct_answers()
    has_admin_answers = quiz_correct_answers is not None and predictions_correct_answers is not None
    
    # Get all users who have submitted
    predictions = db.get_all_predictions()
    scoreboard = []
    
    for user_name in predictions.keys():
        # Get quiz answers
        quiz_answers = db.get_user_quiz_answers(user_name)
        quiz_correct = 0
        quiz_total = len(quiz_answers)
        
        if has_admin_answers and quiz_correct_answers:
            for answer in quiz_answers:
                if quiz_correct_answers.answers.get(answer.questionId) == answer.answer:
                    quiz_correct += 1
        
        # Get predictions
        user_prediction = predictions[user_name]
        predictions_correct = 0
        predictions_total = len(user_prediction.predictions)
        
        if has_admin_answers and predictions_correct_answers:
            for giver, receiver in user_prediction.predictions.items():
                if predictions_correct_answers.answers.get(giver) == receiver:
                    predictions_correct += 1
        
        # Calculate totals
        total_correct = quiz_correct + predictions_correct
        total_questions = quiz_total + predictions_total
        score = round((total_correct / total_questions) * 100, 2) if total_questions > 0 else 0.0
        
        scoreboard.append({
            "userName": user_name,
            "quizCorrect": quiz_correct,
            "quizTotal": quiz_total,
            "predictionsCorrect": predictions_correct,
            "predictionsTotal": predictions_total,
            "totalCorrect": total_correct,
            "totalQuestions": total_questions,
            "score": score
        })
    
    # Sort by score descending
    scoreboard.sort(key=lambda x: (x['score'], x['totalCorrect']), reverse=True)
    
    return {
        "success": True,
        "hasAdminAnswers": has_admin_answers,
        "data": scoreboard
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.PORT)
