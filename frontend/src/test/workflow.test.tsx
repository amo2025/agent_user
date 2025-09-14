import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WorkflowEditor from '../pages/WorkflowEditor'
import useWorkflowStore from '../hooks/useWorkflow'

// Mock React Flow
vi.mock('reactflow', () => ({
  ReactFlow: ({ children, onInit, onNodeClick, onConnect, onEdgesChange, onNodesChange }: any) => (
    <div data-testid="react-flow" onClick={() => onInit?.()}>
      <div data-testid="nodes-container">{children}</div>
      <button data-testid="add-node" onClick={() => {
        onNodesChange?.([{ type: 'add', item: { id: '1', type: 'input', position: { x: 100, y: 100 } } }])
      }}>Add Node</button>
    </div>
  ),
  Controls: () => <div data-testid="controls">Controls</div>,
  Background: () => <div data-testid="background">Background</div>,
  MiniMap: () => <div data-testid="minimap">MiniMap</div>,
  useNodesState: () => [[], vi.fn(), vi.fn()],
  useEdgesState: () => [[], vi.fn(), vi.fn()],
  useReactFlow: () => ({
    getNodes: () => [],
    getEdges: () => [],
    setNodes: vi.fn(),
    setEdges: vi.fn(),
    addNodes: vi.fn(),
    addEdges: vi.fn(),
    fitView: vi.fn(),
    project: vi.fn(),
  }),
  Handle: ({ type, position }: any) => (
    <div data-testid={`handle-${type}-${position}`} className={`handle ${type} ${position}`} />
  ),
}))

describe('WorkflowEditor', () => {
  beforeEach(() => {
    // Reset workflow store before each test
    useWorkflowStore.setState({
      currentWorkflow: null,
      selectedNodes: [],
      selectedEdges: [],
      clipboard: null,
      showGrid: true,
      showMinimap: true,
      showPropertiesPanel: true,
      zoomLevel: 1,
    })
  })

  it('renders workflow editor with all components', () => {
    render(<WorkflowEditor />)

    expect(screen.getByTestId('react-flow')).toBeInTheDocument()
    expect(screen.getByTestId('controls')).toBeInTheDocument()
    expect(screen.getByTestId('background')).toBeInTheDocument()
    expect(screen.getByTestId('minimap')).toBeInTheDocument()
  })

  it('validates workflow structure correctly', async () => {
    const { result } = renderHook(() => useWorkflowStore())

    // Add a workflow with no input nodes (should fail validation)
    result.current.setCurrentWorkflow({
      id: 'test-workflow',
      name: 'Test Workflow',
      description: 'Test workflow without input',
      nodes: [
        {
          id: '1',
          type: 'agent',
          position: { x: 100, y: 100 },
          data: { name: 'Test Agent', description: 'Test' }
        }
      ],
      edges: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

    const validation = result.current.validateWorkflow()

    expect(validation.is_valid).toBe(false)
    expect(validation.errors).toHaveLength(1)
    expect(validation.errors[0].message).toContain('must have at least one input node')
  })

  it('detects workflow cycles correctly', () => {
    const { result } = renderHook(() => useWorkflowStore())

    // Create a workflow with a cycle
    result.current.setCurrentWorkflow({
      id: 'test-cycle',
      name: 'Cycle Test',
      description: 'Workflow with cycle',
      nodes: [
        { id: '1', type: 'input', position: { x: 0, y: 0 }, data: {} },
        { id: '2', type: 'agent', position: { x: 100, y: 100 }, data: {} },
        { id: '3', type: 'output', position: { x: 200, y: 200 }, data: {} }
      ],
      edges: [
        { id: 'e1', source: '1', target: '2' },
        { id: 'e2', source: '2', target: '3' },
        { id: 'e3', source: '3', target: '2' } // This creates a cycle
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

    const validation = result.current.validateWorkflow()

    expect(validation.is_valid).toBe(false)
    expect(validation.errors).toHaveLength(1)
    expect(validation.errors[0].message).toContain('cycles')
  })

  it('supports copy and paste functionality', () => {
    const { result } = renderHook(() => useWorkflowStore())

    // Set up a workflow with nodes
    result.current.setCurrentWorkflow({
      id: 'test-copy',
      name: 'Copy Test',
      description: 'Test copy functionality',
      nodes: [
        { id: '1', type: 'input', position: { x: 0, y: 0 }, data: {} },
        { id: '2', type: 'agent', position: { x: 100, y: 100 }, data: {} }
      ],
      edges: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

    // Select a node
    result.current.selectNode('1')

    // Copy selection
    result.current.copySelection()

    // Paste selection
    result.current.pasteSelection()

    const workflow = result.current.currentWorkflow
    expect(workflow?.nodes).toHaveLength(3) // Original 2 + 1 pasted
    expect(workflow?.nodes[2].id).not.toBe('1') // New node has different ID
  })
})