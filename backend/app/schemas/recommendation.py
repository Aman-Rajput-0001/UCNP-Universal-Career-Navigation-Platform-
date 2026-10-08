from typing import List, Optional
from pydantic import BaseModel, Field


# Learning Recommendation Models
class LearningRecommendationItem(BaseModel):
    skill_name: str = Field(..., description="Target skill to acquire")
    what_to_learn: List[str] = Field(default_factory=list, description="Core concepts, syntax, patterns, and principles to study")
    learning_sequence: List[str] = Field(default_factory=list, description="Step-by-step phased curriculum sequence")
    estimated_time: str = Field(..., description="Estimated time needed, e.g., 2-3 Weeks or 15-20 Hours")
    prerequisite_knowledge: List[str] = Field(default_factory=list, description="Required foundational knowledge before starting")
    practice_recommendation: str = Field(..., description="Actionable exercises, interactive sandboxes, or coding drills")


class LearningRecommendationRequest(BaseModel):
    career_name: str = Field(..., min_length=1, description="Target career role")
    skills: List[str] = Field(..., min_length=1, description="List of target roadmap skills to generate learning plans for")
    current_skills: List[str] = Field(default_factory=list, description="Candidate's already known skills")
    available_time: Optional[str] = Field(default=None, description="Available study time per week")


class LearningRecommendationResponse(BaseModel):
    career_name: str
    learning_recommendations: List[LearningRecommendationItem]
    summary: str


# Project Recommendation Models
class ProjectDifficulty(str):
    beginner = "Beginner"
    intermediate = "Intermediate"
    advanced = "Advanced"


class ProjectRecommendationItem(BaseModel):
    project_title: str = Field(..., description="Compelling, portfolio-ready project title")
    difficulty: str = Field(..., description="Beginner, Intermediate, or Advanced")
    skills_practiced: List[str] = Field(default_factory=list, description="Skills exercised and verified in this project")
    expected_outcome: str = Field(..., description="Observable deliverable, features, and production readiness")
    portfolio_value: str = Field(..., description="Why hiring managers and recruiters value this piece")


class ProjectRecommendationRequest(BaseModel):
    career_name: str = Field(..., min_length=1, description="Target career role")
    skills: List[str] = Field(..., min_length=1, description="List of skills to build projects around")
    current_skills: List[str] = Field(default_factory=list, description="Candidate's existing skillset")
    education_level: Optional[str] = Field(default=None, description="Educational or background context")


class ProjectRecommendationResponse(BaseModel):
    career_name: str
    project_recommendations: List[ProjectRecommendationItem]
    summary: str

