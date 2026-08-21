import type { Task, Project, Status } from '../types';

const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

// Lightweight task list (token-efficient)
export async function getProjectTasks(projectId: string): Promise<Pick<Task, 'id' | 'title' | 'status' | 'tags' | 'reviewMode' | 'summary' | 'dependencies' | 'evidence'>[]> {
  return request(`/projects/${projectId}/tasks`);
}

export async function getTaskDetail(taskId: string): Promise<Task> {
  return request(`/tasks/${taskId}`);
}

export async function createTask(task: Omit<Task, 'createdAt' | 'updatedAt' | 'detailedLog'>): Promise<Task> {
  return request('/tasks', {
    method: 'POST',
    body: JSON.stringify(task),
  });
}

export async function updateTaskStatus(taskId: string, status: Status): Promise<Task> {
  return request(`/tasks/${taskId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function addTaskLog(taskId: string, summary: string, detail: string): Promise<Task> {
  return request(`/tasks/${taskId}/log`, {
    method: 'POST',
    body: JSON.stringify({ summary, detail }),
  });
}

export async function submitEvidence(taskId: string, evidence: { type: string; path: string; description: string }): Promise<Task> {
  return request(`/tasks/${taskId}/evidence`, {
    method: 'POST',
    body: JSON.stringify(evidence),
  });
}

export async function addDependency(taskId: string, dependsOn: string): Promise<Task> {
  return request(`/tasks/${taskId}/dependencies`, {
    method: 'POST',
    body: JSON.stringify({ dependsOn }),
  });
}

export async function removeDependency(taskId: string, dependsOn: string): Promise<Task> {
  return request(`/tasks/${taskId}/dependencies/${dependsOn}`, {
    method: 'DELETE',
  });
}

export async function deleteTask(taskId: string): Promise<void> {
  await request(`/tasks/${taskId}`, { method: 'DELETE' });
}
