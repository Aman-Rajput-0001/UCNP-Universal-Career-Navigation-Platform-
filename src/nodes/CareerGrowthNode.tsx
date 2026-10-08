import { memo } from 'react'
import type { NodeProps, Node } from '@xyflow/react'
import { BaseWorkflowNode } from './BaseWorkflowNode'
import type { CareerGrowthNodeData } from '../types/workflow'

export const CareerGrowthNode = memo(function CareerGrowthNode(
  props: NodeProps<Node<CareerGrowthNodeData>>
) {
  const { data, selected } = props
  const stages = data.stagesData || []

  return (
    <BaseWorkflowNode
      data={{
        ...data,
        title: data.title || 'Career Growth',
        description: data.description || 'Long-term promotion milestones',
        category: 'career',
        icon: data.icon || '📈',
      }}
      selected={selected}
      showInputHandle={true}
      showOutputHandle={false}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {data.targetCareer && (
          <div
            style={{
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(168, 85, 247, 0.12)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              color: '#c084fc',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ color: '#94a3b8' }}>Path:</span>
            <span style={{ fontWeight: 600 }}>{data.targetCareer}</span>
          </div>
        )}

        {stages.length > 0 ? (
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
              <span>Progression Stages:</span>
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>{stages.length} Tiers</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {stages.map((st, idx) => {
                const isManagement = st.role_type === 'management' || idx === 4
                const isSpecialist = st.role_type === 'specialist_lead' || idx === 3
                const tagColor = isManagement ? '#f59e0b' : isSpecialist ? '#c084fc' : idx === 2 ? '#38bdf8' : idx === 1 ? '#34d399' : '#94a3b8'
                const tagBg = isManagement ? 'rgba(245, 158, 11, 0.15)' : isSpecialist ? 'rgba(192, 132, 252, 0.15)' : 'rgba(51, 65, 85, 0.6)'
                
                return (
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
                      alignItems: 'center',
                      borderLeft: `3px solid ${tagColor}`,
                    }}
                  >
                    <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                      {st.stage_name.replace(/Level \d+:\s*/, '')}
                    </span>
                    <span
                      style={{
                        fontSize: '9px',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        backgroundColor: tagBg,
                        color: tagColor,
                        fontWeight: 600,
                      }}
                    >
                      {st.experience_expectations || st.years_of_experience || `L${st.stage_level}`}
                    </span>
                  </div>
                )
              })}
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
            Select node to inspect 5-stage career growth trajectory
          </div>
        )}
      </div>
    </BaseWorkflowNode>
  )
})

