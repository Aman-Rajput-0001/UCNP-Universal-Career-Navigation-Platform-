import { useState, useEffect } from 'react'
import type { Node } from '@xyflow/react'
import type {
  WorkflowNodeData,
  StudentProfileNodeData,
  AIRoadmapNodeData,
  RoadmapStepNodeData,
  ContextualAssistResponse,
  ContextualAssistPayload,
} from '../types/workflow'
import { fetchContextualAssistApi } from '../services/api'

interface ContextualAIAssistantProps {
  selectedNode: Node<WorkflowNodeData>
  nodes: Node<WorkflowNodeData>[]
}

// In-memory cache for assistance by nodeId to keep navigation snappy
const assistCache: Record<string, ContextualAssistResponse> = {}

export function ContextualAIAssistant({ selectedNode, nodes }: ContextualAIAssistantProps) {
  const [assistance, setAssistance] = useState<ContextualAssistResponse | null>(
    assistCache[selectedNode.id] || null
  )
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // When selected node changes, update to cached result if available
  useEffect(() => {
    setAssistance(assistCache[selectedNode.id] || null)
    setError(null)
  }, [selectedNode.id])

  // Extract student profile context
  const profileNode = nodes.find((n) => n.type === 'studentProfileNode')
  const profileData = profileNode?.data as StudentProfileNodeData | undefined

  // Extract roadmap context
  const roadmapNode = nodes.find((n) => n.type === 'aiRoadmapNode')
  const roadmapData = roadmapNode?.data as AIRoadmapNodeData | undefined

  // Derive target career
  const targetCareer =
    roadmapData?.targetCareer ||
    profileData?.careerGoal ||
    'Software Engineer'

  // Derive roadmap steps summary
  const roadmapStepNodes = nodes.filter((n) => n.type === 'roadmapStepNode')
  const totalSteps = roadmapData?.roadmapResult?.steps?.length || roadmapStepNodes.length
  const completedCount =
    roadmapData?.completedStepIds?.length ||
    roadmapStepNodes.filter(
      (n) => (n.data as RoadmapStepNodeData).progressStatus === 'completed'
    ).length

  const nodeTitle = (selectedNode.data.title as string) || selectedNode.type || 'Workflow Node'
  const nodeStepData = selectedNode.data as RoadmapStepNodeData
  const nodeSkills = Array.isArray(nodeStepData?.skills) ? nodeStepData.skills : []

  const handleFetchAssistance = async () => {
    setLoading(true)
    setError(null)

    // Build Student Profile context
    const profileSkills = profileData?.skills
      ? profileData.skills.split(',').map((s) => s.trim()).filter(Boolean)
      : []
    const profileInterests = profileData?.interests
      ? profileData.interests.split(',').map((s) => s.trim()).filter(Boolean)
      : []
    const profileStrengths = profileData?.strengths
      ? profileData.strengths.split(',').map((s) => s.trim()).filter(Boolean)
      : []
    const profileWeaknesses = profileData?.weaknesses
      ? profileData.weaknesses.split(',').map((s) => s.trim()).filter(Boolean)
      : []

    const payload: ContextualAssistPayload = {
      profile_id: profileData?.profileId,
      student_profile: {
        education: profileData?.educationLevel || 'Skill-first',
        degree: profileData?.degreeOrCourse,
        branch: profileData?.branchOrSubject,
        currentYear: profileData?.currentYear,
        skills: profileSkills,
        interests: profileInterests,
        strengths: profileStrengths,
        weaknesses: profileWeaknesses,
        careerGoal: profileData?.careerGoal || targetCareer,
        availableTime: profileData?.availableTime || '10-15 hrs/week',
      },
      target_career: targetCareer,
      selected_node: {
        node_id: selectedNode.id,
        node_type: selectedNode.type || 'roadmapStepNode',
        title: nodeTitle,
        step_type: nodeStepData?.stepType || (selectedNode.data.category as string) || 'learning',
        skills: nodeSkills,
        description: (selectedNode.data.description as string) || '',
        status: nodeStepData?.progressStatus || 'not_started',
        estimated_duration: nodeStepData?.estimatedDuration || '',
      },
      roadmap_context: {
        total_steps: totalSteps,
        completed_steps_count: completedCount,
        surrounding_steps: roadmapStepNodes.slice(0, 5).map((n) => (n.data.title as string) || n.id),
      },
    }

    const res = await fetchContextualAssistApi(payload)
    setLoading(false)

    if (res.success && res.data) {
      assistCache[selectedNode.id] = res.data
      setAssistance(res.data)
    } else {
      setError(res.error || 'Failed to generate contextual guidance')
    }
  }

  return (
    <div
      style={{
        backgroundColor: '#0b1120',
        borderRadius: '10px',
        border: '1px solid #1e293b',
        padding: '14px',
        marginBottom: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
      }}
    >
      {/* Header with context pills */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '15px' }}>🤖</span>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#38bdf8',
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}
          >
            Contextual AI Assistant
          </span>
        </div>
        <span
          style={{
            fontSize: '10px',
            padding: '2px 7px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(56, 189, 248, 0.12)',
            color: '#7dd3fc',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            fontWeight: 600,
          }}
        >
          {targetCareer}
        </span>
      </div>

      <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4, marginBottom: '12px' }}>
        Tailored next steps grounded in your background, target role, and current roadmap position for{' '}
        <strong style={{ color: '#f8fafc' }}>{nodeTitle}</strong>.
      </div>

      {/* Primary Action Button: "What should I do next?" */}
      <button
        onClick={handleFetchAssistance}
        disabled={loading}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '10px 14px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 700,
          color: '#ffffff',
          background: loading
            ? '#334155'
            : 'linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #4f46e5 100%)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)',
          transition: 'all 0.2s ease',
          marginBottom: assistance || error ? '14px' : '0',
        }}
      >
        <span>{loading ? '⏳' : '✨'}</span>
        <span>{loading ? 'Analyzing Workflow Context...' : 'What should I do next?'}</span>
      </button>

      {/* Loading state indicator */}
      {loading && (
        <div
          style={{
            marginTop: '10px',
            padding: '12px',
            borderRadius: '6px',
            backgroundColor: '#131b2e',
            border: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            color: '#94a3b8',
          }}
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              border: '2px solid #38bdf8',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <span>Synthesizing student profile, target career & roadmap position...</span>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div
          style={{
            marginTop: '10px',
            padding: '10px',
            borderRadius: '6px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            fontSize: '11px',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Guidance Cards */}
      {assistance && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* 1. Next Action */}
          <div
            style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(14, 165, 233, 0.1)',
              border: '1px solid rgba(14, 165, 233, 0.3)',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 800,
                color: '#38bdf8',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '5px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span>⚡</span> Immediate Next Action
            </div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#f0f9ff',
                lineHeight: 1.45,
              }}
            >
              {assistance.next_action}
            </div>
          </div>

          {/* 2. Explanation */}
          <div
            style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: '#131b2e',
              border: '1px solid #1e293b',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 800,
                color: '#fbbf24',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '5px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span>💡</span> Why This Matters
            </div>
            <div
              style={{
                fontSize: '11px',
                color: '#cbd5e1',
                lineHeight: 1.5,
              }}
            >
              {assistance.explanation}
            </div>
          </div>

          {/* 3. Targeted Practice */}
          <div
            style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: '#131b2e',
              border: '1px solid #1e293b',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 800,
                color: '#34d399',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span>🎯</span> Targeted Practice & Drills
            </div>
            {Array.isArray(assistance.practice) ? (
              <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {assistance.practice.map((item, idx) => (
                  <li key={idx} style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4 }}>
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.45 }}>
                {assistance.practice}
              </div>
            )}
          </div>

          {/* 4. Applied Project */}
          <div
            style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: '#131b2e',
              border: '1px solid #1e293b',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 800,
                color: '#a78bfa',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '5px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span>🛠️</span> Hands-on Project
            </div>
            {typeof assistance.project === 'object' && assistance.project !== null ? (
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc', marginBottom: '3px' }}>
                  {assistance.project.title}
                </div>
                <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4, marginBottom: '6px' }}>
                  {assistance.project.description}
                </div>
                {assistance.project.deliverable && (
                  <div style={{ fontSize: '10px', color: '#38bdf8' }}>
                    📦 Deliverable: <strong>{assistance.project.deliverable}</strong>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.45 }}>
                {String(assistance.project)}
              </div>
            )}
          </div>

          {/* 5. Interview Questions */}
          {assistance.interview_questions && assistance.interview_questions.length > 0 && (
            <div
              style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: '#131b2e',
                border: '1px solid #1e293b',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#f472b6',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <span>🎤</span> Interview Questions to Expect
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {assistance.interview_questions.map((q, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '7px 9px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      fontSize: '11px',
                      color: '#e2e8f0',
                      lineHeight: 1.35,
                    }}
                  >
                    <span style={{ color: '#f472b6', fontWeight: 700, marginRight: '5px' }}>
                      Q{idx + 1}:
                    </span>
                    {q}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Next Milestone */}
          <div
            style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 800,
                color: '#34d399',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span>🏁</span> Next Milestone
            </div>
            <div
              style={{
                fontSize: '11px',
                color: '#a7f3d0',
                lineHeight: 1.45,
                fontWeight: 500,
              }}
            >
              {assistance.next_milestone}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
