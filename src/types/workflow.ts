import type { ReactNode } from 'react'
import type { Node, Edge } from '@xyflow/react'

export type NodeExecutionStatus = 'idle' | 'running' | 'success' | 'error'

export type NodeCategory =
  | 'input'
  | 'discovery'
  | 'analysis'
  | 'roadmap'
  | 'learning'
  | 'career'
  | 'action'

export interface WorkflowNodeData extends Record<string, unknown> {
  title: string
  description?: string
  category?: NodeCategory
  icon?: string | ReactNode
  status?: NodeExecutionStatus
  statusMessage?: string
  inputsCount?: number
  outputsCount?: number
  summaryItems?: { label: string; value: string }[]
}

export interface StudentProfileForm {
  education: string
  degree?: string
  branch?: string
  currentYear?: string
  skills: string
  interests: string
  strengths: string
  weaknesses: string
  careerGoal?: string
  availableTime?: string
}

export interface StudentProfileResponse {
  id: string
  education: string
  degree: string
  branch: string
  currentYear: string
  skills: string[]
  interests: string[]
  strengths: string[]
  weaknesses: string[]
  careerGoal: string
  availableTime: string
  isNormalized: boolean
}

export type EligibilityLevel = 'direct' | 'additional_requirements' | 'restricted'

export interface CareerDiscoveryItem {
  career_name: string
  match_reason: string
  eligibility_level: EligibilityLevel
  required_skills: string[]
  missing_skills: string[]
  qualification_requirements: string
  possible_entry_roles: string[]
}

export interface CareerDiscoveryResponse {
  careers: CareerDiscoveryItem[]
  summary?: string
}

export interface CareerDiscoveryNodeData extends WorkflowNodeData {
  careers?: CareerDiscoveryItem[]
  discoveredAt?: string
  selectedCareerIndex?: number
}

// Eligibility Checker DTOs & Types
export type EligibilityStatusColor = 'GREEN' | 'YELLOW' | 'RED'

export interface EligibilityCheckPayload {
  profile_id?: string
  career_name: string
  education: string
  degree?: string
  branch?: string
  skills?: string[]
}

export interface EligibilityCheckResponse {
  status: EligibilityStatusColor
  qualification_requirements: string
  additional_requirements: string[]
  missing_requirements: string[]
  explanation: string
}

export interface EligibilityCheckerNodeData extends WorkflowNodeData {
  targetCareer?: string
  eligibilityResult?: EligibilityCheckResponse
  checkedAt?: string
}

// Skill Gap Analysis DTOs & Types
export type SkillPriorityLevel = 'high' | 'medium' | 'low'

export interface PrioritySkillItem {
  skill_name: string
  priority: SkillPriorityLevel
  reason: string
}

export interface SkillGapPayload {
  profile_id?: string
  career_name: string
  current_skills: string[]
  required_skills?: string[]
}

export interface SkillGapResponse {
  matched_skills: string[]
  missing_skills: string[]
  priority_skills: PrioritySkillItem[]
  skill_level: string
  reason: string
}

export interface SkillGapAnalysisNodeData extends WorkflowNodeData {
  targetCareer?: string
  skillGapResult?: SkillGapResponse
  analyzedAt?: string
}

// Roadmap Step Types & DTOs
export type RoadmapStepType =
  | 'learning'
  | 'project'
  | 'certification'
  | 'internship'
  | 'portfolio'
  | 'interview'
  | 'job'

export interface RoadmapStep {
  id: string
  title: string
  type: RoadmapStepType
  description: string
  prerequisites: string[]
  skills: string[]
  estimated_duration: string
  projects: string[]
  resources: string[]
  completion_criteria: string
}

export interface RoadmapGeneratePayload {
  profile_id?: string
  profile?: {
    education: string
    degree?: string
    branch?: string
    currentYear?: string
    skills: string[]
    interests?: string[]
    strengths?: string[]
    weaknesses?: string[]
    careerGoal?: string
    availableTime?: string
  }
  selected_career: string
  eligibility_result?: EligibilityCheckResponse
  skill_gap_result?: SkillGapResponse
}

export interface RoadmapGenerateResponse {
  career_name: string
  total_estimated_duration: string
  summary: string
  steps: RoadmapStep[]
}

// Roadmap Dynamic Replanning DTOs
export interface RoadmapNewInformation {
  new_skills?: string[]
  updated_available_time?: string
  target_career?: string
  additional_notes?: string
}

export interface RoadmapReplanPayload {
  profile_id?: string
  current_profile?: {
    education: string
    degree?: string
    branch?: string
    currentYear?: string
    skills: string[]
    interests?: string[]
    strengths?: string[]
    weaknesses?: string[]
    careerGoal?: string
    availableTime?: string
  }
  current_roadmap: RoadmapStep[]
  completed_steps: string[]
  new_information?: RoadmapNewInformation
  target_career?: string
}

export interface RoadmapReplanResponse {
  career_name: string
  total_estimated_duration: string
  summary: string
  completed_steps: RoadmapStep[]
  remaining_steps: RoadmapStep[]
  all_steps: RoadmapStep[]
}

export type StepProgressStatus = 'not_started' | 'in_progress' | 'completed'

export interface ProgressUpdatePayload {
  roadmap_id: string
  career_name?: string
  step_id: string
  status: StepProgressStatus
  all_step_ids?: string[]
}

export interface RoadmapProgressData {
  roadmap_id: string
  career_name: string
  total_steps: number
  completed_steps_count: number
  in_progress_steps_count: number
  not_started_steps_count: number
  progress_percentage: number
  step_statuses: Record<string, StepProgressStatus>
  updated_at?: string
}

export interface AIRoadmapNodeData extends WorkflowNodeData {
  targetCareer?: string
  roadmapResult?: RoadmapGenerateResponse
  generatedAt?: string
  completedStepIds?: string[]
  replanSummary?: string
  progressData?: RoadmapProgressData
  progressPercentage?: number
}

export interface RoadmapStepNodeData extends WorkflowNodeData {
  stepId: string
  stepType: RoadmapStepType
  estimatedDuration: string
  skills: string[]
  projects: string[]
  resources: string[]
  completionCriteria: string
  prerequisites: string[]
  progressStatus?: StepProgressStatus
  roadmapId?: string
}

// Learning Recommendation Interfaces
export interface LearningRecommendationItem {
  skill_name: string
  what_to_learn: string[]
  learning_sequence: string[]
  estimated_time: string
  prerequisite_knowledge: string[]
  practice_recommendation: string
}

export interface LearningRecommendationPayload {
  career_name: string
  skills: string[]
  current_skills?: string[]
  available_time?: string
}

export interface LearningRecommendationResponse {
  career_name: string
  learning_recommendations: LearningRecommendationItem[]
  summary: string
}

export interface LearningNodeData extends WorkflowNodeData {
  targetCareer?: string
  targetSkills?: string[]
  learningRecommendations?: LearningRecommendationItem[]
  generatedAt?: string
}

// Project Recommendation Interfaces
export interface ProjectRecommendationItem {
  project_title: string
  difficulty: string
  skills_practiced: string[]
  expected_outcome: string
  portfolio_value: string
}

export interface ProjectRecommendationPayload {
  career_name: string
  skills: string[]
  current_skills?: string[]
  education_level?: string
}

export interface ProjectRecommendationResponse {
  career_name: string
  project_recommendations: ProjectRecommendationItem[]
  summary: string
}

export interface ProjectsNodeData extends WorkflowNodeData {
  targetCareer?: string
  targetSkills?: string[]
  projectRecommendations?: ProjectRecommendationItem[]
  generatedAt?: string
}

// Pathway Progression Structured Models
export interface InternshipModel {
  id: string
  title: string
  organization_type: string
  duration: string
  stipend_range: string
  location_type: string
  required_skills: string[]
  learning_outcomes: string[]
  conversion_potential: string
  is_demo_blueprint: boolean
}

export interface EntryRoleModel {
  id: string
  title: string
  experience_level: string
  typical_salary_range: string
  key_responsibilities: string[]
  minimum_qualifications: string
  interview_focus_areas: string[]
  is_demo_blueprint: boolean
}

export interface CareerStageModel {
  stage_level: number
  stage_name: string
  role_type?: 'entry' | 'mid' | 'senior' | 'specialist_lead' | 'management' | string
  experience_expectations: string
  years_of_experience?: string
  expected_capabilities: string[]
  skills_required_for_next_stage: string[]
  possible_specialization: string[]
  upskilling_recommendations: string[]
  management_track_notes?: string
  target_compensation_range: string
  key_promotion_milestones: string[]
}

export interface CareerPathwayPayload {
  career_name: string
  candidate_skills?: string[]
  education_level?: string
}

export interface CareerPathwayResponse {
  career_name: string
  internship: InternshipModel
  entry_role: EntryRoleModel
  career_stages: CareerStageModel[]
  progression_chain: string[]
  disclaimer: string
}

export interface CareerGrowthPayload {
  career_name: string
  current_skills?: string[]
  current_stage?: string
}

export interface CareerGrowthResponse {
  career_name: string
  entry_role: CareerStageModel
  mid_level_role: CareerStageModel
  senior_role: CareerStageModel
  specialist_lead_role: CareerStageModel
  management_possibility: CareerStageModel
  all_stages: CareerStageModel[]
  disclaimer: string
}

export interface InternshipNodeData extends WorkflowNodeData {
  targetCareer?: string
  internshipData?: InternshipModel
  generatedAt?: string
}

export interface JobNodeData extends WorkflowNodeData {
  targetCareer?: string
  entryRoleData?: EntryRoleModel
  generatedAt?: string
}

export interface CareerGrowthNodeData extends WorkflowNodeData {
  targetCareer?: string
  stagesData?: CareerStageModel[]
  growthResponse?: CareerGrowthResponse
  selectedStageIndex?: number
  progressionChain?: string[]
  generatedAt?: string
}

// What-If Career Simulation Models
export interface SimulationMajorStep {
  step_number: number
  title: string
  phase: string
  estimated_duration: string
  focus: string
  deliverable: string
}

export interface CareerSimulationRequest {
  career_name: string
  education?: string
  degree?: string
  branch?: string
  current_year?: string
  current_skills?: string[]
  available_time?: string
  profile_id?: string
}

export interface CareerSimulationResponse {
  career: string
  eligibility: EligibilityCheckResponse
  skill_gap: SkillGapResponse
  estimated_path: string
  required_qualification: string
  major_steps: SimulationMajorStep[]
  possible_entry_roles: string[]
}

export interface SimulationNodeData extends WorkflowNodeData {
  simulationData?: CareerSimulationResponse
  simulatedCareer?: string
  generatedAt?: string
}

// Career Comparison Models
export interface CareerComparisonItem {
  careerName: string
  source: 'primary' | 'discovery' | 'simulation' | 'custom'
  qualification: string
  eligibility: string
  eligibilityStatus: 'GREEN' | 'YELLOW' | 'RED' | string
  missingSkills: string[]
  learningTime: string
  entryRoles: string[]
  careerGrowth: string
  additionalRequirements: string[]
  roadmapLength: string
}

export interface StudentProfileNodeData extends WorkflowNodeData {
  educationLevel?: string
  degreeOrCourse?: string
  branchOrSubject?: string
  currentYear?: string
  skills?: string
  interests?: string
  strengths?: string
  weaknesses?: string
  careerGoal?: string
  availableTime?: string
  profileId?: string
  normalizedSkills?: string[]
}

export interface SerializedWorkflow<TData extends Record<string, unknown> = WorkflowNodeData> {
  version?: string
  updatedAt?: string
  nodes: Node<TData>[]
  edges: Edge[]
}

// Contextual AI Assistance Models
export interface NodeContextInput {
  node_id: string
  node_type: string
  title: string
  step_type?: string
  skills?: string[]
  description?: string
  status?: string
  estimated_duration?: string
}

export interface RoadmapSummaryContextInput {
  total_steps: number
  completed_steps_count: number
  current_step_index?: number
  surrounding_steps?: string[]
}

export interface StudentProfileContextInput {
  education?: string
  degree?: string
  branch?: string
  currentYear?: string
  skills?: string[]
  interests?: string[]
  strengths?: string[]
  weaknesses?: string[]
  careerGoal?: string
  availableTime?: string
}

export interface ContextualAssistPayload {
  profile_id?: string
  student_profile?: StudentProfileContextInput
  target_career: string
  selected_node: NodeContextInput
  roadmap_context?: RoadmapSummaryContextInput
}

export interface ContextualAssistProject {
  title: string
  description: string
  deliverable?: string
}

export interface ContextualAssistResponse {
  next_action: string
  explanation: string
  practice: string[] | string
  project: ContextualAssistProject | string
  interview_questions: string[]
  next_milestone: string
}

// Interview Preparation Models
export interface InterviewQuestionItem {
  id: string
  category: 'technical' | 'behavioral' | 'project' | 'career_specific' | string
  question: string
  context_or_tip: string
  difficulty?: 'Easy' | 'Medium' | 'Hard' | string
  expected_topics?: string[]
}

export interface InterviewGeneratePayload {
  profile_id?: string
  student_profile?: StudentProfileContextInput
  target_career: string
  skills: string[]
  projects: string[]
  roadmap?: string[]
}

export interface InterviewGenerateResponse {
  career_name: string
  technical_questions: InterviewQuestionItem[]
  behavioral_questions: InterviewQuestionItem[]
  project_questions: InterviewQuestionItem[]
  career_specific_questions: InterviewQuestionItem[]
  total_questions_count: number
  summary: string
}

export interface InterviewAnswerPayload {
  career_name: string
  question_id: string
  question: string
  category: string
  answer: string
  student_profile?: StudentProfileContextInput
}

export interface InterviewAnswerEvaluation {
  question_id: string
  score: number
  rating: string
  feedback: string
  strengths: string[]
  improvement_tips: string[]
  sample_better_answer: string
}

export interface InterviewStudentAnswerRecord {
  question_id: string
  question: string
  category: string
  answer: string
  evaluation?: InterviewAnswerEvaluation
  answered_at: string
}

export interface InterviewNodeData extends WorkflowNodeData {
  targetCareer?: string
  skills?: string[]
  projects?: string[]
  interviewSuite?: InterviewGenerateResponse
  answers?: Record<string, InterviewStudentAnswerRecord>
  lastMockSessionId?: string
  generatedAt?: string
}

// AI Mock Interview Session Models
export interface CategoryFeedback {
  score: number
  summary: string
  key_observations?: string[]
}

export interface ConfidenceIndicators {
  score: number
  articulation_clarity: string
  assertiveness_level: string
  observable_signals?: string[]
}

export interface FinalFeedbackResult {
  overall_score: number
  readiness_rating: string
  executive_summary: string
  communication: CategoryFeedback
  technical_knowledge: CategoryFeedback
  answer_quality: CategoryFeedback
  confidence_indicators: ConfidenceIndicators
  knowledge_gaps: string[]
  improvement_suggestions: string[]
  disclaimer: string
}

export interface MockInterviewTurn {
  turn_number: number
  question_id: string
  category: string
  question: string
  context_or_tip: string
  difficulty?: string
  student_answer?: string
  evaluation?: InterviewAnswerEvaluation
}

export interface MockInterviewSessionResponse {
  session_id: string
  career_name: string
  status: 'in_progress' | 'completed' | string
  current_question_index: number
  total_questions: number
  current_question?: InterviewQuestionItem | null
  turns: MockInterviewTurn[]
  final_feedback?: FinalFeedbackResult | null
}

export interface MockInterviewStartPayload {
  profile_id?: string
  student_profile?: StudentProfileContextInput
  target_career: string
  skills: string[]
  projects: string[]
  question_count?: number
}

export interface MockInterviewSubmitAnswerPayload {
  session_id: string
  question_id: string
  student_answer: string
}

export interface MockInterviewFinishPayload {
  session_id: string
}

// ==========================================
// Market Trends & Future Skills Data Models
// ==========================================
export interface MarketTrendItem {
  id: string
  title: string
  direction: 'Rising' | 'Transforming' | 'Stable' | 'Declining' | string
  impact_level: 'High' | 'Medium' | 'Critical' | string
  time_horizon: string
  summary: string
  key_drivers: string[]
  affected_sectors: string[]
}

export interface InDemandSkillItem {
  id: string
  name: string
  category: string
  demand_intensity: 'Very High' | 'High' | 'Moderate' | string
  growth_rate_label: string
  typical_roles: string[]
  recommended_tools: string[]
}

export interface OccupationChangeItem {
  id: string
  occupation_title: string
  evolution_type: 'Expanding' | 'Transforming' | 'Automating' | 'Emerging' | string
  automation_exposure: string
  emerging_responsibilities: string[]
  declining_responsibilities: string[]
  upskilling_path: string
}

export interface FutureSkillItem {
  id: string
  name: string
  maturity_stage: 'Nascent' | 'Early Adopter' | 'Mainstream Frontier' | string
  readiness_urgency: 'Learn Now' | 'Watch & Experiment' | 'Future Horizon' | string
  why_it_matters: string
  learning_approach: string
  prerequisite_foundations: string[]
}

export interface MarketTrendsResponse {
  career_focus: string
  data_source_mode: string
  is_live_data: boolean
  market_trends: MarketTrendItem[]
  in_demand_skills: InDemandSkillItem[]
  occupation_changes: OccupationChangeItem[]
  future_skills: FutureSkillItem[]
  disclaimer: string
}

export interface MarketTrendsPayload {
  career_focus?: string
  target_skills?: string[]
}

export interface MarketTrendsNodeData extends WorkflowNodeData {
  careerFocus?: string
  trendsData?: MarketTrendsResponse
  selectedTab?: 'trends' | 'in_demand' | 'occupations' | 'future'
  generatedAt?: string
}



