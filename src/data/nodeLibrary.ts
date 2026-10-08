import type { NodeCategory } from '../types/workflow'

export interface NodeTypeDefinition {
  type: string
  name: string
  icon: string
  category: NodeCategory
  description: string
  defaultSummary?: { label: string; value: string }[]
}

export const WORKFLOW_NODE_DEFINITIONS: NodeTypeDefinition[] = [
  {
    type: 'studentProfileNode',
    name: 'Student Profile',
    icon: '🎓',
    category: 'input',
    description: 'Education, strengths & career preferences',
    defaultSummary: [
      { label: 'Education', value: 'Universal background' },
      { label: 'Status', value: 'Profile ready' },
    ],
  },
  {
    type: 'careerDiscoveryNode',
    name: 'Career Discovery',
    icon: '🧭',
    category: 'discovery',
    description: 'Discover viable careers irrespective of degree limitations',
    defaultSummary: [
      { label: 'Scope', value: 'Skill & interest based' },
      { label: 'Status', value: 'Awaiting profile' },
    ],
  },
  {
    type: 'eligibilityCheckerNode',
    name: 'Eligibility Checker',
    icon: '✅',
    category: 'analysis',
    description: 'Check eligibility criteria & non-degree entry routes',
    defaultSummary: [
      { label: 'Check', value: 'Degrees vs Skill routes' },
      { label: 'Status', value: 'Unchecked' },
    ],
  },
  {
    type: 'skillGapAnalysisNode',
    name: 'Skill Gap Analysis',
    icon: '📊',
    category: 'analysis',
    description: 'Identify missing core and emerging skill gaps',
    defaultSummary: [
      { label: 'Benchmark', value: 'Industry standards' },
      { label: 'Status', value: 'Pending' },
    ],
  },
  {
    type: 'careerGoalNode',
    name: 'Career Goal',
    icon: '🎯',
    category: 'career',
    description: 'Target role, expected timeline & compensation',
    defaultSummary: [
      { label: 'Target', value: 'Not configured' },
      { label: 'Horizon', value: '6-12 Months' },
    ],
  },
  {
    type: 'aiRoadmapNode',
    name: 'AI Roadmap',
    icon: '🗺️',
    category: 'roadmap',
    description: 'Step-by-step personalized career transition plan',
    defaultSummary: [
      { label: 'Plan', value: 'Adaptive path' },
      { label: 'Phases', value: 'Pending generation' },
    ],
  },
  {
    type: 'learningNode',
    name: 'Learning',
    icon: '📚',
    category: 'learning',
    description: 'Curated courses, docs, tutorials & practice material',
    defaultSummary: [
      { label: 'Source', value: 'Free & open resources' },
      { label: 'Progress', value: '0%' },
    ],
  },
  {
    type: 'projectsNode',
    name: 'Projects',
    icon: '🛠️',
    category: 'learning',
    description: 'Proof-of-work project suggestions with GitHub guidance',
    defaultSummary: [
      { label: 'Portfolio', value: 'Real-world projects' },
      { label: 'Count', value: '0 completed' },
    ],
  },
  {
    type: 'certificationNode',
    name: 'Certification',
    icon: '📜',
    category: 'learning',
    description: 'Recognized industry credentials and accreditations',
    defaultSummary: [
      { label: 'Tracks', value: 'Industry recognized' },
      { label: 'Recommended', value: 'None selected' },
    ],
  },
  {
    type: 'internshipNode',
    name: 'Internship',
    icon: '💼',
    category: 'action',
    description: 'Entry-level work opportunities and experiential learning',
    defaultSummary: [
      { label: 'Opportunities', value: 'Pending matching' },
      { label: 'Type', value: 'Remote / On-site' },
    ],
  },
  {
    type: 'resumeNode',
    name: 'Resume',
    icon: '📄',
    category: 'action',
    description: 'Skill-first ATS resume generation & optimization',
    defaultSummary: [
      { label: 'ATS Score', value: 'Pending' },
      { label: 'Tailoring', value: 'Target role' },
    ],
  },
  {
    type: 'interviewNode',
    name: 'Interview',
    icon: '🎤',
    category: 'action',
    description: 'Role-specific mock interview simulations & feedback',
    defaultSummary: [
      { label: 'Preparation', value: 'Behavioral & Tech' },
      { label: 'Mock rounds', value: '0 completed' },
    ],
  },
  {
    type: 'jobNode',
    name: 'Job',
    icon: '🚀',
    category: 'career',
    description: 'Curated job opportunities matched to candidate capabilities',
    defaultSummary: [
      { label: 'Match Rate', value: 'Awaiting match' },
      { label: 'Listings', value: 'None' },
    ],
  },
  {
    type: 'careerGrowthNode',
    name: 'Career Growth',
    icon: '📈',
    category: 'career',
    description: 'Long-term promotion, upskilling and leadership tracking',
    defaultSummary: [
      { label: 'Trajectory', value: 'Long term' },
      { label: 'Review', value: 'Annual milestones' },
    ],
  },
  {
    type: 'simulationNode',
    name: 'What-If Career Simulator',
    icon: '🔮',
    category: 'discovery',
    description: 'Simulate alternative pathways (e.g., Data Analyst, PM, Govt) without deleting primary roadmap',
    defaultSummary: [
      { label: 'Hypothetical', value: 'Separate track' },
      { label: 'Primary Path', value: 'Preserved' },
    ],
  },
  {
    type: 'marketTrendsNode',
    name: 'Market Trends & Future Skills',
    icon: '🌐',
    category: 'analysis',
    description: 'Real-time industry trajectories, in-demand skills, occupational shifts & future horizons',
    defaultSummary: [
      { label: 'Source', value: 'Benchmark Blueprint' },
      { label: 'Scope', value: 'Trends & Skills' },
    ],
  },
]


