import os
import json
from typing import Protocol, List, Optional
from dotenv import load_dotenv
from app.schemas.recommendation import (
    LearningRecommendationRequest,
    LearningRecommendationResponse,
    LearningRecommendationItem,
    ProjectRecommendationRequest,
    ProjectRecommendationResponse,
    ProjectRecommendationItem,
)

load_dotenv()


class RecommendationAIProviderInterface(Protocol):
    async def recommend_learning(
        self, request: LearningRecommendationRequest
    ) -> LearningRecommendationResponse:
        ...

    async def recommend_projects(
        self, request: ProjectRecommendationRequest
    ) -> ProjectRecommendationResponse:
        ...


class GeminiRecommendationAIProvider:
    """
    AI provider implementation for Learning & Project recommendations.
    Uses google-genai SDK when configured; falls back to deterministic curriculum & project design.
    NO paid course integrations; focuses on open-source docs and real-world project builds.
    """

    def __init__(self, api_key: Optional[str] = None, model: str = "gemini-2.5-flash"):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "")
        self.model = model

    async def recommend_learning(
        self, request: LearningRecommendationRequest
    ) -> LearningRecommendationResponse:
        if not self.api_key:
            return self._fallback_learning(request, reason="GEMINI_API_KEY not configured")

        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=self.api_key)

            system_instruction = (
                "You are an expert technical curriculum designer.\n"
                "Personalize learning recommendations strictly to the selected career role and roadmap skills.\n"
                "CRITICAL RULES:\n"
                "1. For each skill, specify: what to learn, learning sequence, estimated time, prerequisite knowledge, practice recommendation.\n"
                "2. DO NOT promote or integrate external paid courses (e.g. no Udemy/Coursera paywalls). Focus on official open documentation, open-source tools, and hands-on drills.\n"
                "3. Keep pacing realistic to candidate available time."
            )

            prompt = (
                f"Design a structured learning curriculum for Target Career: '{request.career_name}'.\n"
                f"- Roadmap Skills to Learn: {', '.join(request.skills)}\n"
                f"- Current Known Skills: {', '.join(request.current_skills) if request.current_skills else 'None'}\n"
                f"- Weekly Time Available: {request.available_time or '10-15 hrs/week'}\n"
            )

            response = client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=LearningRecommendationResponse,
                    temperature=0.2,
                ),
            )

            if response.parsed:
                return response.parsed  # type: ignore

            data = json.loads(response.text)
            return LearningRecommendationResponse.model_validate(data)

        except Exception as e:
            return self._fallback_learning(request, reason=f"Gemini execution error: {str(e)}")

    async def recommend_projects(
        self, request: ProjectRecommendationRequest
    ) -> ProjectRecommendationResponse:
        if not self.api_key:
            return self._fallback_projects(request, reason="GEMINI_API_KEY not configured")

        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=self.api_key)

            system_instruction = (
                "You are a Senior Principal Engineer and Hiring Reviewer.\n"
                "Recommend high-impact, proof-of-work portfolio projects personalized to the target career.\n"
                "CRITICAL RULES:\n"
                "1. Each project must have: project_title, difficulty (Beginner, Intermediate, Advanced), skills_practiced, expected_outcome, portfolio_value.\n"
                "2. Projects must be realistic to build independently without paid services.\n"
                "3. Emphasize observable proof-of-work that hiring managers look for in portfolios."
            )

            prompt = (
                f"Recommend portfolio projects for Target Career: '{request.career_name}'.\n"
                f"- Primary Skills to Exercise: {', '.join(request.skills)}\n"
                f"- Existing Skills: {', '.join(request.current_skills) if request.current_skills else 'None'}\n"
                f"- Educational Background: {request.education_level or 'Standard'}\n"
            )

            response = client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=ProjectRecommendationResponse,
                    temperature=0.2,
                ),
            )

            if response.parsed:
                return response.parsed  # type: ignore

            data = json.loads(response.text)
            return ProjectRecommendationResponse.model_validate(data)

        except Exception as e:
            return self._fallback_projects(request, reason=f"Gemini execution error: {str(e)}")

    def _fallback_learning(
        self, request: LearningRecommendationRequest, reason: str
    ) -> LearningRecommendationResponse:
        """
        Deterministic, structured learning recommendations personalized to target career and skills.
        """
        items: List[LearningRecommendationItem] = []
        career = request.career_name
        current_set = set(s.lower() for s in request.current_skills)

        for skill in request.skills:
            s_lower = skill.lower()

            if any(k in s_lower for k in ["python", "fastapi", "django", "backend", "api"]):
                items.append(
                    LearningRecommendationItem(
                        skill_name=skill,
                        what_to_learn=[
                            "Asynchronous programming & event loops (async/await)",
                            "RESTful API design conventions, status codes, and HTTP verbs",
                            "Data validation and schemas (Pydantic / dataclasses)",
                            "Database interaction & ORMs (SQLAlchemy, migrations with Alembic)",
                            "Authentication & Authorization (JWT tokens, OAuth2 flows)",
                        ],
                        learning_sequence=[
                            "Phase 1: Syntax & asynchronous I/O fundamentals",
                            "Phase 2: Building CRUD endpoints with schema validation",
                            "Phase 3: Relational database connection and connection pooling",
                            "Phase 4: Middleware, error handling, and unit/integration testing",
                        ],
                        estimated_time="2-3 Weeks (15-20 hours)",
                        prerequisite_knowledge=[
                            p for p in ["Basic Python syntax", "Fundamental HTTP concepts"]
                            if p.lower() not in current_set
                        ] or ["Basic programming fundamentals"],
                        practice_recommendation="Build a stateless authentication microservice with Pytest coverage and Swagger auto-docs.",
                    )
                )
            elif any(k in s_lower for k in ["react", "frontend", "typescript", "vue", "javascript"]):
                items.append(
                    LearningRecommendationItem(
                        skill_name=skill,
                        what_to_learn=[
                            "Component lifecycle, React 19 hooks (useState, useEffect, useMemo, useCallback)",
                            "State management strategies (Zustand / Redux Toolkit / Context)",
                            "TypeScript typing for props, handlers, and asynchronous API calls",
                            "Client-side routing, code splitting, and bundle optimization",
                            "Modern styling with Tailwind CSS or CSS Modules",
                        ],
                        learning_sequence=[
                            "Phase 1: Component hierarchy & unidirectional data flow",
                            "Phase 2: Custom hooks and asynchronous side-effect management",
                            "Phase 3: State lifting and global state stores",
                            "Phase 4: Responsive UI layout and accessibility (WCAG) checks",
                        ],
                        estimated_time="3-4 Weeks (20-25 hours)",
                        prerequisite_knowledge=[
                            p for p in ["HTML5 Semantic Elements", "Modern JavaScript (ES6+)", "CSS Flexbox & Grid"]
                            if p.lower() not in current_set
                        ] or ["Web fundamentals"],
                        practice_recommendation="Create an interactive, accessible dashboard with real-time state filtering and search debounce.",
                    )
                )
            elif any(k in s_lower for k in ["docker", "devops", "cloud", "kubernetes", "ci/cd"]):
                items.append(
                    LearningRecommendationItem(
                        skill_name=skill,
                        what_to_learn=[
                            "Containerization fundamentals: Images vs Containers",
                            "Writing efficient, multi-stage Dockerfiles",
                            "Multi-container orchestration using Docker Compose",
                            "Volume mounting, container networking, and secret management",
                            "CI/CD automation pipelines with GitHub Actions",
                        ],
                        learning_sequence=[
                            "Phase 1: Docker CLI basics, pulling and running containers",
                            "Phase 2: Multi-stage builds and minimal image footprints (Alpine/Debian Slim)",
                            "Phase 3: Composing services (Web app + Database + Cache)",
                            "Phase 4: Automated container testing in GitHub Actions",
                        ],
                        estimated_time="2 Weeks (12-15 hours)",
                        prerequisite_knowledge=["Basic Linux bash commands", "Client-server architecture"],
                        practice_recommendation="Containerize a full-stack app with PostgreSQL and Redis, verifying startup with a single `docker compose up` command.",
                    )
                )
            elif any(k in s_lower for k in ["ml", "machine learning", "pytorch", "ai", "deep learning"]):
                items.append(
                    LearningRecommendationItem(
                        skill_name=skill,
                        what_to_learn=[
                            "Tensor operations, automatic differentiation (Autograd)",
                            "Dataset preprocessing, DataLoaders, and feature engineering",
                            "Building neural network architectures (MLP, CNNs, Transformers)",
                            "Loss functions, optimizers, and learning rate scheduling",
                            "Model evaluation metrics, overfitting mitigation, and checkpointing",
                        ],
                        learning_sequence=[
                            "Phase 1: Linear algebra & PyTorch tensor manipulation",
                            "Phase 2: Supervised learning models & training loop construction",
                            "Phase 3: Deep neural networks & Transfer Learning with HuggingFace",
                            "Phase 4: Model serialization and inference optimization (ONNX)",
                        ],
                        estimated_time="3-5 Weeks (25-30 hours)",
                        prerequisite_knowledge=["Python programming", "Probability & statistics basics"],
                        practice_recommendation="Train and evaluate a transfer learning model on custom classification data with TensorBoard logging.",
                    )
                )
            elif any(k in s_lower for k in ["sql", "database", "postgres", "data modeling"]):
                items.append(
                    LearningRecommendationItem(
                        skill_name=skill,
                        what_to_learn=[
                            "Relational schema design, foreign keys, normalization (3NF)",
                            "Complex joins, subqueries, and Window Functions (ROW_NUMBER, RANK)",
                            "Indexing strategies (B-Tree, Hash, GIN) and EXPLAIN ANALYZE queries",
                            "Transactions, ACID guarantees, and concurrency isolation levels",
                        ],
                        learning_sequence=[
                            "Phase 1: DDL & DML fundamentals, joins, and aggregates",
                            "Phase 2: Window functions and analytical aggregation",
                            "Phase 3: Query profiling and index optimization",
                            "Phase 4: Database constraints and migration integrity",
                        ],
                        estimated_time="2-3 Weeks (14-18 hours)",
                        prerequisite_knowledge=["Basic data types and table understanding"],
                        practice_recommendation="Solve 25 real-world analytical SQL query scenarios and optimize a slow query using EXPLAIN ANALYZE.",
                    )
                )
            else:
                # Generic fallback for domain skills
                items.append(
                    LearningRecommendationItem(
                        skill_name=skill,
                        what_to_learn=[
                            f"Core theoretical foundations of {skill}",
                            f"Industry-standard tools, syntax, and workflows for {skill}",
                            f"Security, maintainability, and architectural best practices in {career}",
                        ],
                        learning_sequence=[
                            f"Phase 1: {skill} fundamentals & documentation immersion",
                            f"Phase 2: Intermediate application patterns and tooling",
                            f"Phase 3: Production simulation and error handling",
                        ],
                        estimated_time="2-3 Weeks (15 hours)",
                        prerequisite_knowledge=["Foundational analytical aptitude"],
                        practice_recommendation=f"Build and document a focused proof-of-concept module applying {skill} in a real-world scenario.",
                    )
                )

        return LearningRecommendationResponse(
            career_name=career,
            learning_recommendations=items,
            summary=f"Personalized learning sequences for {len(items)} roadmap skills tailored to {career} ({reason}).",
        )

    def _fallback_projects(
        self, request: ProjectRecommendationRequest, reason: str
    ) -> ProjectRecommendationResponse:
        """
        Deterministic, structured project recommendations personalized to target career and skills.
        """
        career = request.career_name
        career_lower = career.lower()
        skills = request.skills
        items: List[ProjectRecommendationItem] = []

        # 1. Flagship End-to-End Capstone
        items.append(
            ProjectRecommendationItem(
                project_title=f"{career} Production Platform",
                difficulty="Intermediate",
                skills_practiced=skills[:4] if len(skills) >= 4 else skills + ["System Design", "Git CI/CD"],
                expected_outcome=(
                    f"A fully functional, deployable application embodying the core responsibilities of a {career}. "
                    "Features end-to-end user flows, automated tests, clean separation of concerns, and live hosted demo URL."
                ),
                portfolio_value=(
                    f"Demonstrates you can build production-caliber software matching actual industry standards for a {career}, "
                    "proving capability beyond textbook exercises."
                ),
            )
        )

        # 2. Focused Domain / Optimization Project
        if any(k in career_lower for k in ["data", "ml", "machine learning", "ai"]):
            items.append(
                ProjectRecommendationItem(
                    project_title="Automated Analytics Pipeline & Real-Time Dashboard",
                    difficulty="Advanced",
                    skills_practiced=["SQL", "Python", "Data Modeling", "ETL Pipelines"],
                    expected_outcome="Reproducible data pipeline ingesting raw records, performing cleansing, and visualizing key metric trends.",
                    portfolio_value="Demonstrates data integrity discipline, schema modeling skills, and business communication.",
                )
            )
        elif any(k in career_lower for k in ["design", "ui", "ux"]):
            items.append(
                ProjectRecommendationItem(
                    project_title="Design System & Multi-Platform Component Library",
                    difficulty="Intermediate",
                    skills_practiced=["Figma", "Design Systems", "Usability Testing", "Wireframing"],
                    expected_outcome="Complete atomic design system with typography, color tokens, interactive variants, and WCAG contrast conformance.",
                    portfolio_value="Hiring leads look for systematic design thinking that engineers can implement frictionlessly.",
                )
            )
        else:
            items.append(
                ProjectRecommendationItem(
                    project_title="High-Concurrency Microservice with Caching & Rate Limiting",
                    difficulty="Advanced",
                    skills_practiced=["REST APIs", "Caching (Redis)", "Docker", "Load Testing"],
                    expected_outcome="Stateless API service handling 500+ requests/sec with robust rate limiting and structured JSON logging.",
                    portfolio_value="Provides tangible proof of backend scaling awareness and operational maturity.",
                )
            )

        # 3. Quick Starter / Proof of Work
        items.append(
            ProjectRecommendationItem(
                project_title=f"CLI Tool & Automation Suite for {skills[0] if skills else career}",
                difficulty="Beginner",
                skills_practiced=[skills[0] if skills else "Scripting", "Testing", "Documentation"],
                expected_outcome="Command-line utility or developer toolkit with argument parsing, error validation, and automated unit tests.",
                portfolio_value="Shows clean code structure, attention to developer experience, and packaging discipline.",
            )
        )

        return ProjectRecommendationResponse(
            career_name=career,
            project_recommendations=items,
            summary=f"Curated {len(items)} proof-of-work project blueprints for {career} without paid dependencies ({reason}).",
        )

