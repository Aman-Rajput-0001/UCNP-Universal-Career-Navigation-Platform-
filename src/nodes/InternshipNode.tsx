import { memo } from 'react'
import type { NodeProps, Node } from '@xyflow/react'
import { BaseWorkflowNode } from './BaseWorkflowNode'
import type { InternshipNodeData } from '../types/workflow'

export const InternshipNode = memo(function InternshipNode(
  props: NodeProps<Node<InternshipNodeData>>
) {
  const { data, selected } = props
  const intern = data.internshipData

  return (
    <BaseWorkflowNode
      data={{
        ...data,
        title: data.title || 'Internship',
        description: data.description || 'Experiential learning & PPO conversion',
        category: 'action',
        icon: data.icon || '💼',
      }}
      selected={selected}
      showInputHandle={true}
      showOutputHandle={true}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {intern ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc' }}>
                {intern.title}
              </span>
              {intern.is_demo_blueprint && (
                <span
                  style={{
                    fontSize: '8px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    color: '#fbbf24',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                  }}
                >
                  Blueprint Archetype
                </span>
              )}
            </div>

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
              <span>Duration:</span>
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>{intern.duration}</span>
            </div>

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
              <span>Stipend:</span>
              <span style={{ color: '#34d399', fontWeight: 600 }}>{intern.stipend_range}</span>
            </div>

            <div style={{ fontSize: '10px', color: '#cbd5e1', backgroundColor: '#131b2e', padding: '5px 8px', borderRadius: '4px' }}>
              <span style={{ color: '#a78bfa', fontWeight: 600 }}>PPO Potential: </span>
              <span>{intern.conversion_potential}</span>
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
            Select node to inspect internship blueprint
          </div>
        )}
      </div>
    </BaseWorkflowNode>
  )
})

