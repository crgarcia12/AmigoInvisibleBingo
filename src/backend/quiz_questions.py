"""
Quiz questions with correct answers
This file contains the hardcoded quiz questions and their correct answers
"""

from typing import List, Dict
from pydantic import BaseModel


class QuizQuestionData(BaseModel):
    """Quiz question with options and correct answer"""
    id: str
    question: str
    options: List[str]
    correctAnswer: str
    timeLimit: int  # Time limit in seconds


class QuizQuestions:
    """Hardcoded quiz questions"""
    
    QUESTIONS: List[QuizQuestionData] = [
        QuizQuestionData(
            id="q1",
            question="¿Cuál es el país más poblado del mundo?",
            options=["India", "Estados Unidos", "China", "Indonesia"],
            correctAnswer="China",
            timeLimit=15
        ),
        QuizQuestionData(
            id="q2",
            question="¿En qué año cayó el Muro de Berlín?",
            options=["1987", "1989", "1991", "1993"],
            correctAnswer="1989",
            timeLimit=20
        ),
        QuizQuestionData(
            id="q3",
            question="¿Cuál es el océano más grande?",
            options=["Atlántico", "Índico", "Ártico", "Pacífico"],
            correctAnswer="Pacífico",
            timeLimit=10
        )
    ]
    
    @classmethod
    def get_all_questions(cls) -> List[QuizQuestionData]:
        """Get all quiz questions"""
        return cls.QUESTIONS
    
    @classmethod
    def get_question_by_id(cls, question_id: str) -> QuizQuestionData:
        """Get a specific question by ID"""
        for question in cls.QUESTIONS:
            if question.id == question_id:
                return question
        return None
    
    @classmethod
    def get_correct_answer(cls, question_id: str) -> str:
        """Get the correct answer for a question"""
        question = cls.get_question_by_id(question_id)
        return question.correctAnswer if question else None
    
    @classmethod
    def get_questions_for_user(cls) -> List[Dict]:
        """Get questions without correct answers (for API response)"""
        return [
            {
                "id": q.id,
                "question": q.question,
                "options": q.options,
                "timeLimit": q.timeLimit
            }
            for q in cls.QUESTIONS
        ]
    
    @classmethod
    def get_questions_for_admin(cls) -> List[Dict]:
        """Get questions with correct answers (for admin panel)"""
        return [
            {
                "id": q.id,
                "question": q.question,
                "options": q.options,
                "correctAnswer": q.correctAnswer,
                "timeLimit": q.timeLimit
            }
            for q in cls.QUESTIONS
        ]
