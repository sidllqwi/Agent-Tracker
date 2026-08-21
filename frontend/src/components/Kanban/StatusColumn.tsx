import { useDroppable } from '@dnd-kit/core';
import type { Status, Task } from '../../types';
import { STATUS_LABELS, STATUS_COLORS } from '../../types';
import { TaskCard } from '../TaskCard/TaskCard';

interface StatusColumnProps {
  status: Status;
  tasks: Task[];
}

export function StatusColumn({ status, tasks }: StatusColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[200px] rounded-2xl p-3.5 pb-4.5 border transition-all duration-200 min-h-[320px] ${isOver ? 'border-blue-500' : 'border-slate-200'}`}
      style={{
        background: isOver ? '#e2e8f0' : '#f0f2f6',
        boxShadow: isOver ? '0 0 0 3px rgba(59,130,246,0.25)' : '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex items-center justify-between mb-3.5 text-sm font-semibold text-slate-500 tracking-wide">
        <span className="flex items-center">
          <span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ background: STATUS_COLORS[status] }} />
          {STATUS_LABELS[status]}
        </span>
        <span className="bg-black/5 px-2.5 py-0.5 rounded-full text-xs font-medium text-slate-400">
          {tasks.length}
        </span>
      </div>
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}
