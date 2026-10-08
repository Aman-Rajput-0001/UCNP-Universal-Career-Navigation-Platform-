from typing import Protocol, List, Optional
from app.schemas.market_trends import (
    MarketTrendsRequest,
    MarketTrendsResponse,
    MarketTrendItem,
    InDemandSkillItem,
    OccupationChangeItem,
    FutureSkillItem,
)


class MarketTrendsProviderProtocol(Protocol):
    """
    Authoritative service interface for Market Trends, In-Demand Skills,
    Occupation Changes, and Future Skills.
    External data providers (e.g., Burning Glass/Lightcast, BLS, O*NET, World Economic Forum,
    LinkedIn Economic Graph, or live labor market aggregators) will implement this protocol.
    """

    def fetch_market_trends(self, request: MarketTrendsRequest) -> MarketTrendsResponse:
        """Fetch market trends, in-demand skills, occupation shifts, and future skills."""
        ...


class StaticDemoMarketTrendsProvider:
    """
    Modular reference provider implementing MarketTrendsProviderProtocol with
    clearly labeled demo/static industry benchmark archetypes.
    Does not pretend demo data is live market data.
    """

    def fetch_market_trends(self, request: MarketTrendsRequest) -> MarketTrendsResponse:
        focus = (request.career_focus or "Technology & Software").strip()
        focus_lower = focus.lower()

        # Archetype 1: AI / Data / Machine Learning
        if any(k in focus_lower for k in ["data", "ai", "machine learning", "ml", "analytics"]):
            market_trends = [
                MarketTrendItem(
                    id="trend-data-01",
                    title="From Experimental ML to Production Agentic Systems & MLOps",
                    direction="Rising",
                    impact_level="Critical",
                    time_horizon="1 - 3 Years",
                    summary="Enterprises are pivoting from isolated proof-of-concept models to production-hardened compound AI systems, agentic tool workflows, and rigorous data quality governance.",
                    key_drivers=[
                        "High cost of unmonitored model inference and GPU infrastructure",
                        "Requirement for deterministic data pipelines feeding Retrieval-Augmented Generation (RAG)",
                        "Enterprise demand for autonomous agents operating with verified tool contracts",
                    ],
                    affected_sectors=["Cloud Software", "FinTech", "Healthcare Informatics", "Autonomous Supply Chain"],
                ),
                MarketTrendItem(
                    id="trend-data-02",
                    title="Real-Time Streaming & Semantic Layer Consolidation",
                    direction="Transforming",
                    impact_level="High",
                    time_horizon="2 - 4 Years",
                    summary="Batch-only ELT architectures are being complemented with streaming pipelines (Kafka/Flink) and unified semantic layers for real-time analytics.",
                    key_drivers=[
                        "Demand for sub-second fraud detection and pricing engines",
                        "Standardization around open table formats (Apache Iceberg, Delta Lake)",
                    ],
                    affected_sectors=["E-Commerce", "Algorithmic Finance", "Smart Logistics"],
                ),
                MarketTrendItem(
                    id="trend-data-03",
                    title="Rigorous Data Privacy, Lineage & Synthetic Data Compliance",
                    direction="Rising",
                    impact_level="High",
                    time_horizon="1 - 2 Years",
                    summary="Strict global AI regulations (EU AI Act, GDPR, HIPAA) require transparent training data lineage and increased adoption of privacy-preserving synthetic data.",
                    key_drivers=["Regulatory compliance mandates", "IP and data ownership litigation risks"],
                    affected_sectors=["Healthcare", "Legal Tech", "Banking"],
                ),
            ]

            in_demand_skills = [
                InDemandSkillItem(
                    id="skill-data-01",
                    name="Data Pipeline Engineering & Distributed Compute",
                    category="Technical",
                    demand_intensity="Very High",
                    growth_rate_label="+38% Benchmark Growth Index",
                    typical_roles=["Data Engineer", "MLOps Engineer", "Analytics Architect"],
                    recommended_tools=["Apache Spark", "Databricks", "dbt", "PostgreSQL", "BigQuery"],
                ),
                InDemandSkillItem(
                    id="skill-data-02",
                    name="Compound AI Orchestration & Evaluation",
                    category="Technical",
                    demand_intensity="Very High",
                    growth_rate_label="+65% Benchmark Emerging Index",
                    typical_roles=["AI Engineer", "Applied ML Scientist"],
                    recommended_tools=["LangChain/LangGraph", "LlamaIndex", "FastAPI", "Vector DBs"],
                ),
                InDemandSkillItem(
                    id="skill-data-03",
                    name="Data Observability & Quality Telemetry",
                    category="Analytical",
                    demand_intensity="High",
                    growth_rate_label="+24% Benchmark Growth Index",
                    typical_roles=["Data Platform Engineer", "Analytics Engineer"],
                    recommended_tools=["Great Expectations", "Monte Carlo", "Prometheus", "OpenTelemetry"],
                ),
            ]

            occupation_changes = [
                OccupationChangeItem(
                    id="occ-data-01",
                    occupation_title="Data Analyst",
                    evolution_type="Transforming",
                    automation_exposure="Moderate (routine queries augmented by generative agents)",
                    emerging_responsibilities=[
                        "Validating automated AI-synthesized business hypotheses",
                        "Managing semantic data models and metric governance",
                        "Deep cross-functional stakeholder storytelling and strategic guidance",
                    ],
                    declining_responsibilities=[
                        "Manual spreadsheet copy-pasting and repetitive weekly formula generation",
                        "Routine boilerplate SQL slice-and-dice requests",
                    ],
                    upskilling_path="Transition toward Analytics Engineering (dbt, Git, SQL data testing) or Domain Strategist.",
                ),
                OccupationChangeItem(
                    id="occ-data-02",
                    occupation_title="Machine Learning Engineer",
                    evolution_type="Expanding",
                    automation_exposure="Low (scope expanding into platform reliability and agent governance)",
                    emerging_responsibilities=[
                        "Latency optimization for LLM model serving and quantization",
                        "Designing multi-agent safety sandboxes and token budget guardrails",
                        "Fine-tuning domain-specific Small Language Models (SLMs)",
                    ],
                    declining_responsibilities=[
                        "Writing bespoke training loops from scratch for standard computer vision/NLP tasks",
                    ],
                    upskilling_path="Specialize in Systems/Hardware-accelerated AI engineering or Enterprise AI Governance.",
                ),
            ]

            future_skills = [
                FutureSkillItem(
                    id="fut-data-01",
                    name="Autonomous Multi-Agent Architecture & Tool Integration",
                    maturity_stage="Early Adopter",
                    readiness_urgency="Learn Now",
                    why_it_matters="Complex enterprise workflows will be performed by networks of specialized collaborating agents operating with human-in-the-loop oversight.",
                    learning_approach="Build small deterministic multi-agent graphs with state machines, verifiable schemas, and rollback mechanisms.",
                    prerequisite_foundations=["Async Python", "REST/gRPC APIs", "State Machines", "Vector Indexing"],
                ),
                FutureSkillItem(
                    id="fut-data-02",
                    name="Edge-Native & Privacy-Preserving Machine Learning",
                    maturity_stage="Nascent",
                    readiness_urgency="Watch & Experiment",
                    why_it_matters="On-device models (mobile, IoT, embedded) reduce cloud dependency and guarantee zero data exfiltration for consumer privacy.",
                    learning_approach="Study ONNX runtime, model quantization (GGUF, TensorRT), and Apple CoreML/LiteRT runtimes.",
                    prerequisite_foundations=["C++ / Rust basics", "Linear Algebra", "Hardware Memory Profiling"],
                ),
            ]

        # Archetype 2: Design / UX / Creative
        elif any(k in focus_lower for k in ["design", "ui", "ux", "product design"]):
            market_trends = [
                MarketTrendItem(
                    id="trend-des-01",
                    title="AI-Assisted Spatial & Dynamic Component Prototyping",
                    direction="Rising",
                    impact_level="High",
                    time_horizon="1 - 3 Years",
                    summary="Designers are shifting from static 2D screen drawing to prompt-driven interactive components, spatial computing interfaces, and design systems with live code synchronization.",
                    key_drivers=["Adoption of design tokens syncing directly into React/SwiftUI codebases", "AI layout generation tools"],
                    affected_sectors=["Consumer SaaS", "Spatial Computing", "Automotive UI"],
                ),
                MarketTrendItem(
                    id="trend-des-02",
                    title="Universal Accessibility & Inclusive Design Standards Mandates",
                    direction="Rising",
                    impact_level="Critical",
                    time_horizon="1 - 2 Years",
                    summary="Global digital accessibility legislation (European Accessibility Act 2025, ADA Title II) enforces strict compliance across all consumer digital experiences.",
                    key_drivers=["Enforceable legal compliance deadlines", "Broader assistive technology adoption"],
                    affected_sectors=["E-Commerce", "Government Portals", "FinTech"],
                ),
            ]

            in_demand_skills = [
                InDemandSkillItem(
                    id="skill-des-01",
                    name="Design System Architecture & Token Engineering",
                    category="Technical",
                    demand_intensity="Very High",
                    growth_rate_label="+31% Benchmark Growth Index",
                    typical_roles=["Product Designer", "Design Systems Lead", "DesignOps Engineer"],
                    recommended_tools=["Figma Variables", "Tokens Studio", "Storybook", "Zeroheight"],
                ),
                InDemandSkillItem(
                    id="skill-des-02",
                    name="Quantitative UX Research & Telemetry Analysis",
                    category="Analytical",
                    demand_intensity="High",
                    growth_rate_label="+22% Benchmark Growth Index",
                    typical_roles=["UX Researcher", "Product Designer"],
                    recommended_tools=["Mixpanel", "Hotjar", "UserTesting", "Maze"],
                ),
            ]

            occupation_changes = [
                OccupationChangeItem(
                    id="occ-des-01",
                    occupation_title="UI / Visual Designer",
                    evolution_type="Transforming",
                    automation_exposure="High (static graphic assets and icons automated by generative tools)",
                    emerging_responsibilities=[
                        "Micro-interaction choreography and generative dynamic theme systems",
                        "Deep user empathy evaluation and brand identity guardianship",
                    ],
                    declining_responsibilities=["Manual redlining and export of static icon assets"],
                    upskilling_path="Evolve into End-to-End Product Design with strong interaction and systems thinking.",
                )
            ]

            future_skills = [
                FutureSkillItem(
                    id="fut-des-01",
                    name="Adaptive Multimodal Interface Orchestration",
                    maturity_stage="Early Adopter",
                    readiness_urgency="Learn Now",
                    why_it_matters="Future user interfaces will blend voice, ambient visual suggestions, gaze tracking, and intent-aware layouts rather than static form inputs.",
                    learning_approach="Experiment with voice user interfaces (VUI), dynamic UI streaming, and accessibility screen reader heuristics.",
                    prerequisite_foundations=["Information Architecture", "Cognitive Load Principles", "WCAG 2.2 Guidelines"],
                )
            ]

        # Archetype 3: General Software Engineering & Tech
        else:
            market_trends = [
                MarketTrendItem(
                    id="trend-swe-01",
                    title="AI-Augmented Pair Programming & Elevated Verification Standards",
                    direction="Rising",
                    impact_level="Critical",
                    time_horizon="1 - 3 Years",
                    summary="With generative coding tools synthesizing boilerplate code in seconds, the software engineer's primary value has shifted toward architectural verification, security audits, and domain correctness.",
                    key_drivers=[
                        "Rapid proliferation of code synthesizers requiring rigorous code review",
                        "Elevated risk of subtle hallucinated bugs and supply chain vulnerabilities",
                    ],
                    affected_sectors=["Enterprise Software", "Cloud Infrastructure", "FinTech", "Cybersecurity"],
                ),
                MarketTrendItem(
                    id="trend-swe-02",
                    title="Platform Engineering, Internal Developer Platforms & FinOps",
                    direction="Transforming",
                    impact_level="High",
                    time_horizon="2 - 4 Years",
                    summary="Organizations are reducing cognitive load on product teams by building centralized developer platforms with automated guardrails, self-service infrastructure, and cloud cost telemetry.",
                    key_drivers=["Microservices complexity fatigue", "Cloud infrastructure budget scrutiny"],
                    affected_sectors=["Cloud Computing", "SaaS Enterprises", "Telecommunications"],
                ),
                MarketTrendItem(
                    id="trend-swe-03",
                    title="Zero-Trust Architecture & Software Supply Chain Security",
                    direction="Rising",
                    impact_level="High",
                    time_horizon="1 - 3 Years",
                    summary="Mandatory Software Bills of Materials (SBOMs), signed commits, and zero-trust networking are now baseline requirements across modern software delivery pipelines.",
                    key_drivers=["High-profile open-source dependency injection attacks", "Government security directives"],
                    affected_sectors=["Defense", "FinTech", "Enterprise Infrastructure"],
                ),
            ]

            in_demand_skills = [
                InDemandSkillItem(
                    id="skill-swe-01",
                    name="Cloud Native Architecture & Container Orchestration",
                    category="Technical",
                    demand_intensity="Very High",
                    growth_rate_label="+34% Benchmark Growth Index",
                    typical_roles=["Backend Engineer", "Platform Engineer", "Site Reliability Engineer"],
                    recommended_tools=["Docker", "Kubernetes", "Terraform", "AWS / GCP / Azure"],
                ),
                InDemandSkillItem(
                    id="skill-swe-02",
                    name="Application Security (AppSec) & Resilient Testing",
                    category="Technical",
                    demand_intensity="Very High",
                    growth_rate_label="+29% Benchmark Growth Index",
                    typical_roles=["Full Stack Engineer", "Security Engineer"],
                    recommended_tools=["Snyk", "SonarQube", "Jest / Pytest", "OAuth 2.1 / OIDC"],
                ),
                InDemandSkillItem(
                    id="skill-swe-03",
                    name="Distributed System Telemetry & Observability",
                    category="Technical",
                    demand_intensity="High",
                    growth_rate_label="+27% Benchmark Growth Index",
                    typical_roles=["Staff Engineer", "Backend Engineer"],
                    recommended_tools=["OpenTelemetry", "Datadog", "Grafana", "Prometheus"],
                ),
            ]

            occupation_changes = [
                OccupationChangeItem(
                    id="occ-swe-01",
                    occupation_title="Full Stack Software Engineer",
                    evolution_type="Expanding",
                    automation_exposure="Moderate (boilerplate CRUD generation automated; architectural rigor heightened)",
                    emerging_responsibilities=[
                        "Reviewing, debugging, and testing AI-assisted code contributions",
                        "Designing resilient distributed system boundaries and API contracts",
                        "Ensuring cross-service latency and zero-trust authentication",
                    ],
                    declining_responsibilities=[
                        "Writing repetitive CRUD endpoints and manual regex parsers by hand",
                        "Manual CSS cross-browser reset debugging",
                    ],
                    upskilling_path="Focus on Deep Systems Architecture, Domain Driven Design (DDD), and System Security.",
                ),
                OccupationChangeItem(
                    id="occ-swe-02",
                    occupation_title="Quality Assurance (QA) / Manual Tester",
                    evolution_type="Automating",
                    automation_exposure="Critical (pure manual clicking largely automated by autonomous testing agents)",
                    emerging_responsibilities=[
                        "Authoring chaos testing drills and failure injection scenarios",
                        "Reviewing edge-case adversarial attack vectors",
                        "Managing automated end-to-end synthetic user flows",
                    ],
                    declining_responsibilities=["Manual test script execution and routine visual bug regression checking"],
                    upskilling_path="Transition toward Software Development Engineer in Test (SDET) or Quality Architect.",
                ),
            ]

            future_skills = [
                FutureSkillItem(
                    id="fut-swe-01",
                    name="Agentic Development & Automated Specification Engineering",
                    maturity_stage="Early Adopter",
                    readiness_urgency="Learn Now",
                    why_it_matters="The highest-leverage software engineers will orchestrate fleets of specialized coding agents via precise specifications, formal contracts, and automated verification suites.",
                    learning_approach="Practice writing unambiguous RFC specifications, formal interface contracts, and property-based test suites.",
                    prerequisite_foundations=["Clean Architecture", "API Design", "Integration Testing", "Git Workflow"],
                ),
                FutureSkillItem(
                    id="fut-swe-02",
                    name="Post-Quantum Cryptography & Zero-Knowledge Proofs (ZKP)",
                    maturity_stage="Nascent",
                    readiness_urgency="Future Horizon",
                    why_it_matters="National NIST quantum-resistant standards are phasing out RSA/ECC, while ZKP enables mathematical verification without exposing private data.",
                    learning_approach="Study NIST post-quantum migration standards (ML-KEM, SLH-DSA) and identity verification protocols.",
                    prerequisite_foundations=["Applied Cryptography", "Number Theory", "Security Protocols"],
                ),
            ]

        return MarketTrendsResponse(
            career_focus=focus,
            data_source_mode="DEMO_BLUEPRINT_STATIC",
            is_live_data=False,
            market_trends=market_trends,
            in_demand_skills=in_demand_skills,
            occupation_changes=occupation_changes,
            future_skills=future_skills,
            disclaimer="[DEMO BENCHMARK DATA] Market trends and future skill models represent curated industry benchmark archetypes for educational planning. This module does not claim to stream live scraped labor exchange feeds. An authoritative external data adapter can be plugged into the service interface.",
        )


class MarketTrendsService:
    """
    Main modular service handling Market Trends, In-Demand Skills,
    Occupation Changes, and Future Skills.
    Accepts an interchangeable provider implementing MarketTrendsProviderProtocol.
    """

    def __init__(self, provider: Optional[MarketTrendsProviderProtocol] = None):
        self._provider = provider or StaticDemoMarketTrendsProvider()

    def set_provider(self, provider: MarketTrendsProviderProtocol) -> None:
        """Allow runtime injection of external authoritative live data providers."""
        self._provider = provider

    def get_market_trends(self, request: MarketTrendsRequest) -> MarketTrendsResponse:
        return self._provider.fetch_market_trends(request)


default_market_trends_service = MarketTrendsService()

