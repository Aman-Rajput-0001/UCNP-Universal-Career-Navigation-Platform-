"""
Authoritative Eligibility Rules Engine.
Kept separate from general AI generation to prevent LLMs from freely inventing
statutory, licensing, or academic requirements.
"""

from typing import List, Dict, Any, Optional
from app.schemas.career import EligibilityStatusColor, EligibilityCheckResponse

# Authoritative career rules dictionary
CAREER_RULES: Dict[str, Dict[str, Any]] = {
    # 1. Regulated / Licensed Professions (RED unless strict degrees exist)
    "doctor": {
        "qualification_requirements": "Mandatory MBBS / MD from an accredited medical council, plus valid medical council registration/license.",
        "statutory_barrier": True,
        "required_education_keywords": ["mbbs", "md", "medical degree"],
        "min_level": "specialized_medical",
        "additional_requirements": ["Clinical Internship", "State Medical Council Registration", "Residency Training"],
    },
    "surgeon": {
        "qualification_requirements": "Mandatory MBBS + MS / DNB in Surgery, along with surgical licensing board accreditation.",
        "statutory_barrier": True,
        "required_education_keywords": ["ms", "mch", "dnb surgery", "mbbs"],
        "min_level": "specialized_medical",
        "additional_requirements": ["Surgical Residency", "Board Certification", "Hospital Clinical Privileges"],
    },
    "lawyer": {
        "qualification_requirements": "Mandatory LL.B. (3-year or 5-year integrated law degree) and Bar Council enrollment.",
        "statutory_barrier": True,
        "required_education_keywords": ["llb", "b.a. llb", "bba llb", "law degree"],
        "min_level": "law_degree",
        "additional_requirements": ["All India Bar Examination (AIBE) / Bar Council Enrollment", "Court Practice Apprenticeship"],
    },
    "advocate": {
        "qualification_requirements": "LL.B. degree recognized by the Bar Council + state Bar enrollment.",
        "statutory_barrier": True,
        "required_education_keywords": ["llb", "law"],
        "min_level": "law_degree",
        "additional_requirements": ["Bar Council Enrollment Certificate", "Moot Court / Chamber Experience"],
    },
    "chartered accountant": {
        "qualification_requirements": "ICAI / ACCA accreditation: Foundation, Intermediate, Articleship (practical training), and Final CA examinations.",
        "statutory_barrier": True,
        "required_education_keywords": ["ca", "icai", "acca"],
        "min_level": "professional_accounting",
        "additional_requirements": ["ICAI Final Examination", "3-Year Mandatory Articleship", "ICAI Membership"],
    },
    "civil structural engineer": {
        "qualification_requirements": "Accredited Bachelor of Engineering (B.E./B.Tech) in Civil Engineering; Chartered Engineer or Professional Engineer (PE) stamp required for municipal plan signoffs.",
        "statutory_barrier": True,
        "required_education_keywords": ["b.tech civil", "b.e. civil", "civil engineering"],
        "min_level": "civil_btech",
        "additional_requirements": ["Structural Design Certifications (STAAD/ETABS)", "Site Supervised Experience"],
    },

    # 2. Skill-first / Tech / Digital Professions (GREEN if foundation exists, YELLOW if bridge/portfolio needed)
    "software": {
        "qualification_requirements": "No statutory licensing barrier. Industry prioritizes technical problem-solving, clean code, DSA, and verifiable GitHub projects.",
        "statutory_barrier": False,
        "required_education_keywords": ["bachelor", "diploma", "iti", "master", "skill-first", "12th", "10th"],
        "additional_requirements": ["Verified GitHub Portfolio", "Data Structures & Algorithms Proficiency", "Hands-on Full-Stack / Backend Project Deployment"],
    },
    "developer": {
        "qualification_requirements": "Open/skill-first entry. Technical competency, framework knowledge, and deployed application portfolio are decisive.",
        "statutory_barrier": False,
        "required_education_keywords": ["bachelor", "diploma", "iti", "master", "skill-first", "12th", "10th"],
        "additional_requirements": ["Version Control (Git)", "Live Project URL / Portfolio", "API Integration Experience"],
    },
    "data analyst": {
        "qualification_requirements": "Open entry across degrees or skill-first pathways. Strong proficiency in SQL, spreadsheet modeling, and BI dashboards.",
        "statutory_barrier": False,
        "required_education_keywords": ["bachelor", "diploma", "12th", "master", "skill-first"],
        "additional_requirements": ["SQL Querying Certificate / Practical Test", "Tableau or Power BI Portfolio Dashboard", "Real-world Dataset Case Study"],
    },
    "product designer": {
        "qualification_requirements": "Design case studies and user experience portfolio are the primary hiring criteria. No statutory degree mandate.",
        "statutory_barrier": False,
        "required_education_keywords": ["bachelor", "diploma", "12th", "master", "skill-first", "10th"],
        "additional_requirements": ["Figma Portfolio with 2-3 End-to-End Case Studies", "User Research & Usability Testing Proof"],
    },
    "ui/ux": {
        "qualification_requirements": "Portfolio-centric. Verifiable UX problem-solving and wireframes.",
        "statutory_barrier": False,
        "required_education_keywords": ["bachelor", "diploma", "12th", "master", "skill-first"],
        "additional_requirements": ["Design System Knowledge", "Figma Prototypes"],
    },
    "robotics": {
        "qualification_requirements": "Polytechnic Diploma, ITI, or B.Tech in Mechanical, Mechatronics, or Electrical is standard. Practical PLC/robotics lab certification can bridge gaps.",
        "statutory_barrier": False,
        "required_education_keywords": ["mechanical", "electrical", "mechatronics", "robotics", "diploma", "b.tech"],
        "additional_requirements": ["PLC & SCADA Hands-on Training", "Robotics Controller Simulation Projects", "Industrial Safety Protocols"],
    },
    "automation": {
        "qualification_requirements": "Engineering diploma or certificate in industrial automation.",
        "statutory_barrier": False,
        "required_education_keywords": ["mechanical", "electrical", "mechatronics", "diploma", "b.tech"],
        "additional_requirements": ["Hardware-in-the-loop simulation", "PLC Ladder Logic Proficiency"],
    },
    "operations": {
        "qualification_requirements": "Accessible across all educational levels (10th/12th/Diploma/Bachelors) with strong communication and problem-solving skills.",
        "statutory_barrier": False,
        "required_education_keywords": ["10th", "12th", "diploma", "bachelor", "master"],
        "additional_requirements": ["Business Communication", "CRM / ERP Tool Familiarity"],
    },
    "product manager": {
        "qualification_requirements": "No strict statutory degree requirement. Cross-functional leadership, user empathy, PRD writing, and technical-business bridging are paramount.",
        "statutory_barrier": False,
        "required_education_keywords": ["bachelor", "master", "mba", "b.tech", "bba"],
        "additional_requirements": ["Product Teardown / Case Study Portfolio", "Wireframing & PRD Spec Documentation", "Product Analytics (Mixpanel/Amplitude/SQL)"],
    },
    "government": {
        "qualification_requirements": "Recognized Bachelor's Degree from an accredited university. Mandatory competitive entrance examination (e.g., UPSC, SSC, State PSC, or Banking exams) plus age eligibility limits.",
        "statutory_barrier": True,
        "required_education_keywords": ["bachelor", "degree", "graduate", "master"],
        "additional_requirements": ["Civil Services / Public Exam Merit Rank", "Interview & Background Verification", "Age Criteria Adherence (typically 21-32 yrs)"],
    },
}


def evaluate_eligibility(
    career_name: str,
    education: str,
    degree: str = "",
    branch: str = "",
    skills: Optional[List[str]] = None,
) -> EligibilityCheckResponse:
    skills = skills or []
    career_lower = career_name.lower().strip()
    education_full = f"{education} {degree} {branch}".lower().strip()

    # Find matching rule in authoritative rules dictionary
    matched_rule_key = None
    for key in CAREER_RULES:
        if key in career_lower:
            matched_rule_key = key
            break

    # If no rule matched, apply a default general rule
    rule = CAREER_RULES.get(matched_rule_key) if matched_rule_key else {
        "qualification_requirements": "General professional track. Hiring typically requires relevant skills, projects, and educational foundation.",
        "statutory_barrier": False,
        "required_education_keywords": ["bachelor", "diploma", "master"],
        "additional_requirements": ["Domain Certifications", "Verifiable Practical Work / Portfolio"],
    }

    statutory = rule.get("statutory_barrier", False)
    req_keywords = rule.get("required_education_keywords", [])
    qual_text = rule["qualification_requirements"]
    add_reqs = rule.get("additional_requirements", [])

    # Case 1: Statutory / Regulated profession (Doctor, Lawyer, CA, etc.)
    if statutory:
        has_statutory_degree = any(kw in education_full for kw in req_keywords)
        if has_statutory_degree:
            return EligibilityCheckResponse(
                status=EligibilityStatusColor.YELLOW,
                qualification_requirements=qual_text,
                additional_requirements=add_reqs,
                missing_requirements=add_reqs,
                explanation=f"Your background indicates an accredited degree foundation, but statutory council examinations and licenses are strictly required before practicing as a {career_name}.",
            )
        else:
            return EligibilityCheckResponse(
                status=EligibilityStatusColor.RED,
                qualification_requirements=qual_text,
                additional_requirements=add_reqs,
                missing_requirements=[f"Mandatory formal qualification ({', '.join(req_keywords).upper()})", "Statutory Council Registration"],
                explanation=f"Cannot practice as a {career_name} without formal statutory accreditation. Degrees and government-recognized licenses are mandatory by law and cannot be bypassed through skill-first roadmaps.",
            )

    # Case 2: Open / Skill-first / Tech / Industry profession
    # Check if education background directly matches standard expectations
    has_relevant_edu = any(kw in education_full for kw in req_keywords)
    has_skills = len(skills) > 0

    if has_relevant_edu and has_skills:
        # Check if they have major skills
        missing = [req for req in add_reqs if not any(kw.lower() in " ".join(skills).lower() for kw in req.lower().split()[:2])]
        if not missing:
            return EligibilityCheckResponse(
                status=EligibilityStatusColor.GREEN,
                qualification_requirements=qual_text,
                additional_requirements=add_reqs,
                missing_requirements=[],
                explanation=f"Directly accessible. Your current profile ({education} {degree} {branch}) meets the typical educational and skill baseline for entry into {career_name}.",
            )
        else:
            return EligibilityCheckResponse(
                status=EligibilityStatusColor.YELLOW,
                qualification_requirements=qual_text,
                additional_requirements=add_reqs,
                missing_requirements=missing,
                explanation=f"Accessible with upskilling. While your formal background is aligned, targeted portfolio proof ({', '.join(missing[:2])}) is needed to secure competitive entry.",
            )

    # Non-traditional or open route
    return EligibilityCheckResponse(
        status=EligibilityStatusColor.YELLOW,
        qualification_requirements=qual_text,
        additional_requirements=add_reqs,
        missing_requirements=add_reqs,
        explanation=f"Possible through alternative route. There is no statutory degree mandate for {career_name}, but you must build verifiable proof of work and complete required practical competencies.",
    )

