import os
import json
from typing import Protocol, List, Optional
from dotenv import load_dotenv
from app.schemas.roadmap import (
    RoadmapGenerateRequest,
    RoadmapGenerateResponse,
    RoadmapStep,
    RoadmapStepType,
    RoadmapReplanRequest,
    RoadmapReplanResponse,
)

load_dotenv()


class RoadmapAIProviderInterface(Protocol):
    async def generate_roadmap(self, request: RoadmapGenerateRequest) -> RoadmapGenerateResponse:
        ...

    async def replan_roadmap(self, request: RoadmapReplanRequest) -> RoadmapReplanResponse:
        ...


class GeminiRoadmapAIProvider:
    """
    Gemini AI provider implementation for Roadmap Generation using google-genai SDK.
    Isolated from service and router logic.
    """

    def __init__(self, api_key: Optional[str] = None, model: str = "gemini-2.5-flash"):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "")
        self.model = model

    async def generate_roadmap(self, request: RoadmapGenerateRequest) -> RoadmapGenerateResponse:
        if not self.api_key:
            return self._fallback_generate_roadmap(request, reason="GEMINI_API_KEY not configured")

        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=self.api_key)

            profile = request.profile
            student_skills = profile.skills if profile else []
            student_edu = profile.education if profile else "Skill-first"
            time_avail = profile.availableTime if profile and profile.availableTime else "10-15 hrs/week"

            matched_skills = request.skill_gap_result.matched_skills if request.skill_gap_result else []
            missing_skills = request.skill_gap_result.missing_skills if request.skill_gap_result else []
            eligibility_status = request.eligibility_result.status if request.eligibility_result else "GREEN"
            eligibility_missing = request.eligibility_result.missing_requirements if request.eligibility_result else []

            system_instruction = (
                "You are an expert AI Career Navigator & Curriculum Architect.\n"
                "Design a rigorous, personalized, step-by-step career transition roadmap.\n"
                "CRITICAL RULES:\n"
                "1. Personalize strictly to the student's current state and available time.\n"
                "2. DO NOT unnecessarily repeat skills the student already possesses.\n"
                "   Already possessed skills: " + ", ".join(set(student_skills + matched_skills)) + ".\n"
                "3. Focus primarily on bridging missing skills: " + ", ".join(missing_skills) + ".\n"
                "4. If eligibility status is YELLOW or RED, include required bridge credentials or regulatory prerequisites.\n"
                "5. Each step MUST have one of the types: learning, project, certification, internship, portfolio, interview, job.\n"
                "6. Order steps logically with explicit prerequisites linking earlier step IDs."
            )

            prompt = (
                f"Generate a personalized career roadmap for Target Career: '{request.selected_career}'.\n"
                f"- Candidate Education: {student_edu}\n"
                f"- Available Time: {time_avail}\n"
                f"- Existing Skills: {', '.join(student_skills) if student_skills else 'None'}\n"
                f"- Missing Skill Gaps: {', '.join(missing_skills) if missing_skills else 'Standard track'}\n"
                f"- Eligibility Status: {eligibility_status}\n"
                f"- Missing Eligibility Requirements: {', '.join(eligibility_missing) if eligibility_missing else 'None'}\n\n"
                "Provide a complete roadmap with between 5 and 7 tactical steps spanning learning, projects, portfolio, interview prep, and job applications."
            )

            response = client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=RoadmapGenerateResponse,
                    temperature=0.2,
                ),
            )

            if response.parsed:
                return response.parsed  # type: ignore

            data = json.loads(response.text)
            return RoadmapGenerateResponse.model_validate(data)

        except Exception as e:
            return self._fallback_generate_roadmap(request, reason=f"Gemini execution error: {str(e)}")

    def _fallback_generate_roadmap(self, request: RoadmapGenerateRequest, reason: str) -> RoadmapGenerateResponse:
        """
        Deterministic, structured fallback personalized to student's background and skill gaps.
        Excludes existing skills and incorporates eligibility bridge actions.
        """
        profile = request.profile
        existing_skills = set(s.strip().lower() for s in (profile.skills if profile else []))
        career = request.selected_career.strip()
        career_lower = career.lower()

        # Gather missing skill gaps
        missing_skills: List[str] = []
        if request.skill_gap_result and request.skill_gap_result.missing_skills:
            missing_skills = [s for s in request.skill_gap_result.missing_skills if s.lower() not in existing_skills]
        elif request.skill_gap_result and request.skill_gap_result.priority_skills:
            missing_skills = [
                p.skill_name for p in request.skill_gap_result.priority_skills
                if p.skill_name.lower() not in existing_skills
            ]

        # Check eligibility barriers
        is_red = request.eligibility_result and request.eligibility_result.status == "RED"
        missing_reqs = request.eligibility_result.missing_requirements if request.eligibility_result else []

        steps: List[RoadmapStep] = []
        step_counter = 1

        # Phase 0: If RED or YELLOW with formal missing requirements, add bridge step
        if missing_reqs or is_red:
            steps.append(
                RoadmapStep(
                    id=f"step-{step_counter}",
                    title=f"Prerequisite & Eligibility Bridge for {career}",
                    type=RoadmapStepType.certification,
                    description=f"Address formal prerequisite gaps: {', '.join(missing_reqs[:2]) if missing_reqs else 'Enroll in accredited transition program'}.",
                    prerequisites=[],
                    skills=["Regulatory Compliance", "Accredited Fundamentals"],
                    estimated_duration="4-8 Weeks",
                    projects=["Prerequisite Enrollment & Baseline Exam Submission"],
                    resources=["Accredited University Portal", "Industry Licensing Guidelines"],
                    completion_criteria="Obtain verified credential or enrollment confirmation before proceeding to job placement.",
                )
            )
            step_counter += 1

        # Phase 1: High Priority Missing Skills Learning
        # Filter out anything candidate already has
        primary_learn_skills = [s for s in missing_skills[:3] if s.lower() not in existing_skills]
        if not primary_learn_skills:
            # If no gaps or already skilled, pick specialized skills for that role
            if "data" in career_lower:
                primary_learn_skills = ["Data Modeling", "Production SQL", "Pipeline Orchestration"]
            elif "design" in career_lower or "ux" in career_lower:
                primary_learn_skills = ["Design Systems", "Usability Testing", "Interactive Prototyping"]
            else:
                primary_learn_skills = ["System Architecture", "API Engineering", "Production Deployment"]
            primary_learn_skills = [s for s in primary_learn_skills if s.lower() not in existing_skills] or ["Advanced Domain Practices"]

        prev_id = f"step-{step_counter - 1}" if step_counter > 1 else ""
        step_1_id = f"step-{step_counter}"
        steps.append(
            RoadmapStep(
                id=step_1_id,
                title=f"Master Core Skill Gaps: {', '.join(primary_learn_skills[:2])}",
                type=RoadmapStepType.learning,
                description=f"Deep-dive technical foundation targeted specifically at identified gaps: {', '.join(primary_learn_skills)}. Avoids repeating familiar topics.",
                prerequisites=[prev_id] if prev_id else [],
                skills=primary_learn_skills,
                estimated_duration="4-6 Weeks",
                projects=["Milestone Coding Labs", "Architecture Documentation"],
                resources=["Official Documentation", "Interactive Sandboxes", "Coursera / Udemy Specialized Track"],
                completion_criteria="Complete all module assessments and build sample exercises with clean test coverage.",
            )
        )
        step_counter += 1

        # Phase 2: Hands-on Proof-of-Work Project
        step_2_id = f"step-{step_counter}"
        project_name = f"End-to-End {career} Capstone Solution"
        steps.append(
            RoadmapStep(
                id=step_2_id,
                title=f"Capstone Project: {project_name}",
                type=RoadmapStepType.project,
                description=f"Construct an end-to-end, production-ready portfolio piece showcasing {', '.join(primary_learn_skills[:2])} and candidate strengths.",
                prerequisites=[step_1_id],
                skills=primary_learn_skills + ["Git / GitHub CI/CD", "Technical Documentation"],
                estimated_duration="3-4 Weeks",
                projects=[f"Full lifecycle {career} application with live demo URL and thorough README"],
                resources=["GitHub Actions", "Vercel / Render / Cloud Run", "Figma / Postman"],
                completion_criteria="Public GitHub repo with comprehensive documentation, demo walkthrough video, and tests.",
            )
        )
        step_counter += 1

        # Phase 3: Industry Certification or Secondary Skill Mastery
        secondary_skills = [s for s in missing_skills[3:6] if s.lower() not in existing_skills]
        if not secondary_skills:
            secondary_skills = ["Cloud Deployment & Observability", "Security & Best Practices"]

        step_3_id = f"step-{step_counter}"
        steps.append(
            RoadmapStep(
                id=step_3_id,
                title="Industry Certification & Tooling Mastery",
                type=RoadmapStepType.certification,
                description=f"Earn a verifiable industry certification demonstrating mastery over {', '.join(secondary_skills)}.",
                prerequisites=[step_2_id],
                skills=secondary_skills,
                estimated_duration="3-4 Weeks",
                projects=["Certification Practice Exams", "Sandbox Lab Scenarios"],
                resources=["AWS / GCP / Meta Certified Track", "FreeCodeCamp / HashiCorp Learn"],
                completion_criteria="Pass certification exam or complete verified accreditation program.",
            )
        )
        step_counter += 1

        # Phase 4: Portfolio & Personal Branding
        step_4_id = f"step-{step_counter}"
        steps.append(
            RoadmapStep(
                id=step_4_id,
                title="Professional Portfolio & ATS Resume",
                type=RoadmapStepType.portfolio,
                description=f"Synthesize your capstone project, existing background, and bridged credentials into a high-impact portfolio.",
                prerequisites=[step_2_id, step_3_id],
                skills=["Technical Writing", "Personal Branding", "ATS Optimization"],
                estimated_duration="2 Weeks",
                projects=["Personal developer/creator website", "Role-tailored 1-page ATS Resume", "LinkedIn profile overhaul"],
                resources=["FlowCV", "GitHub Pages", "Peer review communities"],
                completion_criteria="Published live portfolio link and resume scoring > 85 on ATS screening benchmarks.",
            )
        )
        step_counter += 1

        # Phase 5: Interview Preparation & Mock Rounds
        step_5_id = f"step-{step_counter}"
        steps.append(
            RoadmapStep(
                id=step_5_id,
                title=f"{career} Technical & Behavioral Interview Prep",
                type=RoadmapStepType.interview,
                description="Simulate real-world technical evaluations, case studies, and behavioral STAR-method scenarios.",
                prerequisites=[step_4_id],
                skills=["System Design", "Technical Communication", "STAR Behavioral Framework"],
                estimated_duration="3 Weeks",
                projects=["5 mock interview sessions recorded and self-critiqued"],
                resources=["LeetCode / NeetCode", "Pramp / Interviewing.io", "Role-specific interview guides"],
                completion_criteria="Consistently solve target-level technical prompts within 35 minutes and articulate architecture trade-offs.",
            )
        )
        step_counter += 1

        # Phase 6: Job Applications & Internship Sourcing
        step_6_id = f"step-{step_counter}"
        steps.append(
            RoadmapStep(
                id=step_6_id,
                title="Targeted Job Application Campaign & Networking",
                type=RoadmapStepType.job,
                description=f"Execute proactive outreach targeting entry roles for {career} through referrals, cold messaging, and active job boards.",
                prerequisites=[step_5_id],
                skills=["Cold Outreach", "Networking", "Negotiation"],
                estimated_duration="4-6 Weeks",
                projects=["Weekly tracker of 20 tailored job applications and 5 recruiter connection reach-outs"],
                resources=["LinkedIn Jobs", "Wellfound / AngelList", "Company Career Portals"],
                completion_criteria="Secure minimum 3 formal recruiter screens or initial technical rounds.",
            )
        )

        return RoadmapGenerateResponse(
            career_name=career,
            total_estimated_duration="16 - 24 Weeks (4 - 6 Months)",
            summary=f"Personalized transition path for {career}. Tailored to bridge {len(missing_skills)} identified gaps without repeating existing strengths ({reason}).",
            steps=steps,
        )

    async def replan_roadmap(self, request: RoadmapReplanRequest) -> RoadmapReplanResponse:
        """
        Dynamically replan remaining roadmap preserving completed milestones.
        """
        # Separate completed vs uncompleted steps from current roadmap
        completed_ids = set(request.completed_steps)
        completed_steps = [s for s in request.current_roadmap if s.id in completed_ids]

        if not self.api_key:
            return self._fallback_replan_roadmap(request, completed_steps, reason="GEMINI_API_KEY not configured")

        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=self.api_key)

            target_career = (
                request.new_information.target_career
                if request.new_information and request.new_information.target_career
                else request.target_career or "Target Career"
            )

            current_skills = list(request.current_profile.skills) if request.current_profile else []
            new_skills = request.new_information.new_skills if request.new_information else []
            all_known_skills = list(set(current_skills + new_skills))

            time_avail = (
                request.new_information.updated_available_time
                if request.new_information and request.new_information.updated_available_time
                else (request.current_profile.availableTime if request.current_profile else "10-15 hrs/week")
            )

            completed_summaries = [f"[{s.type}] {s.title} (Skills: {', '.join(s.skills)})" for s in completed_steps]

            system_instruction = (
                "You are an expert dynamic AI Roadmap Replanner.\n"
                "The student has completed certain milestones or changed their profile (skills, available time, target career).\n"
                "CRITICAL RULES:\n"
                "1. PRESERVE COMPLETED STEPS: Do not repeat or discard completed work.\n"
                "2. Dynamically re-synthesize ONLY the remaining roadmap steps.\n"
                "3. If new skills were acquired, remove them from remaining learning steps.\n"
                "4. If available time changed, recalibrate estimated durations accordingly.\n"
                "5. Connect the first remaining step to the last completed step prerequisite ID.\n"
                "6. Return strictly valid structured JSON matching the schema."
            )

            prompt = (
                f"Replan remaining roadmap for Career: '{target_career}'.\n"
                f"- Completed Steps ({len(completed_steps)}): {completed_summaries if completed_summaries else 'None yet'}\n"
                f"- All Current & Newly Acquired Skills: {', '.join(all_known_skills) if all_known_skills else 'None'}\n"
                f"- Updated Weekly Available Time: {time_avail}\n"
                f"- Additional Changes/Notes: {request.new_information.additional_notes if request.new_information else 'None'}\n\n"
                "Generate the remaining roadmap steps needed to reach the target role."
            )

            # We query for remaining steps schema
            class RemainingRoadmapDraft(BaseModel):
                career_name: str
                total_estimated_duration: str
                summary: str
                remaining_steps: List[RoadmapStep]

            response = client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=RemainingRoadmapDraft,
                    temperature=0.2,
                ),
            )

            draft_data = json.loads(response.text)
            remaining_steps: List[RoadmapStep] = [
                RoadmapStep.model_validate(step) for step in draft_data.get("remaining_steps", [])
            ]

            return RoadmapReplanResponse(
                career_name=draft_data.get("career_name", target_career),
                total_estimated_duration=draft_data.get("total_estimated_duration", "10-16 Weeks"),
                summary=draft_data.get("summary", "Roadmap replanned with preserved milestones."),
                completed_steps=completed_steps,
                remaining_steps=remaining_steps,
                all_steps=completed_steps + remaining_steps,
            )

        except Exception as e:
            return self._fallback_replan_roadmap(request, completed_steps, reason=f"Gemini execution error: {str(e)}")

    def _fallback_replan_roadmap(
        self,
        request: RoadmapReplanRequest,
        completed_steps: List[RoadmapStep],
        reason: str,
    ) -> RoadmapReplanResponse:
        """
        Deterministic, intelligent replanning fallback.
        Preserves completed steps, integrates newly acquired skills, adjusts timelines based on updated time.
        """
        target_career = (
            request.new_information.target_career
            if request.new_information and request.new_information.target_career
            else request.target_career or "Target Career"
        )
        career_lower = target_career.lower()

        # Combine existing and new skills
        existing_skills = set(s.strip().lower() for s in (request.current_profile.skills if request.current_profile else []))
        new_skills = set(s.strip().lower() for s in (request.new_information.new_skills if request.new_information else []))
        all_skills = existing_skills.union(new_skills)

        # Look at completed step skills as well
        for cs in completed_steps:
            for sk in cs.skills:
                all_skills.add(sk.strip().lower())

        # Determine remaining steps from current roadmap or generate adapted next steps
        uncompleted_steps = [s for s in request.current_roadmap if s.id not in set(request.completed_steps)]

        updated_time = (
            request.new_information.updated_available_time
            if request.new_information and request.new_information.updated_available_time
            else (request.current_profile.availableTime if request.current_profile else "")
        )

        # Duration adjustment multiplier if time changed
        duration_note = ""
        if updated_time:
            if any(w in updated_time.lower() for w in ["20", "25", "30", "full", "40"]):
                duration_note = " (Accelerated pace: ~2-3 Weeks per phase)"
            elif any(w in updated_time.lower() for w in ["5", "8", "limited"]):
                duration_note = " (Part-time pace: ~4-6 Weeks per phase)"

        remaining_steps: List[RoadmapStep] = []
        last_completed_id = completed_steps[-1].id if completed_steps else ""

        if uncompleted_steps:
            # Adapt the existing uncompleted steps:
            # 1. Strip out any skills that the candidate now possesses
            # 2. Update duration according to updated time
            # 3. Fix prerequisites
            for i, step in enumerate(uncompleted_steps):
                prereqs = [last_completed_id] if i == 0 and last_completed_id else (
                    [uncompleted_steps[i - 1].id] if i > 0 else []
                )

                filtered_step_skills = [
                    sk for sk in step.skills if sk.strip().lower() not in all_skills
                ]

                # If all skills of this step were already acquired via new skills, mark it streamlined
                step_title = step.title
                step_desc = step.description
                if not filtered_step_skills and step.skills:
                    step_title = f"{step.title} [Streamlined / Advanced]"
                    step_desc = f"{step.description} (Target skills already acquired; focusing on practical implementation)."
                    filtered_step_skills = ["Advanced Applied Implementation"]

                new_duration = step.estimated_duration
                if duration_note and "Accelerated" in duration_note:
                    new_duration = "2-3 Weeks"
                elif duration_note and "Part-time" in duration_note:
                    new_duration = "4-6 Weeks"

                remaining_steps.append(
                    RoadmapStep(
                        id=step.id,
                        title=step_title,
                        type=step.type,
                        description=step_desc,
                        prerequisites=prereqs,
                        skills=filtered_step_skills or step.skills,
                        estimated_duration=new_duration,
                        projects=step.projects,
                        resources=step.resources,
                        completion_criteria=step.completion_criteria,
                    )
                )
        else:
            # If all prior steps were completed, or roadmap was empty, synthesize the final placement phase
            step_id = f"replan-step-{len(completed_steps) + 1}"
            remaining_steps.append(
                RoadmapStep(
                    id=step_id,
                    title=f"Advanced {target_career} Final Placement & Interviews",
                    type=RoadmapStepType.job,
                    description=f"Candidate has completed foundational milestones. Focused on senior portfolio reviews and targeted interviews for {target_career}.",
                    prerequisites=[last_completed_id] if last_completed_id else [],
                    skills=["Applied Case Studies", "Executive Communication", "Salary Negotiation"],
                    estimated_duration="3-4 Weeks" if "Accelerated" in duration_note else "4-6 Weeks",
                    projects=[f"Final production portfolio review for {target_career}"],
                    resources=["Hiring Partner Networks", "Peer Mock Panels"],
                    completion_criteria="Receive and evaluate formal job or contract offers.",
                )
            )

        summary_parts = []
        if completed_steps:
            summary_parts.append(f"Preserved {len(completed_steps)} completed milestones.")
        if new_skills:
            summary_parts.append(f"Incorporated {len(new_skills)} newly acquired skills without repetition.")
        if updated_time:
            summary_parts.append(f"Recalibrated pacing for updated availability ({updated_time}).")
        summary_parts.append(f"Replanned {len(remaining_steps)} remaining steps ({reason}).")

        return RoadmapReplanResponse(
            career_name=target_career,
            total_estimated_duration="8 - 14 Weeks" if "Accelerated" in duration_note else "12 - 18 Weeks",
            summary=" ".join(summary_parts),
            completed_steps=completed_steps,
            remaining_steps=remaining_steps,
            all_steps=completed_steps + remaining_steps,
        )

