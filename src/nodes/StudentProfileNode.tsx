import { memo } from 'react'
import type { NodeProps, Node } from '@xyflow/react'
import type { StudentProfileNodeData } from '../types/workflow'
import { BaseWorkflowNode } from './BaseWorkflowNode'

export type StudentProfileNodeType = Node<StudentProfileNodeData, 'studentProfileNode'>

export const StudentProfileNode = memo(function StudentProfileNode({
  data,
  selected,
}: NodeProps<StudentProfileNodeType>) {
  const summaryItems = [
    {
      label: 'Education',
      value: data.educationLevel
        ? `${data.educationLevel}${data.degreeOrCourse ? ` (${data.degreeOrCourse})` : ''}`
        : 'Universal (Any background)',
    },
    {
      label: 'Branch/Sub',
      value: data.branchOrSubject || 'Skill-first / Open',
    },
    {
      label: 'Goal',
      value: data.careerGoal || 'Explore viable careers',
    },
    {
      label: 'Available',
      value: data.availableTime || 'Flexible',
    },
  ]

  return (
    <BaseWorkflowNode
      data={{
        ...data,
        title: data.title || 'Student Profile',
        description: data.description || 'Education & preferences',
        category: data.category || 'input',
        icon: data.icon || '🎓',
        summaryItems,
      }}
      selected={selected}
      showInputHandle={false}
      showOutputHandle={true}
    />
  )
})
