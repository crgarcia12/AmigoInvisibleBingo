from pydantic import BaseModel, Field, validator
from typing import Dict, Optional
from datetime import datetime
import uuid


VALID_PARTICIPANTS = ["Miriam", "Paula", "Adriana", "Lula", "Diego", "Carlos A", "Padrino"]


class PredictionInput(BaseModel):
    """Input model for submitting predictions"""
    userName: str
    predictions: Dict[str, str]

    @validator('userName')
    def validate_user_name(cls, v):
        if v not in VALID_PARTICIPANTS:
            raise ValueError(f'userName must be one of: {", ".join(VALID_PARTICIPANTS)}')
        return v

    @validator('predictions')
    def validate_predictions(cls, v, values):
        # Check all participants are present
        if set(v.keys()) != set(VALID_PARTICIPANTS):
            raise ValueError(f'predictions must contain all participants: {", ".join(VALID_PARTICIPANTS)}')
        
        # Check no one predicts themselves
        for giver, receiver in v.items():
            if giver == receiver:
                raise ValueError(f'{giver} cannot give to themselves')
            if receiver not in VALID_PARTICIPANTS:
                raise ValueError(f'Invalid receiver: {receiver}')
        
        return v


class Prediction(BaseModel):
    """Complete prediction object stored in database"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userName: str
    predictions: Dict[str, str]
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)


class AnswersInput(BaseModel):
    """Input model for setting correct answers"""
    answers: Dict[str, str]

    @validator('answers')
    def validate_answers(cls, v):
        # Check all participants are present
        if set(v.keys()) != set(VALID_PARTICIPANTS):
            raise ValueError(f'answers must contain all participants: {", ".join(VALID_PARTICIPANTS)}')
        
        # Check no one gives to themselves
        for giver, receiver in v.items():
            if giver == receiver:
                raise ValueError(f'{giver} cannot give to themselves')
            if receiver not in VALID_PARTICIPANTS:
                raise ValueError(f'Invalid receiver: {receiver}')
        
        return v


class CorrectAnswers(BaseModel):
    """Correct answers object"""
    answers: Dict[str, str]
    revealDate: datetime
    updatedAt: datetime = Field(default_factory=datetime.utcnow)


class ParticipantStatus(BaseModel):
    """Status of a single participant"""
    userName: str
    hasSubmitted: bool
    submittedAt: Optional[datetime] = None


class Score(BaseModel):
    """Score object for a user"""
    userName: str
    correctPredictions: int
    totalPredictions: int
    score: float


class SuccessResponse(BaseModel):
    """Standard success response"""
    success: bool = True
    message: Optional[str] = None
    data: Optional[dict] = None


class ErrorResponse(BaseModel):
    """Standard error response"""
    success: bool = False
    message: str
    errorCode: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
