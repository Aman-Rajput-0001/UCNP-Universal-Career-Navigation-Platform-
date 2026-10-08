import { memo } from 'react'
import type { NodeProps, Node } from '@xyflow/react'
import type { WorkflowNodeData } from '../types/workflow'
import { BaseWorkflowNode } from './BaseWorkflowNode'

export type PlaceholderWorkflowNodeType = Node<WorkflowNodeData>

export const PlaceholderWorkflowNode = memo(function PlaceholderWorkflowNode({
  data,
  selected,
}: NodeProps<PlaceholderWorkflowNodeType>) {
  return (
    <BaseWorkflowNode
      data={{
        ...data,
        title: data.title || 'Workflow Node',
        description: data.description || 'Placeholder node',
        category: data.category || 'action',
        icon: data.icon || '📦',
      }}
      selected={selected}
      showInputHandle={true}
      showOutputHandle={true}
    />
  )
})

