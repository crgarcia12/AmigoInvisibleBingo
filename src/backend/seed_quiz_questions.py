"""
Script to seed quiz questions into the database
Run this script to populate the database with initial quiz questions
"""

from database import db
from models import Question
import uuid

# Define your quiz questions here
QUIZ_QUESTIONS = [
    {
        "id": "q1",
        "question": "¿Cuántas personas participan en el amigo invisible?",
        "options": ["5", "6", "7", "8"],
        "correctAnswer": "7"
    },
    {
        "id": "q2",
        "question": "¿Cuándo se revelan los resultados?",
        "options": ["23 Dic", "24 Dic", "25 Dic", "31 Dic"],
        "correctAnswer": "24 Dic"
    },
    {
        "id": "q3",
        "question": "¿Cuál es el objetivo del juego?",
        "options": [
            "Adivinar quién es el amigo invisible de cada persona",
            "Comprar regalos",
            "Hacer una fiesta",
            "Ninguna"
        ],
        "correctAnswer": "Adivinar quién es el amigo invisible de cada persona"
    }
]


def seed_questions():
    """Seed quiz questions into the database"""
    print("🌱 Seeding quiz questions...")
    
    for q_data in QUIZ_QUESTIONS:
        question = Question(**q_data)
        
        # Prepare document
        doc = question.dict()
        doc['id'] = f"quiz_question_{question.id}"
        doc['type'] = "quiz_question"  # Partition key
        
        # Upsert to database
        db.container.upsert_item(doc)
        print(f"✅ Added question: {question.id} - {question.question[:50]}...")
    
    print(f"\n✨ Successfully seeded {len(QUIZ_QUESTIONS)} quiz questions!")


if __name__ == "__main__":
    seed_questions()
