import os
from typing import Protocol, List
from dotenv import load_dotenv
from app.schemas.career import (
    CareerDiscoveryRequest,
    CareerDiscoveryResponse,
    CareerDiscoveryItem,
    EligibilityLevel,
    FullCareerAnalysisResponse,
    SkillGapResponse,
    PrioritySkillItem,
    SkillPriority,
    LearningStepItem,
    ProjectItem,
    CertificationItem,
    InternshipPathItem,
    ResumeGuidance,
    InterviewPreparation,
    EntryLevelJob,
    CareerGrowthStage,
)

load_dotenv()


class AIProviderInterface(Protocol):
    async def discover_careers(self, profile: CareerDiscoveryRequest) -> CareerDiscoveryResponse:
        ...

    async def orchestrate_career_analysis(self, profile: CareerDiscoveryRequest) -> FullCareerAnalysisResponse:
        ...


class GeminiCareerAIProvider:
    """
    Gemini AI provider implementation using google-genai SDK.
    Isolated from service and controller logic.
    """

    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "")
        self.model = model or os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

    async def discover_careers(self, profile: CareerDiscoveryRequest) -> CareerDiscoveryResponse:
        if not self.api_key:
            # If API key is not configured, fallback gracefully to structured deterministic rule-based response
            return self._fallback_discovery(profile, reason="GEMINI_API_KEY not configured")

        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=self.api_key)

            system_instruction = (
                "You are an expert, realistic AI Career Navigation advisor.\n"
                "A student's background is NOT an absolute barrier, but you must NEVER claim that every student "
                "can enter every profession without real prerequisites.\n"
                "You must rigorously evaluate educational requirements, licenses, and skill demands.\n"
                "Eligibility Levels:\n"
                "- 'direct': Candidate already possesses required foundational qualification/skills.\n"
                "- 'additional_requirements': Realistic transition with dedicated upskilling, portfolio, or bridge certifications.\n"
                "- 'restricted': Legally or strictly requires specialized formal degrees/licenses (e.g., Surgeon, Licensed Civil PE, Chartered Accountant, Advocate in court).\n"
                "Always return strictly structured output adhering to the schema."
            )

            prompt = (
                f"Analyze the following student profile and discover 3 to 5 realistic, grounded career options:\n"
                f"- Education Level: {profile.education}\n"
                f"- Degree / Course: {profile.degree or 'N/A'}\n"
                f"- Branch / Subject: {profile.branch or 'N/A'}\n"
                f"- Current Year / Status: {profile.currentYear or 'N/A'}\n"
                f"- Current Skills: {', '.join(profile.skills) if profile.skills else 'None declared'}\n"
                f"- Interests: {', '.join(profile.interests) if profile.interests else 'None declared'}\n"
                f"- Strengths: {', '.join(profile.strengths) if profile.strengths else 'None declared'}\n"
                f"- Weaknesses: {', '.join(profile.weaknesses) if profile.weaknesses else 'None declared'}\n"
                f"- Career Goal: {profile.careerGoal or 'Open to discovery'}\n"
                f"- Time Available: {profile.availableTime or 'Flexible'}\n\n"
                "Provide career recommendations that balance realistic feasibility, skill-based entry, and clear eligibility limitations."
            )

            response = client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=CareerDiscoveryResponse,
                    temperature=0.2,
                ),
            )

            if response.parsed:
                return response.parsed  # type: ignore

            # Fallback if parsed schema is somehow missing
            import json
            data = json.loads(response.text)
            return CareerDiscoveryResponse.model_validate(data)

        except Exception as e:
            return self._fallback_discovery(profile, reason=f"Gemini execution error: {str(e)}")

    def _fallback_discovery(self, profile: CareerDiscoveryRequest, reason: str) -> CareerDiscoveryResponse:
        """
        Deterministic, structured fallback when external AI provider is unconfigured or unavailable.
        Respects the rule: never claim every student can enter every profession.
        """
        skills_lower = [s.lower() for s in profile.skills]
        interests_lower = [i.lower() for i in profile.interests]
        edu_lower = profile.education.lower()

        careers: List[CareerDiscoveryItem] = []

        # 1. Tech / Software or Data route
        if any("python" in s or "code" in s or "react" in s or "sql" in s or "tech" in s for s in skills_lower + interests_lower):
            careers.append(
                CareerDiscoveryItem(
                    career_name="Software & Application Developer",
                    match_reason=f"Candidate demonstrates alignment with programming/tools ({', '.join(profile.skills[:3])}). Software allows skill-first portfolio entry.",
                    eligibility_level=EligibilityLevel.direct if "bachelor" in edu_lower or "diploma" in edu_lower else EligibilityLevel.additional_requirements,
                    required_skills=["Data Structures & Algorithms", "Git & GitHub", "API Development", "System Design"],
                    missing_skills=[s for s in ["Data Structures & Algorithms", "System Design"] if s.lower() not in skills_lower],
                    qualification_requirements="No mandatory statutory license. A verified GitHub portfolio, internships, or open-source contributions can bridge non-CS or diploma backgrounds.",
                    possible_entry_roles=["Junior Software Engineer", "Frontend Developer", "Backend Intern", "QA Automation Engineer"],
                )
            )
            careers.append(
                CareerDiscoveryItem(
                    career_name="Data Analyst / Business Intelligence Associate",
                    match_reason=f"Matches strengths in analytical thinking and data tools. High industry demand with verifiable skill tests.",
                    eligibility_level=EligibilityLevel.direct if "sql" in skills_lower else EligibilityLevel.additional_requirements,
                    required_skills=["SQL", "Python / R", "Data Visualization (Tableau/PowerBI)", "Spreadsheets"],
                    missing_skills=[s for s in ["Data Visualization (Tableau/PowerBI)", "Advanced SQL"] if s.lower() not in skills_lower],
                    qualification_requirements="Degree in any analytical field or skill certificate with verified portfolio of dashboards and business case analyses.",
                    possible_entry_roles=["Junior Data Analyst", "BI Associate", "Operations Analyst", "Reporting Specialist"],
                )
            )

        # 2. Design or Creative route
        if any("design" in s or "figma" in s or "ui" in s or "creative" in s for s in skills_lower + interests_lower):
            careers.append(
                CareerDiscoveryItem(
                    career_name="UI/UX & Product Designer",
                    match_reason="Portfolio-centric profession where design problem-solving and user research matter over formal degree type.",
                    eligibility_level=EligibilityLevel.direct,
                    required_skills=["Figma / Penpot", "User Research", "Wireframing & Prototyping", "Design Systems"],
                    missing_skills=["Design Systems", "Usability Testing"],
                    qualification_requirements="Portfolio-based evaluation. Degrees in design help, but comprehensive case studies in Figma/web are primary hiring criteria.",
                    possible_entry_roles=["Junior UI/UX Designer", "Product Design Intern", "Visual Designer"],
                )
            )

        # 3. Engineering / Automation route
        if any("robot" in s or "cad" in s or "mechanic" in s or "electrical" in s for s in skills_lower + interests_lower):
            careers.append(
                CareerDiscoveryItem(
                    career_name="Robotics & Industrial Automation Technician",
                    match_reason=f"Strong fit for hands-on technical and prototyping skills ({profile.branch or profile.education}).",
                    eligibility_level=EligibilityLevel.direct if "diploma" in edu_lower or "bachelor" in edu_lower else EligibilityLevel.additional_requirements,
                    required_skills=["PLC Programming", "CAD/CAM", "Sensors & Actuators", "Preventive Maintenance"],
                    missing_skills=["PLC Programming", "Industrial Safety Protocols"],
                    qualification_requirements="Diploma/Degree in engineering discipline or specialized vocational automation certificate.",
                    possible_entry_roles=["Automation Technician", "Robotics Maintenance Trainee", "Field Service Engineer"],
                )
            )

        # 4. Regulated / Restricted anchor (Demonstrating restriction principle)
        if any("doctor" in s or "medicine" in s or "surgeon" in s or "lawyer" in s for s in [profile.careerGoal.lower() if profile.careerGoal else ""]):
            careers.append(
                CareerDiscoveryItem(
                    career_name=profile.careerGoal or "Regulated Healthcare/Legal Professional",
                    match_reason=f"Stated as an interest, but statutory bar exists based on current credentials ({profile.education}).",
                    eligibility_level=EligibilityLevel.restricted,
                    required_skills=["Accredited Medical/Legal Education", "State Licensing Examination", "Supervised Residency/Clerkship"],
                    missing_skills=["Statutory Medical/Legal Degree", "Board Certification"],
                    qualification_requirements="Mandatory formal degree (MBBS/MD/LLB) and statutory council licensure. Skill-first self-learning cannot substitute statutory license.",
                    possible_entry_roles=["Healthcare Operations Assistant", "Legal Tech Operations Associate"],
                )
            )

        # Default fallback if empty
        if not careers:
            careers.append(
                CareerDiscoveryItem(
                    career_name="Digital Operations & Technical Support Specialist",
                    match_reason=f"Immediate accessible entry point matching foundational aptitude and {profile.education} background.",
                    eligibility_level=EligibilityLevel.direct,
                    required_skills=["Customer Communication", "CRM / ERP Software", "Basic Troubleshooting", "Documentation"],
                    missing_skills=["CRM Administration", "ITIL Fundamentals"],
                    qualification_requirements="Any educational qualification; requires strong problem-solving and process execution.",
                    possible_entry_roles=["Operations Associate", "Technical Support Representative", "Service Desk Analyst"],
                )
            )

        return CareerDiscoveryResponse(
            careers=careers,
            summary=f"Discovered {len(careers)} options for {profile.education} background ({reason}).",
        )

    async def orchestrate_career_analysis(
        self, profile: CareerDiscoveryRequest
    ) -> FullCareerAnalysisResponse:
        """
        Executes unified end-to-end AI Career Orchestration returning all 12 modules:
        1. career_options
        2. skill_gap
        3. recommended_career_goal
        4. roadmap
        5. learning_steps
        6. projects
        7. certifications
        8. internship_path
        9. resume_guidance
        10. interview_preparation
        11. entry_level_jobs
        12. career_growth
        """
        if not self.api_key:
            return self._fallback_orchestrated_analysis(profile, reason="GEMINI_API_KEY not configured")

        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=self.api_key)

            system_instruction = (
                "You are an elite, comprehensive AI Career Navigation Orchestrator.\n"
                "Given a student's profile (education, degree, branch, current skills, interests, strengths, weaknesses, goal, available time),\n"
                "you must produce a rigorous, realistic, and synchronized end-to-end career transition analysis.\n"
                "CRITICAL REQUIREMENTS:\n"
                "1. Provide realistic career options with eligibility levels ('direct', 'additional_requirements', or 'restricted').\n"
                "2. Provide a detailed skill gap analysis for the top recommended career.\n"
                "3. Provide the single best recommended_career_goal title.\n"
                "4. Provide 4-6 roadmap milestone phases (e.g. 'Foundations', 'Core Development', 'Portfolio Projects', 'Certification & Job Readiness').\n"
                "5. Provide actionable modular learning_steps with resources, duration, and practice drills.\n"
                "6. Provide proof-of-work project blueprints with technologies and portfolio value.\n"
                "7. Provide industry-recognized certifications with issuer and importance.\n"
                "8. Provide a realistic internship path with prerequisites and full-time conversion strategy.\n"
                "9. Provide ATS resume guidance with headline, summary, top keywords, and action bullet points.\n"
                "10. Provide interview preparation with technical questions, behavioral STAR questions, and tips.\n"
                "11. Provide entry-level job titles, responsibilities, and realistic salary benchmarks.\n"
                "12. Provide a 4-5 stage career growth ladder from entry to leadership/architect.\n"
                "Output MUST conform strictly to the JSON schema."
            )

            prompt = (
                f"Analyze this student profile and generate the complete 12-part career transition architecture:\n"
                f"- Education Level: {profile.education}\n"
                f"- Degree / Course: {profile.degree or 'N/A'}\n"
                f"- Branch / Subject: {profile.branch or 'N/A'}\n"
                f"- Current Year / Status: {profile.currentYear or 'N/A'}\n"
                f"- Current Skills: {', '.join(profile.skills) if profile.skills else 'None declared'}\n"
                f"- Interests: {', '.join(profile.interests) if profile.interests else 'None declared'}\n"
                f"- Strengths: {', '.join(profile.strengths) if profile.strengths else 'None declared'}\n"
                f"- Weaknesses: {', '.join(profile.weaknesses) if profile.weaknesses else 'None declared'}\n"
                f"- Career Goal: {profile.careerGoal or 'Open to discovery'}\n"
                f"- Time Available: {profile.availableTime or '15 hrs/week'}\n\n"
                "Ensure every section is grounded, realistic, and mutually aligned with the recommended career goal."
            )

            response = client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=FullCareerAnalysisResponse,
                    temperature=0.2,
                ),
            )

            if response.parsed:
                return response.parsed  # type: ignore

            import json
            data = json.loads(response.text)
            return FullCareerAnalysisResponse.model_validate(data)

        except Exception as e:
            return self._fallback_orchestrated_analysis(profile, reason=f"Gemini execution error: {str(e)}")

    def _fallback_orchestrated_analysis(
        self, profile: CareerDiscoveryRequest, reason: str
    ) -> FullCareerAnalysisResponse:
        """
        Deterministic, production-grade fallback providing all 12 structured items
        if external AI API is unreachable or fails.
        """
        # 1. Base career discovery
        disc = self._fallback_discovery(profile, reason)
        primary_career = disc.careers[0] if disc.careers else CareerDiscoveryItem(
            career_name="Software Engineer",
            match_reason="Matches analytical and technical aptitude.",
            eligibility_level=EligibilityLevel.direct,
            required_skills=["Python", "SQL", "Git", "Data Structures"],
            missing_skills=["Data Structures"],
            qualification_requirements="Degree or equivalent verified coding portfolio.",
            possible_entry_roles=["Junior Software Engineer", "Backend Developer Trainee"],
        )

        c_name = primary_career.career_name
        skills_lower = [s.lower() for s in profile.skills]

        # 2. Skill gap
        matched = [s for s in primary_career.required_skills if s.lower() in skills_lower]
        missing = primary_career.missing_skills or [s for s in primary_career.required_skills if s.lower() not in skills_lower]
        if not missing:
            missing = ["System Design Basics", "Production Testing", "Cloud Deployment"]

        priority_skills = [
            PrioritySkillItem(
                skill_name=sk,
                priority=SkillPriority.high if i == 0 else SkillPriority.medium if i == 1 else SkillPriority.low,
                reason=f"Essential foundation for {c_name} hiring evaluations."
            )
            for i, sk in enumerate(missing[:4])
        ]

        skill_gap = SkillGapResponse(
            matched_skills=matched,
            missing_skills=missing,
            priority_skills=priority_skills,
            skill_level="Intermediate" if len(matched) >= 2 else "Beginner",
            reason=f"Candidate has {len(matched)} matching competencies and needs to bridge {len(missing)} skills to meet junior {c_name} standards.",
        )

        # 3. Recommended goal
        rec_goal = profile.careerGoal.strip() if profile.careerGoal and profile.careerGoal.strip() else c_name

        # 4. Roadmap
        roadmap = [
            "Phase 1: Foundational Core & Syntax Mastery",
            "Phase 2: Architectural Principles & Database Optimization",
            "Phase 3: Production Project Implementation & Testing",
            "Phase 4: Cloud CI/CD & Portfolio Showcase",
            "Phase 5: Technical Interview Drills & Direct Application",
        ]

        # 5. Learning steps
        learning_steps = [
            LearningStepItem(
                step_number=1,
                title=f"Core Fundamentals for {c_name}",
                description="Master core language syntax, algorithmic logic, and standard problem-solving patterns.",
                skills_covered=primary_career.required_skills[:2],
                duration="3-4 Weeks",
                learning_resources=["Official Language Documentation", "FreeCodeCamp Interactive Drills", "CS50 Open Courseware"],
                practice_drill="Implement 15 LeetCode/HackerRank easy-to-medium algorithm questions with zero external hints.",
            ),
            LearningStepItem(
                step_number=2,
                title="System Design & Data Architecture",
                description="Design relational schemas, optimize queries, and implement RESTful API services.",
                skills_covered=["SQL / Relational Databases", "REST APIs", "Clean Architecture"],
                duration="3-4 Weeks",
                learning_resources=["PostgreSQL Official Tutorial", "Designing Data-Intensive Applications summary", "REST API Design Best Practices"],
                practice_drill="Build a fully relational normalized database with transactions, indexing, and foreign key cascades.",
            ),
            LearningStepItem(
                step_number=3,
                title="Cloud Deployment & Production Best Practices",
                description="Dockerize applications, automate CI/CD GitHub Actions, and deploy to a cloud container runtime.",
                skills_covered=["Docker", "Git / GitHub Actions", "Cloud Deployment"],
                duration="2-3 Weeks",
                learning_resources=["Docker Documentation", "GitHub Actions Guide", "Cloud Provider Free Tier Docs"],
                practice_drill="Deploy a multi-service web application with automated build tests on every commit pull request.",
            ),
        ]

        # 6. Projects
        projects = [
            ProjectItem(
                title=f"Full-Stack {c_name} Operations Hub",
                difficulty="Intermediate",
                description="End-to-end production application featuring user auth, structured database, asynchronous workers, and responsive dashboard.",
                technologies=["Python / Node.js", "React / Next.js", "PostgreSQL", "Docker"],
                portfolio_value="Demonstrates complete product lifecycle development, secure authentication, and database modeling.",
            ),
            ProjectItem(
                title="Distributed Data & Analytics Pipeline",
                difficulty="Advanced",
                description="High-throughput pipeline that ingests data streams, computes aggregations, and surfaces insights through REST endpoints.",
                technologies=["SQL", "Python", "FastAPI", "Redis", "Docker Compose"],
                portfolio_value="Proves candidate understands high-concurrency systems, caching layers, and latency management.",
            ),
        ]

        # 7. Certifications
        certifications = [
            CertificationItem(
                name="AWS Certified Cloud Practitioner or Solutions Architect Associate",
                issuer="Amazon Web Services (AWS)",
                importance="Recommended",
                cost_level="$100 - $150 (Discount vouchers often available for students)",
                description="Validates core cloud networking, IAM security, and managed service architectures.",
            ),
            CertificationItem(
                name="PostgreSQL / Database Foundations Credential",
                issuer="The Linux Foundation or Coursera Open Credential",
                importance="Optional",
                cost_level="Free / Low-cost",
                description="Proves practical proficiency in database design, indexes, and transactional consistency.",
            ),
        ]

        # 8. Internship path
        internship_path = InternshipPathItem(
            target_roles=[f"Junior {c_name} Intern", "Software Engineering Intern", "Technical Solutions Trainee"],
            timing_window="3-6 Months Duration (Apply 2 months prior)",
            prerequisites=["2 complete GitHub repositories with live demo URLs and README documentation", "Proficiency in Git & code reviews"],
            conversion_strategy="Deliver pull requests ahead of schedule, write thorough automated tests, and communicate blockers proactively during sprint standups.",
        )

        # 9. Resume guidance
        resume_guidance = ResumeGuidance(
            headline=f"Aspiring {c_name} | Software Development & System Design",
            summary=f"Motivated engineer transitioning to {c_name} with hands-on proficiency in {', '.join(primary_career.required_skills[:3])}. Demonstrated ability to ship production-quality code through end-to-end projects and rigorous problem-solving.",
            top_keywords=primary_career.required_skills + ["Agile", "REST APIs", "Docker", "Unit Testing", "Git"],
            recommended_sections=["Header (LinkedIn + GitHub)", "Technical Skills Summary", "Featured Proof-of-Work Projects", "Education & Coursework", "Certifications"],
            action_bullet_points=[
                "Architected and deployed a multi-tier web application serving real-time analytics with sub-100ms response times.",
                "Engineered RESTful APIs with automated validation, error handling, and 85%+ unit test code coverage.",
                "Designed and normalized relational database schemas with indexed queries improving retrieval efficiency.",
            ],
        )

        # 10. Interview preparation
        interview_prep = InterviewPreparation(
            technical_questions=[
                "Explain the difference between SQL indexing methods (B-tree vs Hash) and when each is optimal.",
                "How do you design a REST API with idempotency and robust error status codes?",
                "Walk through your approach to debugging a high-latency endpoint in production.",
            ],
            behavioral_questions=[
                "Tell me about a time you faced a complex technical bug with a tight deadline. How did you resolve it?",
                "Describe a project decision where you had to balance clean code versus delivery speed.",
                "How do you handle receiving critical code review feedback on a pull request?",
            ],
            project_deep_dive_topics=[
                "Database schema trade-offs and normalization decisions.",
                "Edge cases handled in authentication and state management.",
                "Bottlenecks encountered during load testing or deployment.",
            ],
            preparation_tips=[
                "Practice explaining architectural trade-offs out loud using the STAR technique (Situation, Task, Action, Result).",
                "Ensure you can live-code solutions to your project's core algorithms without IDE auto-complete.",
                "Review time and space complexity (Big-O) for every data structure used in your portfolio.",
            ],
        )

        # 11. Entry-level jobs
        entry_jobs = [
            EntryLevelJob(
                job_title=f"Associate {c_name}",
                typical_responsibilities=[
                    "Implement feature requests under senior engineer supervision.",
                    "Author unit and integration tests for new pull requests.",
                    "Investigate and triage bug reports in staging and production.",
                ],
                salary_range="$60,000 - $85,000 / annum (or local market equivalent $4,000 - $7,000 / month)",
                target_companies="High-growth startups, established product scaleups, IT consultancies",
            ),
            EntryLevelJob(
                job_title="Junior Systems / Web Developer",
                typical_responsibilities=[
                    "Build reusable components and maintain API integrations.",
                    "Collaborate with UI/UX designers and product managers.",
                    "Maintain continuous integration pipelines and documentation.",
                ],
                salary_range="$55,000 - $75,000 / annum",
                target_companies="Digital product studios, fintech startups, SaaS companies",
            ),
        ]

        # 12. Career growth
        career_growth = [
            CareerGrowthStage(
                stage_name="Stage 1: Entry / Junior Engineer",
                timeline="0 - 2 Years",
                key_responsibilities=["Ship well-tested features within defined task boundaries", "Master codebase patterns and code review cycles"],
                skills_required_for_next_level=["Independent problem decomposition", "Deep debugging", "System monitoring"],
            ),
            CareerGrowthStage(
                stage_name="Stage 2: Mid-Level Engineer",
                timeline="2 - 4 Years",
                key_responsibilities=["Own entire feature modules end-to-end", "Mentor junior trainees and write technical design documents"],
                skills_required_for_next_level=["System architecture", "Cross-team communication", "Scalability trade-offs"],
            ),
            CareerGrowthStage(
                stage_name="Stage 3: Senior Engineer / Technical Lead",
                timeline="4 - 7 Years",
                key_responsibilities=["Drive architectural decisions across multiple repositories", "Ensure system reliability, security, and developer ergonomics"],
                skills_required_for_next_level=["Strategic roadmap alignment", "Staff-level engineering impact", "Engineering management options"],
            ),
            CareerGrowthStage(
                stage_name="Stage 4: Principal Architect / Engineering Manager",
                timeline="7+ Years",
                key_responsibilities=["Define organization-wide tech standards or lead high-performing cross-functional teams"],
                skills_required_for_next_level=["Executive technical strategy", "Organizational hiring and culture"],
            ),
        ]

        return FullCareerAnalysisResponse(
            career_options=disc.careers,
            skill_gap=skill_gap,
            recommended_career_goal=rec_goal,
            roadmap=roadmap,
            learning_steps=learning_steps,
            projects=projects,
            certifications=certifications,
            internship_path=internship_path,
            resume_guidance=resume_guidance,
            interview_preparation=interview_prep,
            entry_level_jobs=entry_jobs,
            career_growth=career_growth,
        )


