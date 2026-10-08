from enum import Enum
from typing import Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class StepProgressStatus(str, Enum):
    not_started = "not_started"
    in_progress = "in_progress"
    completed = "completed"


class RoadmapProgressUpdateRequest(BaseModel):
    roadmap_id: str = Field(..., min_length=1, description="Unique roadmap or career identifier")
    career_name: Optional[str] = Field(default="", description="Target career title")
    step_id: str = Field(..., min_length=1, description="Step identifier whose status changed")
    status: StepProgressStatus = Field(..., description="Target status: not_started, in_progress, completed")
    all_step_ids: Optional[List[str]] = Field(default=None, description="Complete list of step IDs in the roadmap for total calculation")


class BulkProgressUpdateRequest(BaseModel):
    roadmap_id: str = Field(..., min_length=1, description="Unique roadmap or career identifier")
    career_name: Optional[str] = Field(default="")
    step_statuses: Dict[str, StepProgressStatus] = Field(..., description="Map of step_id to status")
    all_step_ids: Optional[List[str]] = Field(default=None)


class RoadmapProgressResponse(BaseModel):
    roadmap_id: str
    career_name: str
    total_steps: int
    completed_steps_count: int
    in_progress_steps_count: int
    not_started_steps_count: int
    progress_percentage: float
    step_statuses: Dict[str, StepProgressStatus]
    updated_at: Optional[datetime] = None

