import uuid
from datetime import datetime
from typing import Dict, Optional
import logging
from sqlalchemy.orm import Session
from app.models.mock_interview import MockInterviewSessionModel
from app.schemas.interview import QuestionItem
from app.schemas.mock_interview import (
    MockInterviewStartRequest,
    MockInterviewSessionResponse,
    MockInterviewTurn,
    MockInterviewSubmitAnswerRequest,
    MockInterviewFinishRequest,
    FinalFeedbackResult,
)
from app.agents.mock_interview_agent import GeminiMockInterviewAIProvider, MockInterviewAIProviderInterface

logger = logging.getLogger("uvicorn.error")

# High-availability in-memory session cache
_in_memory_mock_sessions: Dict[str, dict] = {}


class MockInterviewService:
    def __init__(self, ai_provider: Optional[MockInterviewAIProviderInterface] = None):
        self.ai_provider = ai_provider or GeminiMockInterviewAIProvider()

    async def start_session(
        self,
        request: MockInterviewStartRequest,
        db: Optional[Session] = None,
    ) -> MockInterviewSessionResponse:
        session_id = f"mock-{uuid.uuid4().hex[:12]}"
        career = request.target_career or "Software Engineer"

        # Generate questions
        questions = await self.ai_provider.generate_mock_questions(request)
        total_questions = len(questions)

        # Create turns
        turns = [
            MockInterviewTurn(
                turn_number=idx + 1,
                question_id=q.id,
                category=q.category,
                question=q.question,
                context_or_tip=q.context_or_tip,
                difficulty=q.difficulty,
            )
            for idx, q in enumerate(questions)
        ]

        questions_dict_list = [q.dict() for q in questions]
        turns_dict_list = [t.dict() for t in turns]

        # 1. Save to in-memory store
        session_data = {
            "session_id": session_id,
            "profile_id": request.profile_id,
            "career_name": career,
            "status": "in_progress",
            "current_question_index": 0,
            "total_questions": total_questions,
            "questions": questions_dict_list,
            "turns": turns_dict_list,
            "final_feedback": None,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
        _in_memory_mock_sessions[session_id] = session_data

        # 2. Persist to PostgreSQL database if available
        if db:
            try:
                record = MockInterviewSessionModel(
                    session_id=session_id,
                    profile_id=request.profile_id,
                    career_name=career,
                    status="in_progress",
                    current_question_index=0,
                    total_questions=total_questions,
                    questions=questions_dict_list,
                    turns=turns_dict_list,
                    final_feedback=None,
                )
                db.add(record)
                db.commit()
                logger.info(f"Mock interview session {session_id} persisted to database")
            except Exception as e:
                db.rollback()
                logger.warning(f"Database persist warning for mock interview {session_id}: {e}")

        first_question = questions[0] if questions else None

        return MockInterviewSessionResponse(
            session_id=session_id,
            career_name=career,
            status="in_progress",
            current_question_index=0,
            total_questions=total_questions,
            current_question=first_question,
            turns=turns,
            final_feedback=None,
        )

    async def submit_turn_answer(
        self,
        request: MockInterviewSubmitAnswerRequest,
        db: Optional[Session] = None,
    ) -> MockInterviewSessionResponse:
        session_id = request.session_id
        session_data = self._get_raw_session(session_id, db)
        if not session_data:
            raise ValueError(f"Session {session_id} not found")

        curr_idx = session_data["current_question_index"]
        questions = [QuestionItem(**q) for q in session_data["questions"]]
        turns = [MockInterviewTurn(**t) for t in session_data["turns"]]

        # Find current question
        current_q = None
        for q in questions:
            if q.id == request.question_id:
                current_q = q
                break
        if not current_q and curr_idx < len(questions):
            current_q = questions[curr_idx]

        if not current_q:
            raise ValueError("No matching question found for answer submission")

        # Evaluate the student answer
        eval_res = await self.ai_provider.evaluate_turn_answer(
            session_data["career_name"], current_q, request.student_answer
        )

        # Update the corresponding turn
        for t in turns:
            if t.question_id == current_q.id:
                t.student_answer = request.student_answer
                t.evaluation = eval_res
                break

        # Advance index if within range
        next_idx = curr_idx + 1
        session_data["current_question_index"] = next_idx
        session_data["turns"] = [t.dict() for t in turns]
        session_data["updated_at"] = datetime.utcnow().isoformat()

        # Update DB and memory
        self._save_raw_session(session_id, session_data, db)

        next_q = questions[next_idx] if next_idx < len(questions) else None

        return MockInterviewSessionResponse(
            session_id=session_id,
            career_name=session_data["career_name"],
            status=session_data["status"],
            current_question_index=next_idx,
            total_questions=session_data["total_questions"],
            current_question=next_q,
            turns=turns,
            final_feedback=FinalFeedbackResult(**session_data["final_feedback"])
            if session_data.get("final_feedback")
            else None,
        )

    async def finish_session(
        self,
        request: MockInterviewFinishRequest,
        db: Optional[Session] = None,
    ) -> MockInterviewSessionResponse:
        session_id = request.session_id
        session_data = self._get_raw_session(session_id, db)
        if not session_data:
            raise ValueError(f"Session {session_id} not found")

        turns = [MockInterviewTurn(**t) for t in session_data["turns"]]
        career = session_data["career_name"]

        # Synthesize final feedback
        final_feedback = await self.ai_provider.synthesize_final_feedback(career, turns)

        session_data["status"] = "completed"
        session_data["final_feedback"] = final_feedback.dict()
        session_data["updated_at"] = datetime.utcnow().isoformat()

        self._save_raw_session(session_id, session_data, db)

        return MockInterviewSessionResponse(
            session_id=session_id,
            career_name=career,
            status="completed",
            current_question_index=session_data["current_question_index"],
            total_questions=session_data["total_questions"],
            current_question=None,
            turns=turns,
            final_feedback=final_feedback,
        )

    async def get_session(
        self,
        session_id: str,
        db: Optional[Session] = None,
    ) -> Optional[MockInterviewSessionResponse]:
        session_data = self._get_raw_session(session_id, db)
        if not session_data:
            return None

        curr_idx = session_data["current_question_index"]
        questions = [QuestionItem(**q) for q in session_data.get("questions", [])]
        turns = [MockInterviewTurn(**t) for t in session_data.get("turns", [])]
        current_q = questions[curr_idx] if curr_idx < len(questions) else None

        final_fb = (
            FinalFeedbackResult(**session_data["final_feedback"])
            if session_data.get("final_feedback")
            else None
        )

        return MockInterviewSessionResponse(
            session_id=session_id,
            career_name=session_data["career_name"],
            status=session_data["status"],
            current_question_index=curr_idx,
            total_questions=session_data["total_questions"],
            current_question=current_q,
            turns=turns,
            final_feedback=final_fb,
        )

    def _get_raw_session(self, session_id: str, db: Optional[Session]) -> Optional[dict]:
        # 1. Try DB
        if db:
            try:
                record = (
                    db.query(MockInterviewSessionModel)
                    .filter(MockInterviewSessionModel.session_id == session_id)
                    .first()
                )
                if record:
                    return {
                        "session_id": record.session_id,
                        "profile_id": record.profile_id,
                        "career_name": record.career_name,
                        "status": record.status,
                        "current_question_index": record.current_question_index,
                        "total_questions": record.total_questions,
                        "questions": record.questions or [],
                        "turns": record.turns or [],
                        "final_feedback": record.final_feedback,
                    }
            except Exception as e:
                logger.warning(f"DB read error for mock interview {session_id}: {e}")

        # 2. Try Memory
        return _in_memory_mock_sessions.get(session_id)

    def _save_raw_session(self, session_id: str, data: dict, db: Optional[Session]) -> None:
        _in_memory_mock_sessions[session_id] = data

        if db:
            try:
                record = (
                    db.query(MockInterviewSessionModel)
                    .filter(MockInterviewSessionModel.session_id == session_id)
                    .first()
                )
                if record:
                    record.status = data.get("status", "in_progress")
                    record.current_question_index = data.get("current_question_index", 0)
                    record.turns = data.get("turns", [])
                    record.final_feedback = data.get("final_feedback")
                    record.updated_at = datetime.utcnow()
                    db.commit()
                else:
                    record = MockInterviewSessionModel(
                        session_id=session_id,
                        profile_id=data.get("profile_id"),
                        career_name=data.get("career_name", ""),
                        status=data.get("status", "in_progress"),
                        current_question_index=data.get("current_question_index", 0),
                        total_questions=data.get("total_questions", 4),
                        questions=data.get("questions", []),
                        turns=data.get("turns", []),
                        final_feedback=data.get("final_feedback"),
                    )
                    db.add(record)
                    db.commit()
            except Exception as e:
                db.rollback()
                logger.warning(f"DB update error for mock interview {session_id}: {e}")

