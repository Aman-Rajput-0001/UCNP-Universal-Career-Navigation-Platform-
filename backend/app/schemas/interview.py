from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.assist import StudentProfileContext


class QuestionItem(BaseModel):
    id: str = Field(..., description="Unique question identifier, e.g. tech-1")
    category: str = Field(..., description="technical | behavioral | project | career_specific")
    question: str = Field(..., description="Interview question text")
    context_or_tip: str = Field(default="", description="Guiding tip or recommended focus for answering")
    difficulty: Optional[str] = Field(default="Medium", description="Easy | Medium | Hard")
    expected_topics: List[str] = Field(default_factory=list, description="Key concepts or skills tested")


class InterviewGenerateRequest(BaseModel):
    profile_id: Optional[str] = Field(default=None)
    student_profile: Optional[StudentProfileContext] = Field(default=None)
    target_career: str = Field(..., min_length=1, description="Target career role")
    skills: List[str] = Field(default_factory=list, description="Candidate skills")
    projects: List[str] = Field(default_factory=list, description="Projects candidate has built or planned")
    roadmap: List[str] = Field(default_factory=list, description="Roadmap milestones or summary steps")


class InterviewGenerateResponse(BaseModel):
    career_name: str = Field(..., description="Target career for the interview prep")
    technical_questions: List[QuestionItem] = Field(default_factory=list)
    behavioral_questions: List[QuestionItem] = Field(default_factory=list)
    project_questions: List[QuestionItem] = Field(default_factory=list)
    career_specific_questions: List[QuestionItem] = Field(default_factory=list)
    total_questions_count: int = Field(default=0)
    summary: str = Field(default="", description="Interview focus overview and strategy")


class InterviewAnswerSubmitRequest(BaseModel):
    career_name: str = Field(..., min_length=1)
    question_id: str = Field(...)
    question: str = Field(...)
    category: str = Field(default="technical")
    answer: str = Field(..., min_length=1, description="Student's typed response")
    student_profile: Optional[StudentProfileContext] = Field(default=None)


class InterviewAnswerEvaluateResponse(BaseModel):
    question_id: str = Field(...)
    score: int = Field(..., ge=1, le=10, description="Score out of 10")
    rating: str = Field(..., description="Strong Answer | Good Effort | Needs Improvement")
    feedback: str = Field(..., description="Overall constructive evaluation")
    strengths: List[str] = Field(default_factory=list, description="What the student did well")
    improvement_tips: List[str] = Field(default_factory=list, description="Actionable points to sharpen")
    sample_better_answer: str = Field(..., description="Exemplary model response illustrating best practices")

