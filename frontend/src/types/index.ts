export type Status = 'planned' | 'inprogress' | 'pending' | 'completed' | 'blocked';
export type ReviewMode = 'human' | 'ai';

export interface LogEntry {
  timestamp: string;
  message: string;
}

export interface Evidence {
  type: 'file' | 'screenshot' | 'test' | 'diff';
  path: string;
  description: string;
}

export interface Task {
  id: string;
  title: string;
  status: Status;
  reviewMode: ReviewMode;
  tags: string[];
  dependencies: string[];
  summary: string;
  detailedLog: LogEntry[];
  evidence: Evidence[];
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  name: string;
  color: string;
}

export interface Project {
  id: string;
  name: string;
  tasks: Task[];
  tags: Tag[];
  createdAt: string;
}

export const STATUS_LABELS: Record<Status, string> = {
  planned: '待规划',
  inprogress: 'AI 执行中',
  pending: '待验收',
  completed: '已实装',
  blocked: '阻塞',
};

export const STATUS_COLORS: Record<Status, string> = {
  planned: '#94a3b8',
  inprogress: '#3b82f6',
  pending: '#f59e0b',
  completed: '#22c55e',
  blocked: '#ef4444',
};

export const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  '场景': { bg: '#dbeafe', text: '#1d4ed8' },
  '组件': { bg: '#fce7f3', text: '#be185d' },
  '核心': { bg: '#d1fae5', text: '#065f46' },
};
