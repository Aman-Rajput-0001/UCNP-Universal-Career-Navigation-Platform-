from typing import Dict, List, Optional
from datetime import datetime
import logging
from sqlalchemy.orm import Session
from app.models.progress import RoadmapProgressModel
from app.schemas.progress import (
    StepProgressStatus,
    RoadmapProgressUpdateRequest,
    RoadmapProgressResponse,
)

logger = logging.getLogger("uvicorn.error")

# High-availability in-memory fallback cache if PostgreSQL is offline
_in_memory_progress_store: Dict[str, dict] = {}


class ProgressService:
    @staticmethod
    def get_progress(roadmap_id: str, db: Optional[Session]) -> Optional[RoadmapProgressResponse]:
        # Try database first
        if db:
            try:
                record = (
                    db.query(RoadmapProgressModel)
                    .filter(RoadmapProgressModel.roadmap_id == roadmap_id)
                    .first()
                )
                if record:
                    step_statuses = {
                        k: StepProgressStatus(v) if v in StepProgressStatus._value2member_map_ else StepProgressStatus.not_started
                        for k, v in (record.step_statuses or {}).items()
                    }
                    return RoadmapProgressResponse(
                        roadmap_id=record.roadmap_id,
                        career_name=record.career_name or "",
                        total_steps=record.total_steps,
                        completed_steps_count=record.completed_steps_count,
                        in_progress_steps_count=record.in_progress_steps_count,
                        not_started_steps_count=record.not_started_steps_count,
                        progress_percentage=round(record.progress_percentage, 1),
                        step_statuses=step_statuses,
                        updated_at=record.updated_at,
                    )
            except Exception as e:
                logger.warning(f"Database read warning for roadmap {roadmap_id}: {e}")

        # Fallback to in-memory store
        if roadmap_id in _in_memory_progress_store:
            data = _in_memory_progress_store[roadmap_id]
            step_statuses = {
                k: StepProgressStatus(v) if v in StepProgressStatus._value2member_map_ else StepProgressStatus.not_started
                for k, v in (data.get("step_statuses") or {}).items()
            }
            return RoadmapProgressResponse(
                roadmap_id=roadmap_id,
                career_name=data.get("career_name", ""),
                total_steps=data.get("total_steps", 0),
                completed_steps_count=data.get("completed_steps_count", 0),
                in_progress_steps_count=data.get("in_progress_steps_count", 0),
                not_started_steps_count=data.get("not_started_steps_count", 0),
                progress_percentage=data.get("progress_percentage", 0.0),
                step_statuses=step_statuses,
                updated_at=data.get("updated_at"),
            )

        return None

    @staticmethod
    def update_progress(
        payload: RoadmapProgressUpdateRequest,
        db: Optional[Session],
    ) -> RoadmapProgressResponse:
        current_statuses: Dict[str, str] = {}

        # 1. Fetch current statuses from DB or in-memory
        db_record = None
        if db:
            try:
                db_record = (
                    db.query(RoadmapProgressModel)
                    .filter(RoadmapProgressModel.roadmap_id == payload.roadmap_id)
                    .first()
                )
                if db_record and db_record.step_statuses:
                    current_statuses.update(dict(db_record.step_statuses))
            except Exception as e:
                logger.warning(f"Database query error in update_progress: {e}")
                db_record = None

        if not current_statuses and payload.roadmap_id in _in_memory_progress_store:
            current_statuses.update(dict(_in_memory_progress_store[payload.roadmap_id].get("step_statuses", {})))

        # Update specific step status
        current_statuses[payload.step_id] = payload.status.value

        # Populate all known steps
        all_ids = set(current_statuses.keys())
        if payload.all_step_ids:
            for s_id in payload.all_step_ids:
                all_ids.add(s_id)
                if s_id not in current_statuses:
                    current_statuses[s_id] = StepProgressStatus.not_started.value

        total = len(all_ids)
        completed = sum(1 for s in current_statuses.values() if s == StepProgressStatus.completed.value)
        in_progress = sum(1 for s in current_statuses.values() if s == StepProgressStatus.in_progress.value)
        not_started = sum(1 for s in current_statuses.values() if s == StepProgressStatus.not_started.value)
        percentage = round((completed / total) * 100.0, 1) if total > 0 else 0.0
        now = datetime.utcnow()

        # Update in-memory cache
        _in_memory_progress_store[payload.roadmap_id] = {
            "roadmap_id": payload.roadmap_id,
            "career_name": payload.career_name or "",
            "total_steps": total,
            "completed_steps_count": completed,
            "in_progress_steps_count": in_progress,
            "not_started_steps_count": not_started,
            "progress_percentage": percentage,
            "step_statuses": current_statuses,
            "updated_at": now,
        }

        # Persist to database if available
        if db:
            try:
                if not db_record:
                    db_record = RoadmapProgressModel(
                        roadmap_id=payload.roadmap_id,
                        career_name=payload.career_name or "",
                        total_steps=total,
                        completed_steps_count=completed,
                        in_progress_steps_count=in_progress,
                        not_started_steps_count=not_started,
                        progress_percentage=percentage,
                        step_statuses=current_statuses,
                        updated_at=now,
                    )
                    db.add(db_record)
                else:
                    if payload.career_name:
                        db_record.career_name = payload.career_name
                    db_record.total_steps = total
                    db_record.completed_steps_count = completed
                    db_record.in_progress_steps_count = in_progress
                    db_record.not_started_steps_count = not_started
                    db_record.progress_percentage = percentage
                    db_record.step_statuses = current_statuses
                    db_record.updated_at = now

                db.commit()
                db.refresh(db_record)
            except Exception as e:
                logger.warning(f"Database commit error (falling back to memory): {e}")
                db.rollback()

        step_statuses_enum = {
            k: StepProgressStatus(v) if v in StepProgressStatus._value2member_map_ else StepProgressStatus.not_started
            for k, v in current_statuses.items()
        }

        return RoadmapProgressResponse(
            roadmap_id=payload.roadmap_id,
            career_name=payload.career_name or "",
            total_steps=total,
            completed_steps_count=completed,
            in_progress_steps_count=in_progress,
            not_started_steps_count=not_started,
            progress_percentage=percentage,
            step_statuses=step_statuses_enum,
            updated_at=now,
        )


progress_service = ProgressService()

