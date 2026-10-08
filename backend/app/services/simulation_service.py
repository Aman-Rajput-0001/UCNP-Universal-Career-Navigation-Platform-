from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.schemas.career import SkillGapRequest
from app.schemas.simulation import (
    CareerSimulationRequest,
    CareerSimulationResponse,
    SimulationMajorStep,
)
from app.services.eligibility_rules import evaluate_eligibility
from app.services.skill_gap_service import analyze_skill_gap
from app.models.profile import StudentProfileModel


class CareerSimulationService:
    @staticmethod
    def simulate_career(
        request: CareerSimulationRequest,
        db: Optional[Session] = None,
    ) -> CareerSimulationResponse:
        education = request.education or "Bachelor's Degree"
        degree = request.degree or ""
        branch = request.branch or ""
        current_skills = list(request.current_skills or [])

        # If profile_id provided, enrich from DB if record exists
        if request.profile_id and db:
            try:
                profile_record = (
                    db.query(StudentProfileModel)
                    .filter(StudentProfileModel.id == request.profile_id)
                    .first()
                )
                if profile_record:
                    education = profile_record.education or education
                    degree = profile_record.degree or degree
                    branch = profile_record.branch or branch
                    for sk in (profile_record.skills or []):
                        if sk not in current_skills:
                            current_skills.append(sk)
            except Exception:
                pass

        career_name = request.career_name.strip()
        career_lower = career_name.lower()

        # 1. Authoritative Eligibility Evaluation
        eligibility_result = evaluate_eligibility(
            career_name=career_name,
            education=education,
            degree=degree,
            branch=branch,
            skills=current_skills,
        )

        # 2. Skill Gap Analysis
        skill_gap_req = SkillGapRequest(
            career_name=career_name,
            current_skills=current_skills,
            required_skills=[],
        )
        skill_gap_result = analyze_skill_gap(skill_gap_req)

        # 3. Dynamic Archetype Plan based on Career Category
        if "data" in career_lower:
            estimated_path = (
                f"Transitioning from {education} {degree} {branch} to Data Analytics. "
                "Pathway focuses on converting quantitative reasoning into production SQL data pipelines, "
                "BI executive dashboards (Power BI / Tableau), and statistical exploratory analysis."
            )
            required_qualification = (
                eligibility_result.qualification_requirements or
                "Bachelor's degree in any discipline with verified SQL, spreadsheet, and business intelligence portfolio."
            )
            major_steps = [
                SimulationMajorStep(
                    step_number=1,
                    title="Data Querying & Schema Foundations",
                    phase="Foundation",
                    estimated_duration="3-4 Weeks",
                    focus="Advanced SQL (Aggregations, Window Functions, CTEs) and Database Schema Design",
                    deliverable="Optimized SQL scripts analyzing 100k+ row multi-table dataset",
                ),
                SimulationMajorStep(
                    step_number=2,
                    title="Exploratory Data Analysis with Python",
                    phase="Analytics Core",
                    estimated_duration="4-5 Weeks",
                    focus="Python (Pandas, NumPy, Seaborn) data wrangling and statistical testing",
                    deliverable="Jupyter Notebook uncovering business insights from messy real-world data",
                ),
                SimulationMajorStep(
                    step_number=3,
                    title="Executive BI Dashboard & Storytelling",
                    phase="Portfolio",
                    estimated_duration="3-4 Weeks",
                    focus="Tableau / Power BI interactive reporting, KPI definition, stakeholder presentation",
                    deliverable="Live interactive dashboard deployed with video walkthrough",
                ),
                SimulationMajorStep(
                    step_number=4,
                    title="Analytics Case Interviews & Apprenticeship",
                    phase="Placement",
                    estimated_duration="2-3 Weeks",
                    focus="Business case take-home assignments, metric diagnosis, SQL live coding",
                    deliverable="Interview-ready analytics portfolio on GitHub and Tableau Public",
                ),
            ]
            possible_entry_roles = [
                "Junior Data Analyst",
                "Business Intelligence Analyst",
                "Operations / Marketing Data Analyst",
                "Associate Analytics Specialist",
            ]

        elif "product" in career_lower or "pm" in career_lower:
            estimated_path = (
                f"Transitioning from {education} {degree} {branch} to Product Management. "
                "Pathway leverages candidate domain background into user problem discovery, PRD writing, "
                "metric attribution (acquisition, activation, retention), and cross-functional engineering alignment."
            )
            required_qualification = (
                eligibility_result.qualification_requirements or
                "Undergraduate degree. Demonstrable product thinking, case study portfolio, and PRD specifications."
            )
            major_steps = [
                SimulationMajorStep(
                    step_number=1,
                    title="Product Discovery & Customer Empathy",
                    phase="Foundation",
                    estimated_duration="3-4 Weeks",
                    focus="User interviewing, identifying core pain points, competitive benchmarking",
                    deliverable="User research synthesis document and customer journey map",
                ),
                SimulationMajorStep(
                    step_number=2,
                    title="PRD Writing & Feature Specification",
                    phase="Execution",
                    estimated_duration="4 Weeks",
                    focus="PRD documentation, user stories, acceptance criteria, wireframes in Figma",
                    deliverable="Complete Product Requirements Document for a real-world web/mobile feature",
                ),
                SimulationMajorStep(
                    step_number=3,
                    title="Product Analytics & Prioritization Frameworks",
                    phase="Strategy",
                    estimated_duration="3 Weeks",
                    focus="Funnel analysis, North Star metric selection, RICE/MoSCoW scoring",
                    deliverable="Product teardown deck with metric-backed optimization proposals",
                ),
                SimulationMajorStep(
                    step_number=4,
                    title="APM / Product Case Interview Prep",
                    phase="Placement",
                    estimated_duration="2-3 Weeks",
                    focus="Product sense interviews, RCA (Root Cause Analysis), behavioral leadership",
                    deliverable="Portfolio of 2 public product teardowns on Notion/Substack",
                ),
            ]
            possible_entry_roles = [
                "Associate Product Manager (APM)",
                "Junior Technical Product Specialist",
                "Product Operations Specialist",
                "Product Analyst",
            ]

        elif "government" in career_lower or "civil" in career_lower or "public" in career_lower or "upsc" in career_lower or "ssc" in career_lower:
            estimated_path = (
                f"Transitioning to Government / Public Administration services. "
                "Unlike private sector portfolio routes, this track requires rigorous exam syllabus mastery, "
                "preliminary aptitude screening, mains descriptive analysis, and merit-list qualifying ranks."
            )
            required_qualification = (
                eligibility_result.qualification_requirements or
                "Graduation degree from an accredited university. Mandatory qualification through competitive entrance examination."
            )
            major_steps = [
                SimulationMajorStep(
                    step_number=1,
                    title="Exam Syllabus Mapping & General Studies Core",
                    phase="Foundation",
                    estimated_duration="8-12 Weeks",
                    focus="Constitutional framework, Indian polity, history, and socio-economic governance",
                    deliverable="Structured conceptual notes across static General Studies papers",
                ),
                SimulationMajorStep(
                    step_number=2,
                    title="Quantitative Aptitude & Logical Reasoning (CSAT / Prelims)",
                    phase="Screening Prep",
                    estimated_duration="6-8 Weeks",
                    focus="Speed mathematics, logical deduction, reading comprehension, data interpretation",
                    deliverable="Consistent >80th percentile score on timed mock preliminary tests",
                ),
                SimulationMajorStep(
                    step_number=3,
                    title="Current Affairs & Analytical Essay Writing",
                    phase="Descriptive Mastery",
                    estimated_duration="6-8 Weeks",
                    focus="Daily national newspaper analysis, policy critiques, structured multi-dimensional essays",
                    deliverable="Portfolio of 20 graded descriptive answer evaluations",
                ),
                SimulationMajorStep(
                    step_number=4,
                    title="Full-Length Mock Series & Personality Test",
                    phase="Exam Finalization",
                    estimated_duration="4-6 Weeks",
                    focus="Simulation of exam conditions, time management, mock board interviews",
                    deliverable="Comprehensive readiness assessment across Prelims, Mains & Interview",
                ),
            ]
            possible_entry_roles = [
                "Assistant Section Officer (Central / State)",
                "Civil Services Cadre Officer (Group A / B)",
                "Public Sector Probationary Officer",
                "Statistical / Administrative Officer",
            ]

        else:
            # Generic customizable simulation archetype
            estimated_path = (
                f"Simulating alternative transition to {career_name} for student with {education} background. "
                "Evaluates prerequisite skill gaps and produces a structured 4-phase transition blueprint."
            )
            required_qualification = (
                eligibility_result.qualification_requirements or
                "Relevant foundational degree or demonstrated subject-matter capability."
            )
            major_steps = [
                SimulationMajorStep(
                    step_number=1,
                    title=f"Core Knowledge Acquisition for {career_name}",
                    phase="Foundation",
                    estimated_duration="3-4 Weeks",
                    focus=f"Key technical and domain principles in {career_name}",
                    deliverable=f"Summary notes and foundational certification in {career_name}",
                ),
                SimulationMajorStep(
                    step_number=2,
                    title="Hands-on Practical Application",
                    phase="Application",
                    estimated_duration="4-5 Weeks",
                    focus="Applying core concepts to standard industry tools and scenarios",
                    deliverable="Real-world case study deliverable",
                ),
                SimulationMajorStep(
                    step_number=3,
                    title="Proof-of-Work Portfolio Building",
                    phase="Portfolio",
                    estimated_duration="3-4 Weeks",
                    focus="Synthesizing capabilities into a verifiable hiring showcase",
                    deliverable="Public portfolio artifact demonstrating end-to-end execution",
                ),
                SimulationMajorStep(
                    step_number=4,
                    title="Targeted Job Application & Interview Prep",
                    phase="Placement",
                    estimated_duration="2-3 Weeks",
                    focus="Tailored resume, domain mock interviews, networking with practitioners",
                    deliverable="Application-ready candidate profile",
                ),
            ]
            possible_entry_roles = [
                f"Junior {career_name}",
                f"Associate {career_name}",
                f"{career_name} Trainee",
            ]

        return CareerSimulationResponse(
            career=career_name,
            eligibility=eligibility_result,
            skill_gap=skill_gap_result,
            estimated_path=estimated_path,
            required_qualification=required_qualification,
            major_steps=major_steps,
            possible_entry_roles=possible_entry_roles,
        )


career_simulation_service = CareerSimulationService()

