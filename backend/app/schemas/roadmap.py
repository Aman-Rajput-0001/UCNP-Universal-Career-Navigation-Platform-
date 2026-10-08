from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.career import EligibilityCheckResponse, SkillGapResponse


class RoadmapStepType(str, Enum):
    learning = "learning"
    project = "project"
    certification = "certification"
    internship = "internship"
    portfolio = "portfolio"
    interview = "interview"
    job = "job"


class RoadmapStep(BaseModel):
    id: str = Field(..., description="Unique step identifier, e.g. step-1")
    title: str = Field(..., description="Actionable title for this milestone")
    type: RoadmapStepType = Field(..., description="Type of roadmap step")
    description: str = Field(..., description="Detailed description and tactical goal of this step")
    prerequisites: List[str] = Field(default_factory=list, description="IDs of steps or qualifications required beforehand")
    skills: List[str] = Field(default_factory=list, description="Target skills developed in this step")
    estimated_duration: str = Field(..., description="Estimated timeline, e.g. 3-4 Weeks")
    projects: List[str] = Field(default_factory=list, description="Practical deliverables or project items")
    resources: List[str] = Field(default_factory=list, description="Recommended learning resources, platforms, or tools")
    completion_criteria: str = Field(..., description="Observable criteria to declare step finished")


class RoadmapGenerateProfileInput(BaseModel):
    education: str = Field(..., min_length=1)
    degree: Optional[str] = Field(default="")
    branch: Optional[str] = Field(default="")
    currentYear: Optional[str] = Field(default="")
    skills: List[str] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    careerGoal: Optional[str] = Field(default="")
    availableTime: Optional[str] = Field(default="")


class RoadmapGenerateRequest(BaseModel):
    profile_id: Optional[str] = Field(default=None, description="Optional stored profile ID")
    profile: Optional[RoadmapGenerateProfileInput] = Field(default=None, description="Direct student profile input if profile_id not stored")
    selected_career: str = Field(..., min_length=1, description="Selected target career name")
    eligibility_result: Optional[EligibilityCheckResponse] = Field(default=None, description="Eligibility evaluation context")
    skill_gap_result: Optional[SkillGapResponse] = Field(default=None, description="Skill gap analysis context")


class RoadmapGenerateResponse(BaseModel):
    career_name: str = Field(..., description="Target career title")
    total_estimated_duration: str = Field(..., description="Overall duration across all phases")
    summary: str = Field(..., description="Executive summary of the personalized roadmap")
    steps: List[RoadmapStep] = Field(default_factory=list, description="Sequential roadmap step nodes")


# Dynamic Replanning Schemas
class RoadmapNewInformation(BaseModel):
    new_skills: List[str] = Field(default_factory=list, description="Newly acquired or added skills")
    updated_available_time: Optional[str] = Field(default=None, description="Updated study/work time per week")
    target_career: Optional[str] = Field(default=None, description="New or updated target career")
    additional_notes: Optional[str] = Field(default=None, description="Any extra context or constraints")


class RoadmapReplanRequest(BaseModel):
    profile_id: Optional[str] = Field(default=None, description="Optional stored profile ID")
    current_profile: Optional[RoadmapGenerateProfileInput] = Field(default=None, description="Current student profile snapshot")
    current_roadmap: List[RoadmapStep] = Field(default_factory=list, description="All steps in the currently active roadmap")
    completed_steps: List[str] = Field(default_factory=list, description="IDs of steps already completed by the student")
    new_information: Optional[RoadmapNewInformation] = Field(default=None, description="Changes in skills, time, career, etc.")
    target_career: Optional[str] = Field(default=None, description="Target career name (falls back to roadmap or profile)")


class RoadmapReplanResponse(BaseModel):
    career_name: str = Field(..., description="Target career title")
    total_estimated_duration: str = Field(..., description="Updated estimated duration for completion")
    summary: str = Field(..., description="Replanning rationale and changes explanation")
    completed_steps: List[RoadmapStep] = Field(default_factory=list, description="Preserved completed milestone steps")
    remaining_steps: List[RoadmapStep] = Field(default_factory=list, description="Updated remaining milestones")
    all_steps: List[RoadmapStep] = Field(default_factory=list, description="Full stitched roadmap (completed + remaining)")


