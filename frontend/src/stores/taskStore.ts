import { create } from 'zustand';
import type { Task, Status, Project } from '../types';

interface TaskStore {
  project: Project | null;
  tasks: Task[];
  loading: boolean;
  error: string | null;
  activeView: 'kanban' | 'graph' | 'focus';
  selectedTaskId: string | null;
  sidebarOpen: boolean;
  setActiveView: (view: 'kanban' | 'graph' | 'focus') => void;
  selectTask: (taskId: string | null) => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  moveTask: (taskId: string, newStatus: Status) => void;
  approveTask: (taskId: string) => void;
  rejectTask: (taskId: string) => void;
}

const DEMO_PROJECT: Project = {
  id: 'demo-001',
  name: '游戏引擎 · v2.0',
  tags: [
    { name: '场景', color: '#1d4ed8' },
    { name: '组件', color: '#be185d' },
    { name: '核心', color: '#065f46' },
  ],
  createdAt: '2026-08-21T00:00:00Z',
};

const DEMO_TASKS: Task[] = [
  {
    id: 'T-104', title: '设计主菜单布局', status: 'planned', reviewMode: 'human',
    tags: ['场景'], dependencies: [], summary: '等待 AI 初始化设计稿...',
    detailedLog: [], evidence: [], createdAt: '', updatedAt: '',
  },
  {
    id: 'T-107', title: '音效系统接入', status: 'planned', reviewMode: 'ai',
    tags: ['组件'], dependencies: ['T-103'], summary: '待分配资源路径',
    detailedLog: [], evidence: [], createdAt: '', updatedAt: '',
  },
  {
    id: 'T-112', title: '成就系统框架', status: 'planned', reviewMode: 'human',
    tags: ['核心'], dependencies: ['T-104'], summary: '依赖 T-104 完成',
    detailedLog: [], evidence: [], createdAt: '', updatedAt: '',
  },
  {
    id: 'T-101', title: '寻路算法 A*', status: 'inprogress', reviewMode: 'ai',
    tags: ['核心'], dependencies: [], summary: '优化启发式函数...',
    detailedLog: [
      { timestamp: '14:00', message: '开始实现 A* 算法' },
      { timestamp: '14:15', message: '完成启发式函数设计' },
      { timestamp: '14:30', message: '优化中...' },
    ], evidence: [], createdAt: '', updatedAt: '',
  },
  {
    id: 'T-105', title: '战斗动画状态机', status: 'inprogress', reviewMode: 'human',
    tags: ['组件'], dependencies: ['T-101'], summary: '生成 Blend Tree 中...',
    detailedLog: [
      { timestamp: '13:10', message: '初始化 Blend Tree' },
      { timestamp: '13:45', message: '状态机调试中' },
    ], evidence: [], createdAt: '', updatedAt: '',
  },
  {
    id: 'T-106', title: '资源加载管理器', status: 'inprogress', reviewMode: 'ai',
    tags: ['组件'], dependencies: ['T-101'], summary: '异步加载测试中...',
    detailedLog: [], evidence: [], createdAt: '', updatedAt: '',
  },
  {
    id: 'T-102', title: '开始游戏界面', status: 'pending', reviewMode: 'human',
    tags: ['场景'], dependencies: ['T-105'], summary: '已提交 UI 截图 & 交互录屏',
    detailedLog: [
      { timestamp: '14:20', message: '完成界面布局' },
      { timestamp: '14:22', message: '生成 start_ui_v2.png' },
      { timestamp: '14:25', message: '提交验收，状态 -> 待验收' },
    ],
    evidence: [{ type: 'screenshot', path: 'start_ui_v2.png', description: 'UI截图 425KB' }],
    createdAt: '', updatedAt: '',
  },
  {
    id: 'T-108', title: '设置面板', status: 'pending', reviewMode: 'human',
    tags: ['组件'], dependencies: [], summary: '等待设计走查',
    detailedLog: [],
    evidence: [{ type: 'file', path: 'settings_preview.mp4', description: '预览视频' }],
    createdAt: '', updatedAt: '',
  },
  {
    id: 'T-103', title: 'Shader 编译管线', status: 'blocked', reviewMode: 'human',
    tags: ['组件'], dependencies: [], summary: 'GLSL 版本不兼容',
    detailedLog: [
      { timestamp: '12:00', message: '开始 Shader 编译' },
      { timestamp: '12:30', message: '遇到 GLSL 版本兼容问题' },
      { timestamp: '12:45', message: '阻塞：需要人工介入' },
    ],
    evidence: [{ type: 'file', path: 'error_shader.log', description: '错误日志' }],
    createdAt: '', updatedAt: '',
  },
  {
    id: 'T-101-done', title: '寻路算法 A*', status: 'completed', reviewMode: 'ai',
    tags: ['核心'], dependencies: [], summary: '单元测试 12/12 通过',
    detailedLog: [],
    evidence: [{ type: 'test', path: 'test_results.json', description: '测试报告' }],
    createdAt: '', updatedAt: '',
  },
  {
    id: 'T-106-done', title: '资源加载管理器', status: 'completed', reviewMode: 'ai',
    tags: ['组件'], dependencies: [], summary: '性能基准达标',
    detailedLog: [],
    evidence: [{ type: 'test', path: 'benchmark.json', description: '性能报告' }],
    createdAt: '', updatedAt: '',
  },
];

export const useTaskStore = create<TaskStore>((set) => ({
  project: DEMO_PROJECT,
  tasks: DEMO_TASKS,
  loading: false,
  error: null,
  activeView: 'kanban',
  selectedTaskId: null,
  sidebarOpen: false,

  setActiveView: (view) => set({ activeView: view }),
  selectTask: (taskId) => set({ selectedTaskId: taskId }),
  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false, selectedTaskId: null }),

  moveTask: (taskId, newStatus) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t
      ),
    })),

  approveTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, status: 'completed' as Status, updatedAt: new Date().toISOString() } : t
      ),
    })),

  rejectTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, status: 'inprogress' as Status, updatedAt: new Date().toISOString() } : t
      ),
    })),
}));
