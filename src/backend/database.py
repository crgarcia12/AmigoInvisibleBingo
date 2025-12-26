from typing import Dict, Optional, List
from datetime import datetime
from azure.cosmos import CosmosClient, exceptions
from models import Prediction, CorrectAnswers, AMIGOS_INVISIBLES, PLAYERS, QuizAnswer, QuizCorrectAnswers, UserSubmission, QuizAnswerData
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
    
    def get_user_submission(self, user_name: str) -> Optional[UserSubmission]:
        """Get complete user submission (predictions + quiz answers)"""
        try:
            item = self.container.read_item(
                item=f"user_{user_name}",
                partition_key="user_submission"
            )
            # Convert datetime strings and nested objects
            item['timestamp'] = datetime.fromisoformat(item['timestamp'])
            item['createdAt'] = datetime.fromisoformat(item['createdAt'])
            item['updatedAt'] = datetime.fromisoformat(item['updatedAt'])
            
            # Convert quiz answers
            quiz_answers = []
            for qa in item.get('quizAnswers', []):
                qa['timestamp'] = datetime.fromisoformat(qa['timestamp'])
                quiz_answers.append(QuizAnswerData(**qa))
            item['quizAnswers'] = quiz_answers
            
            return UserSubmission(**item)
        except exceptions.CosmosResourceNotFoundError:
            return None
    
    def save_user_submission(self, submission: UserSubmission) -> UserSubmission:
        """Save or update complete user submission"""
        now = datetime.utcnow()
        
        # Try to get existing submission
        try:
            existing_item = self.container.read_item(
                item=f"user_{submission.userName}",
                partition_key="user_submission"
            )
            # Update existing
            submission.id = existing_item['id']
            submission.createdAt = datetime.fromisoformat(existing_item['createdAt'])
            submission.updatedAt = now
        except exceptions.CosmosResourceNotFoundError:
            # New submission
            submission.timestamp = now
            submission.createdAt = now
            submission.updatedAt = now
        
        # Prepare document for Cosmos DB
        doc = submission.dict()
        doc['id'] = f"user_{submission.userName}"
        doc['type'] = "user_submission"  # Partition key
        doc['timestamp'] = doc['timestamp'].isoformat()
        doc['createdAt'] = doc['createdAt'].isoformat()
        doc['updatedAt'] = doc['updatedAt'].isoformat()
        
        # Convert quiz answers timestamps
        for qa in doc['quizAnswers']:
            qa['timestamp'] = qa['timestamp'].isoformat()
        
        # Upsert to Cosmos DB
        self.container.upsert_item(doc)
        return submission
    
    def save_prediction(self, prediction: Prediction) -> Prediction:
        """Save or update a prediction - updates UserSubmission"""
        # Get or create user submission
        submission = self.get_user_submission(prediction.userName)
        if not submission:
            submission = UserSubmission(userName=prediction.userName)
        
        # Update predictions
        submission.predictions = prediction.predictions
        submission.updatedAt = datetime.utcnow()
        
        # Save submission
        self.save_user_submission(submission)
        
        # Return prediction object for compatibility
        prediction.id = submission.id
        prediction.timestamp = submission.timestamp
        prediction.createdAt = submission.createdAt
        prediction.updatedAt = submission.updatedAt
        return prediction
    
    def get_prediction(self, user_name: str) -> Optional[Prediction]:
        """Get a prediction by username"""
        submission = self.get_user_submission(user_name)
        if not submission or not submission.predictions:
            return None
        
        # Convert to Prediction for compatibility
        return Prediction(
            id=submission.id,
            userName=submission.userName,
            predictions=submission.predictions,
            timestamp=submission.timestamp,
            createdAt=submission.createdAt,
            updatedAt=submission.updatedAt
        )
    
    def get_all_predictions(self) -> Dict[str, Prediction]:
        """Get all predictions"""
        query = "SELECT * FROM c WHERE c.type = 'user_submission'"
        items = list(self.container.query_items(query=query, enable_cross_partition_query=True))
        
        predictions = {}
        for item in items:
            if not item.get('predictions'):
                continue
            
            # Convert datetime strings
            timestamp = datetime.fromisoformat(item['timestamp'])
            createdAt = datetime.fromisoformat(item['createdAt'])
            updatedAt = datetime.fromisoformat(item['updatedAt'])
            
            prediction = Prediction(
                id=item['id'],
                userName=item['userName'],
                predictions=item['predictions'],
                timestamp=timestamp,
                createdAt=createdAt,
                updatedAt=updatedAt
            )
            predictions[prediction.userName] = prediction
        
        return predictions
    
    def get_participants_status(self):
        """Get status of all participants"""
        predictions = self.get_all_predictions()
        status_list = []
        for participant in AMIGOS_INVISIBLES:
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
        """Save a quiz answer - updates UserSubmission"""
        # Get or create user submission
        submission = self.get_user_submission(quiz_answer.userName)
        if not submission:
            submission = UserSubmission(userName=quiz_answer.userName)
        
        # Check if question already answered
        for existing in submission.quizAnswers:
            if existing.questionId == quiz_answer.questionId:
                raise ValueError(f"Question {quiz_answer.questionId} has already been answered")
        
        # Add new answer
        quiz_answer.timestamp = datetime.utcnow()
        answer_data = QuizAnswerData(
            questionId=quiz_answer.questionId,
            answer=quiz_answer.answer,
            timestamp=quiz_answer.timestamp
        )
        submission.quizAnswers.append(answer_data)
        submission.updatedAt = datetime.utcnow()
        
        # Save submission
        self.save_user_submission(submission)
        
        return quiz_answer
    
    def get_user_quiz_answers(self, user_name: str) -> List[QuizAnswer]:
        """Get all quiz answers for a user"""
        submission = self.get_user_submission(user_name)
        if not submission:
            return []
        
        # Convert to QuizAnswer objects for compatibility
        answers = []
        for qa in submission.quizAnswers:
            # We need to check correctness from QUIZ_QUESTIONS
            # For now, return with isCorrect=False as placeholder
            answers.append(QuizAnswer(
                id=f"quiz_answer_{user_name}_{qa.questionId}",
                userName=user_name,
                questionId=qa.questionId,
                answer=qa.answer,
                isCorrect=False,  # Will be calculated in main.py
                timestamp=qa.timestamp
            ))
        
        return answers
    
    def get_all_quiz_answers(self) -> Dict[str, List[QuizAnswer]]:
        """Get all quiz answers grouped by user"""
        query = "SELECT * FROM c WHERE c.type = 'user_submission'"
        items = list(self.container.query_items(query=query, enable_cross_partition_query=True))
        
        answers_by_user = {}
        for item in items:
            user_name = item['userName']
            quiz_answers_data = item.get('quizAnswers', [])
            
            if not quiz_answers_data:
                continue
            
            answers = []
            for qa in quiz_answers_data:
                timestamp = datetime.fromisoformat(qa['timestamp'])
                answers.append(QuizAnswer(
                    id=f"quiz_answer_{user_name}_{qa['questionId']}",
                    userName=user_name,
                    questionId=qa['questionId'],
                    answer=qa['answer'],
                    isCorrect=False,  # Calculated in main.py
                    timestamp=timestamp
                ))
            
            answers_by_user[user_name] = answers
        
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
