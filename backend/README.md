# Agent User Platform Backend

MVP v0.1 后端实现，包含用户认证系统和Agent管理功能。

## 🚀 功能特性

### 用户认证系统
- ✅ 用户注册 (`/api/auth/register`)
- ✅ 用户登录 (`/api/auth/login`)
- ✅ 密码修改 (`/api/auth/change-password`)
- ✅ JWT Token管理 (24小时有效期)
- ✅ 密码bcrypt哈希加密

### Agent创建引擎
- ✅ 自然语言解析服务
- ✅ Ollama模型集成
- ✅ Agent配置文件生成
- ✅ Agent模板库设计
- ✅ LangChain Agent初始化

### Agent执行控制台
- ✅ Agent执行API (`/api/agents/execute`)
- ✅ 执行日志记录功能
- ✅ 异步执行机制
- ✅ 实时日志展示
- ✅ 执行结果展示

## 🛠️ 技术栈

- **框架**: FastAPI
- **认证**: JWT + HTTPBearer
- **密码安全**: bcrypt哈希
- **AI集成**: LangChain + Ollama
- **数据存储**: JSON文件存储
- **异步处理**: AsyncIO

## 📋 API端点

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/change-password` - 修改密码
- `GET /api/auth/me` - 获取当前用户信息

### Agent相关
- `POST /api/agents/create` - 创建Agent
- `GET /api/agents` - 获取用户Agent列表
- `GET /api/agents/{agent_id}` - 获取特定Agent
- `POST /api/agents/execute` - 执行Agent
- `GET /api/executions/{execution_id}` - 获取执行状态
- `GET /api/executions/{execution_id}/logs` - 获取执行日志

## 🔧 环境要求

```bash
# Python 3.8+
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt
```

## 🚀 启动服务

```bash
# 启动后端服务
python main.py

# 服务将在 http://localhost:8000 运行
# API文档: http://localhost:8000/docs
```

## 🧪 运行测试

```bash
# 运行认证测试
python test_auth.py

# 运行Agent测试
python test_agents.py
```

## 📊 性能指标

### 验收标准
- ✅ 用户认证响应时间 ≤1秒
- ✅ Agent创建时间 ≤5秒
- ✅ Agent执行时间 ≤5秒
- ✅ 支持实时日志输出
- ✅ 执行状态可追踪
- ✅ 支持参数自定义输入

## 🔒 安全特性

- 密码bcrypt哈希存储
- JWT Token认证
- CORS配置
- 输入验证和净化
- 错误处理不泄露敏感信息

## 📁 项目结构

```
backend/
├── main.py              # 主应用和认证逻辑
├── agent_service.py     # Agent业务逻辑
├── agent_routes.py      # Agent API路由
├── test_auth.py         # 认证测试
├── test_agents.py       # Agent测试
├── requirements.txt     # Python依赖
└── data/               # 数据存储目录
    ├── users.json       # 用户数据
    ├── agents.json      # Agent配置
    └── executions.json  # 执行记录
```

## 🎯 下一步计划

1. **v0.2**: 工作流编排功能
2. **v0.3**: LangStudio集成
3. **v0.4**: WeKnora知识库集成
4. **性能优化**: 数据库集成、缓存机制
5. **安全加固**: 更完善的认证授权

## 🤝 贡献指南

1. Fork项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 📝 许可证

MIT License