"""
Skill Gap Analysis Service.
Compares candidate current skills vs career required skills,
determines matched, missing, priority categorization (high/medium/low),
and computes overall skill baseline level.
"""

from typing import List, Dict, Optional, Any
from app.schemas.career import (
    SkillGapRequest,
    SkillGapResponse,
    PrioritySkillItem,
    SkillPriority,
)

# Standard baseline skills by career category when required_skills are not provided
STANDARD_CAREER_SKILLS: Dict[str, Dict[str, Any]] = {
    "software": {
        "required": [
            ("Data Structures & Algorithms", SkillPriority.high, "Core evaluation hurdle for technical screenings"),
            ("System Design & Architecture", SkillPriority.medium, "Needed for scalable service architecture"),
            ("Git & GitHub Version Control", SkillPriority.high, "Fundamental requirement for modern development teams"),
            ("REST APIs & Backend Integration", SkillPriority.high, "Essential for full-stack communication"),
            ("Automated Unit Testing & CI/CD", SkillPriority.medium, "Critical for enterprise production reliability"),
            ("Docker / Containerization", SkillPriority.low, "Helpful devops practice for local and cloud environments"),
        ]
    },
    "data": {
        "required": [
            ("Advanced SQL (Window Functions, CTEs)", SkillPriority.high, "Primary query tool used in 90% of data tasks"),
            ("Data Modeling & Warehousing", SkillPriority.medium, "Important for schema design and analytics tables"),
            ("Business Intelligence (Power BI / Tableau)", SkillPriority.high, "Key for executive and stakeholder reporting"),
            ("Python (Pandas, NumPy, Scikit-learn)", SkillPriority.medium, "Necessary for exploratory data analysis and automation"),
            ("Statistical Hypothesis Testing", SkillPriority.low, "Helpful for A/B testing and quantitative analysis"),
        ]
    },
    "designer": {
        "required": [
            ("Figma & Design Systems", SkillPriority.high, "Industry standard tooling for UI components and tokens"),
            ("User Experience Research & Usability Testing", SkillPriority.high, "Distinguishes junior visuals from strategic product design"),
            ("Interactive Prototyping", SkillPriority.medium, "Demonstrates complex user interaction flows"),
            ("Information Architecture", SkillPriority.medium, "Organizes content hierarchies and user navigation"),
            ("Basic HTML/CSS Knowledge", SkillPriority.low, "Aids seamless handoff with engineers"),
        ]
    },
    "robotics": {
        "required": [
            ("PLC Programming (Ladder Logic)", SkillPriority.high, "Core standard for industrial automation control"),
            ("Industrial Sensors & Actuators", SkillPriority.high, "Vital for hardware integration and instrumentation"),
            ("CAD 3D Modeling (SolidWorks/Fusion)", SkillPriority.medium, "Required for mechanical framing and prototyping"),
            ("ROS / Embedded C++", SkillPriority.medium, "Essential for advanced autonomous robotic control"),
            ("Industrial Safety Protocols", SkillPriority.low, "Crucial for factory compliance and hazard mitigation"),
        ]
    },
    "operations": {
        "required": [
            ("Business & Cross-functional Communication", SkillPriority.high, "Mandatory for resolving customer and client blockers"),
            ("CRM / Ticket Management (Salesforce/Jira)", SkillPriority.high, "Daily operating system for tracking workflows"),
            ("Spreadsheet Analysis & Reporting", SkillPriority.medium, "Tracks KPIs and process efficiency metrics"),
            ("Incident Management & SLA Compliance", SkillPriority.medium, "Ensures operational delivery timelines"),
            ("Documentation & Knowledge Base Writing", SkillPriority.low, "Scales standard operating procedures"),
        ]
    },
    "product": {
        "required": [
            ("Product Requirements Documentation (PRD)", SkillPriority.high, "Fundamental specification artifact written by PMs"),
            ("User Research & Customer Discovery", SkillPriority.high, "Identifies core pain points and market opportunities"),
            ("Product Analytics & Metrics (A/B, Funnel)", SkillPriority.high, "Drives hypothesis testing and metric attribution"),
            ("Roadmapping & Backlog Prioritization (RICE/MoSCoW)", SkillPriority.medium, "Keeps engineering aligned to business priorities"),
            ("Technical Feasibility & API Understanding", SkillPriority.medium, "Enables constructive collaboration with engineers"),
            ("Go-To-Market & Pricing Strategy", SkillPriority.low, "Accelerates commercial distribution and launch success"),
        ]
    },
    "government": {
        "required": [
            ("General Studies & Public Administration", SkillPriority.high, "Major constituent of civil service and public exams"),
            ("Quantitative Aptitude & Logical Reasoning", SkillPriority.high, "Preliminary test screening hurdle"),
            ("Constitutional Law & Governance Framework", SkillPriority.medium, "Essential for policy execution and statutory duties"),
            ("Official Language Proficiency & Report Drafting", SkillPriority.medium, "Daily administrative communication in government offices"),
            ("Current Affairs & Socio-Economic Policies", SkillPriority.high, "Evaluated across written exams and personality interviews"),
        ]
    },
}


def analyze_skill_gap(request: SkillGapRequest) -> SkillGapResponse:
    career_lower = request.career_name.lower().strip()
    current_skills_clean = [s.strip() for s in request.current_skills if s.strip()]
    current_skills_lower = [s.lower() for s in current_skills_clean]

    # Resolve required skill list
    resolved_required: List[tuple[str, SkillPriority, str]] = []

    if request.required_skills and len(request.required_skills) > 0:
        # Use provided required skills
        for i, req in enumerate(request.required_skills):
            req_clean = req.strip()
            # Distribute priorities: early skills higher
            priority = SkillPriority.high if i < 2 else (SkillPriority.medium if i < 4 else SkillPriority.low)
            resolved_required.append(
                (req_clean, priority, f"Directly demanded by industry for {request.career_name}")
            )
    else:
        # Map to standard skill templates
        matched_category = None
        for cat in STANDARD_CAREER_SKILLS:
            if cat in career_lower:
                matched_category = cat
                break

        if matched_category:
            resolved_required = STANDARD_CAREER_SKILLS[matched_category]["required"]
        else:
            # Generic template
            resolved_required = [
                (f"Core {request.career_name} Fundamentals", SkillPriority.high, "Foundation knowledge for role execution"),
                ("Problem Solving & Troubleshooting", SkillPriority.high, "Essential daily competency"),
                ("Domain Software Tools & Frameworks", SkillPriority.medium, "Standard workflow tooling"),
                ("Documentation & Workflow Standards", SkillPriority.low, "Professional quality standard"),
            ]

    # Match skills
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    priority_skills: List[PrioritySkillItem] = []

    for skill_name, priority, reason in resolved_required:
        skill_lower = skill_name.lower()
        # Check if any user skill closely matches or contains this skill keyword
        is_matched = any(
            user_s in skill_lower or skill_lower in user_s or any(kw in user_s for kw in skill_lower.split() if len(kw) > 3)
            for user_s in current_skills_lower
        )

        if is_matched:
            # Find the actual matching user skill or use standard name
            matched_skills.append(skill_name)
        else:
            missing_skills.append(skill_name)
            priority_skills.append(
                PrioritySkillItem(
                    skill_name=skill_name,
                    priority=priority,
                    reason=reason,
                )
            )

    # Sort priority skills: high -> medium -> low
    priority_order = {SkillPriority.high: 0, SkillPriority.medium: 1, SkillPriority.low: 2}
    priority_skills.sort(key=lambda x: priority_order[x.priority])

    # Compute skill level
    total_required = len(resolved_required)
    matched_count = len(matched_skills)
    ratio = (matched_count / total_required) if total_required > 0 else 0

    if ratio >= 0.6:
        skill_level = "Intermediate to Advanced"
        reason_summary = f"Strong baseline! You already possess {matched_count} of {total_required} primary competencies for {request.career_name}."
    elif ratio >= 0.25:
        skill_level = "Foundation / Early Intermediate"
        reason_summary = f"Good initial foundation with {matched_count} matched skills. Focus on the high-priority missing skills to bridge the gap."
    else:
        skill_level = "Beginner / Transitioning"
        reason_summary = f"Starting your transition into {request.career_name}. Priority skills will form the basis of your focused learning roadmap."

    return SkillGapResponse(
        matched_skills=matched_skills,
        missing_skills=missing_skills,
        priority_skills=priority_skills,
        skill_level=skill_level,
        reason=reason_summary,
    )
