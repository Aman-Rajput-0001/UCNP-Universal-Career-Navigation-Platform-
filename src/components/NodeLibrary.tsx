import { useState, useMemo } from 'react'
import { WORKFLOW_NODE_DEFINITIONS, type NodeTypeDefinition } from '../data/nodeLibrary'
import { NODE_CATEGORY_CONFIGS } from '../nodes/nodeConfig'
import type { NodeCategory } from '../types/workflow'

interface NodeLibraryProps {
  isOpen: boolean
  onClose: () => void
  onAddNode: (nodeDef: NodeTypeDefinition) => void
}

export function NodeLibrary({ isOpen, onClose, onAddNode }: NodeLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const filteredNodes = useMemo(() => {
    return WORKFLOW_NODE_DEFINITIONS.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [searchTerm, selectedCategory])

  if (!isOpen) return null

  const categories: { key: string; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'input', label: 'Input' },
    { key: 'discovery', label: 'Discovery' },
    { key: 'analysis', label: 'Analysis' },
    { key: 'roadmap', label: 'Roadmap' },
    { key: 'learning', label: 'Learning' },
    { key: 'career', label: 'Career' },
    { key: 'action', label: 'Action' },
  ]

  return (
    <aside
      style={{
        width: '320px',
        height: '100%',
        backgroundColor: '#090d16',
        borderRight: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 20,
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Sidebar Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>⚡</span>
          <span style={{ fontWeight: 600, fontSize: '14px', color: '#f8fafc' }}>
            Nodes Library
          </span>
          <span
            style={{
              fontSize: '10px',
              padding: '1px 6px',
              borderRadius: '10px',
              backgroundColor: '#1e293b',
              color: '#94a3b8',
              border: '1px solid #334155',
            }}
          >
            {WORKFLOW_NODE_DEFINITIONS.length}
          </span>
        </div>
        <button
          onClick={onClose}
          type="button"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '4px 8px',
            borderRadius: '4px',
            lineHeight: 1,
          }}
          title="Close Library"
        >
          ✕
        </button>
      </div>

      {/* Search Input with Clear Button */}
      <div style={{ padding: '12px 16px 8px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: '10px', fontSize: '13px', color: '#64748b', pointerEvents: 'none' }}>
            🔍
          </span>
          <input
            type="text"
            placeholder="Search nodes by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: '#111827',
              border: '1.5px solid #2d3748',
              borderRadius: '8px',
              padding: '8px 30px 8px 32px',
              fontSize: '12px',
              color: '#f8fafc',
              outline: 'none',
              transition: 'border-color 0.15s ease',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#3b82f6')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#2d3748')}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              type="button"
              style={{
                position: 'absolute',
                right: '8px',
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '12px',
                padding: '2px 4px',
              }}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Badges */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          padding: '4px 16px 12px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          scrollbarWidth: 'none',
        }}
      >
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.key
          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              type="button"
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '4px',
                border: isSelected ? '1px solid #3b82f6' : '1px solid #1e293b',
                backgroundColor: isSelected ? '#1e3a8a' : '#0f172a',
                color: isSelected ? '#93c5fd' : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Nodes List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 16px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {filteredNodes.length === 0 ? (
          <div
            style={{
              padding: '24px 0',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '12px',
            }}
          >
            No nodes found
          </div>
        ) : (
          filteredNodes.map((item) => {
            const catConfig = NODE_CATEGORY_CONFIGS[item.category as NodeCategory]
            return (
              <div
                key={item.type}
                onClick={() => onAddNode(item)}
                style={{
                  padding: '10px 12px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6'
                  e.currentTarget.style.backgroundColor = '#15203b'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#1e293b'
                  e.currentTarget.style.backgroundColor = '#0f172a'
                }}
              >
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '6px',
                    backgroundColor: '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '15px',
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '2px',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: '13px',
                        color: '#f8fafc',
                      }}
                    >
                      {item.name}
                    </span>
                    {catConfig && (
                      <span
                        style={{
                          fontSize: '9px',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          color: catConfig.color,
                          backgroundColor: catConfig.bgColor,
                          border: `1px solid ${catConfig.borderColor}`,
                          textTransform: 'uppercase',
                        }}
                      >
                        {catConfig.label}
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '11px',
                      color: '#94a3b8',
                      lineHeight: 1.3,
                    }}
                  >
                    {item.description}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </aside>
  )
}

