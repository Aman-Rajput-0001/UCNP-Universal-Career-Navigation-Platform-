import { memo } from 'react'
import type { NodeProps, Node } from '@xyflow/react'
import type { SkillGapAnalysisNodeData } from '../types/workflow'
import { BaseWorkflowNode } from './BaseWorkflowNode'

export type SkillGapAnalysisNodeType = Node<SkillGapAnalysisNodeData, 'skillGapAnalysisNode'>

export const SkillGapAnalysisNode = memo(function SkillGapAnalysisNode({
  data,
  selected,
}: NodeProps<SkillGapAnalysisNodeType>) {
  const result = data.skillGapResult

  return (
    <BaseWorkflowNode
      data={{
        ...data,
        title: data.title || 'Skill Gap Analysis',
        description: data.description || 'Current vs Demanded Competencies',
        category: 'analysis',
        icon: data.icon || '📊',
      }}
      selected={selected}
      showInputHandle={true}
      showOutputHandle={true}
    >
      {!result ? (
        <div style={{ color: '#94a3b8', fontSize: '11px', textAlign: 'center', padding: '6px 0' }}>
          Select career & click <strong>Analyze Skill Gap</strong>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Target and Level */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc' }}>
              {data.targetCareer || 'Target Career'}
            </span>
            <span
              style={{
                fontSize: '9px',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                fontWeight: 600,
              }}
            >
              {result.skill_level}
            </span>
          </div>

          {/* Counts metrics */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <div
              style={{
                flex: 1,
                padding: '5px 8px',
                backgroundColor: '#0f172a',
                borderRadius: '5px',
                border: '1px solid #1e293b',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '9px', color: '#64748b' }}>MATCHED</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#34d399' }}>
                {result.matched_skills.length}
              </div>
            </div>
            <div
              style={{
                flex: 1,
                padding: '5px 8px',
                backgroundColor: '#0f172a',
                borderRadius: '5px',
                border: '1px solid #1e293b',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '9px', color: '#64748b' }}>MISSING</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#f87171' }}>
                {result.missing_skills.length}
              </div>
            </div>
          </div>

          {/* Top priority items snippet */}
          {result.priority_skills && result.priority_skills.length > 0 && (
            <div style={{ fontSize: '10px', color: '#cbd5e1', lineHeight: 1.3 }}>
              <span style={{ color: '#f87171', fontWeight: 600 }}>Top Priority: </span>
              {result.priority_skills[0]?.skill_name}
            </div>
          )}
        </div>
      )}
    </BaseWorkflowNode>
  )
})

