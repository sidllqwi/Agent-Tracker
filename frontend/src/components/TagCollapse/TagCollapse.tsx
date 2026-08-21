import { useState } from 'react';
import { ChevronDown, Tag, Layers } from 'lucide-react';
import { useTaskStore } from '../../stores/taskStore';
import { TAG_COLORS, STATUS_COLORS } from '../../types';

const STATUS_ICONS: Record<string, string> = {
  completed: '✅',
  inprogress: '⚙️',
  pending: '📋',
  planned: '📋',
  blocked: '🚫',
};

export function TagCollapse() {
  const tasks = useTaskStore((s) => s.tasks);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Group tasks by tags
  const tagGroups = new Map<string, typeof tasks>();
  tasks.forEach((task) => {
    task.tags.forEach((tag) => {
      if (!tagGroups.has(tag)) tagGroups.set(tag, []);
      tagGroups.get(tag)!.push(task);
    });
  });

  const toggleTag = (tag: string) => {
    setCollapsed((prev) => ({ ...prev, [tag]: !prev[tag] }));
  };

  return (
    <>
      <div className="mt-4 flex items-center gap-3.5 flex-wrap px-4 py-3 bg-white rounded-xl border border-slate-200">
        <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
          <Layers size={13} /> 折叠聚合
        </span>
        <span style={{ flex: 1 }} />
        {Array.from(tagGroups.entries()).map(([tag, groupTasks]) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`px-3.5 py-1 rounded-full text-xs flex items-center gap-1.5 cursor-pointer transition-all border ${
              collapsed[tag] ? 'bg-slate-800 text-white border-transparent' : 'bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200'
            }`}
          >
            <Layers size={11} /> {tag} ({groupTasks.length})
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-4">
        {Array.from(tagGroups.entries()).map(([tag, groupTasks]) => {
          const colors = TAG_COLORS[tag] || { bg: '#e9edf4', text: '#475569' };
          const isCollapsed = collapsed[tag];

          return (
            <div key={tag} className="flex-1 min-w-[180px]">
              <div
                className="flex items-center gap-2.5 px-3 py-2 bg-white rounded-lg border border-slate-200 cursor-pointer font-medium text-sm transition-all hover:bg-slate-50 mb-1.5"
                onClick={() => toggleTag(tag)}
              >
                <Tag size={13} style={{ color: colors.text }} /> {tag}
                <span className="bg-slate-100 px-2.5 py-0 rounded-full text-xs font-normal">{groupTasks.length}</span>
                <ChevronDown
                  size={13}
                  className="ml-auto transition-transform"
                  style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
                />
              </div>
              {!isCollapsed && (
                <div className="pl-2 transition-all">
                  {groupTasks.map((task) => (
                    <div key={task.id} className="py-1 text-xs text-slate-600">
                      {STATUS_ICONS[task.status]} {task.id} {task.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
