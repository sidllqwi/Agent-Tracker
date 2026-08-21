# Agent-Tracker

> 通用型 AI 项目进度追踪与可视化系统 v2.0

在使用 AI Agent 推进复杂项目时，面临两大致命问题：项目计划沦为"聊天记录中的死文本"，以及上下文 Token 消耗呈指数级爆炸。Agent-Tracker 通过本地状态管理 + 双轨验收机制解决这两个问题。

## 核心特性

- **双轨验收机制**：人工验收任务需人类确认，AI 自验任务自动流转，解放人类时间
- **Token 极简主义**：AI 与 Tracker 通信只传增量指令，全局查询返回轻量级列表
- **看板拖拽**：5 列状态看板，拖拽即可改变任务状态
- **依赖图谱**：React Flow 可视化任务依赖，悬停高亮上下游，防爆炸降噪
- **DAG 环路检测**：建立依赖时自动校验，防止死锁
- **MCP 服务层**：AI Agent 可通过 MCP 协议直接操作项目状态
- **本地化存储**：数据以 JSON 文件存储，支持 Git 版本控制

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite |
| 状态管理 | Zustand |
| 拖拽 | @dnd-kit/core |
| 图谱 | React Flow |
| 样式 | Tailwind CSS v4 |
| 后端 | Python FastAPI |
| MCP | mcp Python SDK |
| 存储 | 本地 JSON 文件 |

## 快速开始

### 环境要求

- Node.js >= 18
- Python >= 3.10

### 安装依赖

```bash
# 前端
cd frontend
npm install

# 后端
cd backend
pip install fastapi uvicorn pydantic mcp
```

### 启动服务

```bash
# 启动后端 (端口 8005)
cd backend
python main.py

# 启动前端 (端口 5563)
cd frontend
npm run dev
```

访问 http://localhost:5563

### API 文档

启动后端后访问 http://localhost:8005/docs

## 项目结构

```
Agent-Tracker/
├── frontend/                     # React + TypeScript + Vite
│   ├── src/
│   │   ├── types/index.ts        # 类型定义
│   │   ├── stores/taskStore.ts   # Zustand 状态管理
│   │   ├── api/client.ts         # REST API 客户端
│   │   ├── utils/dag.ts          # DAG 算法
│   │   └── components/
│   │       ├── Header/           # 顶部栏
│   │       ├── ViewTabs/         # 视图切换
│   │       ├── Kanban/           # 看板拖拽
│   │       ├── TaskCard/         # 任务卡片
│   │       ├── Sidebar/          # 任务详情侧边栏
│   │       ├── Graph/            # 依赖图谱
│   │       ├── TagCollapse/      # 标签折叠
│   │       └── Toast/            # 通知
│   └── vite.config.ts
│
├── backend/                      # Python FastAPI
│   ├── main.py                   # FastAPI 入口
│   ├── mcp_server.py             # MCP 服务器
│   ├── models/schemas.py         # Pydantic 模型
│   ├── services/
│   │   ├── storage.py            # JSON 文件存储
│   │   └── dag_validator.py      # DAG 环路检测
│   └── routers/
│       ├── tasks.py              # 任务 API
│       └── projects.py           # 项目 API
│
└── .gitignore
```

## 任务状态机

```
📦 待规划 (Planned)
    ↓
🤖 AI 执行中 (In Progress)
    ↓
🧪 待验收 (Pending Review)  ← 仅人工验收任务
    ↓
✅ 已实装 (Completed)

🚫 阻塞/报错 (Blocked)
```

### 双轨验收规则

| 验收模式 | 流转规则 |
|----------|----------|
| 人工验收 | AI 提交证据 → 待验收 → 人类点击"通过" → 已实装 |
| AI 自验 | AI 提交测试证据 → 系统自动流转至已实装 |

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/projects/{id}/tasks` | 全局状态（轻量） |
| GET | `/api/tasks/{id}` | 任务详情 |
| POST | `/api/tasks` | 创建任务 |
| PATCH | `/api/tasks/{id}/status` | 推进状态 |
| POST | `/api/tasks/{id}/log` | 追加日志 |
| POST | `/api/tasks/{id}/evidence` | 提交证据 |
| POST | `/api/tasks/{id}/dependencies` | 建立依赖 |
| DELETE | `/api/tasks/{id}/dependencies/{depId}` | 解除依赖 |

## MCP 工具清单

AI Agent 可通过 MCP 协议调用以下工具：

| 工具 | 说明 |
|------|------|
| `get_project_status` | 获取项目状态（省 Token） |
| `get_task_detail` | 获取任务详情 |
| `create_task` | 创建任务 |
| `batch_init_tasks` | 批量初始化任务 |
| `update_task_status` | 推进状态 |
| `add_log` | 追加分层日志 |
| `submit_evidence` | 提交验收证据 |
| `add_dependency` | 建立依赖（自动 DAG 校验） |
| `remove_dependency` | 解除依赖 |
| `delete_task` | 删除任务 |

### MCP 配置示例 (Claude Desktop)

```json
{
  "mcpServers": {
    "agent-tracker": {
      "command": "python",
      "args": ["path/to/Agent-Tracker/backend/mcp_server.py"]
    }
  }
}
```

## 设计原则

1. **Token 极简主义**：AI 每次行动前通过 MCP 读取本地状态，不在对话中复述背景
2. **增量按需加载**：全局查询只返回 id/title/status/tags，详情按需获取
3. **人类操作静默化**：人类在看板拖拽直接修改本地数据，AI 下次读取时自然获取最新状态
4. **本地状态即记忆**：用结构化本地文件替代冗长对话上下文

## License

MIT
