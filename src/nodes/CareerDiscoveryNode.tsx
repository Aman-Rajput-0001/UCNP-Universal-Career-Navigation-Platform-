import { memo } from 'react'
import type { NodeProps, Node } from '@xyflow/react'
import type { CareerDiscoveryNodeData, CareerDiscoveryItem } from '../types/workflow'
import { BaseWorkflowNode } from './BaseWorkflowNode'

export type CareerDiscoveryNodeType = Node<CareerDiscoveryNodeData, 'careerDiscoveryNode'>

function getEligibilityBadge(level: string) {
  switch (level) {
    case 'direct':
      return {
        text: 'Direct Entry',
        color: '#34d399',
        bg: 'rgba(16, 185, 129, 0.15)',
        border: 'rgba(16, 185, 129, 0.3)',
      }
    case 'additional_requirements':
      return {
        text: 'Upskilling Required',
        color: '#facc15',
        bg: 'rgba(234, 179, 8, 0.15)',
        border: 'rgba(234, 179, 8, 0.3)',
      }
    case 'restricted':
      return {
        text: 'Restricted / Statutory Bar',
        color: '#f87171',
        bg: 'rgba(239, 68, 68, 0.15)',
        border: 'rgba(239, 68, 68, 0.3)',
      }
    default:
      return {
        text: level,
        color: '#94a3b8',
        bg: 'rgba(148, 163, 184, 0.15)',
        border: 'rgba(148, 163, 184, 0.3)',
      }
  }
}

export const CareerDiscoveryNode = memo(function CareerDiscoveryNode({
  data,
  selected,
}: NodeProps<CareerDiscoveryNodeType>) {
  const careers = data.careers || []

  return (
    <BaseWorkflowNode
      data={{
        ...data,
        title: data.title || 'Career Discovery',
        description: data.description || 'AI Discovery & Eligibility Check',
        category: 'discovery',
        icon: data.icon || '🧭',
      }}
      selected={selected}
      showInputHandle={true}
      showOutputHandle={true}
    >
      {careers.length === 0 ? (
        <div style={{ color: '#94a3b8', fontSize: '11px', textAlign: 'center', padding: '6px 0' }}>
          Connect profile & click <strong>Discover Careers</strong>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#a78bfa' }}>
              Suggested Pathways ({careers.length})
            </span>
          </div>

          {careers.slice(0, 3).map((career: CareerDiscoveryItem, idx: number) => {
            const badge = getEligibilityBadge(career.eligibility_level)
            return (
              <div
                key={idx}
                style={{
                  padding: '7px 9px',
                  backgroundColor: '#0f172a',
                  borderRadius: '6px',
                  border: '1px solid #1e293b',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: '11px', color: '#f8fafc' }}>
                    {career.career_name}
                  </span>
                  <span
                    style={{
                      fontSize: '9px',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      color: badge.color,
                      backgroundColor: badge.bg,
                      border: `1px solid ${badge.border}`,
                    }}
                  >
                    {badge.text}
                  </span>
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1.25 }}>
                  {career.match_reason.slice(0, 95)}...
                </div>
              </div>
            )
          })}
        </div>
      )}
    </BaseWorkflowNode>
  )
})

