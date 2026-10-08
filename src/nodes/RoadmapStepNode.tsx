import { memo } from 'react'
import type { NodeProps, Node } from '@xyflow/react'
import { BaseWorkflowNode } from './BaseWorkflowNode'
import type { RoadmapStepNodeData, RoadmapStepType } from '../types/workflow'

function getStepTypeBadge(type: RoadmapStepType) {
  switch (type) {
    case 'learning':
      return { icon: '📚', label: 'Learning', color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)' }
    case 'project':
      return { icon: '🛠️', label: 'Project', color: '#34d399', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)' }
    case 'certification':
      return { icon: '📜', label: 'Certification', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)' }
    case 'internship':
      return { icon: '💼', label: 'Internship', color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.15)', border: 'rgba(167, 139, 250, 0.3)' }
    case 'portfolio':
      return { icon: '📄', label: 'Portfolio', color: '#f472b6', bg: 'rgba(244, 114, 182, 0.15)', border: 'rgba(244, 114, 182, 0.3)' }
    case 'interview':
      return { icon: '🎤', label: 'Interview', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.3)' }
    case 'job':
      return { icon: '🚀', label: 'Job Placement', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.3)' }
    default:
      return { icon: '📍', label: type, color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.3)' }
  }
}

export const RoadmapStepNode = memo(function RoadmapStepNode(
  props: NodeProps<Node<RoadmapStepNodeData>>
) {
  const { data, selected } = props
  const badge = getStepTypeBadge(data.stepType || 'learning')

  return (
    <BaseWorkflowNode
      data={{
        ...data,
        title: data.title || 'Roadmap Step',
        description: data.description,
        category: 'roadmap',
        icon: badge.icon,
      }}
      selected={selected}
      showInputHandle={true}
      showOutputHandle={true}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Step Metadata Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '2px 6px',
                borderRadius: '4px',
                color: badge.color,
                backgroundColor: badge.bg,
                border: `1px solid ${badge.border}`,
              }}
            >
              {badge.label}
            </span>
            {data.progressStatus === 'completed' || data.status === 'success' ? (
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  color: '#34d399',
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  padding: '1px 6px',
                  borderRadius: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                ✓ COMPLETED
              </span>
            ) : data.progressStatus === 'in_progress' ? (
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  color: '#facc15',
                  backgroundColor: 'rgba(234, 179, 8, 0.2)',
                  border: '1px solid rgba(234, 179, 8, 0.4)',
                  padding: '1px 6px',
                  borderRadius: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                ⏳ IN PROGRESS
              </span>
            ) : (
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 600,
                  color: '#94a3b8',
                  backgroundColor: 'rgba(148, 163, 184, 0.1)',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  padding: '1px 5px',
                  borderRadius: '3px',
                }}
              >
                NOT STARTED
              </span>
            )}
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>
            ⏱️ {data.estimatedDuration || '2-3 Weeks'}
          </span>
        </div>

        {/* Skills Tagged */}
        {data.skills && data.skills.length > 0 && (
          <div>
            <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 600, marginBottom: '3px' }}>
              TARGET SKILLS
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
              {data.skills.map((skill, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '9px',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    backgroundColor: '#1e293b',
                    color: '#e2e8f0',
                    border: '1px solid #334155',
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Deliverable / Project preview */}
        {data.projects && data.projects.length > 0 && (
          <div
            style={{
              fontSize: '10px',
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '4px',
              padding: '4px 6px',
              color: '#cbd5e1',
            }}
          >
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>Deliverable: </span>
            <span>{data.projects[0]}</span>
          </div>
        )}

        {/* Selected contextual AI indicator */}
        {selected && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '4px',
              backgroundColor: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              fontSize: '10px',
              fontWeight: 700,
              color: '#38bdf8',
            }}
          >
            <span>✨</span> "What should I do next?" (In Panel)
          </div>
        )}
      </div>
    </BaseWorkflowNode>
  )
})
