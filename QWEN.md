# Agent User Platform - 个人Agent助手平台

## 项目概述

这是一个完全本地化部署的个人Agent助手平台，用户可以通过自然语言创建、编排和调试AI Agent，并集成私有化知识库管理能力，实现数据100%私有、流程完全可控的智能自动化助手。

### 核心功能

1. **零编码创建Agent**：通过自然语言描述即可生成专业Agent
2. **可视化工作流编排**：基于React Flow的拖拽式工作流构建
3. **LangGraph执行引擎**：支持顺序、并行、条件等多种执行模式
4. **工作流调试与预览**：完善的调试功能包括断点调试和单步执行
5. **用户认证系统**：基于JWT的安全认证机制

## 技术架构

### 前端技术栈
- **框架**: React 18
- **UI库**: shadcn/ui + Tailwind CSS
- **工作流可视化**: React Flow
- **状态管理**: Zustand
- **路由**: React Router DOM
- **构建工具**: Vite + TypeScript

### 后端技术栈
- **API框架**: FastAPI (Python)
- **AI框架**: LangChain + LangGraph
- **本地AI**: Ollama
- **向量数据库**: Chroma
- **认证**: JWT + Bcrypt
- **异步处理**: AsyncIO

### 数据存储
- **用户数据**: JSON文件存储
- **Agent配置**: 结构化JSON文件
- **工作流配置**: JSON文件存储
- **知识库**: Chroma向量存储

## 项目结构

```
/Volumes/Users/dev/ai/Agent/assistant3/
├── backend/                 # 后端服务
│   ├── main.py             # FastAPI入口
│   ├── auth_utils.py       # 认证工具
│   ├── agent_routes.py     # Agent API路由
│   ├── agent_service.py    # Agent服务逻辑
│   ├── workflow_routes.py  # 工作流API路由
│   ├── workflow_service.py # 工作流服务逻辑
│   ├── data/               # 数据存储目录
│   │   ├── users.json      # 用户数据
│   │   ├── agents.json     # Agent配置
│   │   ├── workflows.json  # 工作流配置
│   │   └── executions.json # 执行记录
│   └── requirements.txt    # Python依赖
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── components/     # UI组件
│   │   ├── hooks/          # React Hooks (Zustand状态管理)
│   │   ├── pages/          # 页面组件
│   │   ├── services/       # API服务
│   │   ├── types/          # TypeScript类型定义
│   │   ├── utils/          # 工具函数
│   │   ├── App.tsx         # 主应用组件
│   │   └── main.tsx        # 应用入口
│   ├── package.json        # 前端依赖
│   └── vite.config.ts      # 构建配置
├── docs/                   # 文档
└── README.md               # 项目说明
```

## 核心模块

### 1. 用户认证系统
- **注册/登录**: `/api/auth/register`, `/api/auth/login`
- **JWT令牌**: 基于Bearer Token的认证机制
- **密码安全**: 使用Bcrypt进行密码哈希存储

### 2. Agent管理模块
- **创建Agent**: 通过自然语言描述自动生成Agent配置
- **执行Agent**: 异步执行Agent任务并返回结果
- **API接口**:
  - `POST /api/agents/create` - 创建Agent
  - `GET /api/agents` - 获取用户所有Agent
  - `POST /api/agents/execute` - 执行Agent

### 3. 工作流引擎模块
- **可视化编辑**: 基于React Flow的拖拽式编辑器
- **多种节点类型**: 输入、输出、Agent、条件分支
- **执行引擎**: 基于LangGraph的工作流执行
- **API接口**:
  - `POST /api/workflows` - 创建工作流
  - `PUT /api/workflows/{id}` - 更新工作流
  - `POST /api/workflows/execute` - 执行工作流
  - `GET /api/workflows/templates` - 获取模板

### 4. 状态管理
- **前端**: 使用Zustand管理全局状态
- **工作流状态**: 包括节点选择、执行状态、调试信息等
- **认证状态**: 用户登录状态和令牌管理

## 开发约定

### 前端开发规范
1. **组件化开发**: 使用React函数组件和Hooks
2. **类型安全**: 使用TypeScript进行类型检查
3. **状态管理**: 使用Zustand进行全局状态管理
4. **UI组件**: 基于shadcn/ui组件库
5. **API调用**: 通过axios封装的API服务层

### 后端开发规范
1. **API设计**: 遵循RESTful API设计原则
2. **错误处理**: 统一的HTTP异常处理机制
3. **数据验证**: 使用Pydantic进行数据验证
4. **异步处理**: 使用async/await进行异步操作
5. **安全措施**: JWT认证、输入验证、访问控制

### 命名约定
1. **文件命名**: 使用kebab-case (如 `workflow-editor.tsx`)
2. **组件命名**: 使用PascalCase (如 `WorkflowEditor`)
3. **函数命名**: 使用camelCase (如 `createWorkflow`)
4. **变量命名**: 使用camelCase (如 `currentWorkflow`)

## 构建和运行

### 环境要求
- Python 3.8+
- Node.js 16+
- Ollama 0.6+
- Git

### 后端启动
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### 前端启动
```bash
cd frontend
npm install
npm run dev
```

### 访问地址
- 前端: http://localhost:3000
- 后端API: http://localhost:8000
- API文档: http://localhost:8000/docs

## 测试

### 前端测试
```bash
cd frontend
npm run test          # 运行测试
npm run test:ui       # 运行测试UI
npm run test:coverage # 运行测试并生成覆盖率报告
```

### 后端测试
```bash
cd backend
pytest                # 运行所有测试
pytest test_agents.py # 运行特定测试文件
```

## 部署

### 生产构建
```bash
# 前端构建
cd frontend
npm run build

# 后端保持运行状态
cd backend
python main.py
```

### 容器化部署
项目支持Docker容器化部署（需要创建docker-compose.yml文件）

## 安全考虑

1. **认证安全**: JWT令牌使用强密钥，设置合理过期时间
2. **数据安全**: 用户数据隔离存储，密码使用Bcrypt哈希
3. **输入验证**: 严格的API输入验证和数据清理
4. **访问控制**: 基于用户所有权的资源访问控制

## 性能优化

1. **异步处理**: 使用asyncio处理耗时操作
2. **缓存机制**: 执行结果和常用数据的缓存
3. **文件存储**: 使用JSON文件存储轻量级数据
4. **执行优化**: 工作流执行状态的实时更新

## 扩展性

1. **插件架构**: Agent工具系统支持扩展
2. **模块化设计**: 前后端分离，组件化开发
3. **API优先**: 所有功能通过API暴露，便于集成
4. **模板系统**: 工作流模板支持快速创建常用流程