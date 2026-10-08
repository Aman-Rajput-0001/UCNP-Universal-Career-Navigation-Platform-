from typing import List, Optional
from app.schemas.pathway import (
    InternshipModel,
    EntryRoleModel,
    CareerStageModel,
    CareerPathwayRequest,
    CareerPathwayResponse,
    CareerGrowthRequest,
    CareerGrowthResponse,
)


class CareerPathwayService:
    """
    Service generating structured career progression:
    Skills → Projects → Portfolio → Resume → Internship → Entry-level role → Career growth.
    No scraping; uses verified industry archetype patterns clearly labeled as Demo / Benchmark blueprints.
    No unrealistic guaranteed salary or job claims.
    """

    def generate_career_stages(self, career_name: str, candidate_skills: Optional[List[str]] = None) -> List[CareerStageModel]:
        career = career_name.strip()
        career_lower = career.lower()
        candidate_skills = candidate_skills or []

        # Domain-tuned specializations, skills and upskilling tracks
        if any(k in career_lower for k in ["data", "ml", "ai", "machine learning"]):
            # Stage 1: Entry
            s1 = CareerStageModel(
                stage_level=1,
                role_type="entry",
                stage_name=f"Entry-Level {career} (Associate)",
                experience_expectations="0 - 2 Years",
                years_of_experience="0 - 2 Years",
                expected_capabilities=[
                    "Executes data extraction, transformation, and SQL query optimization",
                    "Conducts exploratory data analysis (EDA) and builds dashboard visual metrics",
                    "Assists senior engineers in deploying data pipelines and machine learning prototypes",
                ],
                skills_required_for_next_stage=[
                    "Distributed Data Processing (Apache Spark / Databricks)",
                    "Data Warehouse Architecture (BigQuery / Snowflake)",
                    "CI/CD for Data & ML Pipelines (Airflow / Prefect)",
                    "Production API Containerization (Docker / FastAPI)",
                ],
                possible_specialization=[
                    "Analytics Engineering & Semantic Layering",
                    "Batch & Streaming Data Pipelines",
                    "Foundational MLOps & Model Deployment",
                ],
                upskilling_recommendations=[
                    "Complete hands-on Databricks or BigQuery Associate Data Engineer credential",
                    "Build an automated end-to-end ELT pipeline with dbt, Airflow, and Postgres",
                    "Practice writing complex window functions and performance profiling",
                ],
                management_track_notes="Focus at this stage should remain on strong technical fundamentals and predictable execution.",
                target_compensation_range="Standard Market Benchmark: $65,000 - $88,000 (illustrative only, location-dependent)",
                key_promotion_milestones=[
                    "Ship production data pipeline without regressions or schema breakage",
                    "Deliver trusted automated dashboards used by business decision-makers",
                ],
            )
            # Stage 2: Mid
            s2 = CareerStageModel(
                stage_level=2,
                role_type="mid",
                stage_name=f"Mid-Level {career}",
                experience_expectations="2 - 5 Years",
                years_of_experience="2 - 5 Years",
                expected_capabilities=[
                    "Owns end-to-end data schemas, feature stores, or predictive model services",
                    "Diagnoses system latency, memory leaks, and pipeline SLA bottlenecks",
                    "Mentors junior engineers and conducts peer code reviews for standards compliance",
                ],
                skills_required_for_next_stage=[
                    "Large-Scale System Architecture & Distributed Consensus",
                    "High-Throughput Streaming (Kafka / Flink)",
                    "Cloud Infrastructure as Code (Terraform / Kubernetes)",
                    "Business Domain Acumen & Metric Governance",
                ],
                possible_specialization=[
                    "Deep Learning / Large Language Model (LLM) Systems",
                    "Real-Time Event-Driven Streaming Architectures",
                    "Data Governance, Security & Lineage Compliance",
                ],
                upskilling_recommendations=[
                    "Architect multi-tenant event streaming pipelines with Kafka and Redis",
                    "Complete cloud professional data engineer or machine learning certification",
                    "Deliver technical brownbags on schema registry migration or feature caching",
                ],
                management_track_notes="Can explore tech lead responsibilities, task estimation, and junior engineer mentoring.",
                target_compensation_range="Standard Market Benchmark: $95,000 - $130,000 (illustrative only)",
                key_promotion_milestones=[
                    "Lead multi-sprint architectural revamp reducing query execution cost by >30%",
                    "Drive zero-downtime database and pipeline migrations",
                ],
            )
            # Stage 3: Senior
            s3 = CareerStageModel(
                stage_level=3,
                role_type="senior",
                stage_name=f"Senior {career}",
                experience_expectations="5 - 8 Years",
                years_of_experience="5 - 8 Years",
                expected_capabilities=[
                    "Formulates cross-team technical design documents (RFCs) for high-scale data systems",
                    "Partners directly with product managers to define quantitative objectives and KPIs",
                    "Improves org-wide reliability, observability, and automated disaster recovery",
                ],
                skills_required_for_next_stage=[
                    "Multi-Team Engineering Strategy & Technical Roadmapping",
                    "Org-Wide System Trade-off Evaluation (CAP Theorem / FinOps)",
                    "Executive Presentation & Technical Advocacy",
                    "Cross-Functional Resource Allocation",
                ],
                possible_specialization=[
                    "Staff Research / MLOps Infrastructure Principal",
                    "Enterprise Data Platform Architecture",
                    "AI Safety, Governance & Regulatory Compliance",
                ],
                upskilling_recommendations=[
                    "Spearhead an open-source technical RFC or multi-region disaster recovery rollout",
                    "Study software architecture trade-offs, FinOps cloud cost optimization",
                    "Lead company-wide technical interviewing and syllabus calibration",
                ],
                management_track_notes="Senior level is the primary branching point between Staff/Principal Specialist track and Engineering Management track.",
                target_compensation_range="Standard Market Benchmark: $135,000 - $185,000 (illustrative only)",
                key_promotion_milestones=[
                    "Deliver multi-quarter system consolidation supporting 10x traffic increase",
                    "Champion high-availability SLA uptime exceeding 99.9%",
                ],
            )
            # Stage 4: Specialist / Lead
            s4 = CareerStageModel(
                stage_level=4,
                role_type="specialist_lead",
                stage_name=f"Staff Specialist / Technical Lead ({career})",
                experience_expectations="8+ Years",
                years_of_experience="8+ Years",
                expected_capabilities=[
                    "Steers org-wide architectural vision, evaluating major technology adoptions",
                    "Acts as highest escalation point for distributed systems outages and data corruption",
                    "Authors industry publications, patents, or core open-source frameworks",
                ],
                skills_required_for_next_stage=[
                    "Enterprise-Wide Technology Governance & Due Diligence",
                    "Multi-Organization Technical Strategy",
                    "Executive Technical Advisory & Board Engagement",
                ],
                possible_specialization=[
                    "Principal Data Architect / Fellow",
                    "AI/ML Platform Research Specialist",
                    "Global Infrastructure & FinOps Director",
                ],
                upskilling_recommendations=[
                    "Partner with executive leaders on 3-year cloud migration roadmap",
                    "Author institutional playbooks on AI risk management and data residency",
                    "Sponsor company-wide engineering summits and community practices",
                ],
                management_track_notes="Individual Contributor (IC) track summit. Equivalent in scope to Engineering Director without direct HR line management.",
                target_compensation_range="Standard Market Benchmark: $185,000 - $250,000+ (illustrative only)",
                key_promotion_milestones=[
                    "Lead transformation resulting in multi-million dollar infra savings or new product line",
                    "Mentor 3+ senior engineers into lead and staff roles",
                ],
            )
            # Stage 5: Management Possibility
            s5 = CareerStageModel(
                stage_level=5,
                role_type="management",
                stage_name=f"Management Track: Engineering Manager / Data Director",
                experience_expectations="7 - 10+ Years",
                years_of_experience="7 - 10+ Years",
                expected_capabilities=[
                    "Builds, hires, and retains high-performing cross-functional engineering squads",
                    "Translates executive business goals into actionable team deliverables and sprint roadmaps",
                    "Manages budget, headcount, performance reviews, and career ladders for engineers",
                ],
                skills_required_for_next_stage=[
                    "Strategic Org Design & Succession Planning",
                    "P&L and CapEx/OpEx Budget Management",
                    "Executive Board Communication & Stakeholder Alignment",
                ],
                possible_specialization=[
                    "Head of Data & AI Platform",
                    "Director of Enterprise Engineering",
                    "VP of Product Engineering",
                ],
                upskilling_recommendations=[
                    "Complete engineering leadership and people management masterclasses",
                    "Practice 1-on-1 career coaching frameworks, SBI feedback models, and conflict resolution",
                    "Drive agile transformation and cross-department OKR prioritization",
                ],
                management_track_notes="Transitioning from Senior Engineer to EM trades hands-on coding for people growth, organizational velocity, and strategic business delivery.",
                target_compensation_range="Standard Market Benchmark: $170,000 - $240,000+ (illustrative only)",
                key_promotion_milestones=[
                    "Grow engineering retention to top industry percentile with high engagement",
                    "Consistently deliver key strategic company initiatives on schedule and within budget",
                ],
            )
        elif any(k in career_lower for k in ["design", "ui", "ux", "product design"]):
            # Stage 1: Entry
            s1 = CareerStageModel(
                stage_level=1,
                role_type="entry",
                stage_name=f"Junior / Associate {career}",
                experience_expectations="0 - 2 Years",
                years_of_experience="0 - 2 Years",
                expected_capabilities=[
                    "Creates high-fidelity mockups, responsive layouts, and interactive wireframes",
                    "Participates in user research observation and usability testing synthesis",
                    "Maintains component libraries following existing design tokens",
                ],
                skills_required_for_next_stage=[
                    "End-to-End Design Systems Management",
                    "Advanced User Journey Mapping & Heuristic Evaluation",
                    "Interactive Prototyping (Figma Variables / Framer)",
                    "Data-Informed UX (Mixpanel / Hotjar analytics)",
                ],
                possible_specialization=[
                    "Visual & Design System Specialist",
                    "User Research & Usability Analyst",
                    "Product Interaction & Motion Designer",
                ],
                upskilling_recommendations=[
                    "Build a published Figma design system with tokens, variants, and auto-layout",
                    "Conduct 5 recorded user interviews and publish an end-to-end case study",
                    "Learn frontend fundamentals (HTML/CSS) to streamline developer handoff",
                ],
                management_track_notes="Focus at this stage on craft execution, user empathy, and feedback receptivity.",
                target_compensation_range="Standard Market Benchmark: $60,000 - $80,000 (illustrative only)",
                key_promotion_milestones=[
                    "Deliver production feature designs adopted by cross-functional squad without major redesigns",
                    "Contribute 10+ reusable components into core shared design system",
                ],
            )
            # Stage 2: Mid
            s2 = CareerStageModel(
                stage_level=2,
                role_type="mid",
                stage_name=f"Mid-Level {career}",
                experience_expectations="2 - 5 Years",
                years_of_experience="2 - 5 Years",
                expected_capabilities=[
                    "Owns entire product feature surfaces from discovery through validation and launch",
                    "Synthesizes quantitative metrics with qualitative feedback to drive UX decisions",
                    "Collaborates with engineering on feasibility and accessible design tokens (WCAG)",
                ],
                skills_required_for_next_stage=[
                    "Multi-Product Strategic Design Vision",
                    "Experimentation Frameworks & A/B Testing Roadmaps",
                    "Stakeholder Negotiation & Executive Storytelling",
                    "Omnichannel Design Architecture",
                ],
                possible_specialization=[
                    "Design Operations (DesignOps)",
                    "Enterprise B2B Workflow Architect",
                    "Accessibility & Inclusive Design Champion",
                ],
                upskilling_recommendations=[
                    "Lead an A/B test redesign measuring measurable lift in conversion or retention",
                    "Complete certified accessibility evaluation (CPACC or equivalent standards)",
                    "Facilitate cross-functional design sprints with product and tech leads",
                ],
                management_track_notes="Can begin mentoring design apprentices and establishing design review rituals.",
                target_compensation_range="Standard Market Benchmark: $85,000 - $120,000 (illustrative only)",
                key_promotion_milestones=[
                    "Lead major feature design cycle driving measurable engagement uptick",
                    "Establish standardized developer-designer handoff specs across squads",
                ],
            )
            # Stage 3: Senior
            s3 = CareerStageModel(
                stage_level=3,
                role_type="senior",
                stage_name=f"Senior {career}",
                experience_expectations="5 - 8 Years",
                years_of_experience="5 - 8 Years",
                expected_capabilities=[
                    "Defines multi-quarter product design strategy and user research methodologies",
                    "Solves complex product ambiguities across web, mobile, and native platforms",
                    "Advocates for user needs at leadership tables to guide product roadmap priorities",
                ],
                skills_required_for_next_stage=[
                    "Brand & Ecosystem Strategic Design Architecture",
                    "Cross-Functional Executive Influence",
                    "Org-Wide Design Operations & Governance",
                    "Talent Coaching & Team Calibration",
                ],
                possible_specialization=[
                    "Principal Product Designer",
                    "Staff Design Systems Architect",
                    "Behavioral Science & Experience Strategist",
                ],
                upskilling_recommendations=[
                    "Author company-wide design principles and experience quality scorecards",
                    "Lead holistic customer journey overhaul across multiple legacy touchpoints",
                    "Mentor 2+ junior and mid designers through successful promotion cycles",
                ],
                management_track_notes="Primary fork between Principal/Staff Designer (craft path) and Design Manager / Head of Design (people path).",
                target_compensation_range="Standard Market Benchmark: $125,000 - $170,000 (illustrative only)",
                key_promotion_milestones=[
                    "Drive major product redesign impacting company retention and NPS metrics",
                    "Standardize enterprise design system adopted across 4+ product squads",
                ],
            )
            # Stage 4: Specialist / Lead
            s4 = CareerStageModel(
                stage_level=4,
                role_type="specialist_lead",
                stage_name=f"Staff Product Designer / Lead Architect ({career})",
                experience_expectations="8+ Years",
                years_of_experience="8+ Years",
                expected_capabilities=[
                    "High-leverage individual contributor setting holistic experience direction for business",
                    "Solves deeply technical UX problems (multi-tier permissions, workflows, offline sync)",
                    "Key external voice representing company's design brand at conferences and design summits",
                ],
                skills_required_for_next_stage=[
                    "Enterprise Business Model Alignment",
                    "Global UX Localization & Scalability Governance",
                    "C-Suite Design Evangelism",
                ],
                possible_specialization=[
                    "Principal Product Experience Fellow",
                    "Design Systems Infrastructure Lead",
                    "Emerging Interaction & Spatial Computing Lead",
                ],
                upskilling_recommendations=[
                    "Publish thought leadership articles on complex domain product architecture",
                    "Advise executive team on strategic acquisitions from an experience and brand perspective",
                    "Establish next-generation AI-assisted design tooling and workflows",
                ],
                management_track_notes="Staff IC track allows senior designers to maximize craft impact without people management overhead.",
                target_compensation_range="Standard Market Benchmark: $170,000 - $230,000+ (illustrative only)",
                key_promotion_milestones=[
                    "Pioneer flagship user experience that sets a new industry standard in the sector",
                ],
            )
            # Stage 5: Management Possibility
            s5 = CareerStageModel(
                stage_level=5,
                role_type="management",
                stage_name=f"Management Track: Product Design Manager / Head of Design",
                experience_expectations="7 - 10+ Years",
                years_of_experience="7 - 10+ Years",
                expected_capabilities=[
                    "Builds and nurtures multidisciplinary teams of UX, visual, and research professionals",
                    "Allocates design resources, manages agency vendors, and balances squad staffing",
                    "Creates psychological safety, design critique culture, and career progression pathways",
                ],
                skills_required_for_next_stage=[
                    "Executive Stakeholder Alignment & Budget Control",
                    "Cross-Department Organizational Strategy",
                    "Strategic Talent Acquisition & Brand Building",
                ],
                possible_specialization=[
                    "Director of Product Design",
                    "VP of User Experience",
                    "Chief Design Officer (CDO)",
                ],
                upskilling_recommendations=[
                    "Study design operations, team topology, and operational budget planning",
                    "Develop leadership mentoring, constructive critique, and executive communication mastery",
                    "Partner with VP of Product and VP of Engineering on company-level quarterly OKRs",
                ],
                management_track_notes="Transition into design leadership focuses on team enablement, hiring excellence, and cross-functional operational harmony.",
                target_compensation_range="Standard Market Benchmark: $160,000 - $225,000+ (illustrative only)",
                key_promotion_milestones=[
                    "Build a world-class design organization with zero unregretted attrition",
                    "Deliver unified cross-platform design standard recognized across the company",
                ],
            )
        else:
            # Stage 1: Entry Software Engineer / General Tech
            s1 = CareerStageModel(
                stage_level=1,
                role_type="entry",
                stage_name=f"Entry-Level {career} (Associate Engineer)",
                experience_expectations="0 - 2 Years",
                years_of_experience="0 - 2 Years",
                expected_capabilities=[
                    "Delivers well-scoped user stories and bug fixes with code review guidance",
                    "Writes automated unit and integration tests adhering to team standards",
                    "Collaborates in sprint planning, standups, and retrospective ceremonies",
                ],
                skills_required_for_next_stage=[
                    "System Architecture & API Design Patterns (REST, GraphQL, gRPC)",
                    "Cloud Infrastructure & Containerization (Docker, AWS/GCP, Kubernetes)",
                    "Database Optimization (Indexing, Caching, Concurrency)",
                    "CI/CD Pipeline Automation & Telemetry",
                ],
                possible_specialization=[
                    "Frontend & Modern Web Application Engineering",
                    "Backend Microservices & Distributed APIs",
                    "Full-Stack Web & Cloud Infrastructure",
                ],
                upskilling_recommendations=[
                    "Build and deploy a full-stack production application with CI/CD, tests, and telemetry",
                    "Complete cloud practitioner or developer associate certification",
                    "Master debugging with profilers and distributed tracing tools",
                ],
                management_track_notes="Focus at this stage on software craftsmanship, clean code practices, and velocity.",
                target_compensation_range="Standard Market Benchmark: $70,000 - $92,000 (illustrative only)",
                key_promotion_milestones=[
                    "Ship production feature independently with high test coverage and zero regression incidents",
                    "Earn team trust by actively resolving on-call triage tickets",
                ],
            )
            # Stage 2: Mid
            s2 = CareerStageModel(
                stage_level=2,
                role_type="mid",
                stage_name=f"Mid-Level {career} (Software Engineer)",
                experience_expectations="2 - 5 Years",
                years_of_experience="2 - 5 Years",
                expected_capabilities=[
                    "Owns full feature lifecycles from technical design doc to production monitoring",
                    "Identifies and refactors architectural bottlenecks, performance drains, and technical debt",
                    "Conducts insightful code reviews that raise engineering quality across the team",
                ],
                skills_required_for_next_stage=[
                    "Distributed Systems Resiliency & Fault Tolerance",
                    "High-Throughput Caching & Asynchronous Queue Architectures",
                    "Security, IAM, OAuth & Zero-Trust Best Practices",
                    "Cross-Team Technical Leadership & Mentorship",
                ],
                possible_specialization=[
                    "High-Performance Cloud & Backend Architecture",
                    "DevOps, Platform Engineering & SRE",
                    "Mobile & Cross-Platform Systems",
                ],
                upskilling_recommendations=[
                    "Author technical design documents (RFCs) for non-trivial service redesigns",
                    "Implement distributed rate limiting, queueing (RabbitMQ/SQS), and Redis caching",
                    "Mentor junior engineers and interns during their onboarding ramp",
                ],
                management_track_notes="Opportunity to run scrum ceremonies, lead sprint retros, and gauge interest in leadership.",
                target_compensation_range="Standard Market Benchmark: $95,000 - $135,000 (illustrative only)",
                key_promotion_milestones=[
                    "Deliver multi-sprint high-impact project on time with high availability",
                    "Optimize database queries and infrastructure costs for an existing critical service",
                ],
            )
            # Stage 3: Senior
            s3 = CareerStageModel(
                stage_level=3,
                role_type="senior",
                stage_name=f"Senior {career} (Senior Engineer)",
                experience_expectations="5 - 8 Years",
                years_of_experience="5 - 8 Years",
                expected_capabilities=[
                    "Architects scalable, decoupled microservices handling high concurrency and throughput",
                    "De-risks complex technical projects through prototyping and comprehensive RFC reviews",
                    "Drives engineering culture, reliability metrics (SLIs/SLOs), and post-mortem best practices",
                ],
                skills_required_for_next_stage=[
                    "Strategic Technical Roadmapping & Multi-Service Governance",
                    "High-Level Trade-off Analysis (Latency vs Consistency vs Cost)",
                    "Cross-Functional Leadership (Product, Security, Compliance)",
                    "Strategic Talent Development & Hiring Calibration",
                ],
                possible_specialization=[
                    "Platform & Infrastructure Architect",
                    "Distributed Data Systems Specialist",
                    "Application Security & Trust Engineering",
                ],
                upskilling_recommendations=[
                    "Lead cross-functional architecture overhaul mitigating major single-point-of-failure",
                    "Author and enforce company-wide API standards, security guardrails, and telemetry rules",
                    "Actively participate in hiring committees, tech interviewing, and bar-raising",
                ],
                management_track_notes="Primary fork: decide between Technical Lead / Staff Engineer (IC Track) or Engineering Manager (People Track).",
                target_compensation_range="Standard Market Benchmark: $135,000 - $190,000 (illustrative only)",
                key_promotion_milestones=[
                    "Design and execute zero-downtime database or platform migration across production",
                    "Directly mentor multiple mid-level engineers into senior roles",
                ],
            )
            # Stage 4: Specialist / Lead
            s4 = CareerStageModel(
                stage_level=4,
                role_type="specialist_lead",
                stage_name=f"Staff Specialist / Technical Lead ({career})",
                experience_expectations="8+ Years",
                years_of_experience="8+ Years",
                expected_capabilities=[
                    "Drives multi-year technical vision and systems architecture across multiple squads",
                    "Tackles the hardest, most ambiguous systemic engineering problems in the organization",
                    "Serves as trusted advisor to VP/CTO on technological strategy, security, and tooling",
                ],
                skills_required_for_next_stage=[
                    "Company-Wide Technology Strategy & Standard Formulation",
                    "Strategic Partner & Vendor Due Diligence",
                    "Executive Level Advisory & Board Presentations",
                ],
                possible_specialization=[
                    "Principal Systems Architect / Fellow",
                    "Global Platform & Infrastructure Strategist",
                    "Chief Architect",
                ],
                upskilling_recommendations=[
                    "Architect enterprise-scale platform unification saving six-figure cloud expenditure",
                    "Drive company-wide disaster recovery failover drill across multiple cloud regions",
                    "Represent organization at tier-1 tech conferences and open source working groups",
                ],
                management_track_notes="Highest technical IC level. Equal in influence and compensation to Engineering Director without direct reports.",
                target_compensation_range="Standard Market Benchmark: $190,000 - $265,000+ (illustrative only)",
                key_promotion_milestones=[
                    "Lead generational architecture overhaul enabling new business initiatives",
                ],
            )
            # Stage 5: Management Possibility
            s5 = CareerStageModel(
                stage_level=5,
                role_type="management",
                stage_name=f"Management Track: Engineering Manager / Director",
                experience_expectations="7 - 10+ Years",
                years_of_experience="7 - 10+ Years",
                expected_capabilities=[
                    "Recruits, mentors, and retains high-performing, inclusive software engineering teams",
                    "Balances technical roadmap, tech debt, and product feature delivery with product partners",
                    "Conducts performance evaluations, compensation planning, and team succession roadmaps",
                ],
                skills_required_for_next_stage=[
                    "Multi-Team Organizational Strategy & Scaling",
                    "Departmental P&L Budgeting & Resource Forecasting",
                    "Executive Stakeholder Alignment & Business Strategy",
                ],
                possible_specialization=[
                    "Director of Software Engineering",
                    "VP of Engineering",
                    "Head of Technology",
                ],
                upskilling_recommendations=[
                    "Master modern 1-on-1 coaching, situational leadership, and conflict resolution models",
                    "Partner with product and business leaders on quarterly OKR definition and resource allocation",
                    "Build transparent performance frameworks and engineering onboarding programs",
                ],
                management_track_notes="Transitioning to management pivots focus from code output to team velocity, retention, psychological safety, and organizational health.",
                target_compensation_range="Standard Market Benchmark: $175,000 - $250,000+ (illustrative only)",
                key_promotion_milestones=[
                    "Maintain high team retention and sustainable delivery cadence across consecutive quarters",
                    "Successfully promote multiple direct reports through senior engineering levels",
                ],
            )

        return [s1, s2, s3, s4, s5]

    def generate_career_growth(self, request: CareerGrowthRequest) -> CareerGrowthResponse:
        career = request.career_name.strip()
        stages = self.generate_career_stages(career, request.current_skills)

        return CareerGrowthResponse(
            career_name=career,
            entry_role=stages[0],
            mid_level_role=stages[1],
            senior_role=stages[2],
            specialist_lead_role=stages[3],
            management_possibility=stages[4],
            all_stages=stages,
            disclaimer="Notice: Career growth models represent industry benchmark progression standards. Compensation brackets are illustrative only and do not constitute guaranteed job offers or salary promises.",
        )

    def generate_pathway(self, request: CareerPathwayRequest) -> CareerPathwayResponse:
        career = request.career_name.strip()
        career_lower = career.lower()
        skills = request.candidate_skills or ["Core Domain Skills", "System Design", "Git & CI/CD"]

        # 1. Generate Internship Model
        if any(k in career_lower for k in ["data", "ml", "ai", "machine learning"]):
            internship = InternshipModel(
                id="intern-data-01",
                title=f"Junior {career} Intern",
                organization_type="Tech Product Startup / Analytics Consultancy",
                duration="3 - 6 Months",
                stipend_range="$1,200 - $2,500 / month (or equivalent local benchmark)",
                location_type="Remote / Hybrid",
                required_skills=skills[:3] + ["SQL Queries", "Data Wrangling"],
                learning_outcomes=[
                    "Production pipeline debugging and data quality monitoring",
                    "Feature engineering for active business metrics",
                    "Cross-functional collaboration with product and analytics stakeholders",
                ],
                conversion_potential="High (70%+ based on demonstrated initiative, code quality, and capstone project performance)",
                is_demo_blueprint=True,
            )
            entry_role = EntryRoleModel(
                id="role-data-01",
                title=f"Associate {career}",
                experience_level="0-1 Years (Entry-level / Trainee)",
                typical_salary_range="$65,000 - $85,000 / year (Standard Industry Benchmark)",
                key_responsibilities=[
                    "Develop, test, and maintain automated data models and ETL workflows",
                    "Collaborate on model evaluation, validation, and dashboard reporting",
                    "Conduct exploratory analysis to identify operational bottlenecks",
                ],
                minimum_qualifications="Demonstrated portfolio of end-to-end data pipelines or degree in technical field",
                interview_focus_areas=["SQL Problem Solving", "Data Modeling Case Study", "Python & Data Structures", "Communication"],
                is_demo_blueprint=True,
            )
        elif any(k in career_lower for k in ["design", "ui", "ux"]):
            internship = InternshipModel(
                id="intern-design-01",
                title=f"Product Design / UX Intern",
                organization_type="Design Agency / SaaS Platform",
                duration="3 - 6 Months",
                stipend_range="$1,000 - $2,200 / month",
                location_type="Remote / Flexible",
                required_skills=skills[:3] + ["Figma Components", "Wireframing"],
                learning_outcomes=[
                    "Conducting moderated user testing sessions and usability synthesis",
                    "Contributing to live production design tokens and component libraries",
                    "Participating in product design critiques and developer handoffs",
                ],
                conversion_potential="High (evaluated via case study depth and user empathy)",
                is_demo_blueprint=True,
            )
            entry_role = EntryRoleModel(
                id="role-design-01",
                title=f"Junior {career}",
                experience_level="0-1 Years",
                typical_salary_range="$60,000 - $78,000 / year",
                key_responsibilities=[
                    "Design responsive UI screens and interactive prototypes",
                    "Maintain design consistency according to existing design systems",
                    "Work with engineering to ensure high-fidelity implementation",
                ],
                minimum_qualifications="Verified portfolio containing at least 2 comprehensive end-to-end UX case studies",
                interview_focus_areas=["Portfolio Walkthrough", "Live Design Challenge", "Cross-functional Collaboration"],
                is_demo_blueprint=True,
            )
        else:
            internship = InternshipModel(
                id="intern-swe-01",
                title=f"Software Engineering Intern ({career})",
                organization_type="SaaS / Cloud Engineering Firm",
                duration="3 - 6 Months",
                stipend_range="$1,500 - $3,000 / month (or regional benchmark)",
                location_type="Remote / Hybrid",
                required_skills=skills[:3] + ["Git Version Control", "REST API Integration"],
                learning_outcomes=[
                    "Writing production-grade code reviewed by senior engineers",
                    "Navigating legacy codebases and writing unit/integration test suites",
                    "Participating in agile sprints, daily standups, and retrospective meetings",
                ],
                conversion_potential="High (75% conversion rate for interns who ship clean, tested feature PRs)",
                is_demo_blueprint=True,
            )
            entry_role = EntryRoleModel(
                id="role-swe-01",
                title=f"Associate {career}",
                experience_level="0-1 Years (Fresher / Career Transition)",
                typical_salary_range="$70,000 - $92,000 / year (Standard Industry Benchmark)",
                key_responsibilities=[
                    "Build, test, and deploy resilient application features and microservices",
                    "Fix production defects and optimize latency on customer-facing workflows",
                    "Write technical documentation and participate in team architecture reviews",
                ],
                minimum_qualifications="Verifiable proof-of-work project portfolio on GitHub, or degree in relevant discipline",
                interview_focus_areas=["Data Structures & Algorithms", "System Architecture Basics", "Live Coding / Take-home", "Culture & Behavioral STAR"],
                is_demo_blueprint=True,
            )

        # 2. Generate 5-Stage Career Growth Path (Entry -> Mid -> Senior -> Specialist/Lead -> Management)
        career_stages: List[CareerStageModel] = self.generate_career_stages(career, skills)

        return CareerPathwayResponse(
            career_name=career,
            internship=internship,
            entry_role=entry_role,
            career_stages=career_stages,
            progression_chain=[
                "Skills",
                "Projects",
                "Portfolio",
                "Resume",
                "Internship",
                "Entry-level role",
                "Career growth",
            ],
            disclaimer="[DEMO BLUEPRINT DATA] Curated archetype models based on hiring benchmarks. Not live scraped job postings. Compensation ranges are illustrative estimates and do not guarantee actual salary or job offers.",
        )


default_career_pathway_service = CareerPathwayService()


