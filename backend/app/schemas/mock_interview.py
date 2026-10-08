from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.interview import QuestionItem, InterviewAnswerEvaluateResponse
from app.schemas.assist import StudentProfileContext


class MockInterviewStartRequest(BaseModel):
    profile_id: Optional[str] = Field(default=None)
    student_profile: Optional[StudentProfileContext] = Field(default=None)
    target_career: str = Field(..., min_length=1, description="Target career for the mock interview")
    skills: List[str] = Field(default_factory=list)
    projects: List[str] = Field(default_factory=list)
    question_count: int = Field(default=4, ge=3, le=6, description="Number of questions in mock round")


class MockInterviewTurn(BaseModel):
    turn_number: int
    question_id: str
    category: str
    question: str
    context_or_tip: str
    difficulty: Optional[str] = "Medium"
    student_answer: Optional[str] = None
    evaluation: Optional[InterviewAnswerEvaluateResponse] = None


class CategoryFeedback(BaseModel):
    score: int = Field(..., ge=1, le=10, description="Score out of 10")
    summary: str = Field(..., description="Qualitative assessment of this dimension")
    key_observations: List[str] = Field(default_factory=list)


class ConfidenceIndicators(BaseModel):
    score: int = Field(..., ge=1, le=10, description="Professional poise and clarity score out of 10")
    articulation_clarity: str = Field(..., description="Observable structural clarity and directness")
    assertiveness_level: str = Field(..., description="Directness and conviction in technical explanations")
    observable_signals: List[str] = Field(default_factory=list, description="Objective linguistic and structural cues observed")


class FinalFeedbackResult(BaseModel):
    overall_score: int = Field(..., ge=1, le=10, description="Overall interview performance score")
    readiness_rating: str = Field(..., description="e.g. Interview Ready, Nearly Ready, Needs Preparation")
    executive_summary: str = Field(..., description="Overall summary of the candidate's mock session")
    communication: CategoryFeedback = Field(..., description="Communication structure and clarity")
    technical_knowledge: CategoryFeedback = Field(..., description="Depth and accuracy of domain knowledge")
    answer_quality: CategoryFeedback = Field(..., description="Substance, relevance, and trade-off analysis")
    confidence_indicators: ConfidenceIndicators = Field(..., description="Observable professional poise and clarity metrics")
    knowledge_gaps: List[str] = Field(default_factory=list, description="Specific concepts or topics requiring review")
    improvement_suggestions: List[str] = Field(default_factory=list, description="Actionable recommendations before live interviews")
    disclaimer: str = Field(
        default="Notice: This mock interview evaluation is strictly an objective technical and professional readiness assessment. It does not provide, imply, or claim psychological, clinical, cognitive, or medical assessments.",
        description="Mandatory non-clinical disclaimer",
    )


class MockInterviewSessionResponse(BaseModel):
    session_id: str
    career_name: str
    status: str  # 'in_progress' | 'completed'
    current_question_index: int
    total_questions: int
    current_question: Optional[QuestionItem] = None
    turns: List[MockInterviewTurn] = Field(default_factory=list)
    final_feedback: Optional[FinalFeedbackResult] = None


class MockInterviewSubmitAnswerRequest(BaseModel):
    session_id: str
    question_id: str
    student_answer: str = Field(..., min_length=1)


class MockInterviewFinishRequest(BaseModel):
    session_id: str

