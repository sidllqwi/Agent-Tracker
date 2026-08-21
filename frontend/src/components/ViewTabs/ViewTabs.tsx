import { Columns3, Network, Crosshair } from 'lucide-react';
import { useTaskStore } from '../../stores/taskStore';

const tabs = [
  { key: 'kanban' as const, label: '看板 · 拖拽', icon: Columns3 },
  { key: 'graph' as const, label: '图谱 · 高亮', icon: Network },
  { key: 'focus' as const, label: '聚焦模式', icon: Crosshair },
];

export function ViewTabs() {
  const activeView = useTaskStore((s) => s.activeView);
  const setActiveView = useTaskStore((s) => s.setActiveView);

  return (
    <div className="flex gap-1 bg-white p-1 rounded-full border border-slate-200 mb-6 w-fit"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = activeView === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => setActiveView(tab.key)}
            className={`px-5 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all duration-200 border-none cursor-pointer ${
              active
                ? 'bg-slate-800 text-white'
                : 'bg-transparent text-slate-500 hover:bg-slate-100'
            }`}
            style={active ? { boxShadow: '0 2px 8px rgba(30,41,59,0.20)' } : {}}
          >
            <Icon size={14} /> {tab.label}
          </button>
        );
      })}
    </div>
  );
}
