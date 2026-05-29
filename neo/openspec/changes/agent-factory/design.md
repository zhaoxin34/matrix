# Agent Factory 实现设计

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  List Page   │  │ Create Page  │  │  Detail/Edit │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
│         │                  │                  │                    │
│         └──────────────────┼──────────────────┘                    │
│                            ▼                                       │
│                   ┌────────────────┐                               │
│                   │  API Client    │                               │
│                   │  lib/api/agent.ts                              │
│                   └────────┬───────┘                               │
└────────────────────────────┼───────────────────────────────────────┘
                             │ HTTP
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Backend                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│  │   Router    │──▶│  Service   │──▶│ Repository │               │
│  │ api/v1/     │  │   Agent     │  │   Agent     │               │
│  │ agents.py   │  │  Service    │  │ Repository  │               │
│  └─────────────┘  └──────┬──────┘  └──────┬──────┘               │
│                           │                  │                     │
│                           ▼                  ▼                     │
│                   ┌────────────────────────────────┐               │
│                   │           Database             │               │
│                   │     agent / workspace /        │               │
│                   │     agent_prototype / users    │               │
│                   └────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

## File Structure

### Backend

```
backend/src/app/
├── models/
│   └── agent.py                 # Agent 模型
├── repositories/
│   └── agent_repository.py      # Agent 数据访问
├── services/
│   └── agent_service.py         # Agent 业务逻辑
├── api/v1/
│   └── agents.py                # Agent API 路由
├── core/
│   └── error_codes.py           # 错误码定义
└── main.py                      # 路由注册
```

### Frontend

```
frontend/
├── app/(main)/workspace/[workspace_code]/agents/
│   ├── page.tsx                 # 列表页
│   ├── create/page.tsx          # 创建页
│   └── [id]/
│       ├── page.tsx             # 详情页
│       └── edit/page.tsx         # 编辑页
├── components/agent-factory/    # 现有组件
├── lib/api/
│   └── agent.ts                 # API client
└── types/
    └── agent.ts                 # TypeScript 类型
```

## Implementation Details

### Backend

#### 1. Agent Model

```python
from sqlalchemy import Column, BigInteger, String, Text, JSON, Enum, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class Agent(Base):
    __tablename__ = "agent"
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(32), nullable=False, index=True)
    description = Column(Text, nullable=True)
    prototype_id = Column(BigInteger, ForeignKey("agent_prototype.id"), nullable=False)
    prototype_version = Column(String(32), nullable=False)
    workspace_id = Column(BigInteger, ForeignKey("workspace.id"), nullable=False, index=True)
    model = Column(String(64), nullable=False)
    skills = Column(JSON, nullable=False, default=list)
    config = Column(JSON, nullable=False, default=dict)
    status = Column(String(20), nullable=False, default="enabled", index=True)
    created_by = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
```

#### 2. API Response Format

```python
def success_response(data: Any = None) -> dict:
    return {
        "code": 0,
        "message": "ok",
        "data": data,
        "traceId": request.state.trace_id,
        "timestamp": int(time.time() * 1000)
    }

def error_response(code: int, message: str) -> dict:
    return {
        "code": code,
        "message": message,
        "data": None,
        "traceId": request.state.trace_id,
        "timestamp": int(time.time() * 1000)
    }
```

### Frontend

#### API Client Pattern

```typescript
// lib/api/agent.ts
import { apiClient } from './client';

export async function listAgents(workspaceCode: string, params?: ListParams) {
  const response = await apiClient.get(`/workspaces/${workspaceCode}/agents`, { params });
  return response.data;
}

export async function createAgent(workspaceCode: string, data: CreateAgentInput) {
  const response = await apiClient.post(`/workspaces/${workspaceCode}/agents`, data);
  return response.data;
}

// ... 其他 API 函数
```

## Database Migration

```sql
CREATE TABLE agent (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(32) NOT NULL,
    description TEXT,
    prototype_id BIGINT NOT NULL,
    prototype_version VARCHAR(32) NOT NULL,
    workspace_id BIGINT NOT NULL,
    model VARCHAR(64) NOT NULL,
    skills JSON NOT NULL DEFAULT '[]',
    config JSON NOT NULL DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'enabled',
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_agent_name (name),
    INDEX idx_agent_workspace (workspace_id),
    INDEX idx_agent_prototype (prototype_id),
    INDEX idx_agent_status (status),
    INDEX idx_agent_created_by (created_by),
    
    UNIQUE KEY uk_agent_workspace_name (workspace_id, name),
    
    FOREIGN KEY (prototype_id) REFERENCES agent_prototype(id),
    FOREIGN KEY (workspace_id) REFERENCES workspace(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

## Key Decisions

1. **使用 BIGINT 自增主键**：简化 API URL，易于调试
2. **软删除**：deleted 状态可恢复
3. **配置 JSON 存储**：灵活扩展，避免 schema 变更
4. **Prototype 版本锁定**：Agent 创建时锁定 prototype_version，不可修改
5. **Workspace 命名空间**：Agent name 在 workspace 内唯一
