import { Paperclip, UserCheck, Bot, CheckCircle, AlertTriangle, Loader2, AlignLeft, Image, FlaskConical } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { useTaskStore } from '../../stores/taskStore';
import type { Task } from '../../types';
import { STATUS_COLORS, TAG_COLORS } from '../../types';

interface TaskCardProps {
  task: Task;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  planned: <AlignLeft size={13} className="text-slate-400" />,
  inprogress: <Loader2 size={13} className="text-blue-500 animate-spin" />,
  pending: <Image size={13} className="text-amber-500" />,
  completed: <FlaskConical size={13} className="text-green-500" />,
  blocked: <AlertTriangle size={13} className="text-red-500" />,
};

export function TaskCard({ task }: TaskCardProps) {
  const selectTask = useTaskStore((s) => s.selectTask);
  const openSidebar = useTaskStore((s) => s.openSidebar);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  const handleClick = () => {
    if (!isDragging) {
      selectTask(task.id);
      openSidebar();
    }
  };

  const borderColor = STATUS_COLORS[task.status];
  const isAiVerified = task.reviewMode === 'ai' && task.status === 'completed';

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, borderLeftColor: borderColor }}
      className={
        'bg-white rounded-xl p-3.5 pb-4 mb-3 transition-all duration-200 cursor-grab border border-slate-200 relative select-none hover:-translate-y-0.5 ' +
        (isDragging ? 'opacity-40 scale-95' : '')
      }
      {...listeners}
      {...attributes}
      onClick={handleClick}
    >
      <div className="font-semibold text-sm mb-2 flex items-start justify-between gap-2">
        <span>{task.title}</span>
        <span className="font-normal text-slate-400 text-xs whitespace-nowrap">
          #{task.id}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
        {task.tags.map((tag) => {
          const colors = TAG_COLORS[tag] || { bg: '#e9edf4', text: '#475569' };
          return (
            <span
              key={tag}
              className="text-xs font-medium px-2.5 py-0.5 rounded-full"
              style={{ background: colors.bg, color: colors.text }}
            >
              {tag}
            </span>
          );
        })}
        <span
          className={
            'text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ' +
            (task.reviewMode === 'human'
              ? 'bg-purple-50 text-purple-600'
              : 'bg-cyan-50 text-cyan-600')
          }
        >
          {task.reviewMode === 'human' ? (
            <UserCheck size={10} />
          ) : (
            <Bot size={10} />
          )}
          {task.reviewMode === 'human' ? '人工验收' : 'AI 自验'}
        </span>
        {isAiVerified && (
          <span className="bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
            <CheckCircle size={10} /> 自验通过
          </span>
        )}
      </div>

      <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-dashed border-slate-200 flex items-start gap-1.5 leading-relaxed">
        {STATUS_ICON[task.status]}
        <span>{task.summary}</span>
      </div>

      {task.evidence.length > 0 && (
        <div className="text-xs text-slate-400 mt-1.5 bg-slate-50 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 border border-slate-200 font-mono">
          <Paperclip size={11} /> {task.evidence[0].path}
          {task.evidence.length > 1
            ? ' +' + String(task.evidence.length - 1)
            : ''}
        </div>
      )}
    </div>
  );
}
