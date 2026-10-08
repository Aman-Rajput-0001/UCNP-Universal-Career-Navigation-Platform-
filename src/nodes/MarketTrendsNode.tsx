import { memo } from 'react'
import type { NodeProps, Node } from '@xyflow/react'
import { BaseWorkflowNode } from './BaseWorkflowNode'
import type { MarketTrendsNodeData } from '../types/workflow'

export const MarketTrendsNode = memo(function MarketTrendsNode(
  props: NodeProps<Node<MarketTrendsNodeData>>
) {
  const { data, selected } = props
  const trendsResponse = data.trendsData
  const trendsCount = trendsResponse?.market_trends?.length || 0
  const inDemandCount = trendsResponse?.in_demand_skills?.length || 0
  const futureCount = trendsResponse?.future_skills?.length || 0

  return (
    <BaseWorkflowNode
      data={{
        ...data,
        title: data.title || 'Market Trends & Future Skills',
        description: data.description || 'In-demand skills, occupational shifts & future horizon',
        category: 'analysis',
        icon: data.icon || '🌐',
      }}
      selected={selected}
      showInputHandle={true}
      showOutputHandle={true}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Focus Banner */}
        <div
          style={{
            fontSize: '11px',
            padding: '3px 8px',
            borderRadius: '6px',
            backgroundColor: 'rgba(14, 165, 233, 0.12)',
            border: '1px solid rgba(14, 165, 233, 0.3)',
            color: '#38bdf8',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ color: '#94a3b8' }}>Focus:</span>
          <span style={{ fontWeight: 600 }}>{data.careerFocus || 'Technology & Software'}</span>
        </div>

        {/* Demo Data Tag Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '9px',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid rgba(234, 179, 8, 0.25)',
            color: '#facc15',
          }}
        >
          <span>Source: Curated Blueprint</span>
          <span style={{ fontWeight: 700 }}>DEMO / BENCHMARK</span>
        </div>

        {trendsResponse ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {/* Quick Metrics */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '4px',
                textAlign: 'center',
              }}
            >
              <div style={{ backgroundColor: '#1e293b', padding: '4px 2px', borderRadius: '4px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>{trendsCount}</div>
                <div style={{ fontSize: '8px', color: '#94a3b8' }}>Trends</div>
              </div>
              <div style={{ backgroundColor: '#1e293b', padding: '4px 2px', borderRadius: '4px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399' }}>{inDemandCount}</div>
                <div style={{ fontSize: '8px', color: '#94a3b8' }}>In-Demand</div>
              </div>
              <div style={{ backgroundColor: '#1e293b', padding: '4px 2px', borderRadius: '4px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#c084fc' }}>{futureCount}</div>
                <div style={{ fontSize: '8px', color: '#94a3b8' }}>Future</div>
              </div>
            </div>

            {/* Top Trending preview */}
            {trendsResponse.market_trends && trendsResponse.market_trends.length > 0 && (
              <div
                style={{
                  fontSize: '10px',
                  backgroundColor: '#0f172a',
                  padding: '5px 8px',
                  borderRadius: '4px',
                  color: '#cbd5e1',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>Trend: </span>
                {trendsResponse.market_trends[0].title}
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              fontSize: '10px',
              color: '#64748b',
              fontStyle: 'italic',
              textAlign: 'center',
              padding: '4px 0',
            }}
          >
            Select node to query trends & future skills
          </div>
        )}
      </div>
    </BaseWorkflowNode>
  )
})

