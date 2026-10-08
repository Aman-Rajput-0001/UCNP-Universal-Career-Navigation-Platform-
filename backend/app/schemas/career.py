from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class EligibilityLevel(str, Enum):
    direct = "direct"
    additional_requirements = "additional_requirements"
    restricted = "restricted"


class EligibilityStatusColor(str, Enum):
    GREEN = "GREEN"    # Directly accessible
    YELLOW = "YELLOW"  # Possible with additional qualification/skills
    RED = "RED"        # Mandatory professional qualification or major eligibility barrier


class SkillPriority(str, Enum):
    high = "high"
    medium = "medium"
    low = "low"


class PrioritySkillItem(BaseModel):
    skill_name: str
    priority: SkillPriority
    reason: str


class CareerDiscoveryItem(BaseModel):
    career_name: str = Field(..., description="Target career title")
    match_reason: str = Field(..., description="Realistic match justification based on student background and skills")
    eligibility_level: EligibilityLevel = Field(
        ...,
        description="Eligibility classification: direct, additional_requirements, or restricted"
    )
    required_skills: List[str] = Field(default_factory=list, description="Key skills demanded by this career")
    missing_skills: List[str] = Field(default_factory=list, description="Skills student currently needs to acquire")
    qualification_requirements: str = Field(..., description="Realistic educational or regulatory requirements")
    possible_entry_roles: List[str] = Field(default_factory=list, description="Entry-level job titles or pathways")


class CareerDiscoveryRequest(BaseModel):
    profile_id: Optional[str] = Field(default=None, description="Optional profile ID from database")
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


class CareerDiscoveryResponse(BaseModel):
    careers: List[CareerDiscoveryItem]
    summary: Optional[str] = Field(default="", description="High level overview of candidate discoverability")


# Eligibility Checker Request and Response Schemas
class EligibilityCheckRequest(BaseModel):
    profile_id: Optional[str] = Field(default=None)
    career_name: str = Field(..., min_length=1, description="Target career to evaluate")
    education: str = Field(..., min_length=1, description="Candidate education level")
    degree: Optional[str] = Field(default="")
    branch: Optional[str] = Field(default="")
    skills: List[str] = Field(default_factory=list)


class EligibilityCheckResponse(BaseModel):
    status: EligibilityStatusColor = Field(..., description="GREEN, YELLOW, or RED")
    qualification_requirements: str = Field(..., description="Formal education or credential benchmark")
    additional_requirements: List[str] = Field(default_factory=list, description="Bridge certifications, portfolio or prerequisites needed")
    missing_requirements: List[str] = Field(default_factory=list, description="Items currently missing from candidate profile")
    explanation: str = Field(..., description="Clear breakdown of eligibility evaluation")


# Skill Gap Analysis Schemas
class SkillGapRequest(BaseModel):
    profile_id: Optional[str] = Field(default=None)
    career_name: str = Field(..., min_length=1, description="Selected career")
    current_skills: List[str] = Field(default_factory=list, description="Student's existing skills")
    required_skills: List[str] = Field(default_factory=list, description="Career's required skills (optional, inferred if empty)")


class SkillGapResponse(BaseModel):
    matched_skills: List[str] = Field(default_factory=list, description="Skills current profile satisfies")
    missing_skills: List[str] = Field(default_factory=list, description="Key skills student needs to develop")
    priority_skills: List[PrioritySkillItem] = Field(default_factory=list, description="Missing skills categorized by priority: high, medium, low")
    skill_level: str = Field(..., description="Overall baseline level: Beginner, Intermediate, or Advanced")
    reason: str = Field(..., description="Actionable rationale for prioritizing skill development")
