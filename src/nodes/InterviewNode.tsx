import { memo } from 'react'
import type { NodeProps, Node } from '@xyflow/react'
import { BaseWorkflowNode } from './BaseWorkflowNode'
import type { InterviewNodeData } from '../types/workflow'

export const InterviewNode = memo(function InterviewNode(
  props: NodeProps<Node<InterviewNodeData>>
) {
  const { data, selected } = props
  const suite = data.interviewSuite
  const answers = data.answers || {}
  const totalQuestions = suite?.total_questions_count || 0
  const answeredCount = Object.keys(answers).length
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0

  return (
    <BaseWorkflowNode
      data={{
        ...data,
        title: data.title || 'Interview Preparation',
        description: data.description || 'Role-specific technical & behavioral mock prep',
        category: 'action',
        icon: '🎤',
      }}
      selected={selected}
      showInputHandle={true}
      showOutputHandle={true}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Target Career Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '4px',
              backgroundColor: 'rgba(249, 115, 22, 0.15)',
              color: '#fb923c',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              textTransform: 'uppercase',
            }}
          >
            🎯 {data.targetCareer || 'Career Track'}
          </span>
          <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>
            {suite ? `${totalQuestions} Questions` : 'Ready to Prep'}
          </span>
        </div>

        {/* Categories Breakdown */}
        {suite ? (
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
              <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '3px', backgroundColor: '#1e293b', color: '#60a5fa' }}>
                💻 Tech ({suite.technical_questions?.length || 0})
              </span>
              <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '3px', backgroundColor: '#1e293b', color: '#fbbf24' }}>
                🤝 STAR ({suite.behavioral_questions?.length || 0})
              </span>
              <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '3px', backgroundColor: '#1e293b', color: '#a78bfa' }}>
                🛠️ Projects ({suite.project_questions?.length || 0})
              </span>
              <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '3px', backgroundColor: '#1e293b', color: '#34d399' }}>
                🎯 Role ({suite.career_specific_questions?.length || 0})
              </span>
            </div>

            {/* Answered Progress Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#94a3b8', marginBottom: '3px' }}>
                <span>Answered: {answeredCount}/{totalQuestions}</span>
                <span style={{ color: answeredCount > 0 ? '#34d399' : '#94a3b8', fontWeight: 700 }}>
                  {progressPercent}%
                </span>
              </div>
              <div style={{ width: '100%', height: '4px', backgroundColor: '#1e293b', borderRadius: '2px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${progressPercent}%`,
                    height: '100%',
                    backgroundColor: progressPercent === 100 ? '#10b981' : '#f97316',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              fontSize: '10px',
              color: '#94a3b8',
              backgroundColor: '#131b2e',
              padding: '6px 8px',
              borderRadius: '4px',
              border: '1px solid #1e293b',
              lineHeight: 1.35,
            }}
          >
            Generate technical, behavioral, project, and career questions connected to {data.targetCareer || 'your goal'}.
          </div>
        )}

        {/* Selected Hint */}
        {selected && (
          <div
            style={{
              padding: '3px 6px',
              borderRadius: '4px',
              backgroundColor: 'rgba(249, 115, 22, 0.12)',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              fontSize: '9px',
              color: '#fb923c',
              textAlign: 'center',
              fontWeight: 700,
            }}
          >
            ✏️ Practice & Review in Panel
          </div>
        )}
      </div>
    </BaseWorkflowNode>
  )
})

