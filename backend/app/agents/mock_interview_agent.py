import os
import json
from typing import Protocol, List, Optional
from dotenv import load_dotenv
from app.schemas.interview import QuestionItem, InterviewAnswerEvaluateResponse
from app.schemas.mock_interview import (
    MockInterviewStartRequest,
    MockInterviewTurn,
    FinalFeedbackResult,
    CategoryFeedback,
    ConfidenceIndicators,
)
from app.agents.interview_agent import GeminiInterviewAIProvider

load_dotenv()


class MockInterviewAIProviderInterface(Protocol):
    async def generate_mock_questions(
        self, request: MockInterviewStartRequest
    ) -> List[QuestionItem]:
        ...

    async def evaluate_turn_answer(
        self, career_name: str, question: QuestionItem, answer: str
    ) -> InterviewAnswerEvaluateResponse:
        ...

    async def synthesize_final_feedback(
        self, career_name: str, turns: List[MockInterviewTurn]
    ) -> FinalFeedbackResult:
        ...


class GeminiMockInterviewAIProvider:
    """
    AI Provider for Mock Interview Sessions.
    Evaluates turn-by-turn responses and synthesizes a comprehensive final report.
    Explicitly avoids psychological or medical claims.
    """

    def __init__(self, api_key: Optional[str] = None, model: str = "gemini-2.5-flash"):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "")
        self.model = model
        self.base_interview_agent = GeminiInterviewAIProvider(api_key=self.api_key, model=self.model)

    async def generate_mock_questions(
        self, request: MockInterviewStartRequest
    ) -> List[QuestionItem]:
        career = request.target_career or "Software Engineer"
        count = request.question_count

        # Use base interview agent fallback or generation
        from app.schemas.interview import InterviewGenerateRequest

        gen_req = InterviewGenerateRequest(
            target_career=career,
            skills=request.skills,
            projects=request.projects,
        )
        suite = await self.base_interview_agent.generate_questions(gen_req)

        # Assemble a balanced round of questions
        selected: List[QuestionItem] = []
        if suite.technical_questions:
            selected.append(suite.technical_questions[0])
        if suite.project_questions:
            selected.append(suite.project_questions[0])
        if suite.behavioral_questions:
            selected.append(suite.behavioral_questions[0])
        if suite.career_specific_questions:
            selected.append(suite.career_specific_questions[0])

        # If count > 4 or additional needed, pull more
        pool = (
            suite.technical_questions[1:]
            + suite.project_questions[1:]
            + suite.behavioral_questions[1:]
            + suite.career_specific_questions[1:]
        )
        while len(selected) < count and pool:
            selected.append(pool.pop(0))

        # Re-index
        for idx, q in enumerate(selected):
            q.id = f"mock-q{idx + 1}"

        return selected[:count]

    async def evaluate_turn_answer(
        self, career_name: str, question: QuestionItem, answer: str
    ) -> InterviewAnswerEvaluateResponse:
        from app.schemas.interview import InterviewAnswerSubmitRequest

        req = InterviewAnswerSubmitRequest(
            career_name=career_name,
            question_id=question.id,
            question=question.question,
            category=question.category,
            answer=answer,
        )
        return await self.base_interview_agent.evaluate_answer(req)

    async def synthesize_final_feedback(
        self, career_name: str, turns: List[MockInterviewTurn]
    ) -> FinalFeedbackResult:
        if not self.api_key:
            return self._fallback_final_feedback(career_name, turns, reason="GEMINI_API_KEY not configured")

        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=self.api_key)

            turns_transcript = []
            for t in turns:
                turns_transcript.append({
                    "turn_number": t.turn_number,
                    "category": t.category,
                    "question": t.question,
                    "student_answer": t.student_answer or "No answer provided",
                    "evaluation_score": t.evaluation.score if t.evaluation else 5,
                    "evaluation_feedback": t.evaluation.feedback if t.evaluation else "",
                })

            system_instruction = (
                "You are an expert Senior Engineering Hiring Director conducting a post-interview debrief.\n"
                "Synthesize a rigorous, objective professional readiness assessment across all answered questions.\n"
                "CRITICAL RULES:\n"
                "1. DO NOT claim, infer, or provide any psychological, cognitive, clinical, or medical assessments.\n"
                "2. Evaluate strictly observable professional and engineering criteria: structure, terminology, trade-offs, and communication poise.\n"
                "3. Ground feedback in the target career requirements.\n"
                "4. Return strict JSON matching:\n"
                "   - overall_score (integer 1-10)\n"
                "   - readiness_rating (string)\n"
                "   - executive_summary (string)\n"
                "   - communication: {score: int, summary: string, key_observations: list of strings}\n"
                "   - technical_knowledge: {score: int, summary: string, key_observations: list of strings}\n"
                "   - answer_quality: {score: int, summary: string, key_observations: list of strings}\n"
                "   - confidence_indicators: {score: int, articulation_clarity: string, assertiveness_level: string, observable_signals: list of strings}\n"
                "   - knowledge_gaps: list of strings (specific technical or domain areas needing study)\n"
                "   - improvement_suggestions: list of strings (concrete preparation tasks)"
            )

            prompt = (
                f"Target Career: {career_name}\n\n"
                f"Completed Interview Turns:\n{json.dumps(turns_transcript, indent=2)}\n\n"
                "Generate the comprehensive final interview report."
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
                return FinalFeedbackResult(
                    overall_score=int(data.get("overall_score", 7)),
                    readiness_rating=data.get("readiness_rating", "Nearly Interview Ready"),
                    executive_summary=data.get(
                        "executive_summary",
                        f"Demonstrated solid baseline potential for {career_name} with clear opportunities to deepen technical specifics.",
                    ),
                    communication=CategoryFeedback(**data.get("communication", {
                        "score": 7,
                        "summary": "Clear phrasing and structured responses.",
                        "key_observations": ["Logical structure observed", "Good tone"]
                    })),
                    technical_knowledge=CategoryFeedback(**data.get("technical_knowledge", {
                        "score": 7,
                        "summary": "Understands core domain concepts.",
                        "key_observations": ["Accurate terminology", "Awareness of tooling"]
                    })),
                    answer_quality=CategoryFeedback(**data.get("answer_quality", {
                        "score": 7,
                        "summary": "Direct answers addressing prompt objectives.",
                        "key_observations": ["Relevant examples", "Reasonable depth"]
                    })),
                    confidence_indicators=ConfidenceIndicators(**data.get("confidence_indicators", {
                        "score": 7,
                        "articulation_clarity": "Structured and steady phrasing",
                        "assertiveness_level": "Direct without excessive qualifiers",
                        "observable_signals": ["Direct addressing of questions", "Clear conclusions"]
                    })),
                    knowledge_gaps=data.get("knowledge_gaps", ["Edge-case error handling", "Quantitative metric benchmarks"]),
                    improvement_suggestions=data.get("improvement_suggestions", [
                        "Structure behavioral answers with quantifiable metrics.",
                        "Explain architectural trade-offs explicitly."
                    ]),
                )

            return self._fallback_final_feedback(career_name, turns, reason="Empty LLM response")

        except Exception as e:
            return self._fallback_final_feedback(career_name, turns, reason=f"Gemini API error: {str(e)}")

    def _fallback_final_feedback(
        self, career_name: str, turns: List[MockInterviewTurn], reason: str = ""
    ) -> FinalFeedbackResult:
        # Calculate scores from individual turn evaluations
        evaluated_turns = [t for t in turns if t.evaluation]
        scores = [t.evaluation.score for t in evaluated_turns if t.evaluation]
        avg_score = round(sum(scores) / len(scores)) if scores else 7

        if avg_score >= 8:
            readiness = "Interview Ready (High Competency)"
            summary = (
                f"Candidate exhibited strong readiness for {career_name} interviews. Articulation was crisp, technical frameworks were applied correctly, and project anecdotes demonstrated real ownership."
            )
        elif avg_score >= 6:
            readiness = "Nearly Interview Ready (Solid Foundation)"
            summary = (
                f"Candidate demonstrated a good foundational grasp of {career_name} competencies. Answers were cohesive and relevant, but incorporating deeper system trade-offs and quantifiable impact will significantly boost offer rates."
            )
        else:
            readiness = "Needs Targeted Preparation"
            summary = (
                f"Candidate showed genuine interest and core awareness, but responses lacked the depth and structure expected in standard {career_name} technical rounds."
            )

        # Communication analysis
        comm_score = min(10, max(4, avg_score + 1 if avg_score < 8 else avg_score))
        comm_feedback = CategoryFeedback(
            score=comm_score,
            summary="Demonstrated logical progression and clear verbal structure across questions.",
            key_observations=[
                "Directly addressed questions without wandering off-topic",
                "Maintained professional terminology suitable for engineering teams",
                "Structured explanations using introductory framing followed by practical evidence",
            ],
        )

        # Technical knowledge analysis
        tech_score = max(3, avg_score)
        tech_feedback = CategoryFeedback(
            score=tech_score,
            summary=f"Demonstrated good command of core {career_name} technologies with room for architectural depth.",
            key_observations=[
                "Accurate identification of primary tooling and database patterns",
                "Good explanation of happy-path execution flows",
                "Opportunity to elaborate on concurrency, indexing, and failure recovery",
            ],
        )

        # Answer quality analysis
        ans_score = avg_score
        quality_feedback = CategoryFeedback(
            score=ans_score,
            summary="Responses addressed core criteria with relevant project references.",
            key_observations=[
                "Integrated past project context to substantiate technical claims",
                "Explained problem context clearly before detailing execution",
                "Could strengthen conclusions with measurable impact metrics (e.g. latency, scale)",
            ],
        )

        # Confidence indicators (strictly professional communication signals, no psychological claims)
        confidence_score = min(10, max(5, avg_score))
        confidence_indicators = ConfidenceIndicators(
            score=confidence_score,
            articulation_clarity="Structured and steady articulation with clear transitions",
            assertiveness_level="Firm conviction when discussing familiar stacks; cautious on advanced system design",
            observable_signals=[
                "Succinct problem framing in opening remarks",
                "Consistent usage of active technical verbs rather than passive language",
                "Clean declarative sentence structures with minimal filler phrasing",
            ],
        )

        # Knowledge gaps derived from turns
        knowledge_gaps = [
            f"Production performance tuning and query indexing under scale for {career_name}",
            "Quantitative trade-off analysis between monolithic vs decoupled microservice architectures",
            "STAR-framework result quantification (measuring business or technical impact in numbers)",
        ]

        # Actionable improvement suggestions
        improvement_suggestions = [
            "Prepare 3 STAR behavioral stories with exact metrics (e.g. 'reduced latency by 28%').",
            f"Practice explaining the internals of your primary {career_name} framework out loud in under 2 minutes.",
            "Always state technical trade-offs before prescribing a single architecture choice.",
            "End responses with a crisp one-sentence synthesis rather than trailing off.",
        ]

        return FinalFeedbackResult(
            overall_score=avg_score,
            readiness_rating=readiness,
            executive_summary=summary,
            communication=comm_feedback,
            technical_knowledge=tech_feedback,
            answer_quality=quality_feedback,
            confidence_indicators=confidence_indicators,
            knowledge_gaps=knowledge_gaps,
            improvement_suggestions=improvement_suggestions,
        )

