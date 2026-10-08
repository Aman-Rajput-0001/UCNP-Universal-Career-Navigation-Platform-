from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.career import EligibilityCheckResponse, SkillGapResponse


class CareerSimulationRequest(BaseModel):
    career_name: str = Field(..., min_length=1, description="Target career to simulate, e.g. Data Analyst, Product Manager, Government career")
    education: Optional[str] = Field(default="Bachelor's Degree", description="Current education level")
    degree: Optional[str] = Field(default="", description="Degree title, e.g. B.Tech")
    branch: Optional[str] = Field(default="", description="Major branch/discipline")
    current_year: Optional[str] = Field(default="", description="Current academic year")
    current_skills: List[str] = Field(default_factory=list, description="Existing skills of the student")
    available_time: Optional[str] = Field(default="15 hrs/week", description="Available time per week")
    profile_id: Optional[str] = Field(default=None, description="Optional stored profile ID")


class SimulationMajorStep(BaseModel):
    step_number: int
    title: str
    phase: str
    estimated_duration: str
    focus: str
    deliverable: str


class CareerSimulationResponse(BaseModel):
    career: str = Field(..., description="Simulated career name")
    eligibility: EligibilityCheckResponse = Field(..., description="Authoritative eligibility status and criteria")
    skill_gap: SkillGapResponse = Field(..., description="Current vs required skills analysis")
    estimated_path: str = Field(..., description="High-level transition summary and pathway overview")
    required_qualification: str = Field(..., description="Primary qualification and prerequisite credentials")
    major_steps: List[SimulationMajorStep] = Field(..., description="Key roadmap milestones in this hypothetical path")
    possible_entry_roles: List[str] = Field(..., description="Immediate realistic entry-level roles upon completion")

