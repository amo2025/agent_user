# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Agent User Platform - A personal AI Agent creation and management platform with full local deployment capabilities. This is MVP v0.2 featuring user authentication, natural language agent creation, agent execution console, and visual workflow orchestration with LangGraph.

## Architecture

This repository contains **frontend and backend** implementations. The platform consists of:
- **Frontend**: React 19 + TypeScript + Tailwind CSS + React Flow (workflow visualization)
- **Backend**: Python FastAPI service with LangChain + LangGraph integration
- **AI Integration**: Ollama + LangChain for local AI model integration
- **State Management**: Zustand for workflow state, React hooks for auth/agents

## Development Commands

### Frontend Development
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server (port 3000)
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Preview production build
npm run preview
```

### Backend Development
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run backend server (port 8000)
python main.py
```

### Testing
```bash
# Backend tests (from backend directory)
python -m pytest tests/

# Frontend linting (from frontend directory)
npm run lint
```

## Code Architecture

### Frontend Structure
```
frontend/src/
├── components/         # Reusable UI components
│   ├── ui/            # shadcn/ui components (Button, Input, Card, etc.)
│   └── workflow/      # Workflow-specific components (NodeTypes, PropertyPanel)
├── hooks/             # Custom React hooks and Zustand stores
│   ├── useAuth.ts     # Authentication management
│   ├── useAgents.ts   # Agent management
│   └── useWorkflow.ts # Workflow state management (Zustand)
├── pages/             # Page components
│   ├── Login.tsx      # User authentication
│   ├── Register.tsx   # User registration
│   ├── Dashboard.tsx  # Main dashboard
│   ├── CreateAgent.tsx # Agent creation interface
│   ├── ExecuteAgent.tsx # Agent execution console
│   └── WorkflowEditor.tsx # Visual workflow editor
├── services/          # API service layer
│   ├── api.ts         # Centralized axios instance with auth
│   ├── workflowApi.ts # Workflow-specific APIs
│   └── index.ts       # Service exports
├── types/             # TypeScript type definitions
│   ├── index.ts       # Core types (User, Agent, Execution)
│   └── workflow.ts    # Workflow-specific types
└── utils/             # Utility functions
```

### Backend Structure
```
backend/
├── main.py            # FastAPI application entry point
├── routers/           # API route handlers
│   ├── auth.py        # Authentication endpoints
│   ├── agents.py      # Agent management endpoints
│   └── workflows.py   # Workflow management endpoints
├── services/          # Business logic services
│   ├── auth_service.py
│   ├── agent_service.py
│   └── workflow_service.py
├── models/            # Data models and schemas
├── utils/             # Utility functions
└── tests/             # Test files
```

### Key Technical Decisions

**Frontend:**
- **Authentication**: JWT tokens stored in localStorage, automatic 401 handling
- **API Communication**: Centralized axios instance with interceptors in `services/api.ts`
- **State Management**: Zustand for complex workflow state, React hooks for simple state
- **UI Components**: shadcn/ui with Radix UI primitives and Tailwind CSS
- **Routing**: React Router DOM v7 with protected routes
- **Build Tool**: Vite with TypeScript support
- **Workflow Visualization**: React Flow for visual workflow editing

**Backend:**
- **Framework**: FastAPI with async support
- **AI Integration**: LangChain + LangGraph for agent orchestration
- **Data Storage**: JSON files for users/agents, Chroma for vector storage
- **Authentication**: JWT with configurable expiration
- **CORS**: Configured for frontend development

### API Integration Pattern

All API calls go through centralized service layers:

```typescript
// Authentication
authAPI.login(credentials)
authAPI.register(userData)

// Agent Management
agentAPI.createAgent(description)
agentAPI.executeAgent(request)
agentAPI.getExecutionLogs(id)

// Workflow Management (frontend/src/services/workflowApi.ts)
workflowAPI.createWorkflow(workflowData)
workflowAPI.getWorkflows()
workflowAPI.executeWorkflow(id, inputs)
workflowAPI.getExecutionStatus(id)
```

### Workflow Architecture

**Node Types:**
- `input`: Workflow input nodes
- `output`: Workflow output nodes
- `agent`: Agent execution nodes
- `condition`: Conditional branching nodes

**Workflow State Management:**
- Zustand store in `hooks/useWorkflow.ts` manages workflow state
- React Flow integration for visual editing
- Real-time validation with cycle detection
- Copy/paste functionality with clipboard management

## Environment Configuration

**Frontend (vite.config.ts):**
- Development server: `localhost:3000`
- API proxy: `/api` → `http://localhost:8000`

**Backend Environment Variables:**
- `SECRET_KEY`: JWT signing key
- `JWT_EXPIRE_MINUTES`: Token expiration time (default: 30)
- `OLLAMA_BASE_URL`: Ollama service URL (default: http://localhost:11434)
- `DATA_DIR`: Data storage directory (default: ./data)

## Common Development Tasks

### Adding New API Endpoints

1. **Backend:**
   - Add route in appropriate router file (`backend/routers/`)
   - Implement service logic in `backend/services/`
   - Update Pydantic models if needed

2. **Frontend:**
   - Define TypeScript interfaces in `frontend/src/types/`
   - Add API method in `frontend/src/services/api.ts` or `workflowApi.ts`
   - Implement UI components in appropriate pages

### Creating New Workflow Node Types

1. Define node type in `frontend/src/types/workflow.ts`
2. Create node component in `frontend/src/components/workflow/`
3. Update node type registry in workflow editor
4. Add backend execution logic in `backend/services/workflow_service.py`

### Modifying UI Components

1. Check existing shadcn/ui components in `frontend/src/components/ui/`
2. Follow established patterns for new components
3. Maintain consistent styling with Tailwind classes
4. Ensure accessibility standards are met

## Testing Approach

**Frontend:**
- Currently no automated tests configured
- Manual testing should cover:
  - User registration/login flow
  - Agent creation with various descriptions
  - Agent execution and log display
  - Workflow creation, editing, and execution
  - Error handling and edge cases
  - Responsive design on mobile/tablet

**Backend:**
- Unit tests in `backend/tests/`
- Test files: `test_auth.py`, `test_agents.py`, `test_workflows.py`
- Performance testing scripts available

## Current Feature Status (v0.2)

✅ **Completed:**
- User authentication and registration
- Natural language agent creation
- Agent execution console with real-time logs
- Visual workflow editor with React Flow
- Workflow execution with LangGraph
- Template system for common workflows
- Node-based workflow composition
- Real-time workflow validation

🚧 **In Development:**
- Advanced debugging features
- Performance optimizations

📅 **Planned (v0.3+):**
- LangStudio integration for debugging
- WeKnora knowledge base integration
- Advanced workflow analytics
- Multi-user collaboration features

## Important Notes

- Always run `npm run lint` before committing frontend changes
- Backend expects Ollama running locally on port 11434
- Frontend proxy configuration handles API routing in development
- Workflow state is managed client-side until execution
- All data is stored locally (JSON files) for privacy
- JWT tokens expire based on `JWT_EXPIRE_MINUTES` setting