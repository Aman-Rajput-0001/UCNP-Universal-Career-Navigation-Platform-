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


# Structured AI Career Analysis Models (12 Required Items)
class LearningStepItem(BaseModel):
    step_number: int = Field(..., description="Sequential step index")
    title: str = Field(..., description="Topic or skill module title")
    description: str = Field(..., description="Detailed learning guidance")
    skills_covered: List[str] = Field(default_factory=list, description="Skills targeted in this module")
    duration: str = Field(..., description="Estimated study time, e.g. 2-3 Weeks")
    learning_resources: List[str] = Field(default_factory=list, description="Curated docs, tutorials or books")
    practice_drill: str = Field(..., description="Actionable practical exercise")


class ProjectItem(BaseModel):
    title: str = Field(..., description="Project title")
    difficulty: str = Field(default="Intermediate", description="Beginner, Intermediate, or Advanced")
    description: str = Field(..., description="Project scope and architecture")
    technologies: List[str] = Field(default_factory=list, description="Tech stack and tools")
    portfolio_value: str = Field(..., description="What this proves to hiring managers")


class CertificationItem(BaseModel):
    name: str = Field(..., description="Recognized certification name")
    issuer: str = Field(..., description="Issuing body, e.g. AWS, Linux Foundation, Google")
    importance: str = Field(default="Recommended", description="Essential, Recommended, or Optional")
    cost_level: str = Field(default="Free / Low-cost", description="Cost expectation")
    description: str = Field(..., description="Relevance to career validation")


class InternshipPathItem(BaseModel):
    target_roles: List[str] = Field(default_factory=list, description="Target internship titles")
    timing_window: str = Field(default="3-6 Months", description="When to apply and duration")
    prerequisites: List[str] = Field(default_factory=list, description="Minimum portfolio or skills required")
    conversion_strategy: str = Field(..., description="How to transition to full-time")


class ResumeGuidance(BaseModel):
    headline: str = Field(..., description="Impactful professional headline for resume")
    summary: str = Field(..., description="ATS-optimized summary statement")
    top_keywords: List[str] = Field(default_factory=list, description="High-priority keywords for applicant tracking systems")
    recommended_sections: List[str] = Field(default_factory=list, description="Order and focus of resume sections")
    action_bullet_points: List[str] = Field(default_factory=list, description="3-5 sample achievement bullet points")


class InterviewPreparation(BaseModel):
    technical_questions: List[str] = Field(default_factory=list, description="Core technical questions asked for this role")
    behavioral_questions: List[str] = Field(default_factory=list, description="Key behavioral/STAR format questions")
    project_deep_dive_topics: List[str] = Field(default_factory=list, description="How interviewers will probe projects")
    preparation_tips: List[str] = Field(default_factory=list, description="Strategic interview advice")


class EntryLevelJob(BaseModel):
    job_title: str = Field(..., description="Entry-level job title")
    typical_responsibilities: List[str] = Field(default_factory=list, description="Day-to-day responsibilities")
    salary_range: str = Field(..., description="Representative market entry compensation bracket")
    target_companies: str = Field(default="Tech scaleups, startups, IT consultancies", description="Types of employers")


class CareerGrowthStage(BaseModel):
    stage_name: str = Field(..., description="e.g. Junior (0-2y), Mid-Level (2-5y), Senior (5+y), Lead/Architect")
    timeline: str = Field(..., description="Expected years in role")
    key_responsibilities: List[str] = Field(default_factory=list, description="Scope of responsibility")
    skills_required_for_next_level: List[str] = Field(default_factory=list, description="Skills to level up")


class FullCareerAnalysisResponse(BaseModel):
    career_options: List[CareerDiscoveryItem] = Field(..., description="1. Discovered career options")
    skill_gap: SkillGapResponse = Field(..., description="2. Detailed skill gap evaluation for the primary recommendation")
    recommended_career_goal: str = Field(..., description="3. Specifically recommended target career goal")
    roadmap: List[str] = Field(..., description="4. High-level roadmap milestone phases")
    learning_steps: List[LearningStepItem] = Field(..., description="5. Step-by-step modular learning progression")
    projects: List[ProjectItem] = Field(..., description="6. Proof-of-work project blueprints")
    certifications: List[CertificationItem] = Field(..., description="7. Industry recognized certifications")
    internship_path: InternshipPathItem = Field(..., description="8. Structured internship roadmap")
    resume_guidance: ResumeGuidance = Field(..., description="9. ATS resume tailoring guidelines")
    interview_preparation: InterviewPreparation = Field(..., description="10. Technical and behavioral interview preparation")
    entry_level_jobs: List[EntryLevelJob] = Field(..., description="11. Realistic entry-level job roles and compensation")
    career_growth: List[CareerGrowthStage] = Field(..., description="12. Long-term multi-stage career growth ladder")

