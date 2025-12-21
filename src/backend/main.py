from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from typing import Dict

from config import settings
from models import (
    PredictionInput, Prediction, AnswersInput, CorrectAnswers,
    ParticipantStatus, Score, VALID_PARTICIPANTS
)
from database import db


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


@app.post("/api/admin/answers")
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.PORT)
