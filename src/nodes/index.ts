import type { NodeTypes } from '@xyflow/react'
import { StudentProfileNode } from './StudentProfileNode'
import { CareerDiscoveryNode } from './CareerDiscoveryNode'
import { EligibilityCheckerNode } from './EligibilityCheckerNode'
import { SkillGapAnalysisNode } from './SkillGapAnalysisNode'
import { AIRoadmapNode } from './AIRoadmapNode'
import { RoadmapStepNode } from './RoadmapStepNode'
import { LearningNode } from './LearningNode'
import { ProjectsNode } from './ProjectsNode'
import { InternshipNode } from './InternshipNode'
import { InterviewNode } from './InterviewNode'
import { JobNode } from './JobNode'
import { CareerGrowthNode } from './CareerGrowthNode'
import { SimulationNode } from './SimulationNode'
import { MarketTrendsNode } from './MarketTrendsNode'
import { PlaceholderWorkflowNode } from './PlaceholderWorkflowNode'

export const workflowNodeTypes: NodeTypes = {
  studentProfileNode: StudentProfileNode,
  careerDiscoveryNode: CareerDiscoveryNode,
  eligibilityCheckerNode: EligibilityCheckerNode,
  skillGapAnalysisNode: SkillGapAnalysisNode,
  careerGoalNode: PlaceholderWorkflowNode,
  aiRoadmapNode: AIRoadmapNode,
  roadmapStepNode: RoadmapStepNode,
  learningNode: LearningNode,
  projectsNode: ProjectsNode,
  certificationNode: RoadmapStepNode,
  internshipNode: InternshipNode,
  resumeNode: PlaceholderWorkflowNode,
  interviewNode: InterviewNode,
  jobNode: JobNode,
  careerGrowthNode: CareerGrowthNode,
  simulationNode: SimulationNode,
  marketTrendsNode: MarketTrendsNode,
}


