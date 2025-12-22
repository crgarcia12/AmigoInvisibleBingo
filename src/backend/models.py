from pydantic import BaseModel, Field, validator
from typing import Dict, Optional, List
from datetime import datetime
import uuid


VALID_PARTICIPANTS = ["Miriam", "Paula", "Adriana", "Lula", "Diego", "Carlos A", "Padrino"]


class QuizAnswerData(BaseModel):
    """Single quiz answer data"""
    questionId: str
    answer: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class UserSubmission(BaseModel):
    """Complete user submission with predictions and quiz answers"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userName: str
    predictions: Dict[str, str] = Field(default_factory=dict)
    quizAnswers: List[QuizAnswerData] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)


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


# Quiz models
class Question(BaseModel):
    """Quiz question model"""
    id: str
    question: str
    options: List[str]
    correctAnswer: str


class QuizAnswerInput(BaseModel):
    """Input model for submitting a quiz answer"""
    userName: str
    questionId: str
    answer: str

    @validator('userName')
    def validate_user_name(cls, v):
        if v not in VALID_PARTICIPANTS:
            raise ValueError(f'userName must be one of: {", ".join(VALID_PARTICIPANTS)}')
        return v


class QuizAnswer(BaseModel):
    """Quiz answer stored in database"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userName: str
    questionId: str
    answer: str
    isCorrect: bool
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class UserQuizScore(BaseModel):
    """Quiz score for a user"""
    userName: str
    correctAnswers: int
    totalQuestions: int
    score: float
    answers: List[QuizAnswer]


class QuizCorrectAnswersInput(BaseModel):
    """Input model for setting correct quiz answers"""
    answers: Dict[str, str]  # questionId -> correctAnswer


class QuizCorrectAnswers(BaseModel):
    """Correct quiz answers stored by admin"""
    answers: Dict[str, str]
    updatedAt: datetime = Field(default_factory=datetime.utcnow)


class CombinedScore(BaseModel):
    """Combined score including predictions and quiz"""
    userName: str
    quizCorrect: int
    quizTotal: int
    predictionsCorrect: int
    predictionsTotal: int
    totalCorrect: int
    totalQuestions: int
    score: float
    hasAdminAnswers: bool

