from typing import Dict, Optional, List
from datetime import datetime
from azure.cosmos import CosmosClient, exceptions
from models import Prediction, CorrectAnswers, VALID_PARTICIPANTS, QuizAnswer, QuizCorrectAnswers
from config import settings


class Database:
    """Cosmos DB database for storing predictions and answers"""
    
    def __init__(self):
        # Initialize Cosmos DB client with hardcoded credentials
        self.client = CosmosClient(settings.COSMOS_ENDPOINT, settings.COSMOS_KEY)
        self.database = self.client.create_database_if_not_exists(id=settings.COSMOS_DATABASE)
        self.container = self.database.create_container_if_not_exists(
            id=settings.COSMOS_CONTAINER,
            partition_key={"paths": ["/type"], "kind": "Hash"}
        )
        print(f"✅ Connected to Cosmos DB: {settings.COSMOS_DATABASE}/{settings.COSMOS_CONTAINER}")
    
    def save_prediction(self, prediction: Prediction) -> Prediction:
        """Save or update a prediction"""
        now = datetime.utcnow()
        
        # Try to get existing prediction
        try:
            existing_item = self.container.read_item(
                item=f"prediction_{prediction.userName}",
                partition_key="prediction"
            )
            # Update existing
            prediction.id = existing_item['id']
            prediction.createdAt = datetime.fromisoformat(existing_item['createdAt'])
            prediction.updatedAt = now
        except exceptions.CosmosResourceNotFoundError:
            # New prediction
            prediction.timestamp = now
            prediction.createdAt = now
            prediction.updatedAt = now
        
        # Prepare document for Cosmos DB
        doc = prediction.dict()
        doc['id'] = f"prediction_{prediction.userName}"
        doc['type'] = "prediction"  # Partition key
        doc['timestamp'] = doc['timestamp'].isoformat()
        doc['createdAt'] = doc['createdAt'].isoformat()
        doc['updatedAt'] = doc['updatedAt'].isoformat()
        
        # Upsert to Cosmos DB
        self.container.upsert_item(doc)
        return prediction
    
    def get_prediction(self, user_name: str) -> Optional[Prediction]:
        """Get a prediction by username"""
        try:
            item = self.container.read_item(
                item=f"prediction_{user_name}",
                partition_key="prediction"
            )
            # Convert datetime strings back
            item['timestamp'] = datetime.fromisoformat(item['timestamp'])
            item['createdAt'] = datetime.fromisoformat(item['createdAt'])
            item['updatedAt'] = datetime.fromisoformat(item['updatedAt'])
            return Prediction(**item)
        except exceptions.CosmosResourceNotFoundError:
            return None
    
    def get_all_predictions(self) -> Dict[str, Prediction]:
        """Get all predictions"""
        query = "SELECT * FROM c WHERE c.type = 'prediction'"
        items = list(self.container.query_items(query=query, enable_cross_partition_query=True))
        
        predictions = {}
        for item in items:
            # Convert datetime strings back
            item['timestamp'] = datetime.fromisoformat(item['timestamp'])
            item['createdAt'] = datetime.fromisoformat(item['createdAt'])
            item['updatedAt'] = datetime.fromisoformat(item['updatedAt'])
            prediction = Prediction(**item)
            predictions[prediction.userName] = prediction
        
        return predictions
    
    def get_participants_status(self):
        """Get status of all participants"""
        predictions = self.get_all_predictions()
        status_list = []
        for participant in VALID_PARTICIPANTS:
            prediction = predictions.get(participant)
            status_list.append({
                "userName": participant,
                "hasSubmitted": prediction is not None,
                "submittedAt": prediction.timestamp if prediction else None
            })
        return status_list
    
    def save_correct_answers(self, answers: CorrectAnswers) -> CorrectAnswers:
        """Save correct answers"""
        answers.updatedAt = datetime.utcnow()
        
        # Prepare document
        doc = answers.dict()
        doc['id'] = "correct_answers"
        doc['type'] = "answers"  # Partition key
        doc['revealDate'] = doc['revealDate'].isoformat()
        doc['updatedAt'] = doc['updatedAt'].isoformat()
        
        # Upsert to Cosmos DB
        self.container.upsert_item(doc)
        return answers
    
    def get_correct_answers(self) -> Optional[CorrectAnswers]:
        """Get correct answers"""
        try:
            item = self.container.read_item(
                item="correct_answers",
                partition_key="answers"
            )
            # Convert datetime strings back
            item['revealDate'] = datetime.fromisoformat(item['revealDate'])
            item['updatedAt'] = datetime.fromisoformat(item['updatedAt'])
            return CorrectAnswers(**item)
        except exceptions.CosmosResourceNotFoundError:
            return None
    
    def calculate_scores(self) -> list:
        """Calculate scores for all users based on correct answers"""
        correct_answers = self.get_correct_answers()
        if not correct_answers:
            return []
        
        predictions = self.get_all_predictions()
        scores = []
        
        for user_name, prediction in predictions.items():
            correct_count = 0
            total_count = len(prediction.predictions)
            
            for giver, receiver in prediction.predictions.items():
                if correct_answers.answers.get(giver) == receiver:
                    correct_count += 1
            
            score = round((correct_count / total_count) * 100, 2) if total_count > 0 else 0.0
            
            scores.append({
                "userName": user_name,
                "correctPredictions": correct_count,
                "totalPredictions": total_count,
                "score": score
            })
        
        # Sort by score descending
        scores.sort(key=lambda x: x['score'], reverse=True)
        return scores
    
    def save_quiz_answer(self, quiz_answer: QuizAnswer) -> QuizAnswer:
        """Save a quiz answer"""
        quiz_answer.timestamp = datetime.utcnow()
        
        # Prepare document
        doc = quiz_answer.dict()
        doc['id'] = f"quiz_answer_{quiz_answer.userName}_{quiz_answer.questionId}"
        doc['type'] = "quiz_answer"  # Partition key
        doc['timestamp'] = doc['timestamp'].isoformat()
        
        # Upsert to Cosmos DB
        self.container.upsert_item(doc)
        return quiz_answer
    
    def get_user_quiz_answers(self, user_name: str) -> List[QuizAnswer]:
        """Get all quiz answers for a user"""
        query = f"SELECT * FROM c WHERE c.type = 'quiz_answer' AND c.userName = '{user_name}'"
        items = list(self.container.query_items(query=query, enable_cross_partition_query=True))
        
        answers = []
        for item in items:
            item['timestamp'] = datetime.fromisoformat(item['timestamp'])
            answers.append(QuizAnswer(**item))
        
        return answers
    
    def get_all_quiz_answers(self) -> Dict[str, List[QuizAnswer]]:
        """Get all quiz answers grouped by user"""
        query = "SELECT * FROM c WHERE c.type = 'quiz_answer'"
        items = list(self.container.query_items(query=query, enable_cross_partition_query=True))
        
        answers_by_user = {}
        for item in items:
            item['timestamp'] = datetime.fromisoformat(item['timestamp'])
            answer = QuizAnswer(**item)
            if answer.userName not in answers_by_user:
                answers_by_user[answer.userName] = []
            answers_by_user[answer.userName].append(answer)
        
        return answers_by_user
    
    def save_quiz_correct_answers(self, answers: QuizCorrectAnswers) -> QuizCorrectAnswers:
        """Save correct quiz answers (admin only)"""
        answers.updatedAt = datetime.utcnow()
        
        # Prepare document
        doc = answers.dict()
        doc['id'] = "quiz_correct_answers"
        doc['type'] = "quiz_answers"  # Partition key
        doc['updatedAt'] = doc['updatedAt'].isoformat()
        
        # Upsert to Cosmos DB
        self.container.upsert_item(doc)
        return answers
    
    def get_quiz_correct_answers(self) -> Optional[QuizCorrectAnswers]:
        """Get correct quiz answers"""
        try:
            item = self.container.read_item(
                item="quiz_correct_answers",
                partition_key="quiz_answers"
            )
            # Convert datetime strings back
            item['updatedAt'] = datetime.fromisoformat(item['updatedAt'])
            return QuizCorrectAnswers(**item)
        except exceptions.CosmosResourceNotFoundError:
            return None


# Global database instance
db = Database()
