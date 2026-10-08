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

