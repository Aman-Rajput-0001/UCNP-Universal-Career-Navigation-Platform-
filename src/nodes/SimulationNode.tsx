import { memo } from 'react'
import type { NodeProps, Node } from '@xyflow/react'
import { BaseWorkflowNode } from './BaseWorkflowNode'
import type { SimulationNodeData } from '../types/workflow'
import { getStatusColorConfig } from './EligibilityCheckerNode'

export const SimulationNode = memo(function SimulationNode(
  props: NodeProps<Node<SimulationNodeData>>
) {
  const { data, selected } = props
  const sim = data.simulationData
  const eligibility = sim?.eligibility
  const statusCfg = eligibility ? getStatusColorConfig(eligibility.status) : null

  return (
    <BaseWorkflowNode
      data={{
        ...data,
        title: data.title || (sim ? `What-If: ${sim.career}` : 'Career Simulation'),
        description: data.description || (sim ? sim.estimated_path.slice(0, 75) + '...' : 'Hypothetical pathway simulation'),
        category: 'discovery',
        icon: '🔮',
      }}
      selected={selected}
      showInputHandle={true}
      showOutputHandle={true}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Banner: Simulated Career */}
        <div
          style={{
            padding: '5px 8px',
            borderRadius: '6px',
            backgroundColor: 'rgba(168, 85, 247, 0.12)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '10px', color: '#c084fc', fontWeight: 600 }}>
            SIMULATED PATHWAY
          </span>
          <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '3px', backgroundColor: '#581c87', color: '#f3e8ff', fontWeight: 700 }}>
            WHAT-IF
          </span>
        </div>

        {sim ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* Target Career Title */}
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
              {sim.career}
            </div>

            {/* Eligibility Badge */}
            {statusCfg && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 6px',
                  borderRadius: '4px',
                  backgroundColor: statusCfg.bgColor,
                  border: `1px solid ${statusCfg.borderColor}`,
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: statusCfg.dotColor,
                  }}
                />
                <span style={{ fontSize: '10px', fontWeight: 600, color: statusCfg.textColor }}>
                  {statusCfg.badgeText}
                </span>
              </div>
            )}

            {/* Milestones count and skill gap overview */}
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
              <span>Phased Steps:</span>
              <span style={{ color: '#c084fc', fontWeight: 600 }}>
                {sim.major_steps.length} Milestones
              </span>
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
              <span>Missing Skills:</span>
              <span style={{ color: '#f87171', fontWeight: 600 }}>
                {sim.skill_gap.missing_skills.length} gaps
              </span>
            </div>

            {/* First Entry Role */}
            {sim.possible_entry_roles.length > 0 && (
              <div
                style={{
                  fontSize: '9px',
                  backgroundColor: '#131b2e',
                  border: '1px solid #1e293b',
                  borderRadius: '4px',
                  padding: '4px 6px',
                  color: '#cbd5e1',
                }}
              >
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>Entry Target: </span>
                <span>{sim.possible_entry_roles[0]}</span>
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: '#64748b', fontSize: '10px', textAlign: 'center', padding: '6px 0', fontStyle: 'italic' }}>
            Click node to run simulation
          </div>
        )}
      </div>
    </BaseWorkflowNode>
  )
})
