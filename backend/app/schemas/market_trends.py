from typing import List, Optional
from pydantic import BaseModel, Field


# 1. Market Trend Model
class MarketTrendItem(BaseModel):
    id: str = Field(..., description="Unique trend identifier, e.g. trend-01")
    title: str = Field(..., description="Trend topic title, e.g. Generative AI and Agentic Automation")
    direction: str = Field(..., description="Trajectory: 'Rising' | 'Transforming' | 'Stable' | 'Declining'")
    impact_level: str = Field(..., description="Severity of impact: 'High' | 'Medium' | 'Critical'")
    time_horizon: str = Field(..., description="Time horizon, e.g. 1-3 Years, 3-5 Years")
    summary: str = Field(..., description="Contextual explanation of industry dynamics")
    key_drivers: List[str] = Field(default_factory=list, description="Primary forces driving this trend")
    affected_sectors: List[str] = Field(default_factory=list, description="Industry sectors experiencing the biggest shift")


# 2. In-Demand Skill Model
class InDemandSkillItem(BaseModel):
    id: str = Field(..., description="Unique skill identifier, e.g. skill-req-01")
    name: str = Field(..., description="Skill name, e.g. Python, Kubernetes, LLM Orchestration")
    category: str = Field(..., description="Technical, Analytical, Domain, or Leadership")
    demand_intensity: str = Field(..., description="Level: 'Very High' | 'High' | 'Moderate'")
    growth_rate_label: str = Field(..., description="Qualitative or benchmark indicator, e.g. '+34% YoY hiring mentions (Benchmark)'")
    typical_roles: List[str] = Field(default_factory=list, description="Roles requiring this skill")
    recommended_tools: List[str] = Field(default_factory=list, description="Modern frameworks or tools associated with this skill")


# 3. Occupation Evolution & Changes Model
class OccupationChangeItem(BaseModel):
    id: str = Field(..., description="Unique occupation identifier, e.g. occ-01")
    occupation_title: str = Field(..., description="Job role, e.g. Full Stack Developer, Data Analyst")
    evolution_type: str = Field(..., description="'Expanding' | 'Transforming' | 'Automating' | 'Emerging'")
    automation_exposure: str = Field(..., description="Low, Moderate, High risk/augmentation exposure")
    emerging_responsibilities: List[str] = Field(default_factory=list, description="New duties emerging in the job market")
    declining_responsibilities: List[str] = Field(default_factory=list, description="Legacy duties being phased out or automated")
    upskilling_path: str = Field(..., description="Recommended career pivot or adaptation direction")


# 4. Future Skill Model (Emerging 3-7 Year Horizon)
class FutureSkillItem(BaseModel):
    id: str = Field(..., description="Unique identifier, e.g. fut-01")
    name: str = Field(..., description="Future skill name, e.g. Agentic Workflows & Multi-Agent Systems")
    maturity_stage: str = Field(..., description="'Nascent' | 'Early Adopter' | 'Mainstream Frontier'")
    readiness_urgency: str = Field(..., description="'Learn Now' | 'Watch & Experiment' | 'Future Horizon'")
    why_it_matters: str = Field(..., description="Explanation of why this skill will define the next cycle")
    learning_approach: str = Field(..., description="Recommended approach for early mastery")
    prerequisite_foundations: List[str] = Field(default_factory=list, description="Foundations to master before tackling this future skill")


# Aggregated Response Model
class MarketTrendsResponse(BaseModel):
    career_focus: str = Field(..., description="Domain or career queried, e.g. Software Engineering / Tech")
    data_source_mode: str = Field(
        default="DEMO_BLUEPRINT_STATIC",
        description="Explicit flag indicating demo/static blueprint mode vs future live API",
    )
    is_live_data: bool = Field(
        default=False,
        description="Strict Boolean: False confirms this is curated benchmark blueprint data, not live scraped telemetry",
    )
    market_trends: List[MarketTrendItem] = Field(default_factory=list, description="Current macro trends")
    in_demand_skills: List[InDemandSkillItem] = Field(default_factory=list, description="Currently in-demand skills")
    occupation_changes: List[OccupationChangeItem] = Field(default_factory=list, description="Occupation evolution patterns")
    future_skills: List[FutureSkillItem] = Field(default_factory=list, description="Forward-looking future capabilities")
    disclaimer: str = Field(
        default="[DEMO BENCHMARK DATA] Market trends and future skill models represent curated industry benchmark archetypes designed for educational and career planning. This module does not claim to stream live scraped labor exchange feeds. An authoritative external data adapter can be plugged into the service interface.",
        description="Transparency guarantee notice",
    )


class MarketTrendsRequest(BaseModel):
    career_focus: Optional[str] = Field(default="Technology & Software", description="Focus area or target role")
    target_skills: Optional[List[str]] = Field(default_factory=list, description="Optional skills to filter or prioritize")

