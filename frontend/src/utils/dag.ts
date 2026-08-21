import type { Status } from '../types';

interface DagNode {
  id: string;
  dependencies: string[];
}

export class DagError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DagError';
  }
}

/**
 * Detect cycles in a DAG using DFS.
 * Returns true if adding edge (from -> to) would create a cycle.
 */
export function wouldCreateCycle(
  tasks: DagNode[],
  fromId: string,
  toId: string
): boolean {
  const visited = new Set<string>();
  const recStack = new Set<string>();

  // Build adjacency list
  const adj = new Map<string, string[]>();
  for (const task of tasks) {
    adj.set(task.id, [...task.dependencies]);
  }
  // Add the proposed edge
  const existing = adj.get(toId) || [];
  if (!existing.includes(fromId)) {
    adj.set(toId, [...existing, fromId]);
  }

  function dfs(node: string): boolean {
    visited.add(node);
    recStack.add(node);

    for (const neighbor of (adj.get(node) || [])) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recStack.has(neighbor)) {
        return true;
      }
    }

    recStack.delete(node);
    return false;
  }

  // Check from the target node (where the cycle would manifest)
  return dfs(toId);
}

/**
 * Topological sort for display ordering.
 */
export function topologicalSort(tasks: DagNode[]): string[] {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const task of tasks) {
    inDegree.set(task.id, 0);
    adj.set(task.id, []);
  }

  for (const task of tasks) {
    for (const dep of task.dependencies) {
      adj.get(dep)?.push(task.id);
      inDegree.set(task.id, (inDegree.get(task.id) || 0) + 1);
    }
  }

  const queue: string[] = [];
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const node = queue.shift()!;
    sorted.push(node);
    for (const neighbor of (adj.get(node) || [])) {
      const newDegree = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  return sorted;
}

/**
 * Get all upstream dependencies of a task (recursive).
 */
export function getUpstream(taskId: string, tasks: DagNode[]): Set<string> {
  const result = new Set<string>();
  const queue = [taskId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const task = tasks.find(t => t.id === current);
    if (!task) continue;

    for (const dep of task.dependencies) {
      if (!result.has(dep)) {
        result.add(dep);
        queue.push(dep);
      }
    }
  }

  return result;
}

/**
 * Get all downstream dependents of a task (recursive).
 */
export function getDownstream(taskId: string, tasks: DagNode[]): Set<string> {
  const result = new Set<string>();
  const queue = [taskId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const task of tasks) {
      if (task.dependencies.includes(current) && !result.has(task.id)) {
        result.add(task.id);
        queue.push(task.id);
      }
    }
  }

  return result;
}
