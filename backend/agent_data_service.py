import json
import os
import uuid
from datetime import datetime
from typing import Dict, List, Optional

class AgentDataService:
    def __init__(self, data_file: str = "data/agents.json"):
        self.data_file = data_file
        self.ensure_data_file()
    
    def ensure_data_file(self):
        """确保数据文件存在"""
        os.makedirs(os.path.dirname(self.data_file), exist_ok=True)
        if not os.path.exists(self.data_file):
            with open(self.data_file, 'w', encoding='utf-8') as f:
                json.dump({}, f, ensure_ascii=False, indent=2)
    
    def load_agents(self) -> Dict:
        """加载所有Agent数据"""
        try:
            with open(self.data_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {}
    
    def save_agents(self, agents: Dict):
        """保存Agent数据"""
        with open(self.data_file, 'w', encoding='utf-8') as f:
            json.dump(agents, f, ensure_ascii=False, indent=2)
    
    def create_agent(self, user_id: str, name: str, description: str) -> Dict:
        """创建新的Agent"""
        agents = self.load_agents()
        
        agent_id = str(uuid.uuid4())
        agent = {
            "id": agent_id,
            "name": name,
            "description": description,
            "user_id": user_id,
            "config": {
                "model": "gpt-oss:20b",
                "temperature": 0.7,
                "max_tokens": 2000
            },
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "status": "active"
        }
        
        agents[agent_id] = agent
        self.save_agents(agents)
        return agent
    
    def get_agents_by_user(self, user_id: str) -> List[Dict]:
        """获取用户的所有Agent"""
        agents = self.load_agents()
        user_agents = []
        
        for agent_id, agent in agents.items():
            if agent.get("user_id") == user_id:
                user_agents.append(agent)
        
        # 按创建时间倒序排列
        user_agents.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return user_agents
    
    def get_agent(self, agent_id: str, user_id: str) -> Optional[Dict]:
        """获取特定的Agent"""
        agents = self.load_agents()
        agent = agents.get(agent_id)
        
        if agent and agent.get("user_id") == user_id:
            return agent
        return None
    
    def update_agent(self, agent_id: str, user_id: str, updates: Dict) -> Optional[Dict]:
        """更新Agent"""
        agents = self.load_agents()
        agent = agents.get(agent_id)
        
        if agent and agent.get("user_id") == user_id:
            agent.update(updates)
            agent["updated_at"] = datetime.utcnow().isoformat()
            agents[agent_id] = agent
            self.save_agents(agents)
            return agent
        return None
    
    def delete_agent(self, agent_id: str, user_id: str) -> bool:
        """删除Agent"""
        agents = self.load_agents()
        agent = agents.get(agent_id)
        
        if agent and agent.get("user_id") == user_id:
            del agents[agent_id]
            self.save_agents(agents)
            return True
        return False

# 全局实例
agent_data_service = AgentDataService()