import { useMemo, useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTaskStore } from '../../stores/taskStore';
import { STATUS_COLORS, TAG_COLORS, type Task } from '../../types';

function TaskNode({
  data,
}: {
  data: { task: Task; isHighlighted: boolean; isDimmed: boolean };
}) {
  const { task, isHighlighted, isDimmed } = data;
  const borderColor = STATUS_COLORS[task.status];
  const tagColor = TAG_COLORS[task.tags[0]] || { bg: '#e9edf4', text: '#475569' };

  const bgByStatus: Record<string, string> = {
    completed: '#f0fdf4',
    inprogress: '#eff6ff',
    pending: '#fffbeb',
    blocked: '#fef2f2',
    planned: '#f8fafc',
  };

  return (
    <div
      className={
        'px-4 py-2.5 rounded-lg border-2 min-w-[100px] text-center cursor-pointer transition-all duration-200 ' +
        (isDimmed ? 'opacity-20 grayscale' : '')
      }
      style={{
        borderColor,
        background: bgByStatus[task.status] || '#f8fafc',
        boxShadow: isHighlighted
          ? '0 0 0 3px #3b82f6, 0 4px 12px rgba(59,130,246,0.3)'
          : 'none',
        transform: isHighlighted ? 'scale(1.05)' : 'scale(1)',
        zIndex: isHighlighted ? 2 : 1,
      }}
    >
      <div className="text-xs font-medium">{task.id}</div>
      <div className="text-[11px] text-slate-500 mt-0.5">{task.title}</div>
      <div
        className="text-[10px] mt-1 px-2 py-0 rounded-full inline-block"
        style={{ background: tagColor.bg, color: tagColor.text }}
      >
        {task.tags[0] || '未分类'}
      </div>
    </div>
  );
}

const nodeTypes: NodeTypes = { taskNode: TaskNode };

export function GraphView() {
  const tasks = useTaskStore((s) => s.tasks);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    const rows = new Map<string, number>();

    const getDepth = (
      taskId: string,
      visited = new Set<string>()
    ): number => {
      if (visited.has(taskId)) return 0;
      visited.add(taskId);
      const task = taskMap.get(taskId);
      if (!task || task.dependencies.length === 0) return 0;
      return (
        1 +
        Math.max(...task.dependencies.map((d) => getDepth(d, visited)))
      );
    };

    tasks.forEach((task) => {
      const depth = getDepth(task.id);
      const row = rows.get(String(depth)) || 0;
      rows.set(String(depth), row + 1);

      nodes.push({
        id: task.id,
        type: 'taskNode',
        position: { x: depth * 220, y: row * 100 },
        data: { task, isHighlighted: false, isDimmed: false },
      });

      task.dependencies.forEach((depId) => {
        if (taskMap.has(depId)) {
          edges.push({
            id: depId + '-' + task.id,
            source: depId,
            target: task.id,
            animated: task.status !== 'completed',
            style: { stroke: '#94a3b8', strokeWidth: 2 },
          });
        }
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [tasks]);

  const highlightedSet = useMemo(() => {
    if (!hoveredNode)
      return { up: new Set<string>(), down: new Set<string>() };
    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    const up = new Set<string>();
    const down = new Set<string>();

    const queue = [hoveredNode];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      const t = taskMap.get(curr);
      if (!t) continue;
      for (const dep of t.dependencies) {
        if (!up.has(dep)) {
          up.add(dep);
          queue.push(dep);
        }
      }
    }

    const dQueue = [hoveredNode];
    while (dQueue.length > 0) {
      const curr = dQueue.shift()!;
      for (const t of tasks) {
        if (t.dependencies.includes(curr) && !down.has(t.id)) {
          down.add(t.id);
          dQueue.push(t.id);
        }
      }
    }

    return { up, down };
  }, [hoveredNode, tasks]);

  const nodesWithHighlight = useMemo(() => {
    return initialNodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isHighlighted:
          hoveredNode === node.id ||
          highlightedSet.up.has(node.id) ||
          highlightedSet.down.has(node.id),
        isDimmed:
          hoveredNode !== null &&
          hoveredNode !== node.id &&
          !highlightedSet.up.has(node.id) &&
          !highlightedSet.down.has(node.id),
      },
    }));
  }, [initialNodes, hoveredNode, highlightedSet]);

  const onNodeMouseEnter = useCallback((_: any, node: Node) => {
    setHoveredNode(node.id);
  }, []);

  const onNodeMouseLeave = useCallback(() => {
    setHoveredNode(null);
  }, []);

  return (
    <div
      className="bg-white rounded-2xl p-7 border border-slate-200 mt-1.5 min-h-[420px]"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
    >
      <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
        <h3 className="font-semibold text-lg flex items-center gap-2.5">
          依赖图谱 · 悬停高亮上下游
        </h3>
        <div className="flex gap-3.5 text-xs text-slate-500 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ background: STATUS_COLORS.completed }}
            />{' '}
            已实装
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ background: STATUS_COLORS.inprogress }}
            />{' '}
            执行中
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ background: STATUS_COLORS.pending }}
            />{' '}
            待验收
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ background: STATUS_COLORS.blocked }}
            />{' '}
            阻塞
          </span>
        </div>
      </div>
      <div className="h-[360px]">
        <ReactFlow
          nodes={nodesWithHighlight}
          edges={initialEdges}
          nodeTypes={nodeTypes}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
      <div className="mt-3 px-4 py-3 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-500">
        悬停或点击图谱节点，上下游高亮，其余变暗（防爆炸高亮模式）
      </div>
    </div>
  );
}
