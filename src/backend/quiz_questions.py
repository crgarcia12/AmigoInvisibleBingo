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
            question="¿Quién tiene el mayor coeficiente intelectual de la mesa?",
            options=["Francina", "Paula", "Lula"],
            correctAnswer="Francina",
            timeLimit=10
        ),
        QuizQuestionData(
            id="q2",
            question="¿Cuál es el número de calzado que usa Lionel Messi de chancletas?",
            options=["39/40", "42/43", "38"],
            correctAnswer="42/43",
            timeLimit=10
        ),
        QuizQuestionData(
            id="q3",
            question="¿Cuál es la provincia más grande de la Argentina en superficie?",
            options=["Santa Cruz", "Buenos Aires", "Chubut"],
            correctAnswer="Buenos Aires",
            timeLimit=10
        ),
        QuizQuestionData(
            id="q4",
            question="¿Quien es panelista rotativa de LAM?",
            options=["Ángel de Brito", "Luis Ventura", "Adabel Guerrero"],
            correctAnswer="Adabel Guerrero",
            timeLimit=10
        ),QuizQuestionData(
            id="q5",
            question="¿De dónde proviene el nombre «alpargata»?",
            options=["Arabe", "Latín", "indígena"],
            correctAnswer="Arabe",
            timeLimit=10
        ),
        QuizQuestionData(
            id="q6",
            question="¿Cómo se llama el conducto que recorre el interior de la mandíbula?",
            options=["Mandibular", "Conducto mentoniano", "Conducto sublingual"],
            correctAnswer="Mandibular",
            timeLimit=15
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
