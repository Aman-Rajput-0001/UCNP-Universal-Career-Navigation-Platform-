import type { Node, Edge } from '@xyflow/react'
import type { SerializedWorkflow, WorkflowNodeData } from '../types/workflow'

const LOCAL_STORAGE_WORKFLOW_KEY = 'career_navigator_workflow_v1'

/**
 * Serializes workflow nodes and edges into a JSON-serializable structure.
 */
export function serializeWorkflow<TData extends Record<string, unknown> = WorkflowNodeData>(
  nodes: Node<TData>[],
  edges: Edge[]
): SerializedWorkflow<TData> {
  const cleanNodes = nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: {
      x: Math.round(node.position.x),
      y: Math.round(node.position.y),
    },
    data: { ...node.data },
  })) as Node<TData>[]

  const cleanEdges = edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    animated: edge.animated ?? true,
    style: edge.style,
  })) as Edge[]

  return {
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    nodes: cleanNodes,
    edges: cleanEdges,
  }
}

/**
 * Parses and loads a serialized workflow from a JSON string or storage object.
 */
export function loadWorkflow<TData extends Record<string, unknown> = WorkflowNodeData>(
  serialized: string | SerializedWorkflow<TData>
): SerializedWorkflow<TData> {
  const parsed: SerializedWorkflow<TData> =
    typeof serialized === 'string' ? JSON.parse(serialized) : serialized

  if (!parsed || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
    throw new Error('Invalid workflow format: nodes and edges arrays are required')
  }

  return {
    version: parsed.version || '1.0.0',
    updatedAt: parsed.updatedAt || new Date().toISOString(),
    nodes: parsed.nodes,
    edges: parsed.edges,
  }
}

/**
 * Saves workflow to browser localStorage.
 */
export function saveWorkflowToLocalStorage<TData extends Record<string, unknown> = WorkflowNodeData>(
  nodes: Node<TData>[],
  edges: Edge[],
  storageKey = LOCAL_STORAGE_WORKFLOW_KEY
): SerializedWorkflow<TData> {
  const serialized = serializeWorkflow(nodes, edges)
  localStorage.setItem(storageKey, JSON.stringify(serialized))
  return serialized
}

/**
 * Loads workflow from browser localStorage. Returns null if none stored.
 */
export function loadWorkflowFromLocalStorage<TData extends Record<string, unknown> = WorkflowNodeData>(
  storageKey = LOCAL_STORAGE_WORKFLOW_KEY
): SerializedWorkflow<TData> | null {
  const raw = localStorage.getItem(storageKey)
  if (!raw) return null

  try {
    return loadWorkflow<TData>(raw)
  } catch (error) {
    console.error('Failed to parse workflow from localStorage:', error)
    return null
  }
}

