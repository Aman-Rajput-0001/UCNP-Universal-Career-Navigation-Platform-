import { useState, useCallback, useMemo, useEffect } from 'react'
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type Node,
  type Edge,
  type NodeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { workflowNodeTypes } from '../nodes'
import { NodeLibrary } from './NodeLibrary'
import { NodeConfigPanel } from './NodeConfigPanel'
import { CareerComparisonModal } from './CareerComparisonModal'
import { MockInterviewModal } from './MockInterviewModal'
import {
  saveWorkflowToLocalStorage,
  loadWorkflowFromLocalStorage,
} from '../services/workflowStorage'
import {
  checkBackendHealth,
  fetchRoadmapProgressApi,
  simulateCareerApi,
} from '../services/api'
import type { NodeTypeDefinition } from '../data/nodeLibrary'
import type {
  StudentProfileNodeData,
  AIRoadmapNodeData,
  RoadmapStepNodeData,
  SimulationNodeData,
  StepProgressStatus,
  WorkflowNodeData,
} from '../types/workflow'

const defaultInitialNodes: Node<WorkflowNodeData>[] = [
  // 1. INPUT
  {
    id: 'student-profile-1',
    type: 'studentProfileNode',
    position: { x: 100, y: 140 },
    data: {
      title: 'Student Profile',
      description: 'Education, strengths & career preferences',
      category: 'input',
      icon: '🎓',
      status: 'idle',
      educationLevel: "Bachelor's Degree",
      degreeOrCourse: 'B.Tech',
      branchOrSubject: 'Computer Science',
      currentYear: '3rd Year',
      skills: 'Python, SQL, React',
      interests: 'Machine Learning, Web Development',
      strengths: 'Analytical Thinking, Fast Learner',
      weaknesses: 'Networking, Public Speaking',
      careerGoal: 'AI Engineer / Full Stack Developer',
      availableTime: '15 hrs/week',
      summaryItems: [
        { label: 'Category', value: 'INPUT' },
        { label: 'Focus', value: 'Background & Skills' },
      ],
    } as StudentProfileNodeData,
  },
  // 2. DISCOVERY
  {
    id: 'career-discovery-1',
    type: 'careerDiscoveryNode',
    position: { x: 460, y: 140 },
    data: {
      title: 'Career Discovery',
      description: 'Discover viable careers irrespective of degree limitations',
      category: 'discovery',
      icon: '🧭',
      status: 'idle',
      summaryItems: [
        { label: 'Category', value: 'DISCOVERY' },
        { label: 'Scope', value: 'Skill & Interest Matching' },
      ],
    },
  },
  // 3. ANALYSIS
  {
    id: 'eligibility-checker-1',
    type: 'eligibilityCheckerNode',
    position: { x: 820, y: 140 },
    data: {
      title: 'Eligibility Checker',
      description: 'Check eligibility criteria & non-degree entry routes',
      category: 'analysis',
      icon: '✅',
      status: 'idle',
      summaryItems: [
        { label: 'Category', value: 'ANALYSIS' },
        { label: 'Criteria', value: 'Degrees vs Skill routes' },
      ],
    },
  },
  {
    id: 'skill-gap-analysis-1',
    type: 'skillGapAnalysisNode',
    position: { x: 1180, y: 140 },
    data: {
      title: 'Skill Gap Analysis',
      description: 'Identify missing core and emerging skill gaps',
      category: 'analysis',
      icon: '📊',
      status: 'idle',
      summaryItems: [
        { label: 'Category', value: 'ANALYSIS' },
        { label: 'Benchmark', value: 'Target Competencies' },
      ],
    },
  },
  // 4. GOAL
  {
    id: 'career-goal-1',
    type: 'careerGoalNode',
    position: { x: 1180, y: 390 },
    data: {
      title: 'Career Goal',
      description: 'Target role, expected timeline & compensation',
      category: 'career',
      icon: '🎯',
      status: 'idle',
      summaryItems: [
        { label: 'Category', value: 'GOAL' },
        { label: 'Target', value: 'Full Stack Developer / AI' },
      ],
    },
  },
  // 5. ROADMAP
  {
    id: 'ai-roadmap-1',
    type: 'aiRoadmapNode',
    position: { x: 820, y: 390 },
    data: {
      title: 'AI Roadmap',
      description: 'Step-by-step personalized career transition plan',
      category: 'roadmap',
      icon: '🗺️',
      status: 'idle',
      targetCareer: 'Full Stack Developer',
      summaryItems: [
        { label: 'Category', value: 'ROADMAP' },
        { label: 'Plan', value: 'Adaptive Milestones' },
      ],
    } as AIRoadmapNodeData,
  },
  // 6. EXECUTION
  {
    id: 'learning-1',
    type: 'learningNode',
    position: { x: 460, y: 390 },
    data: {
      title: 'Learning',
      description: 'Curated courses, docs, tutorials & practice material',
      category: 'learning',
      icon: '📚',
      status: 'idle',
      summaryItems: [
        { label: 'Category', value: 'EXECUTION' },
        { label: 'Content', value: 'Courses & Tutorials' },
      ],
    },
  },
  {
    id: 'projects-1',
    type: 'projectsNode',
    position: { x: 100, y: 390 },
    data: {
      title: 'Projects',
      description: 'Proof-of-work project suggestions with GitHub guidance',
      category: 'learning',
      icon: '🛠️',
      status: 'idle',
      summaryItems: [
        { label: 'Category', value: 'EXECUTION' },
        { label: 'Portfolio', value: 'Production Blueprints' },
      ],
    },
  },
  {
    id: 'certification-1',
    type: 'certificationNode',
    position: { x: 100, y: 640 },
    data: {
      title: 'Certification',
      description: 'Recognized industry credentials and accreditations',
      category: 'learning',
      icon: '📜',
      status: 'idle',
      summaryItems: [
        { label: 'Category', value: 'EXECUTION' },
        { label: 'Validation', value: 'Industry Credentials' },
      ],
    },
  },
  {
    id: 'internship-1',
    type: 'internshipNode',
    position: { x: 460, y: 640 },
    data: {
      title: 'Internship',
      description: 'Entry-level work opportunities and experiential learning',
      category: 'action',
      icon: '💼',
      status: 'idle',
      summaryItems: [
        { label: 'Category', value: 'EXECUTION' },
        { label: 'Hands-on', value: 'Industry Apprenticeship' },
      ],
    },
  },
  {
    id: 'resume-1',
    type: 'resumeNode',
    position: { x: 820, y: 640 },
    data: {
      title: 'Resume',
      description: 'Skill-first ATS resume generation & optimization',
      category: 'action',
      icon: '📄',
      status: 'idle',
      summaryItems: [
        { label: 'Category', value: 'EXECUTION' },
        { label: 'Format', value: 'ATS Tailored' },
      ],
    },
  },
  {
    id: 'interview-1',
    type: 'interviewNode',
    position: { x: 1180, y: 640 },
    data: {
      title: 'Interview',
      description: 'Role-specific mock interview simulations & feedback',
      category: 'action',
      icon: '🎤',
      status: 'idle',
      summaryItems: [
        { label: 'Category', value: 'EXECUTION' },
        { label: 'Prep', value: 'Technical & Behavioral' },
      ],
    },
  },
  // 7. CAREER GROWTH
  {
    id: 'job-1',
    type: 'jobNode',
    position: { x: 1180, y: 890 },
    data: {
      title: 'Job',
      description: 'Curated job opportunities matched to candidate capabilities',
      category: 'career',
      icon: '🚀',
      status: 'idle',
      summaryItems: [
        { label: 'Category', value: 'CAREER GROWTH' },
        { label: 'Target Role', value: 'Full-time Placement' },
      ],
    },
  },
  {
    id: 'career-growth-1',
    type: 'careerGrowthNode',
    position: { x: 820, y: 890 },
    data: {
      title: 'Career Growth',
      description: 'Long-term promotion, upskilling and leadership tracking',
      category: 'career',
      icon: '📈',
      status: 'idle',
      summaryItems: [
        { label: 'Category', value: 'CAREER GROWTH' },
        { label: 'Ladder', value: 'Promotion & Seniority' },
      ],
    },
  },
]

const defaultInitialEdges: Edge[] = [
  // INPUT → DISCOVERY
  {
    id: 'edge-1-2',
    source: 'student-profile-1',
    target: 'career-discovery-1',
    animated: true,
    style: { stroke: '#4f46e5', strokeWidth: 2.5 },
  },
  // DISCOVERY → ELIGIBILITY
  {
    id: 'edge-2-3',
    source: 'career-discovery-1',
    target: 'eligibility-checker-1',
    animated: true,
    style: { stroke: '#4f46e5', strokeWidth: 2.5 },
  },
  // ELIGIBILITY → SKILL GAP
  {
    id: 'edge-3-4',
    source: 'eligibility-checker-1',
    target: 'skill-gap-analysis-1',
    animated: true,
    style: { stroke: '#4f46e5', strokeWidth: 2.5 },
  },
  // SKILL GAP → CAREER GOAL
  {
    id: 'edge-4-5',
    source: 'skill-gap-analysis-1',
    target: 'career-goal-1',
    animated: true,
    style: { stroke: '#6366f1', strokeWidth: 2.5 },
  },
  // CAREER GOAL → AI ROADMAP
  {
    id: 'edge-5-6',
    source: 'career-goal-1',
    target: 'ai-roadmap-1',
    animated: true,
    style: { stroke: '#6366f1', strokeWidth: 2.5 },
  },
  // AI ROADMAP → LEARNING
  {
    id: 'edge-6-7',
    source: 'ai-roadmap-1',
    target: 'learning-1',
    animated: true,
    style: { stroke: '#6366f1', strokeWidth: 2.5 },
  },
  // LEARNING → PROJECTS
  {
    id: 'edge-7-8',
    source: 'learning-1',
    target: 'projects-1',
    animated: true,
    style: { stroke: '#06b6d4', strokeWidth: 2.5 },
  },
  // PROJECTS → CERTIFICATION
  {
    id: 'edge-8-9',
    source: 'projects-1',
    target: 'certification-1',
    animated: true,
    style: { stroke: '#06b6d4', strokeWidth: 2.5 },
  },
  // CERTIFICATION → INTERNSHIP
  {
    id: 'edge-9-10',
    source: 'certification-1',
    target: 'internship-1',
    animated: true,
    style: { stroke: '#06b6d4', strokeWidth: 2.5 },
  },
  // INTERNSHIP → RESUME
  {
    id: 'edge-10-11',
    source: 'internship-1',
    target: 'resume-1',
    animated: true,
    style: { stroke: '#3b82f6', strokeWidth: 2.5 },
  },
  // RESUME → INTERVIEW
  {
    id: 'edge-11-12',
    source: 'resume-1',
    target: 'interview-1',
    animated: true,
    style: { stroke: '#3b82f6', strokeWidth: 2.5 },
  },
  // INTERVIEW → JOB
  {
    id: 'edge-12-13',
    source: 'interview-1',
    target: 'job-1',
    animated: true,
    style: { stroke: '#10b981', strokeWidth: 2.5 },
  },
  // JOB → CAREER GROWTH
  {
    id: 'edge-13-14',
    source: 'job-1',
    target: 'career-growth-1',
    animated: true,
    style: { stroke: '#10b981', strokeWidth: 2.5 },
  },
]

export function WorkflowCanvas() {
  const [nodes, setNodes] = useState<Node<WorkflowNodeData>[]>(() => {
    const saved = loadWorkflowFromLocalStorage()
    return saved ? saved.nodes : defaultInitialNodes
  })
  const [edges, setEdges] = useState<Edge[]>(() => {
    const saved = loadWorkflowFromLocalStorage()
    return saved ? saved.edges : defaultInitialEdges
  })
  const [isLibraryOpen, setIsLibraryOpen] = useState(true)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null)
  const [isCompareOpen, setIsCompareOpen] = useState(false)
  const [isMockModalOpen, setIsMockModalOpen] = useState(false)
  const [customWhatIfInput, setCustomWhatIfInput] = useState('')

  // Verify backend health on mount and periodically
  useEffect(() => {
    let isMounted = true

    const runHealthCheck = async () => {
      const res = await checkBackendHealth()
      if (isMounted) {
        setBackendConnected(res.connected)
      }
    }

    runHealthCheck()
    const intervalId = setInterval(runHealthCheck, 10000)

    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [])

  // Hydrate roadmap progress from backend on initial mount if a roadmap node is present
  useEffect(() => {
    const roadmapNode = nodes.find((n) => n.type === 'aiRoadmapNode')
    if (roadmapNode) {
      const roadmapId = roadmapNode.id
      fetchRoadmapProgressApi(roadmapId).then((res) => {
        if (res.success && res.data && res.data.total_steps > 0) {
          const progressData = res.data
          const statuses = progressData.step_statuses || {}

          setNodes((prev) =>
            prev.map((n) => {
              if (n.id === roadmapNode.id) {
                const completedIds = Object.entries(statuses)
                  .filter(([, st]) => st === 'completed')
                  .map(([id]) => id)
                return {
                  ...n,
                  data: {
                    ...n.data,
                    progressPercentage: progressData.progress_percentage,
                    progressData,
                    completedStepIds: completedIds,
                  } as AIRoadmapNodeData,
                }
              }
              if (n.type === 'roadmapStepNode') {
                const stepData = n.data as RoadmapStepNodeData
                const stepKey = stepData.stepId || n.id
                if (statuses[stepKey]) {
                  const st = statuses[stepKey] as StepProgressStatus
                  return {
                    ...n,
                    data: {
                      ...n.data,
                      progressStatus: st,
                      status: st === 'completed' ? 'success' : st === 'in_progress' ? 'running' : 'idle',
                      statusMessage:
                        st === 'completed'
                          ? 'Completed'
                          : st === 'in_progress'
                          ? 'In Progress'
                          : 'Not Started',
                    } as RoadmapStepNodeData,
                  }
                }
              }
              return n
            })
          )
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-dismiss notification toast
  useEffect(() => {
    if (!toastMessage) return
    const timer = setTimeout(() => setToastMessage(null), 2500)
    return () => clearTimeout(timer)
  }, [toastMessage])

  const onNodesChange: OnNodesChange<Node<WorkflowNodeData>> = useCallback(
    (changes) => {
      setNodes((nds) => {
        const nextNodes = applyNodeChanges(changes, nds)
        const selectedStillExists = nextNodes.some((n) => n.id === selectedNodeId)
        if (!selectedStillExists && selectedNodeId) {
          setSelectedNodeId(null)
        }
        return nextNodes
      })
    },
    [selectedNodeId]
  )

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  )

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge({ ...connection, animated: true }, eds)),
    []
  )

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    setSelectedNodeId(node.id)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null)
  }, [])

  const handleAddNode = useCallback((nodeDef: NodeTypeDefinition) => {
    const id = `${nodeDef.type}-${Date.now()}`
    
    setNodes((nds) => {
      let xPos = 380
      let yPos = 200

      if (nds.length > 0) {
        // Find rightmost node and place with 360px ergonomic spacing
        const rightmost = nds.reduce((prev, curr) =>
          curr.position.x > prev.position.x ? curr : prev
        , nds[0])
        xPos = rightmost.position.x + 360
        yPos = rightmost.position.y + ((nds.length % 2 === 1) ? 30 : -20)
      }

      const newNode: Node<WorkflowNodeData> = {
        id,
        type: nodeDef.type,
        position: { x: xPos, y: yPos },
        data: {
          title: nodeDef.name,
          description: nodeDef.description,
          category: nodeDef.category,
          icon: nodeDef.icon,
          status: 'idle',
          summaryItems: nodeDef.defaultSummary || [],
        },
      }
      return [...nds, newNode]
    })

    setSelectedNodeId(id)
  }, [])

  const handleUpdateNodeData = useCallback(
    (nodeId: string, updatedData: Partial<WorkflowNodeData>) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                ...updatedData,
              },
            }
          }
          return node
        })
      )
    },
    []
  )

  const handleAddGeneratedRoadmapSteps = useCallback(
    (newNodes: Node<WorkflowNodeData>[], newEdges: Edge[]) => {
      setNodes((prevNodes) => {
        // Filter out any previous steps from this generation run if IDs match
        const existingIds = new Set(newNodes.map((n) => n.id))
        const remaining = prevNodes.filter((n) => !existingIds.has(n.id))
        return [...remaining, ...newNodes]
      })
      setEdges((prevEdges) => {
        const existingEdgeIds = new Set(newEdges.map((e) => e.id))
        const remaining = prevEdges.filter((e) => !existingEdgeIds.has(e.id))
        return [...remaining, ...newEdges]
      })
    },
    []
  )

  const handleReplanRoadmapSteps = useCallback(
    (
      roadmapNodeId: string,
      completedStepIds: string[],
      newRemainingNodes: Node<WorkflowNodeData>[],
      newEdges: Edge[]
    ) => {
      setNodes((prevNodes) => {
        // Keep non-roadmap nodes, AND keep completed roadmap step nodes
        const kept = prevNodes.filter((n) => {
          if (!n.id.startsWith(`step-node-${roadmapNodeId}-`)) return true
          const stepId = n.id.replace(`step-node-${roadmapNodeId}-`, '')
          return completedStepIds.includes(stepId)
        })
        return [...kept, ...newRemainingNodes]
      })
      setEdges((prevEdges) => {
        // Remove stale edges between uncompleted steps
        const validEdges = prevEdges.filter((e) => {
          return !e.id.includes(`edge-step-node-${roadmapNodeId}-`) && !e.id.startsWith(`edge-${roadmapNodeId}-`)
        })
        return [...validEdges, ...newEdges]
      })
    },
    []
  )

  const handleSaveWorkflow = useCallback(() => {
    saveWorkflowToLocalStorage(nodes, edges)
    setToastMessage('Workflow saved to storage')
  }, [nodes, edges])

  const handleLoadWorkflow = useCallback(() => {
    const saved = loadWorkflowFromLocalStorage()
    if (saved) {
      setNodes(saved.nodes)
      setEdges(saved.edges)
      setSelectedNodeId(null)
      setToastMessage('Workflow loaded')
    } else {
      setToastMessage('No saved workflow found')
    }
  }, [])

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId))
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId))
    setSelectedNodeId((currentId) => (currentId === nodeId ? null : currentId))
    setToastMessage('Node deleted')
  }, [])

  // Keyboard shortcut: Press Delete or Backspace to delete selected node
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input, textarea, or contentEditable element
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
        e.preventDefault()
        handleDeleteNode(selectedNodeId)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNodeId, handleDeleteNode])

  // Ergonomic Auto-Layout: Arranges all canvas nodes in a neat, orderly flow
  const handleAutoLayout = useCallback(() => {
    if (nodes.length === 0) return

    setNodes((currentNodes) => {
      const startX = 100
      const startY = 140
      const xGap = 360
      const yGap = 250
      const nodesPerRow = 4

      // Sequence of the 14 core nodes for optimal visual reading:
      // Row 1: Student Profile -> Career Discovery -> Eligibility Checker -> Skill Gap Analysis
      // Row 2: Career Goal -> AI Roadmap -> Learning -> Projects
      // Row 3: Certification -> Internship -> Resume -> Interview
      // Row 4: Job -> Career Growth
      const desiredOrder = [
        'studentProfileNode',
        'careerDiscoveryNode',
        'eligibilityCheckerNode',
        'skillGapAnalysisNode',
        'careerGoalNode',
        'aiRoadmapNode',
        'learningNode',
        'projectsNode',
        'certificationNode',
        'internshipNode',
        'resumeNode',
        'interviewNode',
        'jobNode',
        'careerGrowthNode',
      ]

      // Sort current nodes matching core workflow order first, then others
      const sorted = [...currentNodes].sort((a, b) => {
        const idxA = desiredOrder.indexOf(a.type || '')
        const idxB = desiredOrder.indexOf(b.type || '')
        if (idxA !== -1 && idxB !== -1) return idxA - idxB
        if (idxA !== -1) return -1
        if (idxB !== -1) return 1
        return 0
      })

      return sorted.map((node, index) => {
        const row = Math.floor(index / nodesPerRow)
        // Snake flow: alternate left-to-right and right-to-left for intuitive edge curves
        const isReversedRow = row % 2 === 1
        const col = isReversedRow ? (nodesPerRow - 1 - (index % nodesPerRow)) : (index % nodesPerRow)

        return {
          ...node,
          position: {
            x: startX + col * xGap,
            y: startY + row * yGap,
          },
        }
      })
    })

    setToastMessage('Canvas auto-arranged cleanly!')
  }, [nodes.length])

  const handleDeleteWorkflow = useCallback(() => {
    if (nodes.length === 0) {
      setToastMessage('Canvas is already empty')
      return
    }
    const confirmed = window.confirm(
      'Are you sure you want to delete the entire workflow? This will remove all nodes, connections, and clear saved workflow state.'
    )
    if (!confirmed) return

    setNodes([])
    setEdges([])
    setSelectedNodeId(null)
    localStorage.removeItem('career_navigator_workflow')
    setToastMessage('Workflow deleted')
  }, [nodes.length])

  const handleGenerateCareerProgressionPathway = useCallback(() => {
    // Collect profile data if user already filled it out, otherwise use clean defaults
    const profileNode = nodes.find((n) => n.type === 'studentProfileNode')
    const profileData = (profileNode?.data || {}) as StudentProfileNodeData
    const timestamp = Date.now()

    // 14 Core Workflow Nodes structured in an ergonomic 4-row layout:
    // INPUT -> DISCOVERY -> ANALYSIS -> GOAL -> ROADMAP -> EXECUTION -> CAREER GROWTH
    const coreNodes: Node<WorkflowNodeData>[] = [
      // 1. INPUT
      {
        id: `student-profile-${timestamp}`,
        type: 'studentProfileNode',
        position: { x: 100, y: 140 },
        data: {
          title: 'Student Profile',
          description: 'Education, strengths & career preferences',
          category: 'input',
          icon: '🎓',
          status: 'idle',
          educationLevel: profileData.educationLevel || "Bachelor's Degree",
          degreeOrCourse: profileData.degreeOrCourse || 'B.Tech',
          branchOrSubject: profileData.branchOrSubject || 'Computer Science',
          currentYear: profileData.currentYear || '3rd Year',
          skills: profileData.skills || 'Python, SQL, React',
          interests: profileData.interests || 'Machine Learning, Web Development',
          strengths: profileData.strengths || 'Analytical Thinking, Fast Learner',
          weaknesses: profileData.weaknesses || 'Networking, Public Speaking',
          careerGoal: profileData.careerGoal || 'AI Engineer / Full Stack Developer',
          availableTime: profileData.availableTime || '15 hrs/week',
          summaryItems: [
            { label: 'Category', value: 'INPUT' },
            { label: 'Focus', value: 'Background & Skills' },
          ],
        } as StudentProfileNodeData,
      },
      // 2. DISCOVERY
      {
        id: `career-discovery-${timestamp}`,
        type: 'careerDiscoveryNode',
        position: { x: 460, y: 140 },
        data: {
          title: 'Career Discovery',
          description: 'Discover viable careers irrespective of degree limitations',
          category: 'discovery',
          icon: '🧭',
          status: 'idle',
          summaryItems: [
            { label: 'Category', value: 'DISCOVERY' },
            { label: 'Scope', value: 'Skill & Interest Matching' },
          ],
        },
      },
      // 3. ANALYSIS
      {
        id: `eligibility-checker-${timestamp}`,
        type: 'eligibilityCheckerNode',
        position: { x: 820, y: 140 },
        data: {
          title: 'Eligibility Checker',
          description: 'Check eligibility criteria & non-degree entry routes',
          category: 'analysis',
          icon: '✅',
          status: 'idle',
          summaryItems: [
            { label: 'Category', value: 'ANALYSIS' },
            { label: 'Criteria', value: 'Degrees vs Skill routes' },
          ],
        },
      },
      {
        id: `skill-gap-analysis-${timestamp}`,
        type: 'skillGapAnalysisNode',
        position: { x: 1180, y: 140 },
        data: {
          title: 'Skill Gap Analysis',
          description: 'Identify missing core and emerging skill gaps',
          category: 'analysis',
          icon: '📊',
          status: 'idle',
          summaryItems: [
            { label: 'Category', value: 'ANALYSIS' },
            { label: 'Benchmark', value: 'Target Competencies' },
          ],
        },
      },
      // 4. GOAL
      {
        id: `career-goal-${timestamp}`,
        type: 'careerGoalNode',
        position: { x: 1180, y: 390 },
        data: {
          title: 'Career Goal',
          description: 'Target role, expected timeline & compensation',
          category: 'career',
          icon: '🎯',
          status: 'idle',
          summaryItems: [
            { label: 'Category', value: 'GOAL' },
            { label: 'Target', value: profileData.careerGoal || 'Full Stack Developer / AI' },
          ],
        },
      },
      // 5. ROADMAP
      {
        id: `ai-roadmap-${timestamp}`,
        type: 'aiRoadmapNode',
        position: { x: 820, y: 390 },
        data: {
          title: 'AI Roadmap',
          description: 'Step-by-step personalized career transition plan',
          category: 'roadmap',
          icon: '🗺️',
          status: 'idle',
          targetCareer: profileData.careerGoal || 'Full Stack Developer',
          summaryItems: [
            { label: 'Category', value: 'ROADMAP' },
            { label: 'Plan', value: 'Adaptive Milestones' },
          ],
        } as AIRoadmapNodeData,
      },
      // 6. EXECUTION
      {
        id: `learning-${timestamp}`,
        type: 'learningNode',
        position: { x: 460, y: 390 },
        data: {
          title: 'Learning',
          description: 'Curated courses, docs, tutorials & practice material',
          category: 'learning',
          icon: '📚',
          status: 'idle',
          summaryItems: [
            { label: 'Category', value: 'EXECUTION' },
            { label: 'Content', value: 'Courses & Tutorials' },
          ],
        },
      },
      {
        id: `projects-${timestamp}`,
        type: 'projectsNode',
        position: { x: 100, y: 390 },
        data: {
          title: 'Projects',
          description: 'Proof-of-work project suggestions with GitHub guidance',
          category: 'learning',
          icon: '🛠️',
          status: 'idle',
          summaryItems: [
            { label: 'Category', value: 'EXECUTION' },
            { label: 'Portfolio', value: 'Production Blueprints' },
          ],
        },
      },
      {
        id: `certification-${timestamp}`,
        type: 'certificationNode',
        position: { x: 100, y: 640 },
        data: {
          title: 'Certification',
          description: 'Recognized industry credentials and accreditations',
          category: 'learning',
          icon: '📜',
          status: 'idle',
          summaryItems: [
            { label: 'Category', value: 'EXECUTION' },
            { label: 'Validation', value: 'Industry Credentials' },
          ],
        },
      },
      {
        id: `internship-${timestamp}`,
        type: 'internshipNode',
        position: { x: 460, y: 640 },
        data: {
          title: 'Internship',
          description: 'Entry-level work opportunities and experiential learning',
          category: 'action',
          icon: '💼',
          status: 'idle',
          summaryItems: [
            { label: 'Category', value: 'EXECUTION' },
            { label: 'Hands-on', value: 'Industry Apprenticeship' },
          ],
        },
      },
      {
        id: `resume-${timestamp}`,
        type: 'resumeNode',
        position: { x: 820, y: 640 },
        data: {
          title: 'Resume',
          description: 'Skill-first ATS resume generation & optimization',
          category: 'action',
          icon: '📄',
          status: 'idle',
          summaryItems: [
            { label: 'Category', value: 'EXECUTION' },
            { label: 'Format', value: 'ATS Tailored' },
          ],
        },
      },
      {
        id: `interview-${timestamp}`,
        type: 'interviewNode',
        position: { x: 1180, y: 640 },
        data: {
          title: 'Interview',
          description: 'Role-specific mock interview simulations & feedback',
          category: 'action',
          icon: '🎤',
          status: 'idle',
          summaryItems: [
            { label: 'Category', value: 'EXECUTION' },
            { label: 'Prep', value: 'Technical & Behavioral' },
          ],
        },
      },
      // 7. CAREER GROWTH
      {
        id: `job-${timestamp}`,
        type: 'jobNode',
        position: { x: 1180, y: 890 },
        data: {
          title: 'Job',
          description: 'Curated job opportunities matched to candidate capabilities',
          category: 'career',
          icon: '🚀',
          status: 'idle',
          summaryItems: [
            { label: 'Category', value: 'CAREER GROWTH' },
            { label: 'Target Role', value: 'Full-time Placement' },
          ],
        },
      },
      {
        id: `career-growth-${timestamp}`,
        type: 'careerGrowthNode',
        position: { x: 820, y: 890 },
        data: {
          title: 'Career Growth',
          description: 'Long-term promotion, upskilling and leadership tracking',
          category: 'career',
          icon: '📈',
          status: 'idle',
          summaryItems: [
            { label: 'Category', value: 'CAREER GROWTH' },
            { label: 'Ladder', value: 'Promotion & Seniority' },
          ],
        },
      },
    ]

    // Directed edges connecting the complete workflow sequentially:
    // 0: Profile -> 1: Discovery -> 2: Eligibility -> 3: Skill Gap -> 4: Career Goal ->
    // 5: AI Roadmap -> 6: Learning -> 7: Projects -> 8: Certification -> 9: Internship ->
    // 10: Resume -> 11: Interview -> 12: Job -> 13: Growth
    const coreEdges: Edge[] = [
      {
        id: `edge-core-1-2-${timestamp}`,
        source: coreNodes[0].id,
        target: coreNodes[1].id,
        animated: true,
        style: { stroke: '#4f46e5', strokeWidth: 2.5 },
      },
      {
        id: `edge-core-2-3-${timestamp}`,
        source: coreNodes[1].id,
        target: coreNodes[2].id,
        animated: true,
        style: { stroke: '#4f46e5', strokeWidth: 2.5 },
      },
      {
        id: `edge-core-3-4-${timestamp}`,
        source: coreNodes[2].id,
        target: coreNodes[3].id,
        animated: true,
        style: { stroke: '#4f46e5', strokeWidth: 2.5 },
      },
      {
        id: `edge-core-4-5-${timestamp}`,
        source: coreNodes[3].id,
        target: coreNodes[4].id,
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2.5 },
      },
      {
        id: `edge-core-5-6-${timestamp}`,
        source: coreNodes[4].id,
        target: coreNodes[5].id,
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2.5 },
      },
      {
        id: `edge-core-6-7-${timestamp}`,
        source: coreNodes[5].id,
        target: coreNodes[6].id,
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2.5 },
      },
      {
        id: `edge-core-7-8-${timestamp}`,
        source: coreNodes[6].id,
        target: coreNodes[7].id,
        animated: true,
        style: { stroke: '#06b6d4', strokeWidth: 2.5 },
      },
      {
        id: `edge-core-8-9-${timestamp}`,
        source: coreNodes[7].id,
        target: coreNodes[8].id,
        animated: true,
        style: { stroke: '#06b6d4', strokeWidth: 2.5 },
      },
      {
        id: `edge-core-9-10-${timestamp}`,
        source: coreNodes[8].id,
        target: coreNodes[9].id,
        animated: true,
        style: { stroke: '#06b6d4', strokeWidth: 2.5 },
      },
      {
        id: `edge-core-10-11-${timestamp}`,
        source: coreNodes[9].id,
        target: coreNodes[10].id,
        animated: true,
        style: { stroke: '#3b82f6', strokeWidth: 2.5 },
      },
      {
        id: `edge-core-11-12-${timestamp}`,
        source: coreNodes[10].id,
        target: coreNodes[11].id,
        animated: true,
        style: { stroke: '#3b82f6', strokeWidth: 2.5 },
      },
      {
        id: `edge-core-12-13-${timestamp}`,
        source: coreNodes[11].id,
        target: coreNodes[12].id,
        animated: true,
        style: { stroke: '#10b981', strokeWidth: 2.5 },
      },
      {
        id: `edge-core-13-14-${timestamp}`,
        source: coreNodes[12].id,
        target: coreNodes[13].id,
        animated: true,
        style: { stroke: '#10b981', strokeWidth: 2.5 },
      },
    ]

    setNodes(coreNodes)
    setEdges(coreEdges)
    setSelectedNodeId(coreNodes[0].id)
    setToastMessage('Complete Core Workflow instantiated! (INPUT → DISCOVERY → ANALYSIS → GOAL → ROADMAP → EXECUTION → CAREER GROWTH)')
  }, [nodes])

  const handleSimulateAlternativeCareer = useCallback(async (careerName: string) => {
    const profileNode = nodes.find((n) => n.type === 'studentProfileNode')
    const profileData = (profileNode?.data || {}) as StudentProfileNodeData

    const candidateSkills = (profileData.skills || 'Python, SQL, React')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    setToastMessage(`Simulating pathway: "What if I choose ${careerName}?"...`)

    const res = await simulateCareerApi({
      career_name: careerName,
      education: profileData.educationLevel || "Bachelor's Degree",
      degree: profileData.degreeOrCourse || '',
      branch: profileData.branchOrSubject || '',
      current_skills: candidateSkills,
      available_time: profileData.availableTime || '15 hrs/week',
      profile_id: profileData.profileId,
    })

    if (!res.success || !res.data) {
      setToastMessage(res.error || 'Failed to simulate career')
      return
    }

    const simData = res.data
    const timestamp = Date.now()

    // Determine non-colliding position offset
    const existingSimNodes = nodes.filter((n) => n.type === 'simulationNode')
    const simIndex = existingSimNodes.length
    const xPos = 420 + simIndex * 330
    const yPos = 620

    const newSimulationNode: Node<WorkflowNodeData> = {
      id: `sim-node-${timestamp}`,
      type: 'simulationNode',
      position: { x: xPos, y: yPos },
      data: {
        title: `What-If: ${simData.career}`,
        description: simData.estimated_path,
        category: 'discovery',
        icon: '🔮',
        status: 'success',
        statusMessage: 'Simulation Complete',
        simulatedCareer: simData.career,
        simulationData: simData,
        summaryItems: [
          { label: 'Role', value: simData.career },
          { label: 'Eligibility', value: simData.eligibility.status },
          { label: 'Steps', value: `${simData.major_steps.length} Milestones` },
        ],
      } as SimulationNodeData,
    }

    // Connect edge from Student Profile to this simulation node
    const newEdges: Edge[] = []
    if (profileNode) {
      newEdges.push({
        id: `edge-profile-sim-${timestamp}`,
        source: profileNode.id,
        target: newSimulationNode.id,
        animated: true,
        style: { stroke: '#a855f7', strokeWidth: 2, strokeDasharray: '5,5' },
      })
    }

    setNodes((prev) => {
      let updated = [...prev, newSimulationNode]

      // If user chose to apply this What-If target career to the active roadmap or if roadmap node exists:
      updated = updated.map((n) => {
        if (n.type === 'careerGoalNode') {
          return {
            ...n,
            data: {
              ...n.data,
              status: 'success',
              statusMessage: `What-If: ${simData.career}`,
              summaryItems: [
                { label: 'Target Role', value: simData.career },
                { label: 'Simulated Path', value: `${simData.major_steps.length} Milestones` },
              ],
            },
          }
        }
        if (n.type === 'aiRoadmapNode') {
          return {
            ...n,
            data: {
              ...n.data,
              status: 'success',
              statusMessage: `Recalculated for ${simData.career}`,
              targetCareer: simData.career,
              roadmapResult: {
                career_name: simData.career,
                total_estimated_duration: `${simData.major_steps.length * 4} Weeks`,
                summary: simData.estimated_path,
                steps: simData.major_steps.map((ms) => ({
                  id: `sim-step-${ms.step_number}`,
                  title: ms.title,
                  type: ms.phase.toLowerCase().includes('learn') ? 'learning' : ms.phase.toLowerCase().includes('project') ? 'project' : ms.phase.toLowerCase().includes('cert') ? 'certification' : 'job',
                  description: ms.focus,
                  prerequisites: ms.step_number > 1 ? [`sim-step-${ms.step_number - 1}`] : [],
                  skills: simData.skill_gap.missing_skills.slice((ms.step_number - 1) * 2, ms.step_number * 2),
                  estimated_duration: ms.estimated_duration,
                  projects: [ms.deliverable],
                  resources: ['Official documentation & practical guides'],
                  completion_criteria: ms.deliverable,
                })),
              },
              summaryItems: [
                { label: 'Target Career', value: simData.career },
                { label: 'Recalculated', value: `${simData.major_steps.length} Milestones` },
              ],
            } as AIRoadmapNodeData,
          }
        }
        if (n.type === 'skillGapAnalysisNode') {
          return {
            ...n,
            data: {
              ...n.data,
              status: 'success',
              statusMessage: `${simData.skill_gap.missing_skills.length} Gaps (${simData.skill_gap.skill_level})`,
              targetCareer: simData.career,
              skillGapResult: simData.skill_gap,
              summaryItems: [
                { label: 'Career', value: simData.career },
                { label: 'Level', value: simData.skill_gap.skill_level },
                { label: 'Missing', value: `${simData.skill_gap.missing_skills.length} skills` },
              ],
            },
          }
        }
        if (n.type === 'eligibilityCheckerNode') {
          return {
            ...n,
            data: {
              ...n.data,
              status: 'success',
              statusMessage: `Status: ${simData.eligibility.status}`,
              targetCareer: simData.career,
              eligibilityResult: simData.eligibility,
              summaryItems: [
                { label: 'Career', value: simData.career },
                { label: 'Status', value: simData.eligibility.status },
              ],
            },
          }
        }
        return n
      })

      return updated
    })

    setEdges((prev) => [...prev, ...newEdges])
    setSelectedNodeId(newSimulationNode.id)
    setToastMessage(`Recalculated roadmap & pathway for "${simData.career}"!`)
  }, [nodes])

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  )

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Application Bar */}
      <header
        style={{
          minHeight: '52px',
          background: '#0b1120',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          gap: '10px',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsLibraryOpen((prev) => !prev)}
            type="button"
            style={{
              background: isLibraryOpen ? '#1e3a8a' : '#1e293b',
              color: isLibraryOpen ? '#93c5fd' : '#cbd5e1',
              border: isLibraryOpen ? '1px solid #3b82f6' : '1px solid #334155',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>⚡</span>
            <span>{isLibraryOpen ? 'Hide Nodes' : 'Add Nodes'}</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🧭</span>
            <span style={{ fontWeight: 600, fontSize: '14px', letterSpacing: '-0.2px', color: '#f8fafc' }}>
              Career Navigator
            </span>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                background: '#1e293b',
                color: '#94a3b8',
                borderRadius: '12px',
                border: '1px solid #334155',
              }}
            >
              Workflow Canvas
            </span>
          </div>

          <span style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>•</span>
            <span>{nodes.length} nodes</span>
            <span>•</span>
            <span>{edges.length} edges</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Backend Status Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 500,
              backgroundColor: backendConnected
                ? 'rgba(16, 185, 129, 0.12)'
                : 'rgba(239, 68, 68, 0.12)',
              border: backendConnected
                ? '1px solid rgba(16, 185, 129, 0.3)'
                : '1px solid rgba(239, 68, 68, 0.3)',
              color: backendConnected ? '#34d399' : '#f87171',
            }}
            title={backendConnected ? 'FastAPI backend reachable' : 'Backend offline or unreachable'}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: backendConnected ? '#10b981' : '#ef4444',
                display: 'inline-block',
              }}
            />
            <span>
              Backend: {backendConnected === null ? 'Checking...' : backendConnected ? 'Connected' : 'Offline'}
            </span>
          </div>

          {toastMessage && (
            <span
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.18)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                fontWeight: 500,
              }}
            >
              ✓ {toastMessage}
            </span>
          )}

          {/* Actions Group: Intelligent Flow & Tools */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '3px 6px', borderRadius: '8px', border: '1px solid #1e293b' }}>
            <button
              onClick={handleGenerateCareerProgressionPathway}
              type="button"
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '5px 11px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '11.5px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 4px rgba(79, 70, 229, 0.25)',
                transition: 'opacity 0.15s ease',
              }}
              title="Generate connected progression chain: Skills → Projects → Portfolio → Resume → Internship → Job → Growth"
            >
              <span>🔗</span>
              <span>Full Pathway</span>
            </button>

            <button
              onClick={handleAutoLayout}
              type="button"
              style={{
                background: '#1e293b',
                color: '#38bdf8',
                border: '1px solid #334155',
                padding: '5px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '11.5px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#24344d'
                e.currentTarget.style.borderColor = '#38bdf8'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1e293b'
                e.currentTarget.style.borderColor = '#334155'
              }}
              title="Cleanly arrange and space out all nodes on the canvas"
            >
              <span>📐</span>
              <span>Auto-Arrange</span>
            </button>

            <button
              onClick={() => setIsCompareOpen(true)}
              type="button"
              style={{
                background: '#065f46',
                color: '#ffffff',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '11.5px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 1px 3px rgba(6, 95, 70, 0.3)',
              }}
              title="Open side-by-side career comparison matrix"
            >
              <span>⚖️</span>
              <span>Compare</span>
            </button>

            <button
              onClick={() => setIsMockModalOpen(true)}
              type="button"
              style={{
                background: '#ea580c',
                color: '#ffffff',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '11.5px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 1px 3px rgba(234, 88, 12, 0.3)',
              }}
              title="Launch interactive AI Mock Interview session"
            >
              <span>🎙️</span>
              <span>Mock Interview</span>
            </button>
          </div>

          {/* Quick What-If Simulation Dropdown/Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#131b2e', padding: '3px 6px', borderRadius: '8px', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '11px', color: '#c084fc', fontWeight: 600, paddingRight: '2px' }}>
              🔮 What-If:
            </span>
            <button
              onClick={() => handleSimulateAlternativeCareer('Data Analyst')}
              type="button"
              style={{
                background: '#1e293b',
                color: '#e2e8f0',
                border: '1px solid #334155',
                padding: '3px 7px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 500,
              }}
              title="Simulate Data Analyst pathway"
            >
              Data Analyst
            </button>
            <button
              onClick={() => handleSimulateAlternativeCareer('Product Manager')}
              type="button"
              style={{
                background: '#1e293b',
                color: '#e2e8f0',
                border: '1px solid #334155',
                padding: '3px 7px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 500,
              }}
              title="Simulate Product Manager pathway"
            >
              PM
            </button>
            <button
              onClick={() => handleSimulateAlternativeCareer('Government career')}
              type="button"
              style={{
                background: '#1e293b',
                color: '#e2e8f0',
                border: '1px solid #334155',
                padding: '3px 7px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 500,
              }}
              title="Simulate Government career pathway"
            >
              Govt
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <input
                type="text"
                value={customWhatIfInput}
                onChange={(e) => setCustomWhatIfInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customWhatIfInput.trim()) {
                    handleSimulateAlternativeCareer(customWhatIfInput.trim())
                    setCustomWhatIfInput('')
                  }
                }}
                placeholder="Other career..."
                style={{
                  background: '#090d16',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '10.5px',
                  width: '90px',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (customWhatIfInput.trim()) {
                    handleSimulateAlternativeCareer(customWhatIfInput.trim())
                    setCustomWhatIfInput('')
                  }
                }}
                style={{
                  background: '#6366f1',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '10.5px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
                title="Run What-If for entered career"
              >
                Go
              </button>
            </div>
          </div>

          {/* Canvas Storage & Reset Group */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '3px 6px', borderRadius: '8px', border: '1px solid #1e293b' }}>
            <button
              onClick={handleSaveWorkflow}
              type="button"
              style={{
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '11.5px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
              title="Save workflow state to browser local storage"
            >
              💾 Save
            </button>

            <button
              onClick={handleLoadWorkflow}
              type="button"
              style={{
                background: '#1e293b',
                color: '#e2e8f0',
                border: '1px solid #334155',
                padding: '5px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '11.5px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#273549'
                e.currentTarget.style.borderColor = '#475569'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1e293b'
                e.currentTarget.style.borderColor = '#334155'
              }}
              title="Load saved workflow state from storage"
            >
              📂 Load
            </button>

            <button
              onClick={handleDeleteWorkflow}
              type="button"
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                padding: '5px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '11.5px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#dc2626'
                e.currentTarget.style.color = '#ffffff'
                e.currentTarget.style.borderColor = '#dc2626'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)'
                e.currentTarget.style.color = '#f87171'
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.35)'
              }}
              title="Clear canvas and reset workflow"
            >
              🗑️ Clear
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace with Node Library Sidebar, Canvas & Node Config Panel */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        <NodeLibrary
          isOpen={isLibraryOpen}
          onClose={() => setIsLibraryOpen(false)}
          onAddNode={handleAddNode}
        />

        <div style={{ flex: 1, position: 'relative', height: '100%' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={workflowNodeTypes}
            colorMode="dark"
            fitView
            minZoom={0.25}
            maxZoom={2.2}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#4f46e5', strokeWidth: 2.2 },
            }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1.2}
              color="#2a3547"
            />
            <Controls
              showInteractive={false}
              style={{
                background: '#111827',
                border: '1px solid #374151',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.4)',
              }}
            />
            <MiniMap
              zoomable
              pannable
              nodeColor={(n) => {
                if (n.data?.status === 'running') return '#f59e0b'
                if (n.data?.status === 'success') return '#10b981'
                if (n.data?.status === 'error') return '#ef4444'
                return '#4f46e5'
              }}
              nodeStrokeColor="#0f172a"
              nodeStrokeWidth={2}
              nodeBorderRadius={4}
              maskColor="rgba(11, 17, 32, 0.85)"
              style={{
                background: '#090d16',
                border: '1px solid #1f293d',
                borderRadius: '8px',
                width: 170,
                height: 110,
              }}
            />
          </ReactFlow>

          {/* Empty Canvas Quick-Start Helper */}
          {nodes.length === 0 && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(15, 23, 42, 0.92)',
                border: '1px solid #334155',
                borderRadius: '16px',
                padding: '28px 36px',
                textAlign: 'center',
                maxWidth: '440px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(8px)',
                zIndex: 20,
              }}
            >
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>🧭</div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>
                Your Canvas is Ready
              </div>
              <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5, marginBottom: '20px' }}>
                Start by adding nodes from the left library, or load a connected career progression pathway with one click.
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  onClick={() => setIsLibraryOpen(true)}
                  type="button"
                  style={{
                    backgroundColor: '#1e293b',
                    color: '#e2e8f0',
                    border: '1px solid #334155',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ⚡ Browse Node Library
                </button>
                <button
                  onClick={handleGenerateCareerProgressionPathway}
                  type="button"
                  style={{
                    background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(79, 70, 229, 0.4)',
                  }}
                >
                  🔗 Create Full Pathway
                </button>
              </div>
            </div>
          )}

          {/* Bottom Helpful Canvas Shortcuts Pill */}
          <div
            style={{
              position: 'absolute',
              bottom: '14px',
              left: '16px',
              backgroundColor: 'rgba(11, 17, 32, 0.85)',
              border: '1px solid #1e293b',
              borderRadius: '20px',
              padding: '4px 12px',
              fontSize: '11px',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              pointerEvents: 'none',
              backdropFilter: 'blur(4px)',
              zIndex: 10,
            }}
          >
            <span>💡 <b>Tip:</b> Click any node to configure</span>
            <span>•</span>
            <span>Drag handles to connect</span>
            <span>•</span>
            <span><kbd style={{ background: '#1e293b', padding: '1px 5px', borderRadius: '4px', color: '#94a3b8' }}>Del</kbd> to remove</span>
          </div>
        </div>

        {selectedNode && (
          <NodeConfigPanel
            selectedNode={selectedNode}
            nodes={nodes}
            onUpdateNodeData={handleUpdateNodeData}
            onAddRoadmapNodesAndEdges={handleAddGeneratedRoadmapSteps}
            onReplanRoadmapSteps={handleReplanRoadmapSteps}
            onDeleteNode={handleDeleteNode}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </div>

      {/* Career Comparison Modal Matrix */}
      <CareerComparisonModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        nodes={nodes}
      />

      {/* Interactive AI Mock Interview Modal */}
      {(() => {
        const profileNode = nodes.find((n) => n.type === 'studentProfileNode')
        const profileData = profileNode?.data as StudentProfileNodeData | undefined
        const roadmapNode = nodes.find((n) => n.type === 'aiRoadmapNode')
        const roadmapData = roadmapNode?.data as AIRoadmapNodeData | undefined
        const activeInterviewNode = nodes.find((n) => n.type === 'interviewNode')
        const interviewNodeData = activeInterviewNode?.data as any

        const currentTargetCareer =
          interviewNodeData?.targetCareer ||
          roadmapData?.targetCareer ||
          profileData?.careerGoal ||
          'Software Engineer'

        const currentSkills = profileData?.skills
          ? profileData.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
          : ['Python', 'SQL', 'React']

        const currentProjects =
          roadmapData?.roadmapResult?.steps?.flatMap((s) => s.projects) || [
            `${currentTargetCareer} Showcase Application`,
          ]

        return (
          <MockInterviewModal
            isOpen={isMockModalOpen}
            onClose={() => setIsMockModalOpen(false)}
            targetCareer={currentTargetCareer}
            skills={currentSkills}
            projects={currentProjects}
            profileId={profileData?.profileId}
            onSessionCompleted={(completedSession) => {
              if (activeInterviewNode) {
                handleUpdateNodeData(activeInterviewNode.id, {
                  lastMockSessionId: completedSession.session_id,
                  status: 'success',
                  statusMessage: `Mock Score: ${completedSession.final_feedback?.overall_score || 8}/10`,
                })
              }
            }}
          />
        )
      })()}
    </div>
  )
}

