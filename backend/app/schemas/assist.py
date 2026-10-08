from typing import List, Optional, Union, Dict, Any
from pydantic import BaseModel, Field


class NodeContext(BaseModel):
    node_id: str = Field(..., description="Workflow node identifier")
    node_type: str = Field(default="roadmapStepNode", description="Node type or category")
    title: str = Field(..., description="Title of the selected node (e.g. SQL, Python, Project, Interview, Internship)")
    step_type: Optional[str] = Field(default=None, description="Step type like learning, project, interview, internship")
    skills: List[str] = Field(default_factory=list, description="Associated skills for this node")
    description: Optional[str] = Field(default="", description="Description of the node")
    status: Optional[str] = Field(default="not_started", description="Completion status (not_started, in_progress, completed)")
    estimated_duration: Optional[str] = Field(default="", description="Estimated time for this node")


class RoadmapSummaryContext(BaseModel):
    total_steps: int = Field(default=0)
    completed_steps_count: int = Field(default=0)
    current_step_index: Optional[int] = Field(default=None)
    surrounding_steps: List[str] = Field(default_factory=list, description="Titles of preceding or succeeding steps")


class StudentProfileContext(BaseModel):
    education: Optional[str] = Field(default="Skill-first")
    degree: Optional[str] = Field(default="")
    branch: Optional[str] = Field(default="")
    currentYear: Optional[str] = Field(default="")
    skills: List[str] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    careerGoal: Optional[str] = Field(default="")
    availableTime: Optional[str] = Field(default="")


class ContextualAssistRequest(BaseModel):
    profile_id: Optional[str] = Field(default=None)
    student_profile: Optional[StudentProfileContext] = Field(default=None)
    target_career: str = Field(..., min_length=1, description="Student target career")
    selected_node: NodeContext = Field(..., description="Selected node context")
    roadmap_context: Optional[RoadmapSummaryContext] = Field(default=None)


class ProjectItem(BaseModel):
    title: str = Field(..., description="Recommended project title")
    description: str = Field(..., description="Detailed project description and tasks")
    deliverable: Optional[str] = Field(default="GitHub repository with working implementation and README")


class ContextualAssistResponse(BaseModel):
    next_action: str = Field(..., description="Immediate practical action to take right now")
    explanation: str = Field(..., description="Why this step is critical given current profile and target career")
    practice: Union[List[str], str] = Field(..., description="Targeted hands-on practice exercises or instructions")
    project: Union[ProjectItem, Dict[str, Any], str] = Field(..., description="Concrete project application")
    interview_questions: List[str] = Field(default_factory=list, description="Top interview questions relevant to this node and career")
    next_milestone: str = Field(..., description="Observable milestone before advancing in roadmap")

