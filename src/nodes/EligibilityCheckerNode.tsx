import { memo } from 'react'
import type { NodeProps, Node } from '@xyflow/react'
import type { EligibilityCheckerNodeData } from '../types/workflow'
import { BaseWorkflowNode } from './BaseWorkflowNode'
import { getStatusColorConfig } from './nodeConfig'

export type EligibilityCheckerNodeType = Node<EligibilityCheckerNodeData, 'eligibilityCheckerNode'>

export const EligibilityCheckerNode = memo(function EligibilityCheckerNode({
  data,
  selected,
}: NodeProps<EligibilityCheckerNodeType>) {
  const result = data.eligibilityResult
  const colorConfig = getStatusColorConfig(result?.status)

  return (
    <BaseWorkflowNode
      data={{
        ...data,
        title: data.title || 'Eligibility Checker',
        description: data.description || 'Statutory & Prerequisite Verification',
        category: 'analysis',
        icon: data.icon || '✅',
      }}
      selected={selected}
      showInputHandle={true}
      showOutputHandle={true}
    >
      {!result ? (
        <div style={{ color: '#94a3b8', fontSize: '11px', textAlign: 'center', padding: '6px 0' }}>
          Select career and click <strong>Check Eligibility</strong>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Target career label */}
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc' }}>
            Career: <span style={{ color: '#38bdf8' }}>{data.targetCareer || 'Target Career'}</span>
          </div>

          {/* Color Status Badge */}
          <div
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              backgroundColor: colorConfig.bgColor,
              border: `1px solid ${colorConfig.borderColor}`,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: colorConfig.dotColor,
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: '10px', fontWeight: 700, color: colorConfig.textColor, letterSpacing: '0.3px' }}>
              {colorConfig.badgeText}
            </span>
          </div>

          {/* Explanation snippet */}
          <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.3 }}>
            {result.explanation.slice(0, 110)}...
          </div>
        </div>
      )}
    </BaseWorkflowNode>
  )
})

