# Agent User Platform Frontend

MVP v0.1 前端实现，基于React + TypeScript + Tailwind CSS构建的用户界面。

## 🚀 功能特性

### 用户认证界面
- ✅ 用户注册页面 - 支持邮箱验证、密码强度检查
- ✅ 用户登录页面 - 记住密码、错误提示
- ✅ JWT Token管理 - 自动登录、Token刷新
- ✅ 路由守卫 - 未登录重定向

### Agent创建界面
- ✅ 自然语言输入组件 - 富文本编辑器、示例提示
- ✅ Agent创建界面 - 双栏布局、实时预览
- ✅ 模板选择功能 - 预设示例、快速创建
- ✅ 创建进度展示 - 状态反馈、错误处理

### Agent执行控制台
- ✅ 控制台UI - 三栏式布局、响应式设计
- ✅ 实时日志展示 - WebSocket连接、日志级别过滤
- ✅ 执行结果展示 - 格式化显示、错误处理
- ✅ 输入参数表单 - 动态表单、JSON验证
- ✅ 历史记录管理 - 执行记录、结果对比

## 🛠️ 技术栈

- **框架**: React 18 + TypeScript
- **路由**: React Router DOM
- **UI组件**: shadcn/ui + Radix UI
- **样式**: Tailwind CSS
- **HTTP客户端**: Axios
- **状态管理**: React Hooks + Context
- **图标**: Lucide React

## 📁 项目结构

```
frontend/
├── public/                    # 静态资源
├── src/
│   ├── components/           # 可复用组件
│   │   └── ui/              # shadcn/ui组件
│   ├── hooks/               # 自定义Hooks
│   ├── pages/               # 页面组件
│   ├── services/            # API服务
│   ├── types/               # TypeScript类型定义
│   ├── utils/               # 工具函数
│   ├── App.tsx              # 主应用组件
│   ├── main.tsx             # 应用入口
│   └── index.css            # 全局样式
├── package.json             # 项目配置
├── vite.config.ts           # Vite配置
├── tsconfig.json            # TypeScript配置
└── tailwind.config.js       # Tailwind配置
```

## 🧪 页面组件

### 认证页面
- **Login.tsx** - 登录页面
- **Register.tsx** - 注册页面

### 主应用页面
- **Dashboard.tsx** - 用户仪表板
- **CreateAgent.tsx** - 创建Agent
- **ExecuteAgent.tsx** - 执行Agent控制台

## 🎨 UI组件

### 基础组件
- **Button** - 按钮组件
- **Input** - 输入框组件
- **Card** - 卡片组件
- **Alert** - 警告组件
- **Textarea** - 文本域组件

### 自定义Hooks
- **useAuth** - 认证管理
- **useAgents** - Agent管理

## 🚀 快速开始

### 环境要求
- Node.js 16+
- npm或yarn

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```
服务将在 http://localhost:3000 运行

### 构建生产版本
```bash
npm run build
```

### 预览构建结果
```bash
npm run preview
```

## 🔧 配置说明

### Vite配置
- 代理配置：API请求转发到后端服务
- 端口配置：默认3000端口
- 热更新：开发模式下启用

### Tailwind配置
- 主题定制：支持亮色/暗色模式
- 组件样式：基于设计系统
- 响应式设计：移动端适配

## 📱 响应式设计

- **桌面端**: 完整功能展示
- **平板端**: 优化布局适配
- **手机端**: 移动端优先设计

## ♿ 可访问性

- 键盘导航支持
- 屏幕阅读器兼容
- 语义化HTML标签
- ARIA属性标注

## 🎯 用户体验

- 加载状态指示
- 错误友好提示
- 表单验证反馈
- 操作确认机制

## 📊 性能优化

- 组件懒加载
- 代码分割
- Bundle优化
- 缓存策略

## 🔒 安全特性

- XSS攻击防护
- 输入验证
- HTTPS强制
- 安全Headers

## 🧪 测试

```bash
# 运行类型检查
npm run type-check

# 运行代码检查
npm run lint

# 运行单元测试
npm test
```

## 🚀 部署

### 静态部署
构建后的文件可以部署到任何静态文件服务器：
- Nginx
- Apache
- CDN服务

### 容器化部署
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
```

## 📈 监控和分析

- 性能监控
- 错误追踪
- 用户行为分析
- 日志记录

## 🔮 未来规划

1. **工作流编辑器** - React Flow集成
2. **代码编辑器** - Monaco Editor
3. **实时协作** - WebSocket集成
4. **主题系统** - 更多主题选项
5. **国际化** - 多语言支持

## 🤝 贡献指南

1. Fork项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 📝 许可证

MIT License