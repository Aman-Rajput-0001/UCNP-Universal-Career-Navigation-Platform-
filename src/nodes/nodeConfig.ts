import type { NodeCategory } from '../types/workflow'

export interface NodeCategoryConfig {
  label: string
  color: string
  bgColor: string
  borderColor: string
}

export const NODE_CATEGORY_CONFIGS: Record<NodeCategory, NodeCategoryConfig> = {
  input: {
    label: 'Input',
    color: '#38bdf8',
    bgColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  discovery: {
    label: 'Discovery',
    color: '#a78bfa',
    bgColor: 'rgba(167, 139, 250, 0.12)',
    borderColor: 'rgba(167, 139, 250, 0.35)',
  },
  analysis: {
    label: 'Analysis',
    color: '#fbbf24',
    bgColor: 'rgba(251, 191, 36, 0.12)',
    borderColor: 'rgba(251, 191, 36, 0.35)',
  },
  roadmap: {
    label: 'Roadmap',
    color: '#34d399',
    bgColor: 'rgba(52, 211, 153, 0.12)',
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  learning: {
    label: 'Learning',
    color: '#f472b6',
    bgColor: 'rgba(244, 114, 182, 0.12)',
    borderColor: 'rgba(244, 114, 182, 0.35)',
  },
  career: {
    label: 'Career',
    color: '#60a5fa',
    bgColor: 'rgba(96, 165, 250, 0.12)',
    borderColor: 'rgba(96, 165, 250, 0.35)',
  },
  action: {
    label: 'Action',
    color: '#fb7185',
    bgColor: 'rgba(251, 113, 133, 0.12)',
    borderColor: 'rgba(251, 113, 133, 0.35)',
  },
}

export function getStatusColorConfig(status?: 'GREEN' | 'YELLOW' | 'RED') {
  switch (status) {
    case 'GREEN':
      return {
        badgeText: 'GREEN • DIRECTLY ACCESSIBLE',
        textColor: '#34d399',
        bgColor: 'rgba(16, 185, 129, 0.15)',
        borderColor: 'rgba(16, 185, 129, 0.4)',
        dotColor: '#10b981',
      }
    case 'YELLOW':
      return {
        badgeText: 'YELLOW • POSSIBLE WITH UPSKILLING',
        textColor: '#facc15',
        bgColor: 'rgba(234, 179, 8, 0.15)',
        borderColor: 'rgba(234, 179, 8, 0.4)',
        dotColor: '#eab308',
      }
    case 'RED':
      return {
        badgeText: 'RED • RESTRICTED ENTRY / BARRIER',
        textColor: '#f87171',
        bgColor: 'rgba(239, 68, 68, 0.15)',
        borderColor: 'rgba(239, 68, 68, 0.4)',
        dotColor: '#ef4444',
      }
    default:
      return {
        badgeText: 'PENDING EVALUATION',
        textColor: '#94a3b8',
        bgColor: 'rgba(148, 163, 184, 0.15)',
        borderColor: 'rgba(148, 163, 184, 0.4)',
        dotColor: '#64748b',
      }
  }
}


