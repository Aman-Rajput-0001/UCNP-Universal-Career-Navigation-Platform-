import { memo, type ReactNode } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { WorkflowNodeData, NodeExecutionStatus } from '../types/workflow'
import { NODE_CATEGORY_CONFIGS } from './nodeConfig'
import './nodes.css'

export interface BaseWorkflowNodeProps {
  data: WorkflowNodeData
  selected?: boolean
  children?: ReactNode
  showInputHandle?: boolean
  showOutputHandle?: boolean
}

function getStatusBadge(status?: NodeExecutionStatus, message?: string) {
  switch (status) {
    case 'running':
      return (
        <span className="workflow-node-status-badge status-badge-running">
          <span className="spinner" />
          {message || 'Running'}
        </span>
      )
    case 'success':
      return (
        <span className="workflow-node-status-badge status-badge-success">
          ✓ {message || 'Ready'}
        </span>
      )
    case 'error':
      return (
        <span className="workflow-node-status-badge status-badge-error">
          ✕ {message || 'Error'}
        </span>
      )
    default:
      return null
  }
}

export const BaseWorkflowNode = memo(function BaseWorkflowNode({
  data,
  selected = false,
  children,
  showInputHandle = true,
  showOutputHandle = true,
}: BaseWorkflowNodeProps) {
  const status = data.status || 'idle'
  const categoryConfig = data.category ? NODE_CATEGORY_CONFIGS[data.category] : undefined

  const stateClass = [
    'workflow-node',
    selected ? 'state-selected' : '',
    status !== 'idle' ? `state-${status}` : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={stateClass}>
      {/* Input Port (Left) */}
      {showInputHandle && (
        <Handle
          type="target"
          position={Position.Left}
          id="target"
          className="workflow-handle workflow-handle-left"
        />
      )}

      {/* Header */}
      <div className="workflow-node-header">
        {data.icon && <div className="workflow-node-icon">{data.icon}</div>}

        <div className="workflow-node-header-text">
          <div className="workflow-node-title">{data.title}</div>
          {data.description && (
            <div className="workflow-node-description">{data.description}</div>
          )}
        </div>

        {categoryConfig && (
          <span
            className="workflow-node-category-pill"
            style={{
              color: categoryConfig.color,
              background: categoryConfig.bgColor,
              border: `1px solid ${categoryConfig.borderColor}`,
            }}
          >
            {categoryConfig.label}
          </span>
        )}

        {getStatusBadge(status, data.statusMessage)}
      </div>

      {/* Body */}
      <div className="workflow-node-body">
        {children
          ? children
          : data.summaryItems && data.summaryItems.length > 0 && (
              <>
                {data.summaryItems.map((item, idx) => (
                  <div key={idx} className="workflow-node-summary-row">
                    <span className="workflow-node-summary-label">{item.label}</span>
                    <span className="workflow-node-summary-value">{item.value}</span>
                  </div>
                ))}
              </>
            )}

        {selected && data.category !== 'input' && (
          <div
            style={{
              marginTop: '6px',
              padding: '3px 8px',
              borderRadius: '4px',
              backgroundColor: 'rgba(2, 132, 199, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              fontSize: '9px',
              color: '#38bdf8',
              fontWeight: 700,
            }}
          >
            <span>✨</span> "What should I do next?" (In Panel)
          </div>
        )}
      </div>

      {/* Output Port (Right) */}
      {showOutputHandle && (
        <Handle
          type="source"
          position={Position.Right}
          id="source"
          className="workflow-handle workflow-handle-right"
        />
      )}
    </div>
  )
})

