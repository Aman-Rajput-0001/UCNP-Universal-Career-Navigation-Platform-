import { useState, type ChangeEvent } from 'react'
import type { Node } from '@xyflow/react'
import type {
  StudentProfileNodeData,
  CareerDiscoveryNodeData,
  CareerDiscoveryItem,
  EligibilityCheckerNodeData,
  SkillGapAnalysisNodeData,
  AIRoadmapNodeData,
  RoadmapStepNodeData,
  LearningNodeData,
  ProjectsNodeData,
  InternshipNodeData,
  JobNodeData,
  CareerGrowthNodeData,
  SimulationNodeData,
  InterviewNodeData,
  InterviewQuestionItem,
  MarketTrendsNodeData,
  StepProgressStatus,
  WorkflowNodeData,
} from '../types/workflow'
import {
  submitStudentProfile,
  discoverCareersApi,
  checkEligibilityApi,
  analyzeSkillGapApi,
  generateRoadmapApi,
  replanRoadmapApi,
  fetchLearningRecommendationsApi,
  fetchProjectRecommendationsApi,
  fetchCareerPathwayApi,
  fetchCareerGrowthApi,
  fetchMarketTrendsApi,
  updateRoadmapProgressApi,
  simulateCareerApi,
  generateInterviewQuestionsApi,
  evaluateInterviewAnswerApi,
} from '../services/api'
import { getStatusColorConfig } from '../nodes/nodeConfig'
import { ContextualAIAssistant } from './ContextualAIAssistant'
import { MockInterviewModal } from './MockInterviewModal'
import type { Edge } from '@xyflow/react'

interface NodeConfigPanelProps {
  selectedNode: Node<WorkflowNodeData> | null
  nodes: Node<WorkflowNodeData>[]
  onUpdateNodeData: (nodeId: string, updatedData: Partial<WorkflowNodeData>) => void
  onAddRoadmapNodesAndEdges?: (newNodes: Node<WorkflowNodeData>[], newEdges: Edge[]) => void
  onReplanRoadmapSteps?: (
    roadmapNodeId: string,
    completedStepIds: string[],
    newRemainingNodes: Node<WorkflowNodeData>[],
    newEdges: Edge[]
  ) => void
  onDeleteNode?: (nodeId: string) => void
  onClose: () => void
}

function getFormattedTimestamp(): string {
  return new Date().toLocaleTimeString()
}

const inputStyle = {
  width: '100%',
  backgroundColor: '#131b2e',
  border: '1px solid #334155',
  borderRadius: '6px',
  padding: '7px 10px',
  fontSize: '12px',
  color: '#f8fafc',
  outline: 'none',
  boxSizing: 'border-box' as const,
}

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 500,
  color: '#94a3b8',
  marginBottom: '4px',
}

const formGroupStyle = {
  marginBottom: '12px',
}

function getEligibilityBadge(level: string) {
  switch (level) {
    case 'direct':
      return {
        text: 'Direct Entry',
        color: '#34d399',
        bg: 'rgba(16, 185, 129, 0.15)',
        border: 'rgba(16, 185, 129, 0.3)',
      }
    case 'additional_requirements':
      return {
        text: 'Upskilling Required',
        color: '#facc15',
        bg: 'rgba(234, 179, 8, 0.15)',
        border: 'rgba(234, 179, 8, 0.3)',
      }
    case 'restricted':
      return {
        text: 'Restricted Entry / Statutory Bar',
        color: '#f87171',
        bg: 'rgba(239, 68, 68, 0.15)',
        border: 'rgba(239, 68, 68, 0.3)',
      }
    default:
      return {
        text: level,
        color: '#94a3b8',
        bg: 'rgba(148, 163, 184, 0.15)',
        border: 'rgba(148, 163, 184, 0.3)',
      }
  }
}

export function NodeConfigPanel({
  selectedNode,
  nodes,
  onUpdateNodeData,
  onAddRoadmapNodesAndEdges,
  onReplanRoadmapSteps,
  onDeleteNode,
  onClose,
}: NodeConfigPanelProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionFeedback, setSubmissionFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Local state for selected career in eligibility checker
  const [customCareerInput, setCustomCareerInput] = useState('')

  // Local state for dynamic roadmap replanning
  const [replanNewSkills, setReplanNewSkills] = useState('')
  const [replanAvailableTime, setReplanAvailableTime] = useState('')
  const [replanTargetCareer, setReplanTargetCareer] = useState('')
  const [replanNotes, setReplanNotes] = useState('')

  // Local state for interview preparation
  const [activeInterviewTab, setActiveInterviewTab] = useState<'technical' | 'behavioral' | 'project' | 'career_specific'>('technical')
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({})
  const [evaluatingQuestionId, setEvaluatingQuestionId] = useState<string | null>(null)
  const [expandedModelAnswerId, setExpandedModelAnswerId] = useState<string | null>(null)
  const [isGeneratingInterview, setIsGeneratingInterview] = useState<boolean>(false)
  const [isLiveMockOpen, setIsLiveMockOpen] = useState<boolean>(false)

  if (!selectedNode) return null

  const isStudentProfile = selectedNode.type === 'studentProfileNode'
  const isCareerDiscovery = selectedNode.type === 'careerDiscoveryNode'
  const isEligibilityChecker = selectedNode.type === 'eligibilityCheckerNode'
  const isSkillGapAnalysis = selectedNode.type === 'skillGapAnalysisNode'
  const isAIRoadmap = selectedNode.type === 'aiRoadmapNode'
  const isRoadmapStep = selectedNode.type === 'roadmapStepNode'
  const isLearning = selectedNode.type === 'learningNode'
  const isProjects = selectedNode.type === 'projectsNode'
  const isInternship = selectedNode.type === 'internshipNode'
  const isJob = selectedNode.type === 'jobNode'
  const isCareerGrowth = selectedNode.type === 'careerGrowthNode'
  const isSimulation = selectedNode.type === 'simulationNode'
  const isInterview = selectedNode.type === 'interviewNode'
  const isMarketTrends = selectedNode.type === 'marketTrendsNode'

  const studentData = (selectedNode.data || {}) as StudentProfileNodeData
  const careerData = (selectedNode.data || {}) as CareerDiscoveryNodeData
  const eligibilityData = (selectedNode.data || {}) as EligibilityCheckerNodeData
  const skillGapData = (selectedNode.data || {}) as SkillGapAnalysisNodeData
  const roadmapData = (selectedNode.data || {}) as AIRoadmapNodeData
  const stepData = (selectedNode.data || {}) as RoadmapStepNodeData
  const learningData = (selectedNode.data || {}) as LearningNodeData
  const projectsData = (selectedNode.data || {}) as ProjectsNodeData
  const internshipData = (selectedNode.data || {}) as InternshipNodeData
  const jobData = (selectedNode.data || {}) as JobNodeData
  const growthData = (selectedNode.data || {}) as CareerGrowthNodeData
  const simulationData = (selectedNode.data || {}) as SimulationNodeData
  const interviewData = (selectedNode.data || {}) as InterviewNodeData
  const trendsNodeData = (selectedNode.data || {}) as MarketTrendsNodeData


  // Collect any discovered careers from active workflow to populate convenient selector
  const discoveryNode = nodes.find((n) => n.type === 'careerDiscoveryNode')
  const availableDiscoveredCareers: CareerDiscoveryItem[] =
    (discoveryNode?.data as CareerDiscoveryNodeData)?.careers || []

  const profileNode = nodes.find((n) => n.type === 'studentProfileNode')
  const activeProfileData = (profileNode?.data || {}) as StudentProfileNodeData

  // Also collect active eligibility and skill gap node data if present
  const activeEligibilityNode = nodes.find((n) => n.type === 'eligibilityCheckerNode')
  const activeEligibilityData = (activeEligibilityNode?.data as EligibilityCheckerNodeData)?.eligibilityResult

  const activeSkillGapNode = nodes.find((n) => n.type === 'skillGapAnalysisNode')
  const activeSkillGapData = (activeSkillGapNode?.data as SkillGapAnalysisNodeData)?.skillGapResult

  const handleFieldChange = (field: keyof StudentProfileNodeData, value: string) => {
    setSubmissionFeedback(null)
    onUpdateNodeData(selectedNode.id, {
      [field]: value,
    })
  }

  const handleSaveAndContinue = async () => {
    if (!studentData.educationLevel || studentData.educationLevel.trim() === '') {
      setSubmissionFeedback({
        type: 'error',
        message: 'Education level is required.',
      })
      onUpdateNodeData(selectedNode.id, {
        status: 'error',
        statusMessage: 'Missing Education',
      })
      return
    }

    setIsSubmitting(true)
    setSubmissionFeedback(null)

    onUpdateNodeData(selectedNode.id, {
      status: 'running',
      statusMessage: 'Saving Profile...',
    })

    const res = await submitStudentProfile({
      education: studentData.educationLevel,
      degree: studentData.degreeOrCourse,
      branch: studentData.branchOrSubject,
      currentYear: studentData.currentYear,
      skills: studentData.skills || '',
      interests: studentData.interests || '',
      strengths: studentData.strengths || '',
      weaknesses: studentData.weaknesses || '',
      careerGoal: studentData.careerGoal,
      availableTime: studentData.availableTime,
    })

    setIsSubmitting(false)

    if (res.success && res.data) {
      const normalized = res.data
      onUpdateNodeData(selectedNode.id, {
        status: 'success',
        statusMessage: 'Profile Saved',
        profileId: normalized.id,
        normalizedSkills: normalized.skills,
        summaryItems: [
          {
            label: 'Education',
            value: `${normalized.education}${normalized.degree ? ` (${normalized.degree})` : ''}`,
          },
          {
            label: 'Focus',
            value: normalized.branch || 'Skill-first path',
          },
          {
            label: 'Skills',
            value: normalized.skills.length > 0 ? `${normalized.skills.length} skills added` : 'None specified',
          },
          {
            label: 'Goal',
            value: normalized.careerGoal || 'Career exploration',
          },
        ],
      })

      setSubmissionFeedback({
        type: 'success',
        message: `Profile validated & saved to PostgreSQL! (ID: ${normalized.id.slice(0, 8)}...)`,
      })
    } else {
      onUpdateNodeData(selectedNode.id, {
        status: 'error',
        statusMessage: 'Save Failed',
      })
      setSubmissionFeedback({
        type: 'error',
        message: res.error || 'Failed to submit profile to backend.',
      })
    }
  }

  const handleRunCareerDiscovery = async () => {
    const education = activeProfileData.educationLevel || 'Universal (Skill-first)'
    const skillsList = activeProfileData.skills
      ? activeProfileData.skills.split(',').map((s) => s.trim()).filter(Boolean)
      : []
    const interestsList = activeProfileData.interests
      ? activeProfileData.interests.split(',').map((s) => s.trim()).filter(Boolean)
      : []
    const strengthsList = activeProfileData.strengths
      ? activeProfileData.strengths.split(',').map((s) => s.trim()).filter(Boolean)
      : []
    const weaknessesList = activeProfileData.weaknesses
      ? activeProfileData.weaknesses.split(',').map((s) => s.trim()).filter(Boolean)
      : []

    setIsSubmitting(true)
    setSubmissionFeedback(null)

    onUpdateNodeData(selectedNode.id, {
      status: 'running',
      statusMessage: 'AI Analyzing Careers...',
    })

    const result = await discoverCareersApi({
      profile_id: activeProfileData.profileId,
      education,
      degree: activeProfileData.degreeOrCourse,
      branch: activeProfileData.branchOrSubject,
      currentYear: activeProfileData.currentYear,
      skills: skillsList,
      interests: interestsList,
      strengths: strengthsList,
      weaknesses: weaknessesList,
      careerGoal: activeProfileData.careerGoal,
      availableTime: activeProfileData.availableTime,
    })

    setIsSubmitting(false)

    if (result.success && result.data) {
      const responseData = result.data
      onUpdateNodeData(selectedNode.id, {
        status: 'success',
        statusMessage: `${responseData.careers.length} Careers Found`,
        careers: responseData.careers,
        discoveredAt: getFormattedTimestamp(),
        summaryItems: [
          { label: 'Careers', value: `${responseData.careers.length} Discovered` },
          { label: 'Top Match', value: responseData.careers[0]?.career_name || 'N/A' },
          { label: 'Eligibility', value: responseData.careers[0]?.eligibility_level || 'Evaluated' },
        ],
      })

      setSubmissionFeedback({
        type: 'success',
        message: `Successfully discovered ${responseData.careers.length} career pathways!`,
      })
    } else {
      onUpdateNodeData(selectedNode.id, {
        status: 'error',
        statusMessage: 'Discovery Failed',
      })
      setSubmissionFeedback({
        type: 'error',
        message: result.error || 'Failed to execute AI Career Discovery.',
      })
    }
  }

  const handleRunEligibilityCheck = async (targetCareerName: string) => {
    const careerToTest = targetCareerName || customCareerInput || eligibilityData.targetCareer || activeProfileData.careerGoal

    if (!careerToTest || careerToTest.trim() === '') {
      setSubmissionFeedback({
        type: 'error',
        message: 'Please select or enter a target career to check eligibility.',
      })
      return
    }

    const education = activeProfileData.educationLevel || 'Universal (Skill-first)'
    const skillsList = activeProfileData.skills
      ? activeProfileData.skills.split(',').map((s) => s.trim()).filter(Boolean)
      : []

    setIsSubmitting(true)
    setSubmissionFeedback(null)

    onUpdateNodeData(selectedNode.id, {
      status: 'running',
      statusMessage: 'Verifying Eligibility...',
    })

    const result = await checkEligibilityApi({
      profile_id: activeProfileData.profileId,
      career_name: careerToTest.trim(),
      education,
      degree: activeProfileData.degreeOrCourse,
      branch: activeProfileData.branchOrSubject,
      skills: skillsList,
    })

    setIsSubmitting(false)

    if (result.success && result.data) {
      const res = result.data
      onUpdateNodeData(selectedNode.id, {
        status: 'success',
        statusMessage: `Status: ${res.status}`,
        targetCareer: careerToTest.trim(),
        eligibilityResult: res,
        checkedAt: getFormattedTimestamp(),
        summaryItems: [
          { label: 'Target', value: careerToTest.trim() },
          { label: 'Status', value: res.status },
          { label: 'Missing', value: res.missing_requirements.length > 0 ? `${res.missing_requirements.length} requirements` : 'None (Direct)' },
        ],
      })

      setSubmissionFeedback({
        type: 'success',
        message: `Eligibility evaluated: ${res.status}`,
      })
    } else {
      onUpdateNodeData(selectedNode.id, {
        status: 'error',
        statusMessage: 'Evaluation Failed',
      })
      setSubmissionFeedback({
        type: 'error',
        message: result.error || 'Failed to check eligibility.',
      })
    }
  }

  const handleRunSkillGapAnalysis = async (targetCareerName: string) => {
    // 1. Resolve career name
    const careerToTest =
      targetCareerName ||
      customCareerInput ||
      skillGapData.targetCareer ||
      eligibilityData.targetCareer ||
      activeProfileData.careerGoal

    if (!careerToTest || careerToTest.trim() === '') {
      setSubmissionFeedback({
        type: 'error',
        message: 'Please select or specify a target career to analyze skill gaps.',
      })
      return
    }

    // 2. Resolve required skills from discovered careers if present
    const matchedDiscoveredCareer = availableDiscoveredCareers.find(
      (c) => c.career_name.toLowerCase() === careerToTest.toLowerCase()
    )
    const requiredSkillsList = matchedDiscoveredCareer ? matchedDiscoveredCareer.required_skills : []

    // 3. Resolve user skills
    const userSkills = activeProfileData.skills
      ? activeProfileData.skills.split(',').map((s) => s.trim()).filter(Boolean)
      : []

    setIsSubmitting(true)
    setSubmissionFeedback(null)

    onUpdateNodeData(selectedNode.id, {
      status: 'running',
      statusMessage: 'Analyzing Skill Gaps...',
    })

    const result = await analyzeSkillGapApi({
      profile_id: activeProfileData.profileId,
      career_name: careerToTest.trim(),
      current_skills: userSkills,
      required_skills: requiredSkillsList,
    })

    setIsSubmitting(false)

    if (result.success && result.data) {
      const res = result.data
      onUpdateNodeData(selectedNode.id, {
        status: 'success',
        statusMessage: `Level: ${res.skill_level}`,
        targetCareer: careerToTest.trim(),
        skillGapResult: res,
        analyzedAt: getFormattedTimestamp(),
        summaryItems: [
          { label: 'Career', value: careerToTest.trim() },
          { label: 'Matched', value: `${res.matched_skills.length} skills` },
          { label: 'Missing', value: `${res.missing_skills.length} skills` },
          { label: 'Baseline', value: res.skill_level },
        ],
      })

      setSubmissionFeedback({
        type: 'success',
        message: `Skill gap analyzed: ${res.missing_skills.length} gaps identified (${res.skill_level})`,
      })
    } else {
      onUpdateNodeData(selectedNode.id, {
        status: 'error',
        statusMessage: 'Analysis Failed',
      })
      setSubmissionFeedback({
        type: 'error',
        message: result.error || 'Failed to analyze skill gap.',
      })
    }
  }

  const handleGenerateRoadmap = async (targetCareerName: string) => {
    // 1. Resolve career name
    const careerToTest =
      targetCareerName ||
      customCareerInput ||
      roadmapData.targetCareer ||
      skillGapData.targetCareer ||
      eligibilityData.targetCareer ||
      activeProfileData.careerGoal

    if (!careerToTest || careerToTest.trim() === '') {
      setSubmissionFeedback({
        type: 'error',
        message: 'Please select or enter a target career to generate roadmap.',
      })
      return
    }

    const education = activeProfileData.educationLevel || 'Universal (Skill-first)'
    const userSkills = activeProfileData.skills
      ? activeProfileData.skills.split(',').map((s) => s.trim()).filter(Boolean)
      : []

    setIsSubmitting(true)
    setSubmissionFeedback(null)

    onUpdateNodeData(selectedNode.id, {
      status: 'running',
      statusMessage: 'Generating Roadmap...',
    })

    const result = await generateRoadmapApi({
      profile_id: activeProfileData.profileId,
      profile: {
        education,
        degree: activeProfileData.degreeOrCourse,
        branch: activeProfileData.branchOrSubject,
        currentYear: activeProfileData.currentYear,
        skills: userSkills,
        interests: activeProfileData.interests
          ? activeProfileData.interests.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        strengths: activeProfileData.strengths
          ? activeProfileData.strengths.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        weaknesses: activeProfileData.weaknesses
          ? activeProfileData.weaknesses.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        careerGoal: activeProfileData.careerGoal,
        availableTime: activeProfileData.availableTime,
      },
      selected_career: careerToTest.trim(),
      eligibility_result: activeEligibilityData || undefined,
      skill_gap_result: activeSkillGapData || undefined,
    })

    setIsSubmitting(false)

    if (result.success && result.data) {
      const res = result.data
      onUpdateNodeData(selectedNode.id, {
        status: 'success',
        statusMessage: `${res.steps.length} Steps Ready`,
        targetCareer: careerToTest.trim(),
        roadmapResult: res,
        generatedAt: getFormattedTimestamp(),
        summaryItems: [
          { label: 'Target', value: careerToTest.trim() },
          { label: 'Milestones', value: `${res.steps.length} steps` },
          { label: 'Est. Timeline', value: res.total_estimated_duration },
        ],
      })

      // If callback provided, render roadmap steps as connected workflow nodes on canvas!
      if (onAddRoadmapNodesAndEdges && res.steps.length > 0) {
        const rootPos = selectedNode.position || { x: 300, y: 300 }
        const stepNodes: Node<WorkflowNodeData>[] = []
        const stepEdges: Edge[] = []

        // Lay out roadmap steps horizontally with clean ergonomic n8n-style node spacing
        const stepSpacingX = 360
        const startX = rootPos.x + 380
        const startY = rootPos.y

        res.steps.forEach((step, index) => {
          const stepNodeId = `step-node-${selectedNode.id}-${step.id}`
          const x = startX + index * stepSpacingX
          const y = startY + (index % 2 === 1 ? 30 : -10)

          const nodeData: RoadmapStepNodeData = {
            title: step.title,
            description: step.description,
            category: 'roadmap',
            icon: '📍',
            status: 'idle',
            stepId: step.id,
            stepType: step.type,
            estimatedDuration: step.estimated_duration,
            skills: step.skills,
            projects: step.projects,
            resources: step.resources,
            completionCriteria: step.completion_criteria,
            prerequisites: step.prerequisites,
            summaryItems: [
              { label: 'Type', value: step.type },
              { label: 'Duration', value: step.estimated_duration },
            ],
          }

          stepNodes.push({
            id: stepNodeId,
            type: 'roadmapStepNode',
            position: { x, y },
            data: nodeData,
          })

          // Edge from Roadmap Root node to first step
          if (index === 0) {
            stepEdges.push({
              id: `edge-${selectedNode.id}-${stepNodeId}`,
              source: selectedNode.id,
              target: stepNodeId,
              animated: true,
              style: { stroke: '#38bdf8', strokeWidth: 2 },
            })
          } else {
            // Edge from previous step node to current step node
            const prevStepNodeId = `step-node-${selectedNode.id}-${res.steps[index - 1].id}`
            stepEdges.push({
              id: `edge-${prevStepNodeId}-${stepNodeId}`,
              source: prevStepNodeId,
              target: stepNodeId,
              animated: true,
              style: { stroke: '#38bdf8', strokeWidth: 2 },
            })
          }
        })

        onAddRoadmapNodesAndEdges(stepNodes, stepEdges)
      }

      setSubmissionFeedback({
        type: 'success',
        message: `Personalized roadmap generated with ${res.steps.length} connected milestone nodes!`,
      })
    } else {
      onUpdateNodeData(selectedNode.id, {
        status: 'error',
        statusMessage: 'Generation Failed',
      })
      setSubmissionFeedback({
        type: 'error',
        message: result.error || 'Failed to generate roadmap.',
      })
    }
  }

  const handleToggleStepComplete = (stepId: string) => {
    const currentCompleted = roadmapData.completedStepIds || []
    const isCompleted = currentCompleted.includes(stepId)
    const nextCompleted = isCompleted
      ? currentCompleted.filter((id) => id !== stepId)
      : [...currentCompleted, stepId]

    onUpdateNodeData(selectedNode.id, {
      completedStepIds: nextCompleted,
    })

    // Also update matching step node status on the canvas if present
    const stepNodeId = `step-node-${selectedNode.id}-${stepId}`
    const matchingStepNode = nodes.find((n) => n.id === stepNodeId)
    if (matchingStepNode) {
      onUpdateNodeData(stepNodeId, {
        status: isCompleted ? 'idle' : 'success',
        statusMessage: isCompleted ? undefined : 'Completed',
      })
    }
  }

  const handleReplanRoadmap = async () => {
    if (!roadmapData.roadmapResult || !roadmapData.roadmapResult.steps.length) {
      setSubmissionFeedback({
        type: 'error',
        message: 'No active roadmap found to replan. Please generate an initial roadmap first.',
      })
      return
    }

    const currentCompleted = roadmapData.completedStepIds || []
    const parsedNewSkills = replanNewSkills
      ? replanNewSkills.split(',').map((s) => s.trim()).filter(Boolean)
      : []

    const effectiveTargetCareer =
      replanTargetCareer.trim() ||
      roadmapData.targetCareer ||
      activeProfileData.careerGoal ||
      roadmapData.roadmapResult.career_name

    setIsSubmitting(true)
    setSubmissionFeedback(null)

    onUpdateNodeData(selectedNode.id, {
      status: 'running',
      statusMessage: 'Replanning Roadmap...',
    })

    const replanPayload = {
      profile_id: activeProfileData.profileId,
      current_profile: {
        education: activeProfileData.educationLevel || 'Universal (Skill-first)',
        degree: activeProfileData.degreeOrCourse,
        branch: activeProfileData.branchOrSubject,
        currentYear: activeProfileData.currentYear,
        skills: activeProfileData.skills
          ? activeProfileData.skills.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        interests: activeProfileData.interests
          ? activeProfileData.interests.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        strengths: activeProfileData.strengths
          ? activeProfileData.strengths.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        weaknesses: activeProfileData.weaknesses
          ? activeProfileData.weaknesses.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        careerGoal: activeProfileData.careerGoal,
        availableTime: activeProfileData.availableTime,
      },
      current_roadmap: roadmapData.roadmapResult.steps,
      completed_steps: currentCompleted,
      new_information: {
        new_skills: parsedNewSkills,
        updated_available_time: replanAvailableTime.trim() || undefined,
        target_career: replanTargetCareer.trim() || undefined,
        additional_notes: replanNotes.trim() || undefined,
      },
      target_career: effectiveTargetCareer,
    }

    const result = await replanRoadmapApi(replanPayload)

    setIsSubmitting(false)

    if (result.success && result.data) {
      const res = result.data

      onUpdateNodeData(selectedNode.id, {
        status: 'success',
        statusMessage: `${res.remaining_steps.length} Steps Remaining`,
        targetCareer: res.career_name,
        roadmapResult: {
          career_name: res.career_name,
          total_estimated_duration: res.total_estimated_duration,
          summary: res.summary,
          steps: res.all_steps,
        },
        replanSummary: res.summary,
      })

      // Update remaining step nodes and edges on the canvas
      if (onReplanRoadmapSteps) {
        const rootPos = selectedNode.position || { x: 300, y: 300 }
        const startX = rootPos.x + 360 + currentCompleted.length * 360
        const startY = rootPos.y
        const stepSpacingX = 360

        const newRemainingNodes: Node<WorkflowNodeData>[] = []
        const newEdges: Edge[] = []

        res.remaining_steps.forEach((step, index) => {
          const stepNodeId = `step-node-${selectedNode.id}-${step.id}`
          const x = startX + index * stepSpacingX
          const y = startY + (index % 2 === 1 ? 40 : -20)

          const nodeData: RoadmapStepNodeData = {
            title: step.title,
            description: step.description,
            category: 'roadmap',
            icon: '📍',
            status: 'idle',
            stepId: step.id,
            stepType: step.type,
            estimatedDuration: step.estimated_duration,
            skills: step.skills,
            projects: step.projects,
            resources: step.resources,
            completionCriteria: step.completion_criteria,
            prerequisites: step.prerequisites,
            summaryItems: [
              { label: 'Type', value: step.type },
              { label: 'Duration', value: step.estimated_duration },
            ],
          }

          newRemainingNodes.push({
            id: stepNodeId,
            type: 'roadmapStepNode',
            position: { x, y },
            data: nodeData,
          })

          if (index === 0) {
            // Connect to either last completed step or the roadmap root
            const sourceId = currentCompleted.length > 0
              ? `step-node-${selectedNode.id}-${currentCompleted[currentCompleted.length - 1]}`
              : selectedNode.id

            newEdges.push({
              id: `edge-${sourceId}-${stepNodeId}`,
              source: sourceId,
              target: stepNodeId,
              animated: true,
              style: { stroke: '#fbbf24', strokeWidth: 2 },
            })
          } else {
            const prevStepNodeId = `step-node-${selectedNode.id}-${res.remaining_steps[index - 1].id}`
            newEdges.push({
              id: `edge-${prevStepNodeId}-${stepNodeId}`,
              source: prevStepNodeId,
              target: stepNodeId,
              animated: true,
              style: { stroke: '#38bdf8', strokeWidth: 2 },
            })
          }
        })

        onReplanRoadmapSteps(selectedNode.id, currentCompleted, newRemainingNodes, newEdges)
      }

      setSubmissionFeedback({
        type: 'success',
        message: `Roadmap replanned! ${res.completed_steps.length} completed preserved, ${res.remaining_steps.length} remaining recalibrated.`,
      })
    } else {
      onUpdateNodeData(selectedNode.id, {
        status: 'error',
        statusMessage: 'Replan Failed',
      })
      setSubmissionFeedback({
        type: 'error',
        message: result.error || 'Failed to replan roadmap.',
      })
    }
  }

  const handleFetchLearningRecommendations = async (targetRole: string, targetSkillsInput: string) => {
    const career =
      targetRole.trim() ||
      learningData.targetCareer ||
      roadmapData.targetCareer ||
      activeProfileData.careerGoal ||
      availableDiscoveredCareers[0]?.career_name ||
      'Software Engineer'

    // Collect skills to learn: from user input or active roadmap/skill-gap
    let skillsList: string[] = []
    if (targetSkillsInput.trim()) {
      skillsList = targetSkillsInput.split(',').map((s) => s.trim()).filter(Boolean)
    } else if (roadmapData.roadmapResult?.steps) {
      const allRoadmapSkills = roadmapData.roadmapResult.steps.flatMap((st) => st.skills)
      skillsList = Array.from(new Set(allRoadmapSkills)).slice(0, 5)
    } else if (activeSkillGapData?.missing_skills?.length) {
      skillsList = activeSkillGapData.missing_skills.slice(0, 5)
    } else {
      skillsList = ['System Design', 'API Engineering', 'Cloud Deployment']
    }

    const currentKnown = activeProfileData.skills
      ? activeProfileData.skills.split(',').map((s) => s.trim()).filter(Boolean)
      : []

    setIsSubmitting(true)
    setSubmissionFeedback(null)

    onUpdateNodeData(selectedNode.id, {
      status: 'running',
      statusMessage: 'Curating Curriculum...',
    })

    const res = await fetchLearningRecommendationsApi({
      career_name: career,
      skills: skillsList,
      current_skills: currentKnown,
      available_time: activeProfileData.availableTime || undefined,
    })

    setIsSubmitting(false)

    if (res.success && res.data) {
      onUpdateNodeData(selectedNode.id, {
        status: 'success',
        statusMessage: `${res.data.learning_recommendations.length} Skills Curated`,
        targetCareer: res.data.career_name,
        targetSkills: skillsList,
        learningRecommendations: res.data.learning_recommendations,
        generatedAt: getFormattedTimestamp(),
        summaryItems: [
          { label: 'Role', value: res.data.career_name },
          { label: 'Modules', value: `${res.data.learning_recommendations.length} skills` },
          { label: 'Track', value: 'Open docs & drills' },
        ],
      })

      setSubmissionFeedback({
        type: 'success',
        message: `Learning curriculum generated for ${res.data.learning_recommendations.length} skills!`,
      })
    } else {
      onUpdateNodeData(selectedNode.id, {
        status: 'error',
        statusMessage: 'Curriculum Failed',
      })
      setSubmissionFeedback({
        type: 'error',
        message: res.error || 'Failed to generate learning recommendations.',
      })
    }
  }

  const handleFetchProjectRecommendations = async (targetRole: string, targetSkillsInput: string) => {
    const career =
      targetRole.trim() ||
      projectsData.targetCareer ||
      roadmapData.targetCareer ||
      activeProfileData.careerGoal ||
      availableDiscoveredCareers[0]?.career_name ||
      'Software Engineer'

    let skillsList: string[] = []
    if (targetSkillsInput.trim()) {
      skillsList = targetSkillsInput.split(',').map((s) => s.trim()).filter(Boolean)
    } else if (roadmapData.roadmapResult?.steps) {
      const allRoadmapSkills = roadmapData.roadmapResult.steps.flatMap((st) => st.skills)
      skillsList = Array.from(new Set(allRoadmapSkills)).slice(0, 5)
    } else if (activeSkillGapData?.missing_skills?.length) {
      skillsList = activeSkillGapData.missing_skills.slice(0, 5)
    } else {
      skillsList = ['Full Stack Architecture', 'Database Optimization', 'Docker CI/CD']
    }

    const currentKnown = activeProfileData.skills
      ? activeProfileData.skills.split(',').map((s) => s.trim()).filter(Boolean)
      : []

    setIsSubmitting(true)
    setSubmissionFeedback(null)

    onUpdateNodeData(selectedNode.id, {
      status: 'running',
      statusMessage: 'Generating Projects...',
    })

    const res = await fetchProjectRecommendationsApi({
      career_name: career,
      skills: skillsList,
      current_skills: currentKnown,
      education_level: activeProfileData.educationLevel || undefined,
    })

    setIsSubmitting(false)

    if (res.success && res.data) {
      onUpdateNodeData(selectedNode.id, {
        status: 'success',
        statusMessage: `${res.data.project_recommendations.length} Blueprints Ready`,
        targetCareer: res.data.career_name,
        targetSkills: skillsList,
        projectRecommendations: res.data.project_recommendations,
        generatedAt: getFormattedTimestamp(),
        summaryItems: [
          { label: 'Role', value: res.data.career_name },
          { label: 'Blueprints', value: `${res.data.project_recommendations.length} projects` },
          { label: 'Scope', value: 'Proof-of-work' },
        ],
      })

      setSubmissionFeedback({
        type: 'success',
        message: `Project recommendations created for ${res.data.project_recommendations.length} portfolio blueprints!`,
      })
    } else {
      onUpdateNodeData(selectedNode.id, {
        status: 'error',
        statusMessage: 'Blueprints Failed',
      })
      setSubmissionFeedback({
        type: 'error',
        message: res.error || 'Failed to generate project recommendations.',
      })
    }
  }

  const handleGenerateInterview = async (customRole?: string) => {
    const career =
      customRole?.trim() ||
      interviewData.targetCareer ||
      roadmapData.targetCareer ||
      activeProfileData.careerGoal ||
      availableDiscoveredCareers[0]?.career_name ||
      'Software Engineer'

    // Extract skills
    const skillsList = activeProfileData.skills
      ? activeProfileData.skills.split(',').map((s) => s.trim()).filter(Boolean)
      : []

    // Extract candidate projects
    const roadmapProjects = roadmapData.roadmapResult?.steps?.flatMap((s) => s.projects) || []
    const projectNodeProjects =
      (nodes.find((n) => n.type === 'projectsNode')?.data as ProjectsNodeData)
        ?.projectRecommendations?.map((p) => p.project_title) || []
    const candidateProjects = Array.from(
      new Set([...roadmapProjects, ...projectNodeProjects])
    ).filter(Boolean)

    // Extract roadmap steps
    const roadmapMilestones = roadmapData.roadmapResult?.steps?.map((s) => s.title) || []

    setIsGeneratingInterview(true)
    setSubmissionFeedback(null)

    onUpdateNodeData(selectedNode.id, {
      status: 'running',
      statusMessage: 'Generating Questions...',
    })

    const res = await generateInterviewQuestionsApi({
      profile_id: activeProfileData.profileId,
      student_profile: {
        education: activeProfileData.educationLevel || 'Skill-first',
        degree: activeProfileData.degreeOrCourse,
        branch: activeProfileData.branchOrSubject,
        currentYear: activeProfileData.currentYear,
        skills: skillsList,
        interests: activeProfileData.interests?.split(',').map((s) => s.trim()).filter(Boolean) || [],
        strengths: activeProfileData.strengths?.split(',').map((s) => s.trim()).filter(Boolean) || [],
        weaknesses: activeProfileData.weaknesses?.split(',').map((s) => s.trim()).filter(Boolean) || [],
        careerGoal: activeProfileData.careerGoal || career,
        availableTime: activeProfileData.availableTime || '10-15 hrs/week',
      },
      target_career: career,
      skills: skillsList,
      projects: candidateProjects,
      roadmap: roadmapMilestones,
    })

    setIsGeneratingInterview(false)

    if (res.success && res.data) {
      const answeredCount = Object.keys(interviewData.answers || {}).length
      onUpdateNodeData(selectedNode.id, {
        status: 'success',
        statusMessage: `${res.data.total_questions_count} Questions Ready`,
        targetCareer: career,
        skills: skillsList,
        projects: candidateProjects,
        interviewSuite: res.data,
        generatedAt: getFormattedTimestamp(),
        summaryItems: [
          { label: 'Role', value: career },
          { label: 'Suite', value: `${res.data.total_questions_count} Qs` },
          { label: 'Answered', value: `${answeredCount}/${res.data.total_questions_count}` },
        ],
      })

      setSubmissionFeedback({
        type: 'success',
        message: `Generated ${res.data.total_questions_count} interview questions for ${career}!`,
      })
    } else {
      onUpdateNodeData(selectedNode.id, {
        status: 'error',
        statusMessage: 'Generation Failed',
      })
      setSubmissionFeedback({
        type: 'error',
        message: res.error || 'Failed to generate interview questions.',
      })
    }
  }

  const handleEvaluateAnswer = async (q: InterviewQuestionItem) => {
    const studentAns = studentAnswers[q.id] || interviewData.answers?.[q.id]?.answer || ''
    if (!studentAns.trim()) {
      setSubmissionFeedback({
        type: 'error',
        message: 'Please type an answer before requesting feedback.',
      })
      return
    }

    const career =
      interviewData.targetCareer ||
      roadmapData.targetCareer ||
      activeProfileData.careerGoal ||
      'Software Engineer'

    setEvaluatingQuestionId(q.id)
    setSubmissionFeedback(null)

    const res = await evaluateInterviewAnswerApi({
      career_name: career,
      question_id: q.id,
      question: q.question,
      category: q.category,
      answer: studentAns.trim(),
    })

    setEvaluatingQuestionId(null)

    if (res.success && res.data) {
      const updatedAnswers = {
        ...(interviewData.answers || {}),
        [q.id]: {
          question_id: q.id,
          question: q.question,
          category: q.category,
          answer: studentAns.trim(),
          evaluation: res.data,
          answered_at: getFormattedTimestamp(),
        },
      }

      const totalQs = interviewData.interviewSuite?.total_questions_count || 12
      const answeredCount = Object.keys(updatedAnswers).length

      onUpdateNodeData(selectedNode.id, {
        answers: updatedAnswers,
        summaryItems: [
          { label: 'Role', value: career },
          { label: 'Suite', value: `${totalQs} Qs` },
          { label: 'Answered', value: `${answeredCount}/${totalQs}` },
        ],
      })

      setSubmissionFeedback({
        type: 'success',
        message: `Answer evaluated! Score: ${res.data.score}/10 (${res.data.rating})`,
      })
    } else {
      setSubmissionFeedback({
        type: 'error',
        message: res.error || 'Failed to evaluate answer.',
      })
    }
  }

  return (
    <aside
      style={{
        width: 'min(400px, 100vw)',
        maxWidth: '100vw',
        height: '100%',
        backgroundColor: '#090d16',
        borderLeft: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 25,
        boxShadow: '-6px 0 24px rgba(0, 0, 0, 0.55)',
      }}
    >
      {/* Panel Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #1e293b',
          backgroundColor: '#0b1120',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#192233',
              border: '1px solid #2d3b50',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              flexShrink: 0,
            }}
          >
            {selectedNode.data.icon as string || '⚙️'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: 600,
                fontSize: '13px',
                color: '#f8fafc',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {selectedNode.data.title as string || 'Node Configuration'}
            </div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>
              ID: {selectedNode.id}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {onDeleteNode && (
            <button
              onClick={() => onDeleteNode(selectedNode.id)}
              type="button"
              style={{
                background: '#2d1515',
                border: '1px solid #7f1d1d',
                color: '#f87171',
                cursor: 'pointer',
                fontSize: '12px',
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                lineHeight: 1,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#991b1b'
                e.currentTarget.style.color = '#ffffff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2d1515'
                e.currentTarget.style.color = '#f87171'
              }}
              title="Delete node from canvas"
            >
              🗑️
            </button>
          )}
          <button
            onClick={onClose}
            type="button"
            style={{
              background: '#131b2e',
              border: '1px solid #2d3748',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '14px',
              width: '26px',
              height: '26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              lineHeight: 1,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#f8fafc'
              e.currentTarget.style.borderColor = '#3b82f6'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94a3b8'
              e.currentTarget.style.borderColor = '#2d3748'
            }}
            title="Close Inspector"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
        }}
      >
        {/* Contextual AI Assistant grounded in workflow context */}
        <ContextualAIAssistant selectedNode={selectedNode} nodes={nodes} />

        {/* 1. Student Profile Node Panel */}
        {isStudentProfile && (
          <div>
            <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Student Background & Preferences
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>
                Education Level <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={studentData.educationLevel || ''}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => handleFieldChange('educationLevel', e.target.value)}
                style={inputStyle}
              >
                <option value="">Select Level</option>
                <option value="10th">10th</option>
                <option value="12th">12th</option>
                <option value="Diploma / ITI">Diploma / ITI</option>
                <option value="Bachelor's Degree">Bachelor's Degree</option>
                <option value="Master's Degree">Master's Degree</option>
                <option value="Professional Qualification">Professional Qualification</option>
                <option value="No Formal Degree / Skill-First">No Formal Degree / Skill-First</option>
              </select>
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Degree / Course</label>
              <input
                type="text"
                placeholder="e.g. B.Tech, B.Com, BA, Polytechnic, Self-taught"
                value={studentData.degreeOrCourse || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleFieldChange('degreeOrCourse', e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Branch / Subject</label>
              <input
                type="text"
                placeholder="e.g. Computer Science, Mechanical, Commerce, Arts"
                value={studentData.branchOrSubject || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleFieldChange('branchOrSubject', e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Current Year / Status</label>
              <input
                type="text"
                placeholder="e.g. 1st Year, Final Year, Graduated, Working"
                value={studentData.currentYear || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleFieldChange('currentYear', e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Skills (Comma-separated)</label>
              <textarea
                rows={2}
                placeholder="e.g. Python, SQL, Communication, Figma"
                value={studentData.skills || ''}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleFieldChange('skills', e.target.value)}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Interests (Comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. Artificial Intelligence, Web Design, Data Analytics"
                value={studentData.interests || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleFieldChange('interests', e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Strengths (Comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. Logical reasoning, Problem solving, Fast learner"
                value={studentData.strengths || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleFieldChange('strengths', e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Weaknesses / Challenges (Comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. Public speaking, Math foundations, Low consistency"
                value={studentData.weaknesses || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleFieldChange('weaknesses', e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Career Goal</label>
              <input
                type="text"
                placeholder="e.g. Software Engineer, Data Scientist, Product Designer"
                value={studentData.careerGoal || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleFieldChange('careerGoal', e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Available Time</label>
              <input
                type="text"
                placeholder="e.g. 15 hours / week, 2 hours / day"
                value={studentData.availableTime || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleFieldChange('availableTime', e.target.value)}
                style={inputStyle}
              />
            </div>

            {submissionFeedback && (
              <div
                style={{
                  marginTop: '10px',
                  marginBottom: '10px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  backgroundColor: submissionFeedback.type === 'success'
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(239, 68, 68, 0.15)',
                  border: submissionFeedback.type === 'success'
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid rgba(239, 68, 68, 0.3)',
                  color: submissionFeedback.type === 'success' ? '#34d399' : '#f87171',
                }}
              >
                {submissionFeedback.message}
              </div>
            )}

            <div style={{ marginTop: '16px', marginBottom: '8px' }}>
              <button
                type="button"
                onClick={handleSaveAndContinue}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  backgroundColor: isSubmitting ? '#1e3a8a' : '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background-color 0.15s ease',
                }}
              >
                {isSubmitting ? 'Saving to Database...' : 'Save Profile →'}
              </button>
            </div>
          </div>
        )}

        {/* 2. Career Discovery Node Panel */}
        {isCareerDiscovery && (
          <div>
            <div style={{ fontSize: '11px', color: '#a78bfa', fontWeight: 600, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              AI Career Discovery Engine
            </div>

            <p style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4, margin: '0 0 14px' }}>
              Discovers realistic career pathways based on your active student profile. Evaluates eligibility: <strong>Direct</strong>, <strong>Upskilling Required</strong>, or <strong>Restricted</strong> (licensing/formal barriers).
            </p>

            <button
              type="button"
              onClick={handleRunCareerDiscovery}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '9px 14px',
                backgroundColor: isSubmitting ? '#4c1d95' : '#7c3aed',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '12px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '14px',
              }}
            >
              {isSubmitting ? 'AI Discovering Careers...' : '✨ Run Career Discovery'}
            </button>

            {submissionFeedback && (
              <div
                style={{
                  marginBottom: '14px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  backgroundColor: submissionFeedback.type === 'success'
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(239, 68, 68, 0.15)',
                  border: submissionFeedback.type === 'success'
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid rgba(239, 68, 68, 0.3)',
                  color: submissionFeedback.type === 'success' ? '#34d399' : '#f87171',
                }}
              >
                {submissionFeedback.message}
              </div>
            )}

            {careerData.careers && careerData.careers.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>
                  Recommended Career Pathways ({careerData.careers.length})
                </div>

                {careerData.careers.map((career: CareerDiscoveryItem, index: number) => {
                  const badge = getEligibilityBadge(career.eligibility_level)
                  return (
                    <div
                      key={index}
                      style={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: '8px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: '13px', color: '#f8fafc' }}>
                          {career.career_name}
                        </span>
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            color: badge.color,
                            backgroundColor: badge.bg,
                            border: `1px solid ${badge.border}`,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {badge.text}
                        </span>
                      </div>

                      <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4 }}>
                        {career.match_reason}
                      </p>

                      <div style={{ fontSize: '11px', backgroundColor: '#162033', padding: '6px 8px', borderRadius: '4px' }}>
                        <span style={{ color: '#94a3b8', fontWeight: 500 }}>Qualification Check: </span>
                        <span style={{ color: '#e2e8f0' }}>{career.qualification_requirements}</span>
                      </div>

                      {career.required_skills && career.required_skills.length > 0 && (
                        <div>
                          <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>
                            REQUIRED SKILLS
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {career.required_skills.map((s, sIdx) => (
                              <span
                                key={sIdx}
                                style={{
                                  fontSize: '10px',
                                  padding: '2px 6px',
                                  backgroundColor: '#1e293b',
                                  borderRadius: '4px',
                                  color: '#cbd5e1',
                                }}
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {career.missing_skills && career.missing_skills.length > 0 && (
                        <div>
                          <div style={{ fontSize: '10px', color: '#f87171', marginBottom: '4px', fontWeight: 600 }}>
                            MISSING / GAP SKILLS
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {career.missing_skills.map((s, sIdx) => (
                              <span
                                key={sIdx}
                                style={{
                                  fontSize: '10px',
                                  padding: '2px 6px',
                                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.25)',
                                  borderRadius: '4px',
                                  color: '#fca5a5',
                                }}
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {career.possible_entry_roles && career.possible_entry_roles.length > 0 && (
                        <div>
                          <div style={{ fontSize: '10px', color: '#38bdf8', marginBottom: '4px', fontWeight: 600 }}>
                            POSSIBLE ENTRY ROLES
                          </div>
                          <div style={{ fontSize: '11px', color: '#93c5fd' }}>
                            {career.possible_entry_roles.join(' · ')}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ color: '#64748b', fontSize: '11px', textAlign: 'center', padding: '16px 0' }}>
                No careers generated yet. Click "Run Career Discovery" to analyze with AI.
              </div>
            )}
          </div>
        )}

        {/* 3. Eligibility Checker Node Panel */}
        {isEligibilityChecker && (
          <div>
            <div style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 600, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Authoritative Eligibility Verification
            </div>

            <p style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4, margin: '0 0 14px' }}>
              Rigorous check against formal and statutory prerequisites. Does not allow hallucinated rules.
            </p>

            {/* Target Career Selection */}
            <div style={formGroupStyle}>
              <label style={labelStyle}>Select Career to Evaluate</label>
              {availableDiscoveredCareers.length > 0 ? (
                <select
                  value={eligibilityData.targetCareer || ''}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                    const chosen = e.target.value
                    onUpdateNodeData(selectedNode.id, { targetCareer: chosen })
                    handleRunEligibilityCheck(chosen)
                  }}
                  style={inputStyle}
                >
                  <option value="">-- Choose from discovered careers --</option>
                  {availableDiscoveredCareers.map((c, i) => (
                    <option key={i} value={c.career_name}>
                      {c.career_name}
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>
                  No careers discovered in workflow yet. Type career name below:
                </div>
              )}
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Or Enter Custom Career Role</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="e.g. Software Engineer, Doctor, Lawyer, Data Analyst"
                  value={customCareerInput || eligibilityData.targetCareer || ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setCustomCareerInput(e.target.value)
                    onUpdateNodeData(selectedNode.id, { targetCareer: e.target.value })
                  }}
                  style={inputStyle}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleRunEligibilityCheck(customCareerInput || eligibilityData.targetCareer || '')}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '9px 14px',
                backgroundColor: isSubmitting ? '#854d0e' : '#d97706',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '12px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '14px',
              }}
            >
              {isSubmitting ? 'Evaluating Rules...' : '🔍 Check Eligibility'}
            </button>

            {submissionFeedback && (
              <div
                style={{
                  marginBottom: '14px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  backgroundColor: submissionFeedback.type === 'success'
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(239, 68, 68, 0.15)',
                  border: submissionFeedback.type === 'success'
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid rgba(239, 68, 68, 0.3)',
                  color: submissionFeedback.type === 'success' ? '#34d399' : '#f87171',
                }}
              >
                {submissionFeedback.message}
              </div>
            )}

            {/* Display Eligibility Result */}
            {eligibilityData.eligibilityResult ? (
              <div
                style={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                {/* Result Status Banner */}
                {(() => {
                  const cfg = getStatusColorConfig(eligibilityData.eligibilityResult.status)
                  return (
                    <div
                      style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        backgroundColor: cfg.bgColor,
                        border: `1px solid ${cfg.borderColor}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: cfg.dotColor,
                          display: 'inline-block',
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: '11px', fontWeight: 700, color: cfg.textColor }}>
                        {cfg.badgeText}
                      </span>
                    </div>
                  )
                })()}

                {/* Explanation */}
                <div>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>
                    EVALUATION EXPLANATION
                  </div>
                  <p style={{ margin: 0, fontSize: '11px', color: '#e2e8f0', lineHeight: 1.4 }}>
                    {eligibilityData.eligibilityResult.explanation}
                  </p>
                </div>

                {/* Formal Qualifications Required */}
                <div style={{ backgroundColor: '#131d31', padding: '8px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, marginBottom: '2px' }}>
                    QUALIFICATION BENCHMARK
                  </div>
                  <div style={{ fontSize: '11px', color: '#f1f5f9' }}>
                    {eligibilityData.eligibilityResult.qualification_requirements}
                  </div>
                </div>

                {/* Missing Requirements */}
                {eligibilityData.eligibilityResult.missing_requirements.length > 0 && (
                  <div>
                    <div style={{ fontSize: '10px', color: '#f87171', fontWeight: 600, marginBottom: '4px' }}>
                      MISSING PREREQUISITES / LICENSES
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#fca5a5', lineHeight: 1.4 }}>
                      {eligibilityData.eligibilityResult.missing_requirements.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Additional Pathway Requirements */}
                {eligibilityData.eligibilityResult.additional_requirements.length > 0 && (
                  <div>
                    <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 600, marginBottom: '4px' }}>
                      RECOMMENDED BRIDGE REQUIREMENTS
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#93c5fd', lineHeight: 1.4 }}>
                      {eligibilityData.eligibilityResult.additional_requirements.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: '#64748b', fontSize: '11px', textAlign: 'center', padding: '16px 0' }}>
                No eligibility check run yet. Select a career above.
              </div>
            )}
          </div>
        )}

        {/* 4. Skill Gap Analysis Node Panel */}
        {isSkillGapAnalysis && (
          <div>
            <div style={{ fontSize: '11px', color: '#fb923c', fontWeight: 600, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Skill Gap Analysis
            </div>

            <p style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4, margin: '0 0 14px' }}>
              Compares current student skills against industry requirements for the selected career, categorizing gaps by priority (High, Medium, Low).
            </p>

            {/* Target Career Selection */}
            <div style={formGroupStyle}>
              <label style={labelStyle}>Select Career to Analyze</label>
              {availableDiscoveredCareers.length > 0 ? (
                <select
                  value={skillGapData.targetCareer || ''}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                    const chosen = e.target.value
                    onUpdateNodeData(selectedNode.id, { targetCareer: chosen })
                    handleRunSkillGapAnalysis(chosen)
                  }}
                  style={inputStyle}
                >
                  <option value="">-- Choose from discovered careers --</option>
                  {availableDiscoveredCareers.map((c, i) => (
                    <option key={i} value={c.career_name}>
                      {c.career_name}
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>
                  No discovered careers found in workflow yet. Type career name below:
                </div>
              )}
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Or Enter Career Role</label>
              <input
                type="text"
                placeholder="e.g. Software Engineer, Data Analyst, UI/UX Designer"
                value={customCareerInput || skillGapData.targetCareer || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setCustomCareerInput(e.target.value)
                  onUpdateNodeData(selectedNode.id, { targetCareer: e.target.value })
                }}
                style={inputStyle}
              />
            </div>

            <button
              type="button"
              onClick={() => handleRunSkillGapAnalysis(customCareerInput || skillGapData.targetCareer || '')}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '9px 14px',
                backgroundColor: isSubmitting ? '#9a3412' : '#ea580c',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '12px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '14px',
              }}
            >
              {isSubmitting ? 'Analyzing Skills...' : '📊 Run Skill Gap Analysis'}
            </button>

            {submissionFeedback && (
              <div
                style={{
                  marginBottom: '14px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  backgroundColor: submissionFeedback.type === 'success'
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(239, 68, 68, 0.15)',
                  border: submissionFeedback.type === 'success'
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid rgba(239, 68, 68, 0.3)',
                  color: submissionFeedback.type === 'success' ? '#34d399' : '#f87171',
                }}
              >
                {submissionFeedback.message}
              </div>
            )}

            {/* Display Skill Gap Result */}
            {skillGapData.skillGapResult ? (
              <div
                style={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {/* Level Banner */}
                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Baseline Level:</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>
                    {skillGapData.skillGapResult.skill_level}
                  </span>
                </div>

                {/* Reason Explanation */}
                <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4 }}>
                  {skillGapData.skillGapResult.reason}
                </p>

                {/* Matched Skills */}
                <div>
                  <div style={{ fontSize: '10px', color: '#34d399', fontWeight: 600, marginBottom: '6px' }}>
                    MATCHED SKILLS ({skillGapData.skillGapResult.matched_skills.length})
                  </div>
                  {skillGapData.skillGapResult.matched_skills.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {skillGapData.skillGapResult.matched_skills.map((s, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '10px',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            color: '#34d399',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                          }}
                        >
                          ✓ {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '11px', color: '#64748b' }}>None matched yet</div>
                  )}
                </div>

                {/* Priority Missing Skills */}
                <div>
                  <div style={{ fontSize: '10px', color: '#f87171', fontWeight: 600, marginBottom: '6px' }}>
                    PRIORITY GAPS TO BRIDGE ({skillGapData.skillGapResult.priority_skills.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {skillGapData.skillGapResult.priority_skills.map((p, idx) => {
                      const priorityColor =
                        p.priority === 'high'
                          ? { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.35)' }
                          : p.priority === 'medium'
                          ? { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.35)' }
                          : { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.35)' }

                      return (
                        <div
                          key={idx}
                          style={{
                            padding: '6px 8px',
                            borderRadius: '6px',
                            backgroundColor: '#131b2e',
                            border: '1px solid #1e293b',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc' }}>
                              {p.skill_name}
                            </span>
                            <span
                              style={{
                                fontSize: '9px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                color: priorityColor.color,
                                backgroundColor: priorityColor.bg,
                                border: `1px solid ${priorityColor.border}`,
                              }}
                            >
                              {p.priority}
                            </span>
                          </div>
                          <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1.25 }}>
                            {p.reason}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: '#64748b', fontSize: '11px', textAlign: 'center', padding: '16px 0' }}>
                No skill gap analysis run yet. Select a career above.
              </div>
            )}
          </div>
        )}

        {/* 5. AI Roadmap Node Panel */}
        {isAIRoadmap && (
          <div>
            <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Personalized Career Roadmap
            </div>

            <p style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4, margin: '0 0 14px' }}>
              Synthesizes Student Profile, Eligibility results, and Skill Gaps into a step-by-step transition roadmap. Focuses on unmastered skills and prerequisites.
            </p>

            {/* Target Career Selection */}
            <div style={formGroupStyle}>
              <label style={labelStyle}>Target Career Pathway</label>
              {availableDiscoveredCareers.length > 0 ? (
                <select
                  value={roadmapData.targetCareer || ''}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                    const chosen = e.target.value
                    onUpdateNodeData(selectedNode.id, { targetCareer: chosen })
                  }}
                  style={inputStyle}
                >
                  <option value="">-- Choose from discovered careers --</option>
                  {availableDiscoveredCareers.map((c, i) => (
                    <option key={i} value={c.career_name}>
                      {c.career_name}
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>
                  No discovered careers found in workflow yet. Type target role below:
                </div>
              )}
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Or Enter Target Role</label>
              <input
                type="text"
                placeholder="e.g. Machine Learning Engineer, Cloud Architect"
                value={customCareerInput || roadmapData.targetCareer || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setCustomCareerInput(e.target.value)
                  onUpdateNodeData(selectedNode.id, { targetCareer: e.target.value })
                }}
                style={inputStyle}
              />
            </div>

            {/* Context Summary Badges */}
            <div style={{ backgroundColor: '#0f172a', padding: '8px 10px', borderRadius: '6px', marginBottom: '14px', border: '1px solid #1e293b' }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
                AVAILABLE PIPELINE CONTEXT
              </div>
              <div style={{ fontSize: '11px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div>• Profile: {activeProfileData.educationLevel ? `${activeProfileData.educationLevel} (${activeProfileData.skills?.split(',').length || 0} skills)` : 'Default/Open'}</div>
                <div>• Eligibility Check: {activeEligibilityData ? `${activeEligibilityData.status} status` : 'Not run'}</div>
                <div>• Skill Gaps: {activeSkillGapData ? `${activeSkillGapData.missing_skills.length} missing gaps` : 'Standard catalog'}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleGenerateRoadmap(customCareerInput || roadmapData.targetCareer || '')}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '9px 14px',
                backgroundColor: isSubmitting ? '#0369a1' : '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '12px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '14px',
              }}
            >
              {isSubmitting ? 'Generating AI Roadmap...' : '🗺️ Generate Personalized Roadmap'}
            </button>

            {submissionFeedback && (
              <div
                style={{
                  marginBottom: '14px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  backgroundColor: submissionFeedback.type === 'success'
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(239, 68, 68, 0.15)',
                  border: submissionFeedback.type === 'success'
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid rgba(239, 68, 68, 0.3)',
                  color: submissionFeedback.type === 'success' ? '#34d399' : '#f87171',
                }}
              >
                {submissionFeedback.message}
              </div>
            )}

            {/* Display Roadmap Result */}
            {roadmapData.roadmapResult ? (
              <div
                style={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                    {roadmapData.roadmapResult.career_name}
                  </span>
                  <span style={{ fontSize: '10px', color: '#34d399', fontWeight: 600, backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                    ⏱️ {roadmapData.roadmapResult.total_estimated_duration}
                  </span>
                </div>

                <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4 }}>
                  {roadmapData.roadmapResult.summary}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                    MILESTONE STEPS ({roadmapData.roadmapResult.steps.length})
                  </div>
                  <div style={{ fontSize: '10px', color: '#34d399' }}>
                    {roadmapData.completedStepIds?.length || 0} completed
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {roadmapData.roadmapResult.steps.map((st, sIdx) => {
                    const isCompleted = (roadmapData.completedStepIds || []).includes(st.id)
                    return (
                      <div
                        key={sIdx}
                        style={{
                          padding: '10px',
                          borderRadius: '6px',
                          backgroundColor: isCompleted ? 'rgba(16, 185, 129, 0.08)' : '#131b2e',
                          border: isCompleted ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid #1e293b',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', flex: 1 }}>
                            <input
                              type="checkbox"
                              checked={isCompleted}
                              onChange={() => handleToggleStepComplete(st.id)}
                              style={{ cursor: 'pointer', accentColor: '#10b981' }}
                            />
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: isCompleted ? '#34d399' : '#f8fafc',
                                textDecoration: isCompleted ? 'line-through' : 'none',
                              }}
                            >
                              {sIdx + 1}. {st.title}
                            </span>
                          </label>
                          <span style={{ fontSize: '9px', textTransform: 'uppercase', padding: '1px 5px', borderRadius: '3px', backgroundColor: '#1e293b', color: '#38bdf8' }}>
                            {st.type}
                          </span>
                        </div>
                        <div style={{ fontSize: '10px', color: isCompleted ? '#94a3b8' : '#cbd5e1', lineHeight: 1.3, paddingLeft: '20px' }}>
                          {st.description}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#64748b', paddingLeft: '20px' }}>
                          <span>Skills: {st.skills.slice(0, 3).join(', ')}</span>
                          <span style={{ color: '#e2e8f0' }}>{st.estimated_duration}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Dynamic Replanning Section */}
                <div
                  style={{
                    marginTop: '8px',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px' }}>⚡</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase' }}>
                      Dynamic Roadmap Replanning
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: '10px', color: '#cbd5e1', lineHeight: 1.35 }}>
                    Changed skills, available time, or completed steps? Recalibrate the remaining roadmap without losing completed milestones.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <label style={{ ...labelStyle, fontSize: '10px' }}>Newly Acquired Skills (Comma-separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. Docker, TypeScript, FastApi"
                        value={replanNewSkills}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setReplanNewSkills(e.target.value)}
                        style={{ ...inputStyle, padding: '5px 8px', fontSize: '11px' }}
                      />
                    </div>

                    <div>
                      <label style={{ ...labelStyle, fontSize: '10px' }}>Updated Weekly Time</label>
                      <input
                        type="text"
                        placeholder="e.g. 25 hrs/week (Accelerated) or 8 hrs/week (Part-time)"
                        value={replanAvailableTime}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setReplanAvailableTime(e.target.value)}
                        style={{ ...inputStyle, padding: '5px 8px', fontSize: '11px' }}
                      />
                    </div>

                    <div>
                      <label style={{ ...labelStyle, fontSize: '10px' }}>Updated Target Career (Optional)</label>
                      <input
                        type="text"
                        placeholder={roadmapData.targetCareer || 'Leave blank to keep current'}
                        value={replanTargetCareer}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setReplanTargetCareer(e.target.value)}
                        style={{ ...inputStyle, padding: '5px 8px', fontSize: '11px' }}
                      />
                    </div>

                    <div>
                      <label style={{ ...labelStyle, fontSize: '10px' }}>Replanning Notes (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Need to prepare for hackathon next month"
                        value={replanNotes}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setReplanNotes(e.target.value)}
                        style={{ ...inputStyle, padding: '5px 8px', fontSize: '11px' }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleReplanRoadmap}
                      disabled={isSubmitting}
                      style={{
                        marginTop: '4px',
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: isSubmitting ? '#92400e' : '#d97706',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 600,
                        fontSize: '11px',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      {isSubmitting ? 'Replanning Remaining Milestones...' : '⚡ Replan Remaining Roadmap'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: '#64748b', fontSize: '11px', textAlign: 'center', padding: '16px 0' }}>
                No roadmap generated yet. Select a career above and click generate.
              </div>
            )}
          </div>
        )}

        {/* 6. Roadmap Step Individual Node Panel */}
        {isRoadmapStep && (
          <div>
            <div style={{ fontSize: '11px', color: '#a78bfa', fontWeight: 600, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Roadmap Step Milestone
            </div>

            <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: '#1e293b', color: '#38bdf8' }}>
                  {stepData.stepType || 'Milestone'}
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '8px' }}>
                  ⏱️ {stepData.estimatedDuration || 'N/A'}
                </span>
              </div>

              <div style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>
                {selectedNode.data.title as string}
              </div>

              <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4 }}>
                {selectedNode.data.description as string}
              </p>

              {stepData.skills && stepData.skills.length > 0 && (
                <div>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
                    TARGET SKILLS
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {stepData.skills.map((sk, idx) => (
                      <span key={idx} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#1e293b', color: '#e2e8f0' }}>
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {stepData.projects && stepData.projects.length > 0 && (
                <div>
                  <div style={{ fontSize: '10px', color: '#34d399', fontWeight: 600, marginBottom: '4px' }}>
                    PROJECTS & DELIVERABLES
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#cbd5e1' }}>
                    {stepData.projects.map((p, idx) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}

              {stepData.resources && stepData.resources.length > 0 && (
                <div>
                  <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 600, marginBottom: '4px' }}>
                    CURATED RESOURCES
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#93c5fd' }}>
                    {stepData.resources.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {stepData.completionCriteria && (
                <div style={{ backgroundColor: '#162033', padding: '8px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '10px', color: '#facc15', fontWeight: 600, marginBottom: '2px' }}>
                    COMPLETION CRITERIA
                  </div>
                  <div style={{ fontSize: '11px', color: '#fef08a', lineHeight: 1.3 }}>
                    {stepData.completionCriteria}
                  </div>
                </div>
              )}

              {/* Step Progress Tracking Controls */}
              <div
                style={{
                  marginTop: '6px',
                  padding: '10px',
                  backgroundColor: '#0b1120',
                  borderRadius: '6px',
                  border: '1px solid #1e293b',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                    Milestone Progress State
                  </span>
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '3px',
                      backgroundColor:
                        (stepData.progressStatus || (selectedNode.data.status === 'success' ? 'completed' : 'not_started')) === 'completed'
                          ? 'rgba(16, 185, 129, 0.2)'
                          : (stepData.progressStatus || 'not_started') === 'in_progress'
                          ? 'rgba(234, 179, 8, 0.2)'
                          : 'rgba(148, 163, 184, 0.15)',
                      color:
                        (stepData.progressStatus || (selectedNode.data.status === 'success' ? 'completed' : 'not_started')) === 'completed'
                          ? '#34d399'
                          : (stepData.progressStatus || 'not_started') === 'in_progress'
                          ? '#facc15'
                          : '#94a3b8',
                    }}
                  >
                    {(stepData.progressStatus || (selectedNode.data.status === 'success' ? 'completed' : 'not_started')).replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                  {(['not_started', 'in_progress', 'completed'] as StepProgressStatus[]).map((st) => {
                    const currentStatus: StepProgressStatus =
                      stepData.progressStatus ||
                      (selectedNode.data.status === 'success' ? 'completed' : 'not_started')
                    const isActive = currentStatus === st

                    const label =
                      st === 'completed'
                        ? '✓ Done'
                        : st === 'in_progress'
                        ? '⏳ Active'
                        : '○ To Do'

                    const activeBg =
                      st === 'completed'
                        ? '#059669'
                        : st === 'in_progress'
                        ? '#d97706'
                        : '#334155'

                    return (
                      <button
                        key={st}
                        type="button"
                        disabled={isSubmitting}
                        onClick={async () => {
                          const newProgressStatus = st
                          const nodeExecStatus =
                            st === 'completed'
                              ? 'success'
                              : st === 'in_progress'
                              ? 'running'
                              : 'idle'

                          // Identify parent roadmap ID & all steps
                          const parentRoadmapNode = nodes.find((n) => n.type === 'aiRoadmapNode')
                          const roadmapId =
                            stepData.roadmapId ||
                            parentRoadmapNode?.id ||
                            `roadmap-${activeProfileData.careerGoal || 'default'}`
                          const targetCareer =
                            (parentRoadmapNode?.data as AIRoadmapNodeData)?.targetCareer ||
                            activeProfileData.careerGoal ||
                            ''

                          // Find all roadmap step IDs in current workflow
                          const allStepNodes = nodes.filter((n) => n.type === 'roadmapStepNode')
                          const allStepIds = allStepNodes.map(
                            (n) => (n.data as RoadmapStepNodeData).stepId || n.id
                          )

                          // Optimistically update current step node
                          onUpdateNodeData(selectedNode.id, {
                            progressStatus: newProgressStatus,
                            status: nodeExecStatus,
                            statusMessage:
                              newProgressStatus === 'completed'
                                ? 'Completed'
                                : newProgressStatus === 'in_progress'
                                ? 'In Progress'
                                : 'Not Started',
                          })

                          // Persist via POST /api/progress
                          setIsSubmitting(true)
                          const res = await updateRoadmapProgressApi({
                            roadmap_id: roadmapId,
                            career_name: targetCareer,
                            step_id: stepData.stepId || selectedNode.id,
                            status: newProgressStatus,
                            all_step_ids: allStepIds.length > 0 ? allStepIds : undefined,
                          })
                          setIsSubmitting(false)

                          if (res.success && res.data && parentRoadmapNode) {
                            // Update parent AI Roadmap node with progress percentage and data
                            const updatedCompletedIds = Object.entries(res.data.step_statuses)
                              .filter(([, s]) => s === 'completed')
                              .map(([id]) => id)

                            onUpdateNodeData(parentRoadmapNode.id, {
                              progressPercentage: res.data.progress_percentage,
                              progressData: res.data,
                              completedStepIds: updatedCompletedIds,
                            })

                            setSubmissionFeedback({
                              type: 'success',
                              message: `Progress updated: ${res.data.progress_percentage}% completed (${res.data.completed_steps_count}/${res.data.total_steps})`,
                            })
                          }
                        }}
                        style={{
                          padding: '6px 4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          borderRadius: '4px',
                          border: isActive ? '1px solid transparent' : '1px solid #334155',
                          backgroundColor: isActive ? activeBg : '#1e293b',
                          color: isActive ? '#ffffff' : '#cbd5e1',
                          cursor: isSubmitting ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. Learning Node Panel */}
        {isLearning && (
          <div>
            <div style={{ fontSize: '11px', color: '#60a5fa', fontWeight: 600, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Skill Learning Curriculum
            </div>

            <p style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4, margin: '0 0 14px' }}>
              Curates precise learning plans for each roadmap skill: what to learn, learning sequence, estimated time, prerequisites, and practice drills. No paid course paywalls.
            </p>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Target Career Pathway</label>
              {availableDiscoveredCareers.length > 0 ? (
                <select
                  value={learningData.targetCareer || ''}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                    const chosen = e.target.value
                    onUpdateNodeData(selectedNode.id, { targetCareer: chosen })
                  }}
                  style={inputStyle}
                >
                  <option value="">-- Choose from discovered careers --</option>
                  {availableDiscoveredCareers.map((c, i) => (
                    <option key={i} value={c.career_name}>
                      {c.career_name}
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>
                  No discovered careers in workflow yet. Type target role below:
                </div>
              )}
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Target Career Role</label>
              <input
                type="text"
                placeholder={learningData.targetCareer || activeProfileData.careerGoal || 'e.g. Full Stack Developer'}
                value={customCareerInput || learningData.targetCareer || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setCustomCareerInput(e.target.value)
                  onUpdateNodeData(selectedNode.id, { targetCareer: e.target.value })
                }}
                style={inputStyle}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Skills to Learn (Comma-separated)</label>
              <input
                type="text"
                placeholder={
                  activeSkillGapData?.missing_skills?.join(', ') ||
                  'e.g. React, Node.js, PostgreSQL, Docker'
                }
                value={replanNewSkills}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setReplanNewSkills(e.target.value)}
                style={inputStyle}
              />
            </div>

            <button
              type="button"
              onClick={() =>
                handleFetchLearningRecommendations(
                  customCareerInput || learningData.targetCareer || '',
                  replanNewSkills
                )
              }
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '9px 14px',
                backgroundColor: isSubmitting ? '#1e40af' : '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '12px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '14px',
              }}
            >
              {isSubmitting ? 'Curating Curriculum...' : '📚 Recommend Learning Plan'}
            </button>

            {submissionFeedback && (
              <div
                style={{
                  marginBottom: '14px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  backgroundColor:
                    submissionFeedback.type === 'success'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(239, 68, 68, 0.15)',
                  border:
                    submissionFeedback.type === 'success'
                      ? '1px solid rgba(16, 185, 129, 0.3)'
                      : '1px solid rgba(239, 68, 68, 0.3)',
                  color: submissionFeedback.type === 'success' ? '#34d399' : '#f87171',
                }}
              >
                {submissionFeedback.message}
              </div>
            )}

            {/* Render Learning Recommendations */}
            {learningData.learningRecommendations && learningData.learningRecommendations.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                  RECOMMENDED SKILL MODULES ({learningData.learningRecommendations.length})
                </div>

                {learningData.learningRecommendations.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #1e293b',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                        {item.skill_name}
                      </span>
                      <span style={{ fontSize: '10px', color: '#34d399', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                        ⏱️ {item.estimated_time}
                      </span>
                    </div>

                    {/* What to Learn */}
                    <div>
                      <div style={{ fontSize: '10px', color: '#60a5fa', fontWeight: 600, marginBottom: '3px' }}>
                        WHAT TO LEARN
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#cbd5e1', lineHeight: 1.35 }}>
                        {item.what_to_learn.map((c, cIdx) => (
                          <li key={cIdx}>{c}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Learning Sequence */}
                    <div style={{ backgroundColor: '#131b2e', padding: '8px', borderRadius: '6px' }}>
                      <div style={{ fontSize: '10px', color: '#a78bfa', fontWeight: 600, marginBottom: '3px' }}>
                        CURRICULUM SEQUENCE
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {item.learning_sequence.map((seq, sIdx) => (
                          <div key={sIdx} style={{ fontSize: '10px', color: '#e2e8f0' }}>
                            {seq}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Prerequisite Knowledge */}
                    {item.prerequisite_knowledge && item.prerequisite_knowledge.length > 0 && (
                      <div>
                        <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Prerequisites: </span>
                        <span style={{ fontSize: '10px', color: '#e2e8f0' }}>
                          {item.prerequisite_knowledge.join(', ')}
                        </span>
                      </div>
                    )}

                    {/* Practice Recommendation */}
                    <div style={{ backgroundColor: '#162033', padding: '8px', borderRadius: '6px' }}>
                      <div style={{ fontSize: '10px', color: '#facc15', fontWeight: 600, marginBottom: '2px' }}>
                        PRACTICE DRILL
                      </div>
                      <div style={{ fontSize: '11px', color: '#fef08a', lineHeight: 1.35 }}>
                        {item.practice_recommendation}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#64748b', fontSize: '11px', textAlign: 'center', padding: '16px 0' }}>
                No learning recommendations yet. Click "Recommend Learning Plan" above.
              </div>
            )}
          </div>
        )}

        {/* 8. Projects Node Panel */}
        {isProjects && (
          <div>
            <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 600, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Proof-of-Work Project Recommendations
            </div>

            <p style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4, margin: '0 0 14px' }}>
              Generates high-impact portfolio project blueprints tailored to the selected career, verifying skills with measurable deliverables and hiring value.
            </p>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Target Career Pathway</label>
              {availableDiscoveredCareers.length > 0 ? (
                <select
                  value={projectsData.targetCareer || ''}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                    const chosen = e.target.value
                    onUpdateNodeData(selectedNode.id, { targetCareer: chosen })
                  }}
                  style={inputStyle}
                >
                  <option value="">-- Choose from discovered careers --</option>
                  {availableDiscoveredCareers.map((c, i) => (
                    <option key={i} value={c.career_name}>
                      {c.career_name}
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>
                  No discovered careers in workflow yet. Type target role below:
                </div>
              )}
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Target Career Role</label>
              <input
                type="text"
                placeholder={projectsData.targetCareer || activeProfileData.careerGoal || 'e.g. AI Engineer'}
                value={customCareerInput || projectsData.targetCareer || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setCustomCareerInput(e.target.value)
                  onUpdateNodeData(selectedNode.id, { targetCareer: e.target.value })
                }}
                style={inputStyle}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Focus Skills for Projects (Comma-separated)</label>
              <input
                type="text"
                placeholder={
                  activeSkillGapData?.missing_skills?.join(', ') ||
                  'e.g. Python, PyTorch, Docker, FastAPI'
                }
                value={replanNewSkills}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setReplanNewSkills(e.target.value)}
                style={inputStyle}
              />
            </div>

            <button
              type="button"
              onClick={() =>
                handleFetchProjectRecommendations(
                  customCareerInput || projectsData.targetCareer || '',
                  replanNewSkills
                )
              }
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '9px 14px',
                backgroundColor: isSubmitting ? '#065f46' : '#059669',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '12px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '14px',
              }}
            >
              {isSubmitting ? 'Designing Blueprints...' : '🛠️ Recommend Portfolio Projects'}
            </button>

            {submissionFeedback && (
              <div
                style={{
                  marginBottom: '14px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  backgroundColor:
                    submissionFeedback.type === 'success'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(239, 68, 68, 0.15)',
                  border:
                    submissionFeedback.type === 'success'
                      ? '1px solid rgba(16, 185, 129, 0.3)'
                      : '1px solid rgba(239, 68, 68, 0.3)',
                  color: submissionFeedback.type === 'success' ? '#34d399' : '#f87171',
                }}
              >
                {submissionFeedback.message}
              </div>
            )}

            {/* Render Project Recommendations */}
            {projectsData.projectRecommendations && projectsData.projectRecommendations.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                  RECOMMENDED PORTFOLIO BLUEPRINTS ({projectsData.projectRecommendations.length})
                </div>

                {projectsData.projectRecommendations.map((proj, pIdx) => (
                  <div
                    key={pIdx}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #1e293b',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                        {proj.project_title}
                      </span>
                      <span
                        style={{
                          fontSize: '9px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: 700,
                          backgroundColor:
                            proj.difficulty === 'Advanced'
                              ? 'rgba(239, 68, 68, 0.2)'
                              : proj.difficulty === 'Intermediate'
                              ? 'rgba(245, 158, 11, 0.2)'
                              : 'rgba(16, 185, 129, 0.2)',
                          color:
                            proj.difficulty === 'Advanced'
                              ? '#fca5a5'
                              : proj.difficulty === 'Intermediate'
                              ? '#fde047'
                              : '#86efac',
                        }}
                      >
                        {proj.difficulty}
                      </span>
                    </div>

                    {/* Skills Practiced */}
                    {proj.skills_practiced && proj.skills_practiced.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                        {proj.skills_practiced.map((sk, skIdx) => (
                          <span
                            key={skIdx}
                            style={{
                              fontSize: '9px',
                              padding: '1px 5px',
                              borderRadius: '3px',
                              backgroundColor: '#1e293b',
                              color: '#cbd5e1',
                            }}
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Expected Outcome */}
                    <div>
                      <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 600, marginBottom: '2px' }}>
                        EXPECTED DELIVERABLE & OUTCOME
                      </div>
                      <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1', lineHeight: 1.35 }}>
                        {proj.expected_outcome}
                      </p>
                    </div>

                    {/* Portfolio Value */}
                    <div style={{ backgroundColor: '#131b2e', padding: '8px', borderRadius: '6px' }}>
                      <div style={{ fontSize: '10px', color: '#34d399', fontWeight: 600, marginBottom: '2px' }}>
                        WHY HIRING MANAGERS CARE (PORTFOLIO VALUE)
                      </div>
                      <div style={{ fontSize: '11px', color: '#a7f3d0', lineHeight: 1.35 }}>
                        {proj.portfolio_value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#64748b', fontSize: '11px', textAlign: 'center', padding: '16px 0' }}>
                No project blueprints generated yet. Click "Recommend Portfolio Projects" above.
              </div>
            )}
          </div>
        )}

        {/* 9. Internship Node Configuration */}
        {isInternship && (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '14px',
                padding: '8px 10px',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '6px',
              }}
            >
              <span style={{ fontSize: '18px' }}>💼</span>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#a5b4fc' }}>
                  Internship Pathway Node
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                  Target: {internshipData.targetCareer || activeProfileData.careerGoal || 'Selected Career'}
                </div>
              </div>
            </div>

            {/* Disclaimer Badge */}
            <div
              style={{
                marginBottom: '14px',
                padding: '8px 10px',
                backgroundColor: 'rgba(234, 179, 8, 0.1)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                borderRadius: '6px',
                fontSize: '11px',
                color: '#fef08a',
                lineHeight: 1.4,
              }}
            >
              <strong>⚠️ Educational Blueprint Notice:</strong> Internship data represents realistic market archetypes & benchmarks for career preparation. No simulated live job scraping.
            </div>

            {/* Action button to refresh/fetch pathway */}
            <div style={{ marginBottom: '16px' }}>
              <button
                type="button"
                onClick={async () => {
                  const targetCareer =
                    internshipData.targetCareer ||
                    activeProfileData.careerGoal ||
                    'Full Stack Developer'
                  const candidateSkills = (activeProfileData.skills || '')
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)

                  setIsSubmitting(true)
                  setSubmissionFeedback(null)
                  onUpdateNodeData(selectedNode.id, {
                    status: 'running',
                    statusMessage: 'Fetching Pathway Archetype...',
                  })

                  const res = await fetchCareerPathwayApi({
                    career_name: targetCareer,
                    candidate_skills: candidateSkills,
                    education_level: activeProfileData.educationLevel || "Bachelor's Degree",
                  })

                  setIsSubmitting(false)
                  if (res.success && res.data) {
                    onUpdateNodeData(selectedNode.id, {
                      status: 'success',
                      statusMessage: 'Blueprint Ready',
                      internshipData: res.data.internship,
                      targetCareer: res.data.career_name,
                    })
                    setSubmissionFeedback({
                      type: 'success',
                      message: 'Internship archetype fetched successfully!',
                    })
                  } else {
                    onUpdateNodeData(selectedNode.id, {
                      status: 'error',
                      statusMessage: 'Fetch Failed',
                    })
                    setSubmissionFeedback({
                      type: 'error',
                      message: res.error || 'Failed to fetch internship blueprint.',
                    })
                  }
                }}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  background: isSubmitting ? '#475569' : '#6366f1',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '9px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <span>{isSubmitting ? '⏳' : '⚡'}</span>
                <span>{isSubmitting ? 'Updating...' : 'Fetch Internship Blueprint'}</span>
              </button>
            </div>

            {submissionFeedback && (
              <div
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  marginBottom: '12px',
                  backgroundColor:
                    submissionFeedback.type === 'success'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(239, 68, 68, 0.15)',
                  border: `1px solid ${
                    submissionFeedback.type === 'success'
                      ? 'rgba(16, 185, 129, 0.3)'
                      : 'rgba(239, 68, 68, 0.3)'
                  }`,
                  color: submissionFeedback.type === 'success' ? '#34d399' : '#f87171',
                }}
              >
                {submissionFeedback.message}
              </div>
            )}

            {internshipData.internshipData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ backgroundColor: '#131b2e', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
                    {internshipData.internshipData.title}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>
                    {internshipData.internshipData.organization_type} · {internshipData.internshipData.location_type}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
                    <div style={{ backgroundColor: '#0b1120', padding: '8px', borderRadius: '6px' }}>
                      <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Duration</div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>{internshipData.internshipData.duration}</div>
                    </div>
                    <div style={{ backgroundColor: '#0b1120', padding: '8px', borderRadius: '6px' }}>
                      <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Stipend Range</div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#34d399' }}>{internshipData.internshipData.stipend_range}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: '10px', backgroundColor: '#0b1120', padding: '8px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>PPO Conversion Potential</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#a5b4fc', marginTop: '2px' }}>{internshipData.internshipData.conversion_potential}</div>
                  </div>
                </div>

                {/* Required Skills */}
                <div style={{ backgroundColor: '#131b2e', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>
                    Prerequisite Skills
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {internshipData.internshipData.required_skills.map((sk, idx) => (
                      <span key={idx} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', backgroundColor: '#1e293b', color: '#cbd5e1' }}>
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Learning Outcomes */}
                <div style={{ backgroundColor: '#131b2e', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: '10px', color: '#34d399', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>
                    Key Learning & Experiential Outcomes
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4 }}>
                    {internshipData.internshipData.learning_outcomes.map((out, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{out}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div style={{ color: '#64748b', fontSize: '11px', textAlign: 'center', padding: '16px 0' }}>
                No internship blueprint loaded. Click "Fetch Internship Blueprint" above.
              </div>
            )}
          </div>
        )}

        {/* 10. Job (Entry-Level Role) Node Configuration */}
        {isJob && (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '14px',
                padding: '8px 10px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: '6px',
              }}
            >
              <span style={{ fontSize: '18px' }}>🚀</span>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#93c5fd' }}>
                  Entry-Level Role Node
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                  Target: {jobData.targetCareer || activeProfileData.careerGoal || 'Selected Career'}
                </div>
              </div>
            </div>

            {/* Disclaimer Badge */}
            <div
              style={{
                marginBottom: '14px',
                padding: '8px 10px',
                backgroundColor: 'rgba(234, 179, 8, 0.1)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                borderRadius: '6px',
                fontSize: '11px',
                color: '#fef08a',
                lineHeight: 1.4,
              }}
            >
              <strong>⚠️ Educational Blueprint Notice:</strong> Job profile represents verified career progression benchmarks and competency standards. Not a fake live job posting.
            </div>

            {/* Action button to fetch archetype */}
            <div style={{ marginBottom: '16px' }}>
              <button
                type="button"
                onClick={async () => {
                  const targetCareer =
                    jobData.targetCareer ||
                    activeProfileData.careerGoal ||
                    'Full Stack Developer'
                  const candidateSkills = (activeProfileData.skills || '')
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)

                  setIsSubmitting(true)
                  setSubmissionFeedback(null)
                  onUpdateNodeData(selectedNode.id, {
                    status: 'running',
                    statusMessage: 'Fetching Entry Role Archetype...',
                  })

                  const res = await fetchCareerPathwayApi({
                    career_name: targetCareer,
                    candidate_skills: candidateSkills,
                    education_level: activeProfileData.educationLevel || "Bachelor's Degree",
                  })

                  setIsSubmitting(false)
                  if (res.success && res.data) {
                    onUpdateNodeData(selectedNode.id, {
                      status: 'success',
                      statusMessage: 'Role Archetype Ready',
                      entryRoleData: res.data.entry_role,
                      targetCareer: res.data.career_name,
                    })
                    setSubmissionFeedback({
                      type: 'success',
                      message: 'Entry role archetype fetched successfully!',
                    })
                  } else {
                    onUpdateNodeData(selectedNode.id, {
                      status: 'error',
                      statusMessage: 'Fetch Failed',
                    })
                    setSubmissionFeedback({
                      type: 'error',
                      message: res.error || 'Failed to fetch entry role archetype.',
                    })
                  }
                }}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  background: isSubmitting ? '#475569' : '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '9px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <span>{isSubmitting ? '⏳' : '🚀'}</span>
                <span>{isSubmitting ? 'Updating...' : 'Fetch Entry-Level Archetype'}</span>
              </button>
            </div>

            {submissionFeedback && (
              <div
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  marginBottom: '12px',
                  backgroundColor:
                    submissionFeedback.type === 'success'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(239, 68, 68, 0.15)',
                  border: `1px solid ${
                    submissionFeedback.type === 'success'
                      ? 'rgba(16, 185, 129, 0.3)'
                      : 'rgba(239, 68, 68, 0.3)'
                  }`,
                  color: submissionFeedback.type === 'success' ? '#34d399' : '#f87171',
                }}
              >
                {submissionFeedback.message}
              </div>
            )}

            {jobData.entryRoleData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ backgroundColor: '#131b2e', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
                    {jobData.entryRoleData.title}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {jobData.entryRoleData.experience_level}
                  </div>

                  <div style={{ marginTop: '10px', backgroundColor: '#0b1120', padding: '8px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Typical Market Compensation</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399', marginTop: '2px' }}>{jobData.entryRoleData.typical_salary_range}</div>
                  </div>

                  <div style={{ marginTop: '8px', backgroundColor: '#0b1120', padding: '8px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Minimum Education & Qualifications</div>
                    <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '2px' }}>{jobData.entryRoleData.minimum_qualifications}</div>
                  </div>
                </div>

                {/* Key Responsibilities */}
                <div style={{ backgroundColor: '#131b2e', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>
                    Core Day-to-Day Responsibilities
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4 }}>
                    {jobData.entryRoleData.key_responsibilities.map((resp, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{resp}</li>
                    ))}
                  </ul>
                </div>

                {/* Interview Focus Areas */}
                <div style={{ backgroundColor: '#131b2e', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: '10px', color: '#a78bfa', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>
                    Hiring Manager Interview Focus
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {jobData.entryRoleData.interview_focus_areas.map((foc, idx) => (
                      <span key={idx} style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#1e293b', color: '#ddd6fe' }}>
                        🎯 {foc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: '#64748b', fontSize: '11px', textAlign: 'center', padding: '16px 0' }}>
                No entry-level role blueprint loaded. Click "Fetch Entry-Level Archetype" above.
              </div>
            )}
          </div>
        )}

        {/* 11. Career Growth Progression Node Configuration */}
        {isCareerGrowth && (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '14px',
                padding: '8px 10px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '6px',
              }}
            >
              <span style={{ fontSize: '18px' }}>📈</span>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#6ee7b7' }}>
                  Career Growth Progression Ladder
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                  Target: {growthData.targetCareer || activeProfileData.careerGoal || 'Selected Career'}
                </div>
              </div>
            </div>

            {/* Disclaimer Badge */}
            <div
              style={{
                marginBottom: '14px',
                padding: '8px 10px',
                backgroundColor: 'rgba(234, 179, 8, 0.1)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                borderRadius: '6px',
                fontSize: '11px',
                color: '#fef08a',
                lineHeight: 1.4,
              }}
            >
              <strong>⚠️ Educational Benchmark Notice:</strong> Progression stages and illustrative compensation brackets reflect industry market standards. Advancement timelines, job offers, and salary brackets depend on performance and local markets; no outcomes are guaranteed.
            </div>

            {/* Action button to fetch growth ladder */}
            <div style={{ marginBottom: '16px' }}>
              <button
                type="button"
                onClick={async () => {
                  const targetCareer =
                    growthData.targetCareer ||
                    activeProfileData.careerGoal ||
                    'Full Stack Developer'
                  const candidateSkills = (activeProfileData.skills || '')
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)

                  setIsSubmitting(true)
                  setSubmissionFeedback(null)
                  onUpdateNodeData(selectedNode.id, {
                    status: 'running',
                    statusMessage: 'Generating 5-Stage Growth Ladder...',
                  })

                  const res = await fetchCareerGrowthApi({
                    career_name: targetCareer,
                    current_skills: candidateSkills,
                  })

                  setIsSubmitting(false)
                  if (res.success && res.data) {
                    onUpdateNodeData(selectedNode.id, {
                      status: 'success',
                      statusMessage: '5-Stage Ladder Ready',
                      stagesData: res.data.all_stages,
                      growthResponse: res.data,
                      targetCareer: res.data.career_name,
                    })
                    setSubmissionFeedback({
                      type: 'success',
                      message: '5-Stage career growth progression ladder generated successfully!',
                    })
                  } else {
                    onUpdateNodeData(selectedNode.id, {
                      status: 'error',
                      statusMessage: 'Fetch Failed',
                    })
                    setSubmissionFeedback({
                      type: 'error',
                      message: res.error || 'Failed to fetch career growth progression ladder.',
                    })
                  }
                }}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  background: isSubmitting ? '#475569' : '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '9px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <span>{isSubmitting ? '⏳' : '📈'}</span>
                <span>{isSubmitting ? 'Generating...' : 'Generate 5-Stage Career Growth Ladder'}</span>
              </button>
            </div>

            {submissionFeedback && (
              <div
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  marginBottom: '12px',
                  backgroundColor:
                    submissionFeedback.type === 'success'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(239, 68, 68, 0.15)',
                  border: `1px solid ${
                    submissionFeedback.type === 'success'
                      ? 'rgba(16, 185, 129, 0.3)'
                      : 'rgba(239, 68, 68, 0.3)'
                  }`,
                  color: submissionFeedback.type === 'success' ? '#34d399' : '#f87171',
                }}
              >
                {submissionFeedback.message}
              </div>
            )}

            {growthData.stagesData && growthData.stagesData.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {growthData.stagesData.map((stage, idx) => {
                  const isManagement = stage.role_type === 'management' || idx === 4
                  const isSpecialist = stage.role_type === 'specialist_lead' || idx === 3
                  const badgeColor = isManagement ? '#f59e0b' : isSpecialist ? '#c084fc' : idx === 2 ? '#38bdf8' : idx === 1 ? '#34d399' : '#94a3b8'
                  const badgeBg = isManagement ? 'rgba(245, 158, 11, 0.15)' : isSpecialist ? 'rgba(192, 132, 252, 0.15)' : 'rgba(51, 65, 85, 0.6)'

                  return (
                    <div
                      key={stage.stage_level || idx}
                      style={{
                        backgroundColor: '#131b2e',
                        padding: '12px',
                        borderRadius: '8px',
                        border: `1px solid ${isManagement ? 'rgba(245, 158, 11, 0.3)' : '#1e293b'}`,
                      }}
                    >
                      {/* Header with Title and Tier Badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px', gap: '8px' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                            {stage.stage_name}
                          </div>
                          <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                            Tenure Expectation: <strong style={{ color: '#cbd5e1' }}>{stage.experience_expectations || stage.years_of_experience || 'Standard'}</strong>
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: '9px',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: 700,
                            backgroundColor: badgeBg,
                            color: badgeColor,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {isManagement ? 'Leadership Track' : isSpecialist ? 'Principal IC' : `Stage ${stage.stage_level}`}
                        </span>
                      </div>

                      {/* Illustrative Compensation Disclaimer */}
                      <div
                        style={{
                          fontSize: '10px',
                          color: '#64748b',
                          backgroundColor: '#0b1120',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          marginBottom: '10px',
                        }}
                      >
                        <span style={{ color: '#94a3b8' }}>Benchmark Bracket: </span>
                        <span style={{ color: '#38bdf8', fontWeight: 600 }}>{stage.target_compensation_range}</span>
                      </div>

                      {/* 1. Skills Required for Next Stage */}
                      {stage.skills_required_for_next_stage && stage.skills_required_for_next_stage.length > 0 && (
                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                            🎯 Skills Required for Next Stage
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {stage.skills_required_for_next_stage.map((sk, sIdx) => (
                              <span
                                key={sIdx}
                                style={{
                                  fontSize: '10px',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: '#1e293b',
                                  color: '#7dd3fc',
                                  border: '1px solid rgba(56, 189, 248, 0.2)',
                                }}
                              >
                                {sk}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 2. Possible Specialization */}
                      {stage.possible_specialization && stage.possible_specialization.length > 0 && (
                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ fontSize: '10px', color: '#a78bfa', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                            🔍 Possible Specializations
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {stage.possible_specialization.map((spec, spIdx) => (
                              <span
                                key={spIdx}
                                style={{
                                  fontSize: '10px',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: 'rgba(167, 139, 250, 0.12)',
                                  color: '#c4b5fd',
                                  border: '1px solid rgba(167, 139, 250, 0.25)',
                                }}
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 3. Upskilling Recommendations */}
                      {stage.upskilling_recommendations && stage.upskilling_recommendations.length > 0 && (
                        <div style={{ marginBottom: '10px', backgroundColor: '#0f172a', padding: '8px', borderRadius: '6px' }}>
                          <div style={{ fontSize: '10px', color: '#34d399', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                            📚 Upskilling Recommendations
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4 }}>
                            {stage.upskilling_recommendations.map((rec, rIdx) => (
                              <li key={rIdx} style={{ marginBottom: '3px' }}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 4. Management Track Notes (if applicable) */}
                      {stage.management_track_notes && (
                        <div
                          style={{
                            padding: '6px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(245, 158, 11, 0.08)',
                            border: '1px solid rgba(245, 158, 11, 0.2)',
                            fontSize: '10px',
                            color: '#fef08a',
                            lineHeight: 1.35,
                          }}
                        >
                          <strong>🧭 Track Context:</strong> {stage.management_track_notes}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ color: '#64748b', fontSize: '11px', textAlign: 'center', padding: '16px 0' }}>
                No career growth ladder loaded yet. Click "Generate 5-Stage Career Growth Ladder" above.
              </div>
            )}
          </div>
        )}

        {/* 12. What-If Career Simulation Node Panel */}
        {isSimulation && (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '14px',
                padding: '8px 10px',
                background: 'rgba(168, 85, 247, 0.1)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                borderRadius: '6px',
              }}
            >
              <span style={{ fontSize: '18px' }}>🔮</span>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#c084fc' }}>
                  What-If Career Simulator
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                  Hypothetical pathway simulation (Primary roadmap preserved)
                </div>
              </div>
            </div>

            <p style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4, margin: '0 0 12px' }}>
              Simulate alternative career trajectories using your current profile without overriding your primary active roadmap.
            </p>

            {/* Quick preset selector buttons */}
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Quick Presets to Explore:</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '5px' }}>
                {[
                  'Data Analyst',
                  'Product Manager',
                  'Government career',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      onUpdateNodeData(selectedNode.id, {
                        simulatedCareer: preset,
                      })
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '6px 10px',
                      borderRadius: '5px',
                      border:
                        simulationData.simulatedCareer === preset
                          ? '1px solid #c084fc'
                          : '1px solid #334155',
                      backgroundColor:
                        simulationData.simulatedCareer === preset
                          ? 'rgba(168, 85, 247, 0.18)'
                          : '#131b2e',
                      color: simulationData.simulatedCareer === preset ? '#f3e8ff' : '#94a3b8',
                      fontSize: '11px',
                      fontWeight: simulationData.simulatedCareer === preset ? 600 : 400,
                      cursor: 'pointer',
                    }}
                  >
                    "What if I choose {preset}?"
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div style={formGroupStyle}>
              <label style={labelStyle}>Or Enter Any Career Title</label>
              <input
                type="text"
                placeholder="e.g. Data Analyst, Product Manager, Government career"
                value={simulationData.simulatedCareer || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  onUpdateNodeData(selectedNode.id, { simulatedCareer: e.target.value })
                }
                style={inputStyle}
              />
            </div>

            {/* Simulate Button */}
            <div style={{ marginBottom: '16px' }}>
              <button
                type="button"
                disabled={isSubmitting || !simulationData.simulatedCareer?.trim()}
                onClick={async () => {
                  const targetCareer = (simulationData.simulatedCareer || '').trim()
                  if (!targetCareer) return

                  setIsSubmitting(true)
                  setSubmissionFeedback(null)
                  onUpdateNodeData(selectedNode.id, {
                    status: 'running',
                    statusMessage: 'Simulating Alternative Route...',
                  })

                  const candidateSkills = (activeProfileData.skills || '')
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)

                  const res = await simulateCareerApi({
                    career_name: targetCareer,
                    education: activeProfileData.educationLevel || "Bachelor's Degree",
                    degree: activeProfileData.degreeOrCourse || '',
                    branch: activeProfileData.branchOrSubject || '',
                    current_skills: candidateSkills,
                    available_time: activeProfileData.availableTime || '15 hrs/week',
                    profile_id: activeProfileData.profileId,
                  })

                  setIsSubmitting(false)

                  if (res.success && res.data) {
                    onUpdateNodeData(selectedNode.id, {
                      status: 'success',
                      statusMessage: 'Simulation Complete',
                      title: `What-If: ${res.data.career}`,
                      description: res.data.estimated_path,
                      simulationData: res.data,
                      summaryItems: [
                        { label: 'Role', value: res.data.career },
                        { label: 'Eligibility', value: res.data.eligibility.status },
                        { label: 'Steps', value: `${res.data.major_steps.length} Milestones` },
                      ],
                    })
                    setSubmissionFeedback({
                      type: 'success',
                      message: `Simulation for "${res.data.career}" generated successfully!`,
                    })
                  } else {
                    onUpdateNodeData(selectedNode.id, {
                      status: 'error',
                      statusMessage: 'Simulation Failed',
                    })
                    setSubmissionFeedback({
                      type: 'error',
                      message: res.error || 'Failed to simulate career.',
                    })
                  }
                }}
                style={{
                  width: '100%',
                  background:
                    isSubmitting || !simulationData.simulatedCareer?.trim()
                      ? '#475569'
                      : 'linear-gradient(135deg, #9333ea 0%, #4f46e5 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '9px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor:
                    isSubmitting || !simulationData.simulatedCareer?.trim()
                      ? 'not-allowed'
                      : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 4px rgba(147, 51, 234, 0.3)',
                }}
              >
                <span>{isSubmitting ? '⏳' : '🔮'}</span>
                <span>{isSubmitting ? 'Simulating...' : 'Run What-If Simulation'}</span>
              </button>
            </div>

            {submissionFeedback && (
              <div
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  marginBottom: '12px',
                  backgroundColor:
                    submissionFeedback.type === 'success'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(239, 68, 68, 0.15)',
                  border: `1px solid ${
                    submissionFeedback.type === 'success'
                      ? 'rgba(16, 185, 129, 0.3)'
                      : 'rgba(239, 68, 68, 0.3)'
                  }`,
                  color: submissionFeedback.type === 'success' ? '#34d399' : '#f87171',
                }}
              >
                {submissionFeedback.message}
              </div>
            )}

            {simulationData.simulationData && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* 1. Estimated Path Overview */}
                <div style={{ backgroundColor: '#131b2e', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: '10px', color: '#c084fc', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Estimated Pathway
                  </div>
                  <p style={{ margin: 0, fontSize: '11px', color: '#e2e8f0', lineHeight: 1.4 }}>
                    {simulationData.simulationData.estimated_path}
                  </p>
                </div>

                {/* 2. Eligibility & Required Qualifications */}
                <div style={{ backgroundColor: '#131b2e', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                      Eligibility Status
                    </span>
                    {getStatusColorConfig(simulationData.simulationData.eligibility.status) && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          color: getStatusColorConfig(simulationData.simulationData.eligibility.status).textColor,
                          backgroundColor: getStatusColorConfig(simulationData.simulationData.eligibility.status).bgColor,
                          border: `1px solid ${getStatusColorConfig(simulationData.simulationData.eligibility.status).borderColor}`,
                        }}
                      >
                        {getStatusColorConfig(simulationData.simulationData.eligibility.status).badgeText}
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.35, marginBottom: '6px' }}>
                    {simulationData.simulationData.eligibility.explanation}
                  </div>

                  <div style={{ backgroundColor: '#0b1120', padding: '8px', borderRadius: '6px', marginTop: '6px' }}>
                    <div style={{ fontSize: '9px', color: '#fbbf24', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>
                      Required Qualifications & Benchmarks
                    </div>
                    <div style={{ fontSize: '10px', color: '#fef08a', lineHeight: 1.35 }}>
                      {simulationData.simulationData.required_qualification}
                    </div>
                  </div>
                </div>

                {/* 3. Skill Gap Analysis */}
                <div style={{ backgroundColor: '#131b2e', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                    Skill Gap Breakdown
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>
                    Baseline: <strong style={{ color: '#e2e8f0' }}>{simulationData.simulationData.skill_gap.skill_level}</strong>
                  </div>

                  {simulationData.simulationData.skill_gap.missing_skills.length > 0 && (
                    <div style={{ marginBottom: '6px' }}>
                      <div style={{ fontSize: '9px', color: '#f87171', fontWeight: 600, textTransform: 'uppercase', marginBottom: '3px' }}>
                        Missing Priority Skills
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                        {simulationData.simulationData.skill_gap.missing_skills.map((ms, idx) => (
                          <span key={idx} style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '3px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5' }}>
                            {ms}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {simulationData.simulationData.skill_gap.matched_skills.length > 0 && (
                    <div>
                      <div style={{ fontSize: '9px', color: '#34d399', fontWeight: 600, textTransform: 'uppercase', marginBottom: '3px' }}>
                        Transferable Current Skills
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                        {simulationData.simulationData.skill_gap.matched_skills.map((ms, idx) => (
                          <span key={idx} style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '3px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#86efac' }}>
                            ✓ {ms}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Major Steps & Phased Milestones */}
                <div style={{ backgroundColor: '#131b2e', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: '10px', color: '#a78bfa', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                    Phased Milestones ({simulationData.simulationData.major_steps.length} Steps)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {simulationData.simulationData.major_steps.map((st) => (
                      <div
                        key={st.step_number}
                        style={{
                          backgroundColor: '#0b1120',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: '1px solid #1e293b',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc' }}>
                            Step {st.step_number}: {st.title}
                          </span>
                          <span style={{ fontSize: '9px', color: '#94a3b8' }}>
                            ⏱️ {st.estimated_duration}
                          </span>
                        </div>
                        <div style={{ fontSize: '10px', color: '#cbd5e1', lineHeight: 1.35, marginBottom: '4px' }}>
                          {st.focus}
                        </div>
                        <div style={{ fontSize: '9px', color: '#38bdf8' }}>
                          Deliverable: <strong>{st.deliverable}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Possible Entry Roles */}
                <div style={{ backgroundColor: '#131b2e', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: '10px', color: '#34d399', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                    Immediate Target Entry Roles
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {simulationData.simulationData.possible_entry_roles.map((role, idx) => (
                      <span key={idx} style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#1e293b', color: '#a7f3d0' }}>
                        🎯 {role}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 13. Interview Preparation Node Panel */}
        {isInterview && (
          <div>
            <div style={{ fontSize: '11px', color: '#fb923c', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              🎤 Interview Preparation Workspace
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4, marginBottom: '14px' }}>
              Role-specific mock interview preparation connected to your target career, skills, and projects. Type written answers to receive AI evaluation, strengths, and model responses.
            </div>

            {/* Target Career Display & Control */}
            <div style={{ ...formGroupStyle, backgroundColor: '#131b2e', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
              <label style={labelStyle}>Target Career Role</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={interviewData.targetCareer || roadmapData.targetCareer || activeProfileData.careerGoal || 'Full Stack Developer'}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    onUpdateNodeData(selectedNode.id, { targetCareer: e.target.value })
                  }
                  style={inputStyle}
                  placeholder="e.g. Data Analyst, Full Stack Developer"
                />
              </div>
            </div>

            {/* Generate Questions Button */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => handleGenerateInterview()}
                disabled={isGeneratingInterview}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#ffffff',
                  background: isGeneratingInterview
                    ? '#334155'
                    : 'linear-gradient(135deg, #ea580c 0%, #f97316 50%, #f59e0b 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  cursor: isGeneratingInterview ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)',
                }}
              >
                {isGeneratingInterview
                  ? '⏳ Generating Role Questions...'
                  : interviewData.interviewSuite
                  ? '🔄 Regenerate Interview Suite'
                  : '✨ Generate Interview Questions'}
              </button>

              <button
                type="button"
                onClick={() => setIsLiveMockOpen(true)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#ffffff',
                  background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #4f46e5 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <span>🎙️</span> Launch Interactive AI Mock Interview
              </button>
            </div>

            {/* If Suite Exists: Category Tabs + Questions list */}
            {interviewData.interviewSuite && (
              <div>
                {/* Overview Banner */}
                <div style={{ backgroundColor: '#131b2e', padding: '10px 12px', borderRadius: '8px', border: '1px solid #1e293b', marginBottom: '14px' }}>
                  <div style={{ fontSize: '10px', color: '#fb923c', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Suite Summary ({interviewData.interviewSuite.total_questions_count} Questions)
                  </div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4 }}>
                    {interviewData.interviewSuite.summary}
                  </div>
                </div>

                {/* Category Navigation Tabs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginBottom: '14px' }}>
                  {[
                    { id: 'technical', label: '💻 Tech', count: interviewData.interviewSuite.technical_questions?.length || 0 },
                    { id: 'behavioral', label: '🤝 STAR', count: interviewData.interviewSuite.behavioral_questions?.length || 0 },
                    { id: 'project', label: '🛠️ Projects', count: interviewData.interviewSuite.project_questions?.length || 0 },
                    { id: 'career_specific', label: '🎯 Role', count: interviewData.interviewSuite.career_specific_questions?.length || 0 },
                  ].map((tab) => {
                    const isActive = activeInterviewTab === tab.id
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveInterviewTab(tab.id as any)}
                        style={{
                          padding: '7px 4px',
                          borderRadius: '6px',
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor: isActive ? 'rgba(249, 115, 22, 0.2)' : '#131b2e',
                          color: isActive ? '#fb923c' : '#94a3b8',
                          border: isActive ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid #1e293b',
                          cursor: 'pointer',
                          textAlign: 'center',
                        }}
                      >
                        {tab.label} ({tab.count})
                      </button>
                    )
                  })}
                </div>

                {/* Active Questions List */}
                {(() => {
                  const currentQuestions: InterviewQuestionItem[] =
                    activeInterviewTab === 'technical'
                      ? interviewData.interviewSuite.technical_questions || []
                      : activeInterviewTab === 'behavioral'
                      ? interviewData.interviewSuite.behavioral_questions || []
                      : activeInterviewTab === 'project'
                      ? interviewData.interviewSuite.project_questions || []
                      : interviewData.interviewSuite.career_specific_questions || []

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {currentQuestions.map((q, idx) => {
                        const savedAnswerRecord = interviewData.answers?.[q.id]
                        const currentInput = studentAnswers[q.id] !== undefined
                          ? studentAnswers[q.id]
                          : savedAnswerRecord?.answer || ''
                        const isEvaluating = evaluatingQuestionId === q.id
                        const hasEvaluation = !!savedAnswerRecord?.evaluation

                        return (
                          <div
                            key={q.id}
                            style={{
                              backgroundColor: '#131b2e',
                              borderRadius: '8px',
                              border: hasEvaluation ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid #1e293b',
                              padding: '12px',
                            }}
                          >
                            {/* Question Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                                #{idx + 1} • {q.id}
                              </span>
                              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                {q.difficulty && (
                                  <span
                                    style={{
                                      fontSize: '9px',
                                      padding: '1px 6px',
                                      borderRadius: '3px',
                                      backgroundColor:
                                        q.difficulty === 'Hard'
                                          ? 'rgba(239, 68, 68, 0.15)'
                                          : q.difficulty === 'Medium'
                                          ? 'rgba(245, 158, 11, 0.15)'
                                          : 'rgba(16, 185, 129, 0.15)',
                                      color:
                                        q.difficulty === 'Hard'
                                          ? '#fca5a5'
                                          : q.difficulty === 'Medium'
                                          ? '#fcd34d'
                                          : '#86efac',
                                      fontWeight: 600,
                                    }}
                                  >
                                    {q.difficulty}
                                  </span>
                                )}
                                {hasEvaluation && (
                                  <span style={{ fontSize: '9px', color: '#34d399', fontWeight: 700 }}>
                                    ✓ Evaluated
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Question Text */}
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc', lineHeight: 1.45, marginBottom: '6px' }}>
                              {q.question}
                            </div>

                            {/* Context Tip */}
                            {q.context_or_tip && (
                              <div style={{ fontSize: '10px', color: '#94a3b8', backgroundColor: 'rgba(0, 0, 0, 0.25)', padding: '6px 8px', borderRadius: '4px', marginBottom: '8px', borderLeft: '2px solid #fb923c' }}>
                                💡 {q.context_or_tip}
                              </div>
                            )}

                            {/* Student Answer Textarea */}
                            <div style={{ marginBottom: '8px' }}>
                              <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>
                                Your Written Answer:
                              </label>
                              <textarea
                                rows={4}
                                value={currentInput}
                                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                                  setStudentAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                                }}
                                placeholder="Type your response here... Structure your reasoning clearly."
                                style={{
                                  ...inputStyle,
                                  resize: 'vertical',
                                  fontSize: '11px',
                                  lineHeight: 1.4,
                                  borderColor: hasEvaluation ? 'rgba(16, 185, 129, 0.4)' : '#334155',
                                }}
                              />
                            </div>

                            {/* Submit Answer Button */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: hasEvaluation ? '10px' : '0' }}>
                              <button
                                type="button"
                                onClick={() => handleEvaluateAnswer(q)}
                                disabled={isEvaluating || !currentInput.trim()}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '5px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  backgroundColor: isEvaluating ? '#334155' : '#ea580c',
                                  color: '#ffffff',
                                  border: 'none',
                                  cursor: isEvaluating || !currentInput.trim() ? 'not-allowed' : 'pointer',
                                }}
                              >
                                {isEvaluating ? '⏳ Evaluating...' : hasEvaluation ? '🔄 Re-evaluate Answer' : 'Submit for Feedback'}
                              </button>
                            </div>

                            {/* Evaluation Report */}
                            {hasEvaluation && savedAnswerRecord?.evaluation && (
                              <div
                                style={{
                                  marginTop: '8px',
                                  padding: '10px',
                                  borderRadius: '6px',
                                  backgroundColor: '#0b1120',
                                  border: '1px solid rgba(16, 185, 129, 0.25)',
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#34d399' }}>
                                    ⭐ Score: {savedAnswerRecord.evaluation.score}/10
                                  </span>
                                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#a7f3d0' }}>
                                    {savedAnswerRecord.evaluation.rating}
                                  </span>
                                </div>

                                <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4, marginBottom: '6px' }}>
                                  {savedAnswerRecord.evaluation.feedback}
                                </div>

                                {savedAnswerRecord.evaluation.strengths && savedAnswerRecord.evaluation.strengths.length > 0 && (
                                  <div style={{ marginBottom: '6px' }}>
                                    <div style={{ fontSize: '9px', color: '#34d399', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                                      Strengths
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '10px', color: '#86efac' }}>
                                      {savedAnswerRecord.evaluation.strengths.map((str, sIdx) => (
                                        <li key={sIdx}>{str}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {savedAnswerRecord.evaluation.improvement_tips && savedAnswerRecord.evaluation.improvement_tips.length > 0 && (
                                  <div style={{ marginBottom: '8px' }}>
                                    <div style={{ fontSize: '9px', color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                                      Improvement Tips
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '10px', color: '#fcd34d' }}>
                                      {savedAnswerRecord.evaluation.improvement_tips.map((tip, tIdx) => (
                                        <li key={tIdx}>{tip}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Toggle Model Answer */}
                                <div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedModelAnswerId(
                                        expandedModelAnswerId === q.id ? null : q.id
                                      )
                                    }
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      padding: 0,
                                      fontSize: '10px',
                                      color: '#38bdf8',
                                      cursor: 'pointer',
                                      textDecoration: 'underline',
                                    }}
                                  >
                                    {expandedModelAnswerId === q.id
                                      ? 'Hide Model Answer'
                                      : '📖 View Model Answer'}
                                  </button>

                                  {expandedModelAnswerId === q.id && (
                                    <div
                                      style={{
                                        marginTop: '6px',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        backgroundColor: 'rgba(56, 189, 248, 0.08)',
                                        border: '1px solid rgba(56, 189, 248, 0.2)',
                                        fontSize: '10px',
                                        color: '#bae6fd',
                                        lineHeight: 1.45,
                                      }}
                                    >
                                      <strong>Model Answer:</strong><br />
                                      {savedAnswerRecord.evaluation.sample_better_answer}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Live Mock Modal rendered for this interview node */}
            <MockInterviewModal
              isOpen={isLiveMockOpen}
              onClose={() => setIsLiveMockOpen(false)}
              targetCareer={
                interviewData.targetCareer ||
                roadmapData.targetCareer ||
                activeProfileData.careerGoal ||
                'Full Stack Developer'
              }
              skills={
                activeProfileData.skills
                  ? activeProfileData.skills.split(',').map((s) => s.trim()).filter(Boolean)
                  : ['Python', 'SQL', 'React']
              }
              projects={
                roadmapData.roadmapResult?.steps?.flatMap((s) => s.projects) || [
                  `${interviewData.targetCareer || 'Full Stack'} Showcase Application`,
                ]
              }
              profileId={activeProfileData.profileId}
              onSessionCompleted={(completedSession) => {
                onUpdateNodeData(selectedNode.id, {
                  lastMockSessionId: completedSession.session_id,
                  status: 'success',
                  statusMessage: `Mock Score: ${completedSession.final_feedback?.overall_score || 8}/10`,
                })
              }}
            />
          </div>
        )}

        {/* 14. Market Trends & Future Skills Node Panel */}
        {isMarketTrends && (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '14px',
                padding: '8px 10px',
                background: 'rgba(14, 165, 233, 0.1)',
                border: '1px solid rgba(14, 165, 233, 0.25)',
                borderRadius: '6px',
              }}
            >
              <span style={{ fontSize: '18px' }}>🌐</span>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8' }}>
                  Market Trends & Future Skills
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                  Modular Service Interface • Benchmark Blueprint Mode
                </div>
              </div>
            </div>

            {/* Clear Transparency & Demo Blueprint Disclaimer Notice */}
            <div
              style={{
                marginBottom: '14px',
                padding: '8px 10px',
                backgroundColor: 'rgba(234, 179, 8, 0.1)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                borderRadius: '6px',
                fontSize: '11px',
                color: '#fef08a',
                lineHeight: 1.4,
              }}
            >
              <strong>⚠️ Blueprint Architecture Notice:</strong> Curated industry benchmark data. Prepared for pluggable authoritative live data sources (e.g. Lightcast, BLS, O*NET) via the backend service interface.
            </div>

            {/* Target Career Focus Input */}
            <div style={formGroupStyle}>
              <label style={labelStyle}>Target Domain or Career Focus</label>
              <input
                type="text"
                placeholder={
                  trendsNodeData.careerFocus ||
                  activeProfileData.careerGoal ||
                  'e.g. Software Engineering, AI Engineer, UX Design'
                }
                value={customCareerInput || trendsNodeData.careerFocus || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setCustomCareerInput(e.target.value)
                  onUpdateNodeData(selectedNode.id, { careerFocus: e.target.value })
                }}
                style={inputStyle}
              />
            </div>

            {/* Action button to fetch market intelligence */}
            <button
              type="button"
              onClick={async () => {
                const targetCareer =
                  customCareerInput ||
                  trendsNodeData.careerFocus ||
                  activeProfileData.careerGoal ||
                  'Technology & Software'
                const candidateSkills = (activeProfileData.skills || '')
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)

                setIsSubmitting(true)
                setSubmissionFeedback(null)
                onUpdateNodeData(selectedNode.id, {
                  status: 'running',
                  statusMessage: 'Analyzing Market Trends...',
                })

                const res = await fetchMarketTrendsApi({
                  career_focus: targetCareer,
                  target_skills: candidateSkills,
                })

                setIsSubmitting(false)
                if (res.success && res.data) {
                  onUpdateNodeData(selectedNode.id, {
                    status: 'success',
                    statusMessage: 'Trends & Skills Ready',
                    trendsData: res.data,
                    careerFocus: res.data.career_focus,
                  })
                  setSubmissionFeedback({
                    type: 'success',
                    message: 'Market trends and future skills intelligence generated successfully!',
                  })
                } else {
                  onUpdateNodeData(selectedNode.id, {
                    status: 'error',
                    statusMessage: 'Analysis Failed',
                  })
                  setSubmissionFeedback({
                    type: 'error',
                    message: res.error || 'Failed to fetch market trends.',
                  })
                }
              }}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '9px 12px',
                backgroundColor: isSubmitting ? '#0284c7' : '#0ea5e9',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '12px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '14px',
              }}
            >
              <span>{isSubmitting ? '⏳' : '🌐'}</span>
              <span>{isSubmitting ? 'Querying Trends...' : 'Load Market Trends & Future Skills'}</span>
            </button>

            {submissionFeedback && (
              <div
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  marginBottom: '14px',
                  backgroundColor:
                    submissionFeedback.type === 'success'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(239, 68, 68, 0.15)',
                  border: `1px solid ${
                    submissionFeedback.type === 'success'
                      ? 'rgba(16, 185, 129, 0.3)'
                      : 'rgba(239, 68, 68, 0.3)'
                  }`,
                  color: submissionFeedback.type === 'success' ? '#34d399' : '#f87171',
                }}
              >
                {submissionFeedback.message}
              </div>
            )}

            {trendsNodeData.trendsData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* 1. Market Trends Section */}
                <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                      📈 Macro Market Trends ({trendsNodeData.trendsData.market_trends.length})
                    </span>
                    <span style={{ fontSize: '9px', color: '#94a3b8' }}>Industry Shifts</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {trendsNodeData.trendsData.market_trends.map((tr) => (
                      <div
                        key={tr.id}
                        style={{
                          backgroundColor: '#1e293b',
                          padding: '10px',
                          borderRadius: '6px',
                          borderLeft: '3px solid #38bdf8',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>
                            {tr.title}
                          </span>
                          <span
                            style={{
                              fontSize: '9px',
                              padding: '1px 6px',
                              borderRadius: '3px',
                              backgroundColor: 'rgba(56, 189, 248, 0.15)',
                              color: '#38bdf8',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {tr.direction} • {tr.time_horizon}
                          </span>
                        </div>
                        <p style={{ margin: '6px 0', fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4 }}>
                          {tr.summary}
                        </p>
                        {tr.key_drivers && tr.key_drivers.length > 0 && (
                          <div style={{ marginTop: '6px' }}>
                            <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Key Drivers:</div>
                            <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '10px', color: '#94a3b8', lineHeight: 1.35 }}>
                              {tr.key_drivers.map((d, dIdx) => (
                                <li key={dIdx}>{d}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. In-Demand Skills Section */}
                <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase' }}>
                      🔥 In-Demand Skills ({trendsNodeData.trendsData.in_demand_skills.length})
                    </span>
                    <span style={{ fontSize: '9px', color: '#94a3b8' }}>Immediate Relevancy</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {trendsNodeData.trendsData.in_demand_skills.map((sk) => (
                      <div
                        key={sk.id}
                        style={{
                          backgroundColor: '#1e293b',
                          padding: '10px',
                          borderRadius: '6px',
                          borderLeft: '3px solid #34d399',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>
                            {sk.name}
                          </span>
                          <span
                            style={{
                              fontSize: '9px',
                              padding: '1px 6px',
                              borderRadius: '3px',
                              backgroundColor: 'rgba(52, 211, 153, 0.15)',
                              color: '#34d399',
                              fontWeight: 700,
                            }}
                          >
                            {sk.demand_intensity}
                          </span>
                        </div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px' }}>
                          Growth Benchmark: <span style={{ color: '#6ee7b7', fontWeight: 600 }}>{sk.growth_rate_label}</span>
                        </div>
                        {sk.recommended_tools && sk.recommended_tools.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '6px' }}>
                            {sk.recommended_tools.map((tl, tIdx) => (
                              <span
                                key={tIdx}
                                style={{
                                  fontSize: '9px',
                                  padding: '1px 5px',
                                  borderRadius: '3px',
                                  backgroundColor: '#0f172a',
                                  color: '#cbd5e1',
                                }}
                              >
                                ⚙️ {tl}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Occupation Evolution & Shifts Section */}
                <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>
                      🔄 Occupation Evolution ({trendsNodeData.trendsData.occupation_changes.length})
                    </span>
                    <span style={{ fontSize: '9px', color: '#94a3b8' }}>Automation & Shifts</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {trendsNodeData.trendsData.occupation_changes.map((occ) => (
                      <div
                        key={occ.id}
                        style={{
                          backgroundColor: '#1e293b',
                          padding: '10px',
                          borderRadius: '6px',
                          borderLeft: '3px solid #f59e0b',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>
                            {occ.occupation_title}
                          </span>
                          <span
                            style={{
                              fontSize: '9px',
                              padding: '1px 6px',
                              borderRadius: '3px',
                              backgroundColor: 'rgba(245, 158, 11, 0.15)',
                              color: '#fbbf24',
                              fontWeight: 700,
                            }}
                          >
                            {occ.evolution_type}
                          </span>
                        </div>
                        <div style={{ fontSize: '10px', color: '#fb923c', marginTop: '3px' }}>
                          Automation Exposure: {occ.automation_exposure}
                        </div>
                        <div style={{ marginTop: '6px' }}>
                          <div style={{ fontSize: '9px', color: '#34d399', fontWeight: 600, textTransform: 'uppercase' }}>
                            + Emerging Responsibilities
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '10px', color: '#cbd5e1', lineHeight: 1.35 }}>
                            {occ.emerging_responsibilities.map((em, eIdx) => (
                              <li key={eIdx}>{em}</li>
                            ))}
                          </ul>
                        </div>
                        <div style={{ marginTop: '6px', backgroundColor: '#0f172a', padding: '6px', borderRadius: '4px' }}>
                          <div style={{ fontSize: '9px', color: '#38bdf8', fontWeight: 600, textTransform: 'uppercase' }}>
                            Adaptation / Upskilling Path
                          </div>
                          <div style={{ fontSize: '10px', color: '#e2e8f0', marginTop: '2px' }}>
                            {occ.upskilling_path}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Future Skills (3-7 Year Horizon) Section */}
                <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase' }}>
                      🚀 Future Skills Horizon ({trendsNodeData.trendsData.future_skills.length})
                    </span>
                    <span style={{ fontSize: '9px', color: '#94a3b8' }}>Next 3-7 Years</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {trendsNodeData.trendsData.future_skills.map((fut) => (
                      <div
                        key={fut.id}
                        style={{
                          backgroundColor: '#1e293b',
                          padding: '10px',
                          borderRadius: '6px',
                          borderLeft: '3px solid #c084fc',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>
                            {fut.name}
                          </span>
                          <span
                            style={{
                              fontSize: '9px',
                              padding: '1px 6px',
                              borderRadius: '3px',
                              backgroundColor: 'rgba(192, 132, 252, 0.15)',
                              color: '#c084fc',
                              fontWeight: 700,
                            }}
                          >
                            {fut.readiness_urgency}
                          </span>
                        </div>
                        <p style={{ margin: '6px 0', fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4 }}>
                          {fut.why_it_matters}
                        </p>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                          <strong style={{ color: '#e2e8f0' }}>How to prepare: </strong>{fut.learning_approach}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: '#64748b', fontSize: '11px', textAlign: 'center', padding: '16px 0' }}>
                No market trends loaded yet. Click "Load Market Trends & Future Skills" above.
              </div>
            )}
          </div>
        )}

        {/* 15. Generic / Custom Fallback Nodes */}
        {!isStudentProfile &&
          !isCareerDiscovery &&
          !isEligibilityChecker &&
          !isSkillGapAnalysis &&
          !isAIRoadmap &&
          !isRoadmapStep &&
          !isLearning &&
          !isProjects &&
          !isInternship &&
          !isJob &&
          !isCareerGrowth &&
          !isSimulation &&
          !isInterview &&
          !isMarketTrends && (
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '14px' }}>
              Placeholder node configuration. Configure custom title & description.
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Node Title</label>
              <input
                type="text"
                value={(selectedNode.data.title as string) || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  onUpdateNodeData(selectedNode.id, { title: e.target.value })
                }
                style={inputStyle}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Description</label>
              <textarea
                rows={3}
                value={(selectedNode.data.description as string) || ''}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  onUpdateNodeData(selectedNode.id, { description: e.target.value })
                }
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
          </div>
        )}

        {/* Node Danger Zone: Delete Node */}
        {onDeleteNode && (
          <div
            style={{
              marginTop: '28px',
              paddingTop: '16px',
              borderTop: '1px solid #1e293b',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
              Danger Zone
            </div>
            <button
              onClick={() => onDeleteNode(selectedNode.id)}
              type="button"
              style={{
                width: '100%',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#dc2626'
                e.currentTarget.style.color = '#ffffff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'
                e.currentTarget.style.color = '#f87171'
              }}
              title="Delete this node and all its connected edges"
            >
              <span>🗑️</span>
              <span>Delete Node from Workflow</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
