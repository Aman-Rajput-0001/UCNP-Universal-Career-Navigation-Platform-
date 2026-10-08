from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class StudentProfileCreate(BaseModel):
    education: str = Field(..., min_length=1, description="Education level, e.g. 10th, 12th, Bachelor's, etc.")
    degree: Optional[str] = Field(default="", description="Degree or program name")
    branch: Optional[str] = Field(default="", description="Branch or subject discipline")
    currentYear: Optional[str] = Field(default="", description="Current academic year or professional status")
    skills: List[str] = Field(default_factory=list, description="List of technical and soft skills")
    interests: List[str] = Field(default_factory=list, description="Areas of interest")
    strengths: List[str] = Field(default_factory=list, description="Personal strengths")
    weaknesses: List[str] = Field(default_factory=list, description="Areas for improvement")
    careerGoal: Optional[str] = Field(default="", description="Target career role or objective")
    availableTime: Optional[str] = Field(default="", description="Weekly time available for learning")

    @field_validator("skills", "interests", "strengths", "weaknesses", mode="before")
    @classmethod
    def parse_comma_separated_or_list(cls, v):
        if isinstance(v, str):
            parts = [item.strip() for item in v.split(",") if item.strip()]
            return parts
        if isinstance(v, list):
            return [str(item).strip() for item in v if str(item).strip()]
        return []


class StudentProfileResponse(BaseModel):
    id: str
    education: str
    degree: str
    branch: str
    currentYear: str
    skills: List[str]
    interests: List[str]
    strengths: List[str]
    weaknesses: List[str]
    careerGoal: str
    availableTime: str
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
    isNormalized: bool = True

    model_config = {
        "from_attributes": True,
    }
