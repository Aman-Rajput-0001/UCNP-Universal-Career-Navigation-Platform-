import { memo } from 'react'
import type { NodeProps, Node } from '@xyflow/react'
import { BaseWorkflowNode } from './BaseWorkflowNode'
import type { JobNodeData } from '../types/workflow'

export const JobNode = memo(function JobNode(
  props: NodeProps<Node<JobNodeData>>
) {
  const { data, selected } = props
  const role = data.entryRoleData

  return (
    <BaseWorkflowNode
      data={{
        ...data,
        title: data.title || 'Job (Entry-Level)',
        description: data.description || 'Target first career role',
        category: 'career',
        icon: data.icon || '🚀',
      }}
      selected={selected}
      showInputHandle={true}
      showOutputHandle={true}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {role ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc' }}>
                {role.title}
              </span>
              {role.is_demo_blueprint && (
                <span
                  style={{
                    fontSize: '8px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                  }}
                >
                  Benchmark
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
              <span>Experience:</span>
              <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{role.experience_level}</span>
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
              <span>Benchmark Comp:</span>
              <span style={{ color: '#34d399', fontWeight: 600 }}>{role.typical_salary_range}</span>
            </div>

            <div style={{ fontSize: '10px', color: '#94a3b8' }}>
              Focus: {role.interview_focus_areas.slice(0, 3).join(', ')}
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
            Select node to inspect entry-level role blueprint
          </div>
        )}
      </div>
    </BaseWorkflowNode>
  )
})

