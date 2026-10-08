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
  fetchCareerPathwayApi,
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
  {
    id: 'student-profile-1',
    type: 'studentProfileNode',
    position: { x: 380, y: 160 },
    data: {
      title: 'Student Profile',
      description: 'Universal background & career context',
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
    } as StudentProfileNodeData,
  },
]

const defaultInitialEdges: Edge[] = []

export function WorkflowCanvas() {
  const [nodes, setNodes] = useState<Node<WorkflowNodeData>[]>(defaultInitialNodes)
  const [edges, setEdges] = useState<Edge[]>(defaultInitialEdges)
  const [isLibraryOpen, setIsLibraryOpen] = useState(true)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null)
  const [isCompareOpen, setIsCompareOpen] = useState(false)
  const [isMockModalOpen, setIsMockModalOpen] = useState(false)

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

  // Load existing workflow from localStorage on initial mount if available and hydrate persisted progress
  useEffect(() => {
    const saved = loadWorkflowFromLocalStorage()
    const activeNodes = saved ? saved.nodes : nodes
    if (saved) {
      setNodes(saved.nodes)
      setEdges(saved.edges)
    }

    // Attempt to hydrate roadmap progress from backend
    const roadmapNode = activeNodes.find((n) => n.type === 'aiRoadmapNode')
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

  const handleGenerateCareerProgressionPathway = useCallback(async () => {
    // Determine target career and profile from nodes
    const profileNode = nodes.find((n) => n.type === 'studentProfileNode')
    const profileData = (profileNode?.data || {}) as StudentProfileNodeData

    const roadmapNode = nodes.find((n) => n.type === 'aiRoadmapNode')
    const targetCareer =
      (roadmapNode?.data as any)?.targetCareer ||
      profileData.careerGoal ||
      'Full Stack Developer'

    const candidateSkills = (profileData.skills || 'Python, SQL, React')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    setToastMessage('Building Career Progression Chain...')

    const res = await fetchCareerPathwayApi({
      career_name: targetCareer,
      candidate_skills: candidateSkills,
      education_level: profileData.educationLevel || "Bachelor's Degree",
    })

    if (!res.success || !res.data) {
      setToastMessage(res.error || 'Failed to generate pathway')
      return
    }

    const pathwayData = res.data
    const timestamp = Date.now()

    // Base position anchor with n8n-style spacing
    const startX = 180
    const startY = 380
    const xGap = 360

    // Progression: Skills → Projects → Portfolio → Resume → Internship → Entry-level role → Career growth
    const pathwayNodes: Node<WorkflowNodeData>[] = [
      {
        id: `prog-skills-${timestamp}`,
        type: 'studentProfileNode',
        position: { x: startX, y: startY },
        data: {
          title: 'Step 1: Core Skills',
          description: 'Foundation competencies & skill baseline',
          category: 'input',
          icon: '⚡',
          status: 'success',
          statusMessage: 'Baseline Verified',
          educationLevel: profileData.educationLevel || "Bachelor's Degree",
          skills: candidateSkills.join(', '),
          careerGoal: targetCareer,
          summaryItems: [
            { label: 'Role Focus', value: targetCareer },
            { label: 'Skills', value: `${candidateSkills.length} identified` },
          ],
        } as StudentProfileNodeData,
      },
      {
        id: `prog-projects-${timestamp}`,
        type: 'projectsNode',
        position: { x: startX + xGap, y: startY },
        data: {
          title: 'Step 2: Proof-of-Work Projects',
          description: 'Hands-on applied portfolio building',
          category: 'learning',
          icon: '🛠️',
          status: 'success',
          statusMessage: 'Project Blueprints',
          targetCareer,
          targetSkills: candidateSkills,
          summaryItems: [
            { label: 'Projects', value: '2 Curated' },
            { label: 'Track', value: 'Production-ready' },
          ],
        },
      },
      {
        id: `prog-portfolio-${timestamp}`,
        type: 'projectsNode',
        position: { x: startX + xGap * 2, y: startY },
        data: {
          title: 'Step 3: Live Portfolio',
          description: 'Deploy live demos, GitHub repos & technical writeups',
          category: 'learning',
          icon: '🌐',
          status: 'success',
          statusMessage: 'Showcase Ready',
          targetCareer,
          summaryItems: [
            { label: 'Artifacts', value: 'GitHub + Live Demo' },
            { label: 'Evidence', value: 'Measurable Impact' },
          ],
        },
      },
      {
        id: `prog-resume-${timestamp}`,
        type: 'resumeNode',
        position: { x: startX + xGap * 3, y: startY },
        data: {
          title: 'Step 4: Tailored Resume',
          description: 'ATS-optimized resume showcasing verified project impact',
          category: 'action',
          icon: '📄',
          status: 'success',
          statusMessage: 'ATS Optimized',
          summaryItems: [
            { label: 'Format', value: 'Action-verb / Metric first' },
            { label: 'Target', value: targetCareer },
          ],
        },
      },
      {
        id: `prog-internship-${timestamp}`,
        type: 'internshipNode',
        position: { x: startX + xGap * 4, y: startY },
        data: {
          title: 'Step 5: Internship',
          description: pathwayData.internship.title,
          category: 'action',
          icon: '💼',
          status: 'success',
          statusMessage: 'Blueprint Ready',
          targetCareer,
          internshipData: pathwayData.internship,
          summaryItems: [
            { label: 'Type', value: pathwayData.internship.organization_type },
            { label: 'Stipend', value: pathwayData.internship.stipend_range },
            { label: 'PPO', value: pathwayData.internship.conversion_potential },
          ],
        },
      },
      {
        id: `prog-entryrole-${timestamp}`,
        type: 'jobNode',
        position: { x: startX + xGap * 5, y: startY },
        data: {
          title: 'Step 6: Entry-level Role',
          description: pathwayData.entry_role.title,
          category: 'career',
          icon: '🚀',
          status: 'success',
          statusMessage: 'Role Archetype Ready',
          targetCareer,
          entryRoleData: pathwayData.entry_role,
          summaryItems: [
            { label: 'Level', value: pathwayData.entry_role.experience_level },
            { label: 'Comp', value: pathwayData.entry_role.typical_salary_range },
          ],
        },
      },
      {
        id: `prog-growth-${timestamp}`,
        type: 'careerGrowthNode',
        position: { x: startX + xGap * 6, y: startY },
        data: {
          title: 'Step 7: Career Growth',
          description: 'Multi-stage seniority ladder and promotion benchmarks',
          category: 'career',
          icon: '📈',
          status: 'success',
          statusMessage: 'Ladder Ready',
          targetCareer,
          stagesData: pathwayData.career_stages,
          progressionChain: pathwayData.progression_chain,
          summaryItems: [
            { label: 'Stages', value: `${pathwayData.career_stages.length} Tiers` },
            { label: 'Path', value: 'Entry → Mid → Senior → Lead → Mgt' },
          ],
        },
      },
    ]

    // Create 6 directed edges connecting the 7 stages
    const pathwayEdges: Edge[] = [
      {
        id: `edge-prog-1-2-${timestamp}`,
        source: pathwayNodes[0].id,
        target: pathwayNodes[1].id,
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2.5 },
      },
      {
        id: `edge-prog-2-3-${timestamp}`,
        source: pathwayNodes[1].id,
        target: pathwayNodes[2].id,
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2.5 },
      },
      {
        id: `edge-prog-3-4-${timestamp}`,
        source: pathwayNodes[2].id,
        target: pathwayNodes[3].id,
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2.5 },
      },
      {
        id: `edge-prog-4-5-${timestamp}`,
        source: pathwayNodes[3].id,
        target: pathwayNodes[4].id,
        animated: true,
        style: { stroke: '#3b82f6', strokeWidth: 2.5 },
      },
      {
        id: `edge-prog-5-6-${timestamp}`,
        source: pathwayNodes[4].id,
        target: pathwayNodes[5].id,
        animated: true,
        style: { stroke: '#3b82f6', strokeWidth: 2.5 },
      },
      {
        id: `edge-prog-6-7-${timestamp}`,
        source: pathwayNodes[5].id,
        target: pathwayNodes[6].id,
        animated: true,
        style: { stroke: '#10b981', strokeWidth: 2.5 },
      },
    ]

    setNodes((prev) => [...prev, ...pathwayNodes])
    setEdges((prev) => [...prev, ...pathwayEdges])
    setSelectedNodeId(pathwayNodes[4].id) // Select Internship node
    setToastMessage('Progression Pathway: Skills → Projects → Portfolio → Resume → Internship → Job → Growth instantiated!')
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

    // Preserve primary roadmap completely, just add the new simulation node & edge
    setNodes((prev) => [...prev, newSimulationNode])
    setEdges((prev) => [...prev, ...newEdges])
    setSelectedNodeId(newSimulationNode.id)
    setToastMessage(`Simulated pathway for "${simData.career}" added to canvas!`)
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

          <button
            onClick={handleGenerateCareerProgressionPathway}
            type="button"
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 4px rgba(79, 70, 229, 0.3)',
              transition: 'opacity 0.15s ease',
            }}
            title="Generate connected chain: Skills → Projects → Portfolio → Resume → Internship → Job → Growth"
          >
            <span>🔗</span>
            <span>Connect Full Pathway</span>
          </button>

          {/* Quick What-If Career Simulation Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#131b2e', padding: '2px 4px', borderRadius: '6px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '11px', color: '#c084fc', fontWeight: 600, paddingLeft: '4px' }}>
              🔮 What-If:
            </span>
            <button
              onClick={() => handleSimulateAlternativeCareer('Data Analyst')}
              type="button"
              style={{
                background: '#1e293b',
                color: '#e2e8f0',
                border: '1px solid #334155',
                padding: '4px 8px',
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
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 500,
              }}
              title="Simulate Product Manager pathway"
            >
              Product Manager
            </button>
            <button
              onClick={() => handleSimulateAlternativeCareer('Government career')}
              type="button"
              style={{
                background: '#1e293b',
                color: '#e2e8f0',
                border: '1px solid #334155',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 500,
              }}
              title="Simulate Government career pathway"
            >
              Government
            </button>
          </div>

          <button
            onClick={() => setIsCompareOpen(true)}
            type="button"
            style={{
              background: '#047857',
              color: '#ffffff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 4px rgba(4, 120, 87, 0.3)',
            }}
            title="Open side-by-side career comparison matrix"
          >
            <span>⚖️</span>
            <span>Compare Careers</span>
          </button>

          <button
            onClick={() => setIsMockModalOpen(true)}
            type="button"
            style={{
              background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 4px rgba(234, 88, 12, 0.3)',
            }}
            title="Launch interactive AI Mock Interview session"
          >
            <span>🎙️</span>
            <span>Mock Interview</span>
          </button>

          <button
            onClick={handleSaveWorkflow}
            type="button"
            style={{
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.3)',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
            title="Save workflow state to browser local storage"
          >
            💾 Save Workflow
          </button>

          <button
            onClick={handleLoadWorkflow}
            type="button"
            style={{
              background: '#1e293b',
              color: '#e2e8f0',
              border: '1px solid #334155',
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
            📂 Load Workflow
          </button>
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
        </div>

        {selectedNode && (
          <NodeConfigPanel
            selectedNode={selectedNode}
            nodes={nodes}
            onUpdateNodeData={handleUpdateNodeData}
            onAddRoadmapNodesAndEdges={handleAddGeneratedRoadmapSteps}
            onReplanRoadmapSteps={handleReplanRoadmapSteps}
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

