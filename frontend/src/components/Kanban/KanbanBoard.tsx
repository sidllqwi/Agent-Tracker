import { useCallback } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { useTaskStore } from '../../stores/taskStore';
import type { Status } from '../../types';
import { StatusColumn } from './StatusColumn';

const STATUSES: Status[] = ['planned', 'inprogress', 'pending', 'completed', 'blocked'];

export function KanbanBoard() {
  const tasks = useTaskStore((s) => s.tasks);
  const moveTask = useTaskStore((s) => s.moveTask);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const taskId = active.id as string;
      const newStatus = over.id as Status;

      if (!STATUSES.includes(newStatus)) return;

      const task = tasks.find((t) => t.id === taskId);
      if (task && task.status !== newStatus) {
        moveTask(taskId, newStatus);
      }
    },
    [tasks, moveTask]
  );

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-5 overflow-x-auto pb-3 items-start">
        {STATUSES.map((status) => (
          <StatusColumn
            key={status}
            status={status}
            tasks={tasks.filter((t) => t.status === status)}
          />
        ))}
      </div>
      <DragOverlay />
    </DndContext>
  );
}
