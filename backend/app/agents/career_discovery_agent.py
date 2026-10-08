import os
from typing import Protocol, List
from dotenv import load_dotenv
from app.schemas.career import CareerDiscoveryRequest, CareerDiscoveryResponse, CareerDiscoveryItem, EligibilityLevel

load_dotenv()


class AIProviderInterface(Protocol):
    async def discover_careers(self, profile: CareerDiscoveryRequest) -> CareerDiscoveryResponse:
        ...


class GeminiCareerAIProvider:
    """
    Gemini AI provider implementation using google-genai SDK.
    Isolated from service and controller logic.
    """

    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "")
        self.model = model or os.getenv("GEMINI_MODEL", "gemini-3.5-flash")

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

