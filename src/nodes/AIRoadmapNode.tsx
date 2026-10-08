import { memo } from 'react'
import type { NodeProps, Node } from '@xyflow/react'
import { BaseWorkflowNode } from './BaseWorkflowNode'
import type { AIRoadmapNodeData } from '../types/workflow'

export const AIRoadmapNode = memo(function AIRoadmapNode(
  props: NodeProps<Node<AIRoadmapNodeData>>
) {
  const { data, selected } = props
  const roadmap = data.roadmapResult

  return (
    <BaseWorkflowNode
      data={{
        ...data,
        title: data.title || 'AI Roadmap',
        description: data.description || 'Personalized career transition plan',
        category: data.category || 'roadmap',
        icon: data.icon || '🗺️',
      }}
      selected={selected}
      showInputHandle={true}
      showOutputHandle={true}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {data.targetCareer && (
          <div
            style={{
              fontSize: '11px',
              padding: '4px 8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#93c5fd',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ color: '#94a3b8' }}>Target:</span>
            <span style={{ fontWeight: 600 }}>{data.targetCareer}</span>
          </div>
        )}

        {roadmap ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '10px',
                color: '#94a3b8',
                backgroundColor: '#0f172a',
                padding: '4px 8px',
                borderRadius: '4px',
              }}
            >
              <span>Milestones:</span>
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                {roadmap.steps.length} Steps
                {data.progressData?.completed_steps_count !== undefined
                  ? ` (${data.progressData.completed_steps_count}/${data.progressData.total_steps || roadmap.steps.length} done)`
                  : data.completedStepIds && data.completedStepIds.length > 0
                  ? ` (${data.completedStepIds.length} done)`
                  : ''}
              </span>
            </div>

            {/* Progress Percentage Bar */}
            {data.progressPercentage !== undefined && (
              <div
                style={{
                  backgroundColor: '#0f172a',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  border: '1px solid #1e293b',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                    Roadmap Progress
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: data.progressPercentage === 100 ? '#34d399' : '#38bdf8' }}>
                    {data.progressPercentage}%
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '5px',
                    backgroundColor: '#1e293b',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(0, data.progressPercentage))}%`,
                      height: '100%',
                      backgroundColor: data.progressPercentage === 100 ? '#10b981' : '#3b82f6',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
            )}

            {data.replanSummary && (
              <div
                style={{
                  fontSize: '9px',
                  color: '#fbbf24',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  padding: '3px 6px',
                  borderRadius: '4px',
                  lineHeight: 1.25,
                }}
              >
                ⚡ Replanned dynamically
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '10px',
                color: '#94a3b8',
                backgroundColor: '#0f172a',
                padding: '4px 8px',
                borderRadius: '4px',
              }}
            >
              <span>Total Duration:</span>
              <span style={{ color: '#34d399', fontWeight: 600 }}>
                {roadmap.total_estimated_duration}
              </span>
            </div>

            {/* Quick steps preview badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '2px' }}>
              {roadmap.steps.slice(0, 4).map((step, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '9px',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    backgroundColor: '#1e293b',
                    color: '#cbd5e1',
                    border: '1px solid #334155',
                  }}
                >
                  {step.type}
                </span>
              ))}
              {roadmap.steps.length > 4 && (
                <span style={{ fontSize: '9px', color: '#64748b', alignSelf: 'center' }}>
                  +{roadmap.steps.length - 4} more
                </span>
              )}
            </div>
          </div>
        ) : (
          <div
            style={{
              fontSize: '11px',
              color: '#64748b',
              fontStyle: 'italic',
              textAlign: 'center',
              padding: '6px 0',
            }}
          >
            Select node to generate personalized roadmap
          </div>
        )}
      </div>
    </BaseWorkflowNode>
  )
})
