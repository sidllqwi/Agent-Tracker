import { Route, GitBranch, Calendar, Zap } from 'lucide-react';
import { useTaskStore } from '../../stores/taskStore';

export function Header() {
  const project = useTaskStore((s) => s.project);
  const tasks = useTaskStore((s) => s.tasks);
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const total = tasks.length;
  const tokenSaved = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <header className="flex items-center justify-between flex-wrap gap-4 mb-7">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg text-slate-200"
          style={{ background: 'linear-gradient(145deg, #1e293b, #0f172a)', boxShadow: '0 4px 12px rgba(15,23,42,0.25)' }}>
          <Route size={22} />
        </div>
        <div>
          <span className="text-2xl font-bold tracking-tight"
            style={{ background: 'linear-gradient(135deg, #0f172a 40%, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Agent-Tracker
          </span>
          <span className="text-sm text-slate-500 ml-1">· 交互增强</span>
        </div>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <div className="bg-white px-4 py-2 rounded-full text-sm flex items-center gap-4 border border-slate-200"
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <span className="flex items-center gap-1.5 text-slate-600">
            <Calendar size={14} /> {project?.name || '未命名项目'}
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <Calendar size={14} /> 2026-08-21
          </span>
          <span className="bg-indigo-50 text-indigo-700 px-3 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5">
            <Zap size={12} /> 省 Token {tokenSaved}%
          </span>
        </div>
        <button className="bg-transparent border border-slate-200 px-4 py-2 rounded-full text-sm font-medium text-slate-600 flex items-center gap-2 cursor-default">
          <GitBranch size={14} /> Git 联动
        </button>
      </div>
    </header>
  );
}
