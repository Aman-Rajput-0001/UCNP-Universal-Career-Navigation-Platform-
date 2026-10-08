import { memo } from 'react'
import type { NodeProps, Node } from '@xyflow/react'
import { BaseWorkflowNode } from './BaseWorkflowNode'
import type { LearningNodeData } from '../types/workflow'

export const LearningNode = memo(function LearningNode(
  props: NodeProps<Node<LearningNodeData>>
) {
  const { data, selected } = props
  const recommendations = data.learningRecommendations || []

  return (
    <BaseWorkflowNode
      data={{
        ...data,
        title: data.title || 'Learning',
        description: data.description || 'Targeted skill curriculum',
        category: 'learning',
        icon: data.icon || '📚',
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
              padding: '3px 8px',
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

        {recommendations.length > 0 ? (
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
              <span>Skills Tracked:</span>
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                {recommendations.length} Skills
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {recommendations.slice(0, 3).map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    fontSize: '10px',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    backgroundColor: '#1e293b',
                    color: '#e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{item.skill_name}</span>
                  <span style={{ color: '#34d399' }}>{item.estimated_time.split(' ')[0]} {item.estimated_time.split(' ')[1] || ''}</span>
                </div>
              ))}
              {recommendations.length > 3 && (
                <div style={{ fontSize: '9px', color: '#64748b', textAlign: 'center' }}>
                  +{recommendations.length - 3} more skills
                </div>
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
            Select node to generate learning recommendations
          </div>
        )}
      </div>
    </BaseWorkflowNode>
  )
})

