import os
import json
from typing import Protocol, List, Optional
from dotenv import load_dotenv
from app.schemas.assist import (
    ContextualAssistRequest,
    ContextualAssistResponse,
    ProjectItem,
)

load_dotenv()


class AssistAIProviderInterface(Protocol):
    async def get_contextual_assistance(
        self, request: ContextualAssistRequest
    ) -> ContextualAssistResponse:
        ...


class GeminiAssistAIProvider:
    """
    AI provider for Contextual Node Assistance using google-genai SDK.
    Grounds guidance in the student profile, target career, and roadmap position.
    Isolated from service and router layer.
    """

    def __init__(self, api_key: Optional[str] = None, model: str = "gemini-2.5-flash"):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "")
        self.model = model

    async def get_contextual_assistance(
        self, request: ContextualAssistRequest
    ) -> ContextualAssistResponse:
        if not self.api_key:
            return self._fallback_assist(request, reason="GEMINI_API_KEY not configured")

        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=self.api_key)

            profile = request.student_profile
            student_skills = profile.skills if profile else []
            student_edu = profile.education if profile else "Skill-first"
            strengths = profile.strengths if profile else []
            weaknesses = profile.weaknesses if profile else []
            avail_time = profile.availableTime if profile and profile.availableTime else "10-15 hrs/week"

            node = request.selected_node
            roadmap = request.roadmap_context

            roadmap_summary = (
                f"Roadmap has {roadmap.total_steps} total steps ({roadmap.completed_steps_count} completed)."
                if roadmap
                else "Active career roadmap."
            )
            if roadmap and roadmap.surrounding_steps:
                roadmap_summary += f" Surrounding milestone steps: {', '.join(roadmap.surrounding_steps)}."

            system_instruction = (
                "You are an expert AI Career Mentor and Engineering Coach embedded directly in a student's workflow canvas.\n"
                "The student has selected a specific workflow node and asked: 'What should I do next?'\n"
                "Provide hyper-personalized, context-aware guidance tailored directly to the student's background, target career, and current position in their roadmap.\n"
                "CRITICAL RULES:\n"
                "1. DO NOT act like a generic chatbot. Be precise, tactically actionable, and grounded in industry hiring standards.\n"
                "2. Understand the student's profile: their known skills, strengths, weaknesses, and weekly available time.\n"
                "3. Relate the selected node directly to the target career.\n"
                "4. Return strict JSON with exact fields:\n"
                "   - next_action: string\n"
                "   - explanation: string\n"
                "   - practice: list of strings (concrete drills/exercises)\n"
                "   - project: object with {title, description, deliverable}\n"
                "   - interview_questions: list of strings (3-5 realistic questions)\n"
                "   - next_milestone: string"
            )

            prompt = (
                f"Student Profile:\n"
                f"- Education: {student_edu}\n"
                f"- Known Skills: {', '.join(student_skills) if student_skills else 'None declared'}\n"
                f"- Strengths: {', '.join(strengths) if strengths else 'None declared'}\n"
                f"- Weaknesses: {', '.join(weaknesses) if weaknesses else 'None declared'}\n"
                f"- Weekly Commitment: {avail_time}\n\n"
                f"Target Career: '{request.target_career}'\n"
                f"Roadmap Context: {roadmap_summary}\n\n"
                f"Selected Node Context:\n"
                f"- Title: '{node.title}'\n"
                f"- Step Type/Category: '{node.step_type or node.node_type}'\n"
                f"- Node Skills: {', '.join(node.skills) if node.skills else 'None'}\n"
                f"- Node Description: '{node.description or 'No extra description'}'\n"
                f"- Completion Status: '{node.status or 'not_started'}'\n\n"
                f"Question: What should I do next for this node?"
            )

            response = client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    temperature=0.3,
                ),
            )

            if response.text:
                data = json.loads(response.text)
                return ContextualAssistResponse(
                    next_action=data.get("next_action", "Proceed with guided practice for this node."),
                    explanation=data.get("explanation", f"Mastering {node.title} is essential for {request.target_career}."),
                    practice=data.get("practice", ["Practice foundational exercises", "Build test implementations"]),
                    project=data.get("project", {
                        "title": f"{node.title} Hands-on Build",
                        "description": f"Build an applied project demonstrating proficiency in {node.title}.",
                        "deliverable": "GitHub repository with documentation"
                    }),
                    interview_questions=data.get("interview_questions", [
                        f"How do you implement {node.title} in a production environment?",
                        f"What are key performance considerations when working with {node.title}?"
                    ]),
                    next_milestone=data.get("next_milestone", f"Complete exercises and publish project deliverable for {node.title}.")
                )

            return self._fallback_assist(request, reason="Empty LLM response")

        except Exception as e:
            return self._fallback_assist(request, reason=f"Gemini API error: {str(e)}")

    def _fallback_assist(
        self, request: ContextualAssistRequest, reason: str = ""
    ) -> ContextualAssistResponse:
        """
        Deterministic, context-aware guidance fallback based on student profile, target career, and node topic.
        """
        node = request.selected_node
        target = request.target_career or "Software Engineer"
        title_lower = node.title.lower()
        step_type = (node.step_type or node.node_type or "").lower()
        profile = request.student_profile
        known_skills = [s.lower() for s in (profile.skills if profile else [])]
        avail_time = profile.availableTime if profile and profile.availableTime else "10-15 hrs/week"

        # 1. SQL Node
        if "sql" in title_lower or "database" in title_lower or any("sql" in s.lower() for s in node.skills):
            already_knows_sql = "sql" in known_skills
            return ContextualAssistResponse(
                next_action=(
                    "Optimize relational schemas and write advanced multi-table analytical queries with window functions."
                    if already_knows_sql
                    else "Set up a local PostgreSQL database and practice writing SELECT, JOIN (INNER/LEFT), and aggregation queries."
                ),
                explanation=(
                    f"For a {target}, relational data integrity and efficient queries are required to manage application state and metrics. Given your availability of {avail_time}, focusing on indexing and query execution plans will give you an immediate hiring advantage."
                ),
                practice=[
                    "Write queries using INNER, LEFT, and FULL OUTER joins across 3 normalized tables (Users, Orders, LineItems).",
                    "Solve 10 LeetCode Medium database questions focusing on RANK(), DENSE_RANK(), and ROW_NUMBER() window functions.",
                    "Analyze query performance using EXPLAIN ANALYZE and add B-Tree indexes on foreign keys to reduce scan cost."
                ],
                project={
                    "title": f"{target} Analytics & Reporting Schema",
                    "description": "Design a 3NF normalized schema for e-commerce transactions, seed 50,000 synthetic rows, and author 5 complex analytical queries calculating monthly churn and customer lifetime value.",
                    "deliverable": "GitHub repo with schema DDL, seed SQL scripts, and query performance benchmark reports."
                },
                interview_questions=[
                    "What is the operational difference between WHERE and HAVING in SQL?",
                    "How do B-Tree indexes work, and when might an index degrade write performance?",
                    "Explain ACID properties and how PostgreSQL handles concurrent read/write transactions.",
                    "How do you debug a slow-running query with multiple JOINs and subqueries?"
                ],
                next_milestone="Solve 15 SQL challenge problems without looking at solutions and commit your database schema to GitHub."
            )

        # 2. Python Node
        if "python" in title_lower or any("python" in s.lower() for s in node.skills):
            is_data_focused = any(kw in target.lower() for kw in ["data", "ml", "ai", "machine", "analytics"])
            return ContextualAssistResponse(
                next_action=(
                    "Implement a modular data processing pipeline using Pandas, NumPy, and clean Python packaging."
                    if is_data_focused
                    else "Build an asynchronous REST API service using FastAPI with Pydantic validation and unit tests."
                ),
                explanation=(
                    f"Python is a core language for {target}. To stand out, demonstrate idiomatic Python: type annotations, asynchronous generators, and robust exception handling rather than basic scripting."
                ),
                practice=[
                    "Implement custom context managers using Python's `contextlib` and `@asynccontextmanager`.",
                    "Write type-safe data models using Pydantic v2 and enforce validation boundaries on external inputs.",
                    "Implement a Producer-Consumer pattern using `asyncio.Queue` with concurrent worker tasks.",
                    "Write unit tests with `pytest` achieving >85% test coverage for business logic functions."
                ],
                project={
                    "title": f"Production-Ready Python Service for {target}",
                    "description": (
                        "Develop an automated ETL pipeline that ingests messy JSON datasets, validates schemas with Pydantic, and stores clean partitions."
                        if is_data_focused
                        else "Develop a scalable REST microservice with FastAPI, background tasks, JWT authentication, and Docker containerization."
                    ),
                    "deliverable": "GitHub repository with Dockerfile, pytest test suite, and comprehensive README documentation."
                },
                interview_questions=[
                    "Explain the Python GIL (Global Interpreter Lock) and how `asyncio` achieves concurrency despite it.",
                    "What is the difference between mutable and immutable types in Python, and how does memory allocation work?",
                    "How do Python decorators work under the hood, and how do you preserve function metadata using `functools.wraps`?",
                    "What are generators in Python and how do `yield` and `yield from` conserve memory with large datasets?"
                ],
                next_milestone="Publish the Python service to GitHub with passing CI/CD workflow tests and clean API documentation."
            )

        # 3. Project Node
        if "project" in title_lower or step_type == "project":
            return ContextualAssistResponse(
                next_action="Draft the System Architecture Diagram and define API contract specifications before writing implementation code.",
                explanation=(
                    f"Hiring managers for {target} look for proof-of-work that demonstrates end-to-end ownership: architecture trade-offs, test coverage, and clear documentation. This project validates that you can deliver production-quality code."
                ),
                practice=[
                    "Create an Entity-Relationship (ER) diagram and OpenAPI specification before bootstrapping code.",
                    "Implement git feature branching with pull requests and commit hygiene following Conventional Commits.",
                    "Write automated integration tests covering critical happy paths and failure scenarios."
                ],
                project={
                    "title": f"Full-Lifecycle {target} Showcase Application",
                    "description": f"Build a real-world web/data application tailored to {target}. Include user authentication, data persistence, automated tests, and deployment on a cloud provider (e.g. Render, Vercel, or AWS).",
                    "deliverable": "Live demo URL, GitHub repository with CI status badge, architecture diagram, and setup instructions."
                },
                interview_questions=[
                    "Walk me through the architecture of your project: what trade-offs did you make when selecting your tech stack?",
                    "How did you handle error handling, logging, and data validation in edge cases?",
                    "If your application experienced a 10x traffic spike tomorrow, what would break first and how would you scale it?",
                    "Describe a challenging bug you encountered in this project and how you systematically debugged it."
                ],
                next_milestone="Deploy the application to a public cloud URL and record a 2-minute video walkthrough demonstrating key user workflows."
            )

        # 4. Interview Node
        if "interview" in title_lower or step_type == "interview":
            return ContextualAssistResponse(
                next_action="Conduct 2 timed mock interview sessions: one focused on core technical problem-solving and one on STAR-method behavioral stories.",
                explanation=(
                    f"Interviewing for {target} requires communicating your thought process clearly under pressure. Practicing out-loud problem decomposition will bridge the gap between technical knowledge and offer letters."
                ),
                practice=[
                    "Practice the STAR method (Situation, Task, Action, Result) for 5 core stories: technical challenge, team conflict, deadline pressure, failure/learning, and ownership.",
                    "Explain technical solutions out loud before touching keyboard: clarify constraints, state assumptions, and analyze Big-O complexity.",
                    "Prepare 3 insightful reverse-interview questions for engineering leads demonstrating your depth."
                ],
                project={
                    "title": f"{target} Interview Cheat Sheet & Behavioral Matrix",
                    "description": "Compile a structured matrix mapping past projects to 8 common behavioral prompts, alongside concise summaries of system design trade-offs and language internals.",
                    "deliverable": "Well-formatted Notion or Markdown prep document ready for review 30 minutes before interviews."
                },
                interview_questions=[
                    f"Tell me about yourself and why you are targeting a career as a {target}.",
                    "Describe a situation where a technical project fell behind schedule. How did you prioritize deliverables?",
                    "How do you approach learning an unfamiliar technology stack under tight deadline constraints?",
                    "Walk me through a time when you received constructive feedback on code review and how you handled it."
                ],
                next_milestone="Complete a recorded 45-minute peer or AI mock interview with zero pauses over 15 seconds."
            )

        # 5. Internship Node
        if "internship" in title_lower or step_type == "internship":
            return ContextualAssistResponse(
                next_action="Tailor your resume highlighting your recent projects and target 15 company applications with customized cover notes.",
                explanation=(
                    f"Internships and experiential programs for {target} evaluate foundational learning velocity and team collaboration. Showing tangible projects immediately positions you ahead of generic degree applicants."
                ),
                practice=[
                    "Draft 3 personalized outreach messages on LinkedIn to engineering team leads explaining why their product excites you.",
                    "Audit your GitHub profile: pin your top 2 relevant repositories and ensure READMEs have live demo links and screenshots.",
                    "Prepare an elevator pitch summarizing your technical journey, projects, and target role in under 60 seconds."
                ],
                project={
                    "title": "Interactive Portfolio & Application Tracker",
                    "description": "Build a clean portfolio page or Notion hub showcasing project architecture, deliverables, and blog posts detailing what you built, paired with an organized spreadsheet tracking application statuses.",
                    "deliverable": "Live portfolio link, polished 1-page ATS-compliant resume PDF, and outreach tracker."
                },
                interview_questions=[
                    f"What specific skills do you hope to develop during this {target} internship?",
                    "Can you walk us through how you collaborated on or structured your most complex project?",
                    "How do you balance learning company standards with delivering working code autonomously?"
                ],
                next_milestone="Submit 10 targeted applications with customized cover notes and connect with 5 alumni or engineers in the target field."
            )

        # 6. General / Skill Node Fallback (e.g. React, Cloud, Machine Learning, etc.)
        return ContextualAssistResponse(
            next_action=f"Focus on the core concepts of {node.title} and build a proof-of-concept prototype within 48 hours.",
            explanation=(
                f"Mastering {node.title} is an important stepping stone toward becoming a competitive {target}. With your available time of {avail_time}, incremental daily practice will cement this knowledge into long-term recall."
            ),
            practice=[
                f"Study the official documentation for {node.title} and summarize the 3 most important architecture patterns.",
                f"Implement 3 hands-on mini exercises demonstrating error handling and edge-case execution in {node.title}.",
                f"Refactor an existing code snippet or module to integrate {node.title} cleanly."
            ],
            project={
                "title": f"{node.title} Applied Demonstration Module",
                "description": f"Build a modular component or utility demonstrating practical use of {node.title} integrated into a {target} workflow.",
                "deliverable": f"GitHub repository containing the code, tests, and a README explaining why {node.title} was chosen."
            },
            interview_questions=[
                f"What problem does {node.title} solve, and what alternative tools or libraries exist?",
                f"What are the most common anti-patterns or mistakes developers make when adopting {node.title}?",
                f"How do you measure or optimize the performance of {node.title} in production?"
            ],
            next_milestone=f"Successfully build and commit the {node.title} prototype with unit test coverage."
        )

