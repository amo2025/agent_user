import json
import os
from datetime import datetime
from typing import Dict, List, Any, Optional
import httpx

class ModelService:
    def __init__(self, data_dir: str = "data"):
        self.data_dir = data_dir
        self.models_file = os.path.join(data_dir, "models.json")
        self.ensure_data_file()
    
    def ensure_data_file(self):
        """确保数据文件存在"""
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
        
        if not os.path.exists(self.models_file):
            default_data = {
                "local_models": {},
                "online_models": {},
                "model_status": {}
            }
            self.save_models_data(default_data)
    
    def load_models_data(self) -> Dict[str, Any]:
        """加载模型数据"""
        try:
            with open(self.models_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading models data: {e}")
            return {
                "local_models": {},
                "online_models": {},
                "model_status": {}
            }
    
    def save_models_data(self, data: Dict[str, Any]):
        """保存模型数据"""
        try:
            with open(self.models_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error saving models data: {e}")
    
    async def get_ollama_models(self) -> List[Dict[str, Any]]:
        """获取Ollama本地模型"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get("http://localhost:11434/api/tags")
                ollama_data = response.json()
                
                models_data = self.load_models_data()
                local_models = []
                
                for model in ollama_data.get("models", []):
                    model_id = model["name"]
                    # 从持久化数据中获取状态，默认为active
                    status = models_data["model_status"].get(model_id, "active")
                    
                    local_models.append({
                        "id": model_id,
                        "name": model["name"],
                        "type": "local",
                        "provider": "Ollama",
                        "model_name": model["model"],
                        "description": f"本地Ollama模型 - {model['details']['parameter_size']} 参数",
                        "status": status,
                        "size": model.get("size", 0),
                        "parameter_size": model["details"]["parameter_size"],
                        "quantization": model["details"].get("quantization_level", ""),
                        "modified_at": model.get("modified_at", ""),
                        "created_at": datetime.utcnow().isoformat()
                    })
                
                return local_models
        except Exception as e:
            print(f"Error fetching Ollama models: {e}")
            return []
    
    def get_online_models(self) -> List[Dict[str, Any]]:
        """获取在线模型配置"""
        models_data = self.load_models_data()
        online_models = []
        
        for model_id, model_config in models_data["online_models"].items():
            # 从持久化数据中获取状态
            status = models_data["model_status"].get(model_id, "inactive")
            
            online_models.append({
                "id": model_id,
                "name": model_config["name"],
                "type": "online",
                "provider": model_config.get("provider", ""),
                "endpoint": model_config.get("endpoint", ""),
                "model_name": model_config["model_name"],
                "description": model_config.get("description", ""),
                "status": status,
                "api_key": model_config.get("api_key", ""),  # 注意：实际使用时应该加密存储
                "created_at": model_config.get("created_at", datetime.utcnow().isoformat())
            })
        
        return online_models
    
    async def get_all_models(self) -> List[Dict[str, Any]]:
        """获取所有模型（本地+在线）"""
        local_models = await self.get_ollama_models()
        online_models = self.get_online_models()
        return local_models + online_models
    
    def add_online_model(self, model_config: Dict[str, Any]) -> Dict[str, Any]:
        """添加在线模型配置"""
        models_data = self.load_models_data()
        
        model_id = f"online_{len(models_data['online_models']) + 1}_{int(datetime.now().timestamp())}"
        
        # 保存模型配置
        models_data["online_models"][model_id] = {
            "name": model_config["name"],
            "provider": model_config.get("provider", ""),
            "endpoint": model_config.get("endpoint", ""),
            "model_name": model_config["model_name"],
            "description": model_config.get("description", ""),
            "api_key": model_config.get("api_key", ""),  # 注意：实际使用时应该加密存储
            "created_at": datetime.utcnow().isoformat()
        }
        
        # 设置默认状态为inactive
        models_data["model_status"][model_id] = "inactive"
        
        self.save_models_data(models_data)
        
        return {
            "id": model_id,
            "name": model_config["name"],
            "type": "online",
            "provider": model_config.get("provider", ""),
            "endpoint": model_config.get("endpoint", ""),
            "model_name": model_config["model_name"],
            "description": model_config.get("description", ""),
            "status": "inactive",
            "created_at": datetime.utcnow().isoformat()
        }
    
    def toggle_model_status(self, model_id: str) -> Dict[str, Any]:
        """切换模型状态"""
        models_data = self.load_models_data()
        
        # 获取当前状态
        current_status = models_data["model_status"].get(model_id, "active")
        
        # 切换状态
        new_status = "inactive" if current_status == "active" else "active"
        models_data["model_status"][model_id] = new_status
        
        self.save_models_data(models_data)
        
        return {
            "model_id": model_id,
            "old_status": current_status,
            "new_status": new_status,
            "message": f"Model {model_id} status changed from {current_status} to {new_status}"
        }
    
    def delete_online_model(self, model_id: str) -> bool:
        """删除在线模型配置"""
        models_data = self.load_models_data()
        
        # 只能删除在线模型
        if model_id in models_data["online_models"]:
            del models_data["online_models"][model_id]
            # 同时删除状态记录
            if model_id in models_data["model_status"]:
                del models_data["model_status"][model_id]
            
            self.save_models_data(models_data)
            return True
        
        return False
    
    def get_active_models(self) -> List[Dict[str, Any]]:
        """获取所有活跃状态的模型"""
        models_data = self.load_models_data()
        active_models = []
        
        # 获取活跃的模型ID
        active_model_ids = [
            model_id for model_id, status in models_data["model_status"].items()
            if status == "active"
        ]
        
        return active_model_ids

# 创建全局实例
model_service = ModelService()