import os
import json
from typing import Protocol, List, Optional
from dotenv import load_dotenv
from app.schemas.interview import (
    InterviewGenerateRequest,
    InterviewGenerateResponse,
    InterviewAnswerSubmitRequest,
    InterviewAnswerEvaluateResponse,
    QuestionItem,
)

load_dotenv()


class InterviewAIProviderInterface(Protocol):
    async def generate_questions(
        self, request: InterviewGenerateRequest
    ) -> InterviewGenerateResponse:
        ...

    async def evaluate_answer(
        self, request: InterviewAnswerSubmitRequest
    ) -> InterviewAnswerEvaluateResponse:
        ...


class GeminiInterviewAIProvider:
    """
    AI provider for Interview Preparation:
    Generates technical, behavioral, project, and career-specific questions grounded
    in student profile, target career, skills, projects, and roadmap milestones.
    Also provides written answer evaluation without voice or generic chat.
    """

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "")
        self.model = model or os.getenv("GEMINI_MODEL", "gemini-3.5-flash")

    async def generate_questions(
        self, request: InterviewGenerateRequest
    ) -> InterviewGenerateResponse:
        if not self.api_key:
            return self._fallback_generate_interview(request, reason="GEMINI_API_KEY not configured")

        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=self.api_key)

            profile = request.student_profile
            edu = profile.education if profile else "Skill-first"
            skills_str = ", ".join(request.skills) if request.skills else "Core programming & data skills"
            projects_str = ", ".join(request.projects) if request.projects else "Full-stack & data showcase projects"
            roadmap_str = ", ".join(request.roadmap) if request.roadmap else "Step-by-step career path"

            system_instruction = (
                "You are an expert Technical Hiring Manager and Career Interview Coach.\n"
                "Generate a tailored mock interview question suite connected directly to the candidate's target career.\n"
                "CRITICAL RULES:\n"
                "1. Connect all questions strictly to the selected target career.\n"
                "2. Technical questions must test the candidate's actual stated skills & key role requirements.\n"
                "3. Behavioral questions must use the STAR framework (Situation, Task, Action, Result).\n"
                "4. Project questions must interrogate the candidate's stated projects (architecture, decisions, bottlenecks).\n"
                "5. Career-specific questions must test domain nuances and business context for this exact job role.\n"
                "6. Return strict JSON with:\n"
                "   - career_name (string)\n"
                "   - summary (string overview)\n"
                "   - technical_questions: list of objects {id, category: 'technical', question, context_or_tip, difficulty, expected_topics}\n"
                "   - behavioral_questions: list of objects {id, category: 'behavioral', question, context_or_tip, difficulty, expected_topics}\n"
                "   - project_questions: list of objects {id, category: 'project', question, context_or_tip, difficulty, expected_topics}\n"
                "   - career_specific_questions: list of objects {id, category: 'career_specific', question, context_or_tip, difficulty, expected_topics}"
            )

            prompt = (
                f"Candidate Target Career: '{request.target_career}'\n"
                f"Education Background: {edu}\n"
                f"Candidate Skills: {skills_str}\n"
                f"Candidate Projects: {projects_str}\n"
                f"Roadmap Milestones: {roadmap_str}\n\n"
                "Generate 3-4 high-yield questions for each category: Technical, Behavioral, Project, and Career-Specific."
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
                tech = [QuestionItem(**q) for q in data.get("technical_questions", [])]
                beh = [QuestionItem(**q) for q in data.get("behavioral_questions", [])]
                proj = [QuestionItem(**q) for q in data.get("project_questions", [])]
                role = [QuestionItem(**q) for q in data.get("career_specific_questions", [])]
                total = len(tech) + len(beh) + len(proj) + len(role)

                return InterviewGenerateResponse(
                    career_name=request.target_career,
                    technical_questions=tech,
                    behavioral_questions=beh,
                    project_questions=proj,
                    career_specific_questions=role,
                    total_questions_count=total,
                    summary=data.get(
                        "summary",
                        f"Personalized {request.target_career} interview suite focused on your projects and skills.",
                    ),
                )

            return self._fallback_generate_interview(request, reason="Empty LLM response")

        except Exception as e:
            return self._fallback_generate_interview(request, reason=f"Gemini API error: {str(e)}")

    async def evaluate_answer(
        self, request: InterviewAnswerSubmitRequest
    ) -> InterviewAnswerEvaluateResponse:
        if not self.api_key:
            return self._fallback_evaluate_answer(request, reason="GEMINI_API_KEY not configured")

        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=self.api_key)

            system_instruction = (
                "You are a Senior Engineering Hiring Manager evaluating an interview answer.\n"
                "Provide honest, actionable, and encouraging feedback.\n"
                "CRITICAL RULES:\n"
                "1. Score the answer from 1 to 10 based on depth, clarity, specificity, and relevance to the target career.\n"
                "2. Provide rating: 'Strong Answer' (8-10), 'Good Effort' (5-7), or 'Needs Improvement' (1-4).\n"
                "3. Highlight specific strengths.\n"
                "4. Provide 2-3 concrete improvement tips.\n"
                "5. Provide a polished, exemplary model answer illustrating the ideal industry response.\n"
                "6. Return strict JSON with:\n"
                "   - question_id (string)\n"
                "   - score (int 1-10)\n"
                "   - rating (string)\n"
                "   - feedback (string)\n"
                "   - strengths (list of strings)\n"
                "   - improvement_tips (list of strings)\n"
                "   - sample_better_answer (string)"
            )

            prompt = (
                f"Target Career: {request.career_name}\n"
                f"Question ID: {request.question_id}\n"
                f"Category: {request.category}\n"
                f"Interview Question: {request.question}\n\n"
                f"Candidate's Answer:\n\"{request.answer}\"\n\n"
                "Evaluate the candidate's answer and produce structured feedback."
            )

            response = client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    temperature=0.2,
                ),
            )

            if response.text:
                data = json.loads(response.text)
                return InterviewAnswerEvaluateResponse(
                    question_id=request.question_id,
                    score=int(data.get("score", 7)),
                    rating=data.get("rating", "Good Effort"),
                    feedback=data.get("feedback", "Good communication with room for technical depth."),
                    strengths=data.get("strengths", ["Clear explanation of thought process"]),
                    improvement_tips=data.get("improvement_tips", ["Incorporate concrete metrics and trade-offs"]),
                    sample_better_answer=data.get(
                        "sample_better_answer",
                        "A concise, structured response highlighting problem framing, execution, and quantifiable impact.",
                    ),
                )

            return self._fallback_evaluate_answer(request, reason="Empty LLM response")

        except Exception as e:
            return self._fallback_evaluate_answer(request, reason=f"Gemini API error: {str(e)}")

    def _fallback_generate_interview(
        self, request: InterviewGenerateRequest, reason: str = ""
    ) -> InterviewGenerateResponse:
        career = request.target_career or "Software Engineer"
        career_lower = career.lower()
        skills = [s.strip() for s in request.skills if s.strip()] or ["Python", "SQL", "Git"]
        first_skill = skills[0] if skills else "Data Structures"
        second_skill = skills[1] if len(skills) > 1 else "Databases"

        projects = [p.strip() for p in request.projects if p.strip()] or [
            f"{career} Showcase System",
            "Full Stack E-Commerce & Analytics Dashboard",
        ]
        primary_proj = projects[0]

        is_data = any(kw in career_lower for kw in ["data", "analyst", "analytics", "bi", "scientist"])

        tech_questions = [
            QuestionItem(
                id="tech-1",
                category="technical",
                question=f"How would you optimize the performance of a slow query or computation using {first_skill}?",
                context_or_tip=f"Discuss profiling, indexing, memory bottlenecks, and algorithmic efficiency in {first_skill}.",
                difficulty="Medium",
                expected_topics=[first_skill, "Performance Tuning", "Complexity Analysis"],
            ),
            QuestionItem(
                id="tech-2",
                category="technical",
                question=(
                    f"Explain how you model relationships and prevent anomalies in relational databases using {second_skill}."
                    if is_data
                    else f"How do you design RESTful endpoints and handle concurrent requests cleanly in {second_skill}?"
                ),
                context_or_tip="Focus on data integrity, ACID transactions, and error propagation.",
                difficulty="Medium",
                expected_topics=[second_skill, "Architecture", "Concurrency"],
            ),
            QuestionItem(
                id="tech-3",
                category="technical",
                question=f"What are the major trade-offs between asynchronous processing and synchronous execution in {career} systems?",
                context_or_tip="Highlight latency vs throughput, error retry semantics, and operational complexity.",
                difficulty="Hard",
                expected_topics=["System Design", "Async Architectures", "Reliability"],
            ),
        ]

        behavioral_questions = [
            QuestionItem(
                id="beh-1",
                category="behavioral",
                question="Tell me about a time when you had to learn an unfamiliar technology stack under a tight deadline.",
                context_or_tip="Use STAR framework: clarify the learning strategy, deliberate practice, and working deliverable.",
                difficulty="Medium",
                expected_topics=["Adaptability", "Learning Velocity", "STAR Method"],
            ),
            QuestionItem(
                id="beh-2",
                category="behavioral",
                question="Describe a situation where you disagreed with a peer or technical decision. How did you resolve it?",
                context_or_tip="Demonstrate empathy, data-driven reasoning, and putting the project outcome above ego.",
                difficulty="Medium",
                expected_topics=["Conflict Resolution", "Collaboration", "Constructive Feedback"],
            ),
            QuestionItem(
                id="beh-3",
                category="behavioral",
                question="Walk me through a project that failed or encountered an unexpected roadblock. What did you learn?",
                context_or_tip="Highlight accountability, root cause analysis (RCA), and preventative measures adopted.",
                difficulty="Hard",
                expected_topics=["Resilience", "Root Cause Analysis", "Continuous Improvement"],
            ),
        ]

        project_questions = [
            QuestionItem(
                id="proj-1",
                category="project",
                question=f"In your project '{primary_proj}', walk me through your end-to-end architecture decisions and tech stack rationale.",
                context_or_tip="Explain why you selected specific tools over alternatives and how data flows from input to storage.",
                difficulty="Medium",
                expected_topics=[primary_proj, "Architecture", "Design Decisions"],
            ),
            QuestionItem(
                id="proj-2",
                category="project",
                question=f"What was the most challenging technical bug or bottleneck in '{primary_proj}', and how did you debug it?",
                context_or_tip="Describe the diagnostic tools, hypothesis testing, and quantitative fix verified in production.",
                difficulty="Hard",
                expected_topics=[primary_proj, "Debugging", "Telemetry", "Profiling"],
            ),
            QuestionItem(
                id="proj-3",
                category="project",
                question=f"If '{primary_proj}' needed to handle 50,000 active concurrent users, what would fail first and how would you redesign it?",
                context_or_tip="Discuss caching, read-replicas, rate limiting, and horizontal scaling.",
                difficulty="Hard",
                expected_topics=[primary_proj, "Scalability", "High Availability", "Caching"],
            ),
        ]

        career_specific_questions = [
            QuestionItem(
                id="role-1",
                category="career_specific",
                question=(
                    f"How do you translate vague stakeholder business questions into measurable analytical metrics as a {career}?"
                    if is_data
                    else f"How do you ensure security, authentication, and input sanitization across modern {career} workflows?"
                ),
                context_or_tip="Highlight real-world business alignment and robust defensive engineering practices.",
                difficulty="Medium",
                expected_topics=[career, "Domain Expertise", "Industry Practices"],
            ),
            QuestionItem(
                id="role-2",
                category="career_specific",
                question=f"What metrics do you track to evaluate whether a feature or pipeline delivered as a {career} is performing successfully?",
                context_or_tip="Contrast operational health metrics (latency, error rate) with business outcomes (adoption, retention).",
                difficulty="Medium",
                expected_topics=[career, "KPIs", "Observability", "Business Impact"],
            ),
            QuestionItem(
                id="role-3",
                category="career_specific",
                question=f"Where do you see the industry heading for {career} roles over the next 2 years, and how are you preparing?",
                context_or_tip="Discuss automation, AI tooling adoption, and evolving engineering standards.",
                difficulty="Easy",
                expected_topics=[career, "Industry Vision", "Professional Development"],
            ),
        ]

        total_count = len(tech_questions) + len(behavioral_questions) + len(project_questions) + len(career_specific_questions)

        return InterviewGenerateResponse(
            career_name=career,
            technical_questions=tech_questions,
            behavioral_questions=behavioral_questions,
            project_questions=project_questions,
            career_specific_questions=career_specific_questions,
            total_questions_count=total_count,
            summary=f"Role-specific interview prep for {career} grounded in your projects ({primary_proj}) and skills ({', '.join(skills[:3])}).",
        )

    def _fallback_evaluate_answer(
        self, request: InterviewAnswerSubmitRequest, reason: str = ""
    ) -> InterviewAnswerEvaluateResponse:
        answer_words = len(request.answer.split())
        category = request.category.lower()

        # Score based on substantive detail
        if answer_words < 15:
            score = 3
            rating = "Needs Improvement"
            feedback = "The answer is too brief. Interviewers expect specific context, actions, and quantifiable outcomes."
            strengths = ["Direct answer to the prompt"]
            tips = [
                "Expand with concrete examples from your past projects or technical drills.",
                "Structure your response clearly (e.g. context, approach taken, result).",
                "Mention specific technologies and metrics rather than high-level statements.",
            ]
        elif answer_words < 45:
            score = 6
            rating = "Good Effort"
            feedback = "Solid foundation! You outlined the core idea, but deepening technical specificity or measurable impact will elevate this to an offer-worthy response."
            strengths = ["Clear conceptual grasp of the topic", "Cohesive phrasing"]
            tips = [
                "Add 1-2 sentences quantifying the result (e.g. 'reduced latency by 35%', 'handled 5k requests').",
                "Explain the 'why' behind your decision, not just what was done.",
            ]
        else:
            score = 8
            rating = "Strong Answer"
            feedback = "Excellent response! Well-structured, specific, and directly aligns with industry standards for this role."
            strengths = [
                "Detailed explanation with clear situational awareness",
                "Specific technical or behavioral trade-offs addressed",
                "Structured progression from problem to resolution",
            ]
            tips = [
                "Practice delivering this verbally in under 90 seconds.",
                "Conclude with a brief forward-looking takeaway.",
            ]

        sample_model = (
            f"When addressing this as a {request.career_name}, I approach it systematically: First, I define the constraints and verify requirements. Next, I implement the solution focusing on modular design and error handling. For instance, in my project, I applied this by isolating the pipeline with automated tests, which delivered a clean, measurable improvement in system stability."
        )

        return InterviewAnswerEvaluateResponse(
            question_id=request.question_id,
            score=score,
            rating=rating,
            feedback=feedback,
            strengths=strengths,
            improvement_tips=tips,
            sample_better_answer=sample_model,
        )

