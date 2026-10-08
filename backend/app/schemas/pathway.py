from typing import List, Optional
from pydantic import BaseModel, Field


# 1. Internship Structured Data Model (Role archetypes & requirements, clearly labeled Demo/Blueprint)
class InternshipModel(BaseModel):
    id: str = Field(..., description="Unique internship identifier, e.g. intern-1")
    title: str = Field(..., description="Role title, e.g. Junior Backend Engineering Intern")
    organization_type: str = Field(default="Early-Stage Startup / Tech Scaleup", description="Type of company or organization")
    duration: str = Field(..., description="Duration, e.g. 3-6 Months")
    stipend_range: str = Field(..., description="Representative compensation/stipend bracket")
    location_type: str = Field(default="Remote / Hybrid", description="Work arrangement")
    required_skills: List[str] = Field(default_factory=list, description="Must-have verified skills")
    learning_outcomes: List[str] = Field(default_factory=list, description="Hands-on skills to gain during internship")
    conversion_potential: str = Field(..., description="Likelihood and criteria for PPO / full-time conversion")
    is_demo_blueprint: bool = Field(default=True, description="Explicit marker indicating non-scraped archetype data")


# 2. Entry-Level Role Structured Data Model
class EntryRoleModel(BaseModel):
    id: str = Field(..., description="Unique entry role identifier, e.g. role-1")
    title: str = Field(..., description="Entry-level job title, e.g. Associate Software Engineer")
    experience_level: str = Field(default="0-1 Years (Fresher / Transition)", description="Experience requirements")
    typical_salary_range: str = Field(..., description="Industry-standard benchmark compensation")
    key_responsibilities: List[str] = Field(default_factory=list, description="Core day-to-day work expectations")
    minimum_qualifications: str = Field(..., description="Degree or equivalent verified portfolio benchmark")
    interview_focus_areas: List[str] = Field(default_factory=list, description="Evaluation topics assessed during hiring")
    is_demo_blueprint: bool = Field(default=True, description="Explicit marker indicating archetype data")


# 3. Career Stage Progression Structured Data Model
class CareerStageModel(BaseModel):
    stage_level: int = Field(..., description="Sequence level (1: Entry, 2: Mid-level, 3: Senior, 4: Specialist / Lead, 5: Management Possibility)")
    stage_name: str = Field(..., description="Title, e.g. Entry Role, Mid-Level Engineer, Senior Specialist, Engineering Lead, Technical Manager")
    role_type: str = Field(
        ...,
        description="Role classification: 'entry' | 'mid' | 'senior' | 'specialist_lead' | 'management'"
    )
    experience_expectations: str = Field(..., description="Experience expectations, e.g. 0-2 Years, 2-5 Years, 5-8 Years")
    years_of_experience: str = Field(default="", description="Alias or shorthand for experience tenure")
    expected_capabilities: List[str] = Field(default_factory=list, description="Core capabilities and expectations for this stage")
    skills_required_for_next_stage: List[str] = Field(default_factory=list, description="Specific skills required to advance to the next career stage")
    possible_specialization: List[str] = Field(default_factory=list, description="Niche domains or functional specializations at this stage")
    upskilling_recommendations: List[str] = Field(default_factory=list, description="Concrete upskilling courses, certs, or practice initiatives")
    management_track_notes: Optional[str] = Field(default=None, description="Guidance on engineering management / leadership crossover")
    target_compensation_range: str = Field(
        default="Representative market benchmark (illustrative range, non-guaranteed)",
        description="Illustrative market compensation bracket"
    )
    key_promotion_milestones: List[str] = Field(default_factory=list, description="Demonstrated deliverables needed to advance")


# Dedicated Career Growth Progression Response & Request Models
class CareerGrowthRequest(BaseModel):
    career_name: str = Field(..., min_length=1, description="Target career pathway")
    current_skills: List[str] = Field(default_factory=list, description="Current candidate skillset")
    current_stage: Optional[str] = Field(default="entry", description="Current or starting career stage")


class CareerGrowthResponse(BaseModel):
    career_name: str = Field(..., description="Target career profession")
    entry_role: CareerStageModel = Field(..., description="Stage 1: Entry-level role")
    mid_level_role: CareerStageModel = Field(..., description="Stage 2: Mid-level role")
    senior_role: CareerStageModel = Field(..., description="Stage 3: Senior role")
    specialist_lead_role: CareerStageModel = Field(..., description="Stage 4: Specialist / Technical Lead role")
    management_possibility: CareerStageModel = Field(..., description="Stage 5: Management track possibility")
    all_stages: List[CareerStageModel] = Field(default_factory=list, description="Sequential ordered list of all 5 stages")
    disclaimer: str = Field(
        default="Important Notice: Career progression benchmarks and illustrative compensation estimates reflect broader industry norms and do not represent guaranteed job placement, salary offers, or accelerated promotion timelines. Advancement depends on individual performance, business needs, and regional market conditions.",
        description="Clear anti-guarantee disclaimer"
    )


# Complete Pathway Progression Response
class CareerPathwayResponse(BaseModel):
    career_name: str = Field(..., description="Target profession")
    internship: InternshipModel = Field(..., description="Experiential learning archetype")
    entry_role: EntryRoleModel = Field(..., description="Entry-level target position archetype")
    career_stages: List[CareerStageModel] = Field(default_factory=list, description="Multi-stage long-term progression path")
    progression_chain: List[str] = Field(
        default_factory=lambda: [
            "Skills",
            "Projects",
            "Portfolio",
            "Resume",
            "Internship",
            "Entry-level role",
            "Career growth",
        ],
        description="The standardized 7-phase progression sequence",
    )
    disclaimer: str = Field(
        default="Notice: Curated archetype models based on industry hiring standards. Not live scraped job postings.",
        description="Clear transparency notice",
    )


class CareerPathwayRequest(BaseModel):
    career_name: str = Field(..., min_length=1, description="Target career name")
    candidate_skills: List[str] = Field(default_factory=list, description="Candidate skills")
    education_level: Optional[str] = Field(default=None, description="Candidate education level")

