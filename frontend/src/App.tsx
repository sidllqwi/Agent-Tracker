import { Header } from './components/Header/Header';
import { ViewTabs } from './components/ViewTabs/ViewTabs';
import { KanbanBoard } from './components/Kanban/KanbanBoard';
import { Sidebar } from './components/Sidebar/Sidebar';
import { GraphView } from './components/Graph/GraphView';
import { TagCollapse } from './components/TagCollapse/TagCollapse';
import { ToastContainer, useToast } from './components/Toast/Toast';
import { useTaskStore } from './stores/taskStore';

export default function App() {
  const activeView = useTaskStore((s) => s.activeView);
  const { toasts } = useToast();

  return (
    <div className="px-8 pt-7 pb-10 min-h-screen relative">
      <Header />
      <ViewTabs />

      {activeView === 'kanban' && (
        <div>
          <KanbanBoard />
          <TagCollapse />
        </div>
      )}

      {activeView === 'graph' && <GraphView />}

      {activeView === 'focus' && (
        <div>
          <KanbanBoard />
          <TagCollapse />
        </div>
      )}

      <Sidebar />
      <ToastContainer toasts={toasts} />
    </div>
  );
}
