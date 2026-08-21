import { X, Link, Paperclip, Video, Check, XIcon } from 'lucide-react';
import { useTaskStore } from '../../stores/taskStore';
import { STATUS_LABELS, STATUS_COLORS } from '../../types';

export function Sidebar() {
  const sidebarOpen = useTaskStore((s) => s.sidebarOpen);
  const selectedTaskId = useTaskStore((s) => s.selectedTaskId);
  const tasks = useTaskStore((s) => s.tasks);
  const closeSidebar = useTaskStore((s) => s.closeSidebar);
  const approveTask = useTaskStore((s) => s.approveTask);
  const rejectTask = useTaskStore((s) => s.rejectTask);

  const task = tasks.find((t) => t.id === selectedTaskId);

  if (!sidebarOpen || !task) return null;

  const isPending = task.status === 'pending';
  const isHuman = task.reviewMode === 'human';
  const borderColor = STATUS_COLORS[task.status];

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] transition-opacity"
        onClick={closeSidebar}
      />
      <div
        className="fixed top-0 right-0 w-[460px] max-w-[90vw] h-full bg-white z-[1000] shadow-2xl transition-transform duration-300 p-7 flex flex-col overflow-y-auto"
        style={{ transform: sidebarOpen ? 'translateX(0)' : 'translateX(100%)' }}
      >
        <button
          className="self-end bg-transparent border-none text-2xl text-slate-400 cursor-pointer p-1 hover:text-slate-800"
          onClick={closeSidebar}
        >
          <X size={24} />
        </button>

        <div className="text-2xl font-bold mb-3 flex items-center gap-3">
          <span>{task.title}</span>
          <span className="text-sm font-normal text-slate-400">#{task.id}</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap py-2 border-b border-slate-200 text-sm">
          <span className="text-slate-400 min-w-[70px]">状态</span>
          <span className="font-medium flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: borderColor }} />
            {STATUS_LABELS[task.status]}
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap py-2 border-b border-slate-200 text-sm">
          <span className="text-slate-400 min-w-[70px]">验收模式</span>
          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
              isHuman
                ? 'bg-purple-50 text-purple-600'
                : 'bg-cyan-50 text-cyan-600'
            }`}
          >
            {isHuman ? '人工验收' : 'AI 自验'}
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap py-2 border-b border-slate-200 text-sm">
          <span className="text-slate-400 min-w-[70px]">标签</span>
          <span className="font-medium">{task.tags.join(', ') || '无'}</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap py-2 border-b border-slate-200 text-sm">
          <span className="text-slate-400 min-w-[70px]">依赖</span>
          <span className="font-medium flex items-center gap-1">
            <Link size={12} />{' '}
            {task.dependencies.length > 0
              ? task.dependencies.join(', ')
              : '无'}
          </span>
        </div>

        <div className="mt-3 font-semibold text-sm">执行摘要</div>
        <div className="py-2 text-sm text-slate-600">{task.summary}</div>

        <div className="mt-3 font-semibold text-sm flex justify-between">
          <span>详细日志 (分层)</span>
          <span className="font-normal text-xs text-slate-400">折叠/展开</span>
        </div>
        <div className="mt-2 flex-1 bg-slate-50 rounded-lg p-4 border border-slate-200 text-xs leading-7 overflow-y-auto max-h-[260px] font-mono text-slate-600 whitespace-pre-wrap">
          {task.detailedLog.length > 0 ? (
            task.detailedLog.map((log, i) => (
              <div key={i} className="py-1 border-b border-dashed border-slate-200">
                [{log.timestamp}] {log.message}
              </div>
            ))
          ) : (
            <div className="text-slate-400">暂无详细日志</div>
          )}
        </div>

        {task.evidence.length > 0 && (
          <div className="mt-2 text-xs text-slate-400 flex gap-4 flex-wrap">
            {task.evidence.map((ev, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {ev.type === 'screenshot' ? (
                  <Video size={12} />
                ) : (
                  <Paperclip size={12} />
                )}
                {ev.path}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 flex gap-3 flex-wrap pt-4 border-t-2 border-slate-200">
          {isPending && isHuman ? (
            <>
              <button
                className="bg-green-500 text-white border-none px-7 py-2 rounded-full font-semibold text-sm cursor-pointer flex items-center gap-1.5 hover:scale-102"
                onClick={() => {
                  approveTask(task.id);
                  closeSidebar();
                }}
              >
                <Check size={14} /> 验收通过
              </button>
              <button
                className="bg-slate-100 border border-slate-200 px-6 py-2 rounded-full font-medium text-sm text-slate-600 cursor-pointer hover:bg-slate-200"
                onClick={() => {
                  rejectTask(task.id);
                  closeSidebar();
                }}
              >
                <XIcon size={14} /> 驳回
              </button>
            </>
          ) : (
            <span className="text-slate-400 text-sm py-1.5">
              {task.status === 'completed'
                ? '任务已完成'
                : 'AI 自动推进中'}
            </span>
          )}
          <button
            className="bg-slate-800 text-white border-none px-6 py-2 rounded-full font-medium text-sm cursor-pointer ml-auto hover:bg-slate-900"
            onClick={closeSidebar}
          >
            关闭
          </button>
        </div>
      </div>
    </>
  );
}
