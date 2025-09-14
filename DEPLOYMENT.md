# Agent User Platform - 部署指南

## 🚀 快速部署

### 环境要求
- **操作系统**: Linux/macOS/Windows
- **Python**: 3.8+
- **Node.js**: 16+
- **Git**: 最新版本

### 1. 克隆项目
```bash
git clone https://github.com/amo2025/agent_user.git
cd agent_user
```

### 2. 后端部署

#### 创建虚拟环境
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

#### 安装依赖
```bash
pip install -r requirements.txt
```

#### 启动服务
```bash
python main.py
```
后端服务将在 `http://localhost:8000` 运行

### 3. 前端部署

#### 安装依赖
```bash
cd frontend
npm install
```

#### 启动开发服务器
```bash
npm run dev
```
前端服务将在 `http://localhost:3000` 运行

## 🐳 Docker部署

### 使用Docker Compose（推荐）

#### 创建 docker-compose.yml
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend/data:/app/data
    environment:
      - PYTHONUNBUFFERED=1
    networks:
      - app-network

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend
      - frontend
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

#### 创建后端 Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create data directory
RUN mkdir -p data

# Expose port
EXPOSE 8000

# Run application
CMD ["python", "main.py"]
```

#### 创建前端 Dockerfile
```dockerfile
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 创建 nginx.conf
```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8000;
    }

    server {
        listen 80;
        server_name localhost;

        # Frontend
        location / {
            proxy_pass http://frontend:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Backend API
        location /api {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

#### 启动服务
```bash
docker-compose up -d
```

## ☁️ 云平台部署

### AWS部署

#### 使用ECS + Fargate
```bash
# 1. 创建ECS集群
aws ecs create-cluster --cluster-name agent-user-platform

# 2. 创建任务定义
cat > task-definition.json << EOF
{
  "family": "agent-user-platform",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "your-ecr-repo/agent-user-backend:latest",
      "portMappings": [{"containerPort": 8000}],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/agent-user-platform",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF

aws ecs register-task-definition --cli-input-json file://task-definition.json

# 3. 创建服务
aws ecs create-service \
  --cluster agent-user-platform \
  --service-name agent-user-service \
  --task-definition agent-user-platform \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

#### 使用Elastic Beanstalk
```bash
# 1. 创建Elastic Beanstalk应用
eb init -p python-3.8 agent-user-platform --region us-west-2

# 2. 创建环境
eb create agent-user-env --instance-type t3.micro

# 3. 配置环境变量
eb setenv SECRET_KEY=your-secret-key JWT_EXPIRE_MINUTES=1440

# 4. 部署
eb deploy
```

### Google Cloud Platform部署

#### 使用Cloud Run
```bash
# 1. 构建容器镜像
gcloud builds submit --tag gcr.io/PROJECT-ID/agent-user-backend

# 2. 部署到Cloud Run
gcloud run deploy agent-user-backend \
  --image gcr.io/PROJECT-ID/agent-user-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10
```

#### 使用App Engine
```yaml
# app.yaml
runtime: python39
service: default

env_variables:
  SECRET_KEY: "your-secret-key"
  JWT_EXPIRE_MINUTES: "1440"

handlers:
- url: /.*
  script: auto

automatic_scaling:
  min_instances: 1
  max_instances: 10
  target_cpu_utilization: 0.6
```

### Azure部署

#### 使用Container Instances
```bash
# 1. 创建资源组
az group create --name agent-user-rg --location eastus

# 2. 创建容器实例
az container create \
  --resource-group agent-user-rg \
  --name agent-user-backend \
  --image your-registry/agent-user-backend:latest \
  --dns-name-label agent-user-backend \
  --ports 8000 \
  --cpu 1 \
  --memory 1 \
  --environment-variables SECRET_KEY=your-secret-key
```

#### 使用App Service
```bash
# 1. 创建App Service计划
az appservice plan create \
  --name agent-user-plan \
  --resource-group agent-user-rg \
  --sku B1 \
  --is-linux

# 2. 创建Web应用
az webapp create \
  --resource-group agent-user-rg \
  --plan agent-user-plan \
  --name agent-user-backend \
  --deployment-container-image-name your-registry/agent-user-backend:latest
```

## 🔧 生产环境配置

### 环境变量
```bash
# 后端环境变量
SECRET_KEY=your-256-bit-secret-key
JWT_EXPIRE_MINUTES=1440
OLLAMA_BASE_URL=http://localhost:11434
LOG_LEVEL=INFO
MAX_WORKERS=4

# 前端环境变量
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_APP_NAME="Agent User Platform"
VITE_ENVIRONMENT=production
```

### Nginx配置
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL证书
    ssl_certificate /etc/ssl/certs/yourdomain.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;

    # 安全headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # 前端静态文件
    location / {
        root /var/www/agent-user-frontend;
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 系统服务配置
```ini
# /etc/systemd/system/agent-user-backend.service
[Unit]
Description=Agent User Platform Backend
After=network.target

[Service]
Type=simple
User=agentuser
WorkingDirectory=/opt/agent-user-platform/backend
Environment=PATH=/opt/agent-user-platform/backend/venv/bin
ExecStart=/opt/agent-user-platform/backend/venv/bin/python main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

## 📊 监控和日志

### 应用监控
```python
# 在main.py中添加监控
import logging
from logging.handlers import RotatingFileHandler

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        RotatingFileHandler('app.log', maxBytes=10485760, backupCount=5),
        logging.StreamHandler()
    ]
)

# 添加健康检查端点
@app.get("/health/ready")
async def health_ready():
    return {"status": "ready"}

@app.get("/health/live")
async def health_live():
    return {"status": "alive"}
```

### 性能监控
```bash
# 使用Prometheus和Grafana
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-storage:/var/lib/grafana

volumes:
  grafana-storage:
```

## 🔒 安全加固

### SSL/TLS配置
```bash
# 使用Let's Encrypt获取免费SSL证书
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 防火墙配置
```bash
# UFW配置
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Fail2ban配置
```ini
# /etc/fail2ban/jail.local
[agent-user-api]
enabled = true
port = http,https
filter = agent-user-api
logpath = /var/log/nginx/access.log
maxretry = 5
bantime = 3600
```

## 📋 部署检查清单

### 部署前
- [ ] 环境变量配置正确
- [ ] 依赖项安装完整
- [ ] 测试用例全部通过
- [ ] 代码审查完成
- [ ] 安全扫描通过

### 部署中
- [ ] 服务正常启动
- [ ] 端口监听正常
- [ ] 健康检查通过
- [ ] 日志输出正常
- [ ] 数据库连接正常

### 部署后
- [ ] 功能测试通过
- [ ] 性能测试通过
- [ ] 安全测试通过
- [ ] 监控告警配置
- [ ] 备份策略配置

## 🆘 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 检查端口占用
   sudo netstat -tulpn | grep :8000
   sudo netstat -tulpn | grep :3000
   ```

2. **权限问题**
   ```bash
   # 修复文件权限
   sudo chown -R agentuser:agentuser /opt/agent-user-platform
   chmod -R 755 /opt/agent-user-platform
   ```

3. **内存不足**
   ```bash
   # 检查内存使用
   free -h
   # 添加swap空间
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

### 日志查看
```bash
# 系统日志
journalctl -u agent-user-backend -f

# 应用日志
tail -f /opt/agent-user-platform/backend/app.log

# Nginx日志
tail -f /var/log/nginx/error.log
```

## 📞 支持

如有部署问题，请通过以下方式联系：
- GitHub Issues
- 邮箱: support@agentuser.com
- 文档: https://docs.agentuser.com

## 🔄 更新和维护

### 更新流程
```bash
# 1. 备份当前版本
sudo systemctl stop agent-user-backend
cp -r /opt/agent-user-platform /opt/agent-user-platform.backup

# 2. 拉取最新代码
cd /opt/agent-user-platform
git pull origin main

# 3. 更新依赖
cd backend
source venv/bin/activate
pip install -r requirements.txt

cd ../frontend
npm install
npm run build

# 4. 重启服务
sudo systemctl start agent-user-backend
```

### 回滚流程
```bash
# 如果更新出现问题，可以快速回滚
sudo systemctl stop agent-user-backend
rm -rf /opt/agent-user-platform
cp -r /opt/agent-user-platform.backup /opt/agent-user-platform
sudo systemctl start agent-user-backend
```

---

**注意**: 本部署指南基于MVP v0.1版本，后续版本可能有不同的部署要求。请始终参考最新文档。 "Agent User Platform - 完全本地化部署的AI Agent创建和管理平台"

## 🏷️ 版本信息

- **版本**: MVP v0.1
- **发布日期**: 2024年
- **兼容性**: Python 3.8+, Node.js 16+
- **许可证**: MIT License