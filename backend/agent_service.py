import json
import uuid
import os
from datetime import datetime
from typing import Dict, Any, Optional, List
from pydantic import BaseModel
import ollama
from langchain.llms import Ollama
from langchain.agents import initialize_agent, AgentType
from langchain.tools import Tool
from langchain.prompts import PromptTemplate
import asyncio
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AgentConfig(BaseModel):
    id: str
    name: str
    description: str
    type: str
    model: str
    tools: List[str]
    prompt_template: str
    parameters: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

class ExecutionRequest(BaseModel):
    agent_id: str
    input: str
    parameters: Optional[Dict[str, Any]] = {}

class ExecutionLog(BaseModel):
    timestamp: datetime
    level: str
    message: str
    metadata: Optional[Dict[str, Any]] = {}

class ExecutionResponse(BaseModel):
    id: str
    status: str
    result: Optional[str] = None
    error: Optional[str] = None
    logs: List[ExecutionLog]
    start_time: datetime
    end_time: Optional[datetime] = None

class AgentService:
    def __init__(self):
        self.agents_file = "data/agents.json"
        self.executions_file = "data/executions.json"
        self.ollama_base_url = "http://localhost:11434"

        # Ensure data directory exists
        import os
        os.makedirs("data", exist_ok=True)

        # Initialize Ollama
        self.ollama = Ollama(base_url=self.ollama_base_url, model="llama2")

        # Load existing data
        self.agents = self.load_agents()
        self.executions = self.load_executions()

    def load_agents(self) -> Dict[str, AgentConfig]:
        """加载Agent配置"""
        try:
            if not os.path.exists(self.agents_file):
                return {}

            with open(self.agents_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return {
                    agent_id: AgentConfig(**agent_data)
                    for agent_id, agent_data in data.items()
                }
        except Exception as e:
            logger.error(f"Error loading agents: {e}")
            return {}

    def save_agents(self):
        """保存Agent配置"""
        try:
            agents_dict = {
                agent_id: agent.dict()
                for agent_id, agent in self.agents.items()
            }
            with open(self.agents_file, 'w', encoding='utf-8') as f:
                json.dump(agents_dict, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Error saving agents: {e}")

    def load_executions(self) -> Dict[str, ExecutionResponse]:
        """加载执行记录"""
        try:
            if not os.path.exists(self.executions_file):
                return {}

            with open(self.executions_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return {
                    exec_id: ExecutionResponse(**exec_data)
                    for exec_id, exec_data in data.items()
                }
        except Exception as e:
            logger.error(f"Error loading executions: {e}")
            return {}

    def save_executions(self):
        """保存执行记录"""
        try:
            executions_dict = {
                exec_id: exec.dict()
                for exec_id, exec in self.executions.items()
            }
            with open(self.executions_file, 'w', encoding='utf-8') as f:
                json.dump(executions_dict, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Error saving executions: {e}")

    async def create_agent_from_description(self, description: str, user_id: str) -> AgentConfig:
        """从自然语言描述创建Agent"""
        try:
            # Log the start of agent creation
            logger.info(f"Creating agent from description for user {user_id}")

            # Generate agent configuration using Ollama
            prompt = f"""
Based on the following description, generate a structured agent configuration in JSON format:

Description: {description}

Please create a JSON configuration with these fields:
- name: A suitable name for the agent
- description: A brief description of what the agent does
- type: The type of agent (e.g., "conversation", "task", "analysis", "creative")
- model: The AI model to use (e.g., "llama2", "codellama", "mistral")
- tools: List of tools the agent should have access to (e.g., ["web_search", "calculator", "file_reader"])
- prompt_template: A prompt template for the agent
- parameters: Default parameters for the agent

Respond with only the JSON configuration, no additional text.
"""

            # Call Ollama API
            response = await ollama.chat(
                model="llama2",
                messages=[{"role": "user", "content": prompt}]
            )

            config_text = response['message']['content'].strip()
            logger.info(f"Generated agent config: {config_text}")

            # Parse the JSON response
            try:
                config_data = json.loads(config_text)
            except json.JSONDecodeError:
                # If JSON parsing fails, create a default config
                logger.warning("Failed to parse generated config, using default")
                config_data = {
                    "name": "AI Assistant",
                    "description": description[:200],
                    "type": "conversation",
                    "model": "llama2",
                    "tools": [],
                    "prompt_template": "You are a helpful AI assistant. {input}",
                    "parameters": {"temperature": 0.7, "max_tokens": 1000}
                }

            # Create agent configuration
            agent_id = str(uuid.uuid4())
            now = datetime.utcnow()

            agent_config = AgentConfig(
                id=agent_id,
                name=config_data.get("name", "AI Assistant"),
                description=config_data.get("description", description[:200]),
                type=config_data.get("type", "conversation"),
                model=config_data.get("model", "llama2"),
                tools=config_data.get("tools", []),
                prompt_template=config_data.get("prompt_template", "You are a helpful AI assistant. {input}"),
                parameters=config_data.get("parameters", {"temperature": 0.7, "max_tokens": 1000}),
                created_at=now,
                updated_at=now
            )

            # Save agent
            self.agents[agent_id] = agent_config
            self.save_agents()

            logger.info(f"Successfully created agent {agent_id}")
            return agent_config

        except Exception as e:
            logger.error(f"Error creating agent from description: {e}")
            raise Exception(f"Failed to create agent: {str(e)}")

    async def execute_agent(self, request: ExecutionRequest) -> ExecutionResponse:
        """执行Agent"""
        try:
            # Get agent configuration
            agent = self.agents.get(request.agent_id)
            if not agent:
                raise ValueError(f"Agent {request.agent_id} not found")

            # Create execution record
            execution_id = str(uuid.uuid4())
            execution = ExecutionResponse(
                id=execution_id,
                status="running",
                logs=[],
                start_time=datetime.utcnow()
            )

            self.executions[execution_id] = execution
            self.save_executions()

            # Start execution in background
            asyncio.create_task(self._execute_agent_async(agent, request, execution_id))

            return execution

        except Exception as e:
            logger.error(f"Error starting agent execution: {e}")
            raise Exception(f"Failed to start execution: {str(e)}")

    async def _execute_agent_async(self, agent: AgentConfig, request: ExecutionRequest, execution_id: str):
        """异步执行Agent"""
        try:
            execution = self.executions[execution_id]

            # Add initial log
            self._add_log(execution_id, "info", f"Starting execution of agent {agent.name}")

            # Initialize the LLM
            llm = Ollama(base_url=self.ollama_base_url, model=agent.model)

            # Create tools if specified
            tools = []
            if agent.tools:
                for tool_name in agent.tools:
                    tool = self._create_tool(tool_name)
                    if tool:
                        tools.append(tool)

            # Create the agent
            if tools:
                agent_executor = initialize_agent(
                    tools=tools,
                    llm=llm,
                    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
                    verbose=True
                )

                # Execute with tools
                self._add_log(execution_id, "info", f"Executing agent with {len(tools)} tools")

                # Combine input with parameters
                full_input = request.input
                if request.parameters:
                    full_input += f"\nParameters: {json.dumps(request.parameters)}"

                result = await agent_executor.arun(full_input)

            else:
                # Simple LLM execution
                self._add_log(execution_id, "info", "Executing agent without tools")

                # Format prompt template
                prompt = agent.prompt_template.format(
                    input=request.input,
                    parameters=json.dumps(request.parameters) if request.parameters else ""
                )

                result = await llm.ainvoke(prompt)

            # Update execution result
            execution.status = "completed"
            execution.result = str(result)
            execution.end_time = datetime.utcnow()

            self._add_log(execution_id, "info", "Execution completed successfully")

        except Exception as e:
            logger.error(f"Error during agent execution: {e}")
            execution.status = "failed"
            execution.error = str(e)
            execution.end_time = datetime.utcnow()
            self._add_log(execution_id, "error", f"Execution failed: {str(e)}")

        finally:
            self.save_executions()

    def _create_tool(self, tool_name: str):
        """创建工具"""
        # This is a simplified tool creation - in a real implementation,
        # you would have a comprehensive tool registry

        if tool_name == "calculator":
            def calculator(expression: str) -> str:
                """Evaluate a mathematical expression"""
                try:
                    result = eval(expression)
                    return str(result)
                except Exception as e:
                    return f"Error: {str(e)}"

            return Tool(
                name="calculator",
                description="Useful for performing mathematical calculations",
                func=calculator
            )

        elif tool_name == "web_search":
            def web_search(query: str) -> str:
                """Search the web for information"""
                # This would integrate with a real web search API
                return f"Web search results for: {query}"

            return Tool(
                name="web_search",
                description="Useful for searching information on the web",
                func=web_search
            )

        elif tool_name == "file_reader":
            def file_reader(file_path: str) -> str:
                """Read content from a file"""
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        return f.read()
                except Exception as e:
                    return f"Error reading file: {str(e)}"

            return Tool(
                name="file_reader",
                description="Useful for reading content from files",
                func=file_reader
            )

        return None

    def _add_log(self, execution_id: str, level: str, message: str, metadata: Dict[str, Any] = None):
        """添加执行日志"""
        if execution_id in self.executions:
            log = ExecutionLog(
                timestamp=datetime.utcnow(),
                level=level,
                message=message,
                metadata=metadata or {}
            )
            self.executions[execution_id].logs.append(log)
            self.save_executions()

    def get_agent(self, agent_id: str) -> Optional[AgentConfig]:
        """获取Agent配置"""
        return self.agents.get(agent_id)

    def get_user_agents(self, user_id: str) -> List[AgentConfig]:
        """获取用户的所有Agent"""
        # For now, return all agents - in a real implementation,
        # you would filter by user_id
        return list(self.agents.values())

    def get_execution(self, execution_id: str) -> Optional[ExecutionResponse]:
        """获取执行记录"""
        return self.executions.get(execution_id)

    def get_execution_logs(self, execution_id: str) -> List[ExecutionLog]:
        """获取执行日志"""
        execution = self.executions.get(execution_id)
        return execution.logs if execution else []# Create agent service instance
agent_service = AgentService()
