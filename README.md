# Agent User Platform

个人Agent助手平台 - 完全本地化部署的AI Agent创建和管理平台

## 🎯 项目愿景

打造**完全本地化部署**的个人Agent助手平台，让用户通过自然语言创建、编排和调试AI Agent，并集成私有化知识库管理能力，实现**数据100%私有、流程完全可控**的智能自动化助手。

## ✨ 核心功能

### MVP v0.1 ✅
- **🤖 零编码创建Agent**：自然语言描述即可生成专业Agent
- **🎮 Agent执行控制台**：实时查看执行日志和结果
- **🔐 用户认证系统**：JWT基础的安全认证

### v0.2 ✅ - 工作流编排功能
- **🔄 可视化任务编排**：拖拽式构建复杂工作流
  - React Flow画布集成，支持流畅的拖拽操作
  - 多种节点类型：输入、输出、Agent、条件分支
  - 实时预览和撤销/重做功能
- **⚡ LangGraph执行引擎**：强大的工作流执行能力
  - 支持顺序、并行、条件等多种执行模式
  - 异步执行和实时状态更新
  - 节点级日志和错误追踪
- **🔍 工作流调试与预览**：完善的调试功能
  - 工作流结构验证和逻辑检查
  - 模拟执行和数据流可视化
  - 断点调试和单步执行
- **📋 工作流模板系统**：丰富的预设模板
  - 聊天机器人、文档分析等常用模板
  - 支持自定义模板创建和分享

### 即将推出
- **🐛 无缝调试体验**：本地LangStudio深度集成 (v0.3)
- **📚 知识资产私有化**：WeKnora知识库安全存储 (v0.4)

## 🛠 技术架构

### 前端技术栈
- **框架**: React 18
- **UI库**: shadcn/ui + Tailwind CSS
- **工作流可视化**: React Flow
- **状态管理**: Zustand
- **代码编辑器**: Monaco Editor

### 后端技术栈
- **API框架**: FastAPI
- **AI框架**: LangChain + LangGraph
- **本地AI**: Ollama
- **向量数据库**: Chroma
- **异步处理**: AsyncIO

### 数据存储
- **用户数据**: JSON文件存储
- **Agent配置**: 结构化JSON文件
- **知识库**: Chroma向量存储
- **工作流**: YAML/JSON格式

## 📋 版本规划

| 版本 | 核心功能 | 开发周期 | 状态 |
|------|----------|----------|------|
| **MVP v0.1** | 基础单Agent创建与执行 | 2周 | ✅ 已完成 |
| **v0.2** | LangGraph任务流编排 | 3周 | ✅ 已完成 |
| **v0.3** | LangStudio调试导出 | 2周 | 📅 待开发 |
| **v0.4** | WeKnora知识库集成 | 3周 | 📅 待开发 |

## 🚀 快速开始

### 环境要求
- Python 3.8+
- Node.js 16+
- Ollama 0.6+
- Git

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/amo2025/agent_user.git
cd agent_user
```

2. **后端环境配置**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **前端环境配置**
```bash
cd frontend
npm install
```

4. **启动服务**
```bash
# 启动后端 (端口8000)
cd backend
python main.py

# 启动前端 (端口3000)
cd frontend
npm run dev
```

## 📖 文档

- [架构对齐分析](docs/alignment_analysis.md)
- [开发故事与任务分解](docs/development_stories.md)
- [MVP任务详细计划](docs/mvp_tasks.md)

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📝 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 支持

如果您遇到问题或有功能建议，请通过以下方式联系我们：
- 创建 GitHub Issue
- 发送邮件至: support@agentuser.com

## 🙏 致谢

- [LangChain](https://github.com/langchain-ai/langchain) - AI应用开发框架
- [Ollama](https://github.com/ollama/ollama) - 本地大模型运行
- [React Flow](https://github.com/wbkd/react-flow) - 工作流可视化
- [Chroma](https://github.com/chroma-core/chroma) - 向量数据库

---

**⭐ 如果这个项目对您有帮助，请给我们一个Star！**