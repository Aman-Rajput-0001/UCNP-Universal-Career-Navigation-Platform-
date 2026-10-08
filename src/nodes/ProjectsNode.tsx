import { memo } from 'react'
import type { NodeProps, Node } from '@xyflow/react'
import { BaseWorkflowNode } from './BaseWorkflowNode'
import type { ProjectsNodeData } from '../types/workflow'

export const ProjectsNode = memo(function ProjectsNode(
  props: NodeProps<Node<ProjectsNodeData>>
) {
  const { data, selected } = props
  const projects = data.projectRecommendations || []

  return (
    <BaseWorkflowNode
      data={{
        ...data,
        title: data.title || 'Projects',
        description: data.description || 'Proof-of-work portfolio blueprints',
        category: 'learning',
        icon: data.icon || '🛠️',
      }}
      selected={selected}
      showInputHandle={true}
      showOutputHandle={true}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {data.targetCareer && (
          <div
            style={{
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ color: '#94a3b8' }}>Role:</span>
            <span style={{ fontWeight: 600 }}>{data.targetCareer}</span>
          </div>
        )}

        {projects.length > 0 ? (
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
              <span>Blueprints:</span>
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                {projects.length} Recommended
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {projects.slice(0, 3).map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    fontSize: '10px',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    backgroundColor: '#1e293b',
                    color: '#e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }}>
                      {item.project_title}
                    </span>
                    <span
                      style={{
                        fontSize: '8px',
                        padding: '1px 4px',
                        borderRadius: '3px',
                        fontWeight: 700,
                        backgroundColor:
                          item.difficulty === 'Advanced'
                            ? 'rgba(239, 68, 68, 0.2)'
                            : item.difficulty === 'Intermediate'
                            ? 'rgba(245, 158, 11, 0.2)'
                            : 'rgba(16, 185, 129, 0.2)',
                        color:
                          item.difficulty === 'Advanced'
                            ? '#fca5a5'
                            : item.difficulty === 'Intermediate'
                            ? '#fde047'
                            : '#86efac',
                      }}
                    >
                      {item.difficulty}
                    </span>
                  </div>
                  <div style={{ fontSize: '9px', color: '#94a3b8' }}>
                    {item.skills_practiced.slice(0, 3).join(', ')}
                  </div>
                </div>
              ))}
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
            Select node to generate project recommendations
          </div>
        )}
      </div>
    </BaseWorkflowNode>
  )
})

