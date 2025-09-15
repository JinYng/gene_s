# 🏗️ Next.js 全栈架构优化指南

## 📋 优化内容总览

本次优化重构了整个 Next.js 全栈架构，提升了代码质量、可维护性和性能。

### ✨ 主要改进

#### 1. **配置管理统一化**

- 📁 `config/index.js` - 统一配置管理
- 🔧 `env.example` - 标准化环境变量
- 🎯 类型安全的配置访问

#### 2. **工具函数库**

- 🛠️ `lib/utils.js` - 通用工具函数
- 🔒 `lib/middleware.js` - API 中间件
- 📝 `lib/logger.js` - 日志管理系统

#### 3. **服务层重构**

- 🏗️ `services/base/BaseService.js` - 基础服务类
- 📂 `services/FileService.js` - 文件处理服务
- 🤖 优化了 `AIServiceManager` 架构

#### 4. **API 优化**

- 🔄 `pages/api/v2/` - 新版本 API
- 🏥 `pages/api/health.js` - 健康检查端点
- 📈 性能监控和错误处理

#### 5. **开发工具**

- 🚀 `scripts/setup.js` - 项目初始化
- 🧹 `scripts/cleanup.js` - 清理脚本
- 📦 新的 npm 脚本

---

## 🔧 新功能特性

### 配置管理

```javascript
import config from "../config/index.js";

// AI 服务配置
const ollamaUrl = config.ai.ollama.baseUrl;
const maxFileSize = config.storage.maxFileSize;
```

### 中间件系统

```javascript
import {
  combineMiddlewares,
  withErrorHandling,
  withMethodValidation,
} from "../lib/middleware.js";

export default combineMiddlewares(
  withMethodValidation(["POST"]),
  withRateLimit(50, 60000),
  withErrorHandling
)(handler);
```

### 日志记录

```javascript
import logger from "../lib/logger.js";

logger.info("操作成功", { userId: 123, action: "upload" });
logger.error("操作失败", { error: error.message });
```

### 服务基类

```javascript
import BaseService from "./base/BaseService.js";

class MyService extends BaseService {
  async doSomething() {
    return this.executeOperation(async () => {
      // 业务逻辑
    }, "操作名称");
  }
}
```

---

## 📁 新的项目结构

```
gene_simple/
├── config/                 # 配置文件
│   └── index.js            # 统一配置管理
├── lib/                    # 工具库
│   ├── utils.js           # 通用工具函数
│   ├── middleware.js      # API 中间件
│   └── logger.js          # 日志管理
├── services/              # 服务层
│   ├── base/
│   │   └── BaseService.js # 基础服务类
│   ├── FileService.js     # 文件服务
│   └── aiServiceManager.js # AI 服务管理
├── pages/api/             # API 路由
│   ├── v2/               # 新版本 API
│   │   └── upload-file.js
│   └── health.js         # 健康检查
├── scripts/              # 项目脚本
│   ├── setup.js         # 初始化脚本
│   └── cleanup.js       # 清理脚本
└── logs/                # 日志目录
```

---

## 🚀 快速开始

### 1. 项目初始化

```bash
npm run setup
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 健康检查

```bash
npm run health
# 或访问: http://localhost:3000/api/health
```

### 4. 清理临时文件

```bash
npm run clean
```

---

## 📊 性能监控

### 健康检查端点

- **URL**: `/api/health`
- **方法**: GET
- **功能**: 检查所有服务状态

### 响应示例

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 1234.567,
    "services": {
      "ai": { "status": "healthy" },
      "file": { "status": "healthy" },
      "python": { "status": "healthy" },
      "ollama": { "status": "healthy" }
    }
  }
}
```

---

## 🔒 安全增强

### 请求限流

- 每分钟最多 50 次请求
- 自动识别客户端 IP
- 超限自动拒绝请求

### 文件验证

- 文件类型白名单
- 文件大小限制
- 自动清理临时文件

### 错误处理

- 统一错误响应格式
- 敏感信息过滤
- 详细日志记录

---

## 📈 日志系统

### 日志级别

- **ERROR**: 错误信息
- **WARN**: 警告信息
- **INFO**: 一般信息
- **DEBUG**: 调试信息

### 日志文件

- 生产环境: `logs/YYYY-MM-DD.log`
- 开发环境: 仅控制台输出
- 自动按日期分割

---

## 🛠️ 开发指南

### 创建新的 API 端点

```javascript
// pages/api/my-endpoint.js
import {
  combineMiddlewares,
  withErrorHandling,
  withMethodValidation,
} from "../../lib/middleware.js";
import logger from "../../lib/logger.js";

async function handler(req, res) {
  logger.info("API 调用", { endpoint: "/api/my-endpoint" });

  res.json({
    success: true,
    data: { message: "Hello World" },
    message: "操作成功",
  });
}

export default combineMiddlewares(
  withMethodValidation(["GET", "POST"]),
  withErrorHandling
)(handler);
```

### 创建新的服务

```javascript
// services/MyService.js
import BaseService from "./base/BaseService.js";

export default class MyService extends BaseService {
  constructor() {
    super("MyService");
  }

  async processData(data) {
    return this.executeOperation(async () => {
      this.validateRequiredFields(data, ["field1", "field2"]);

      // 处理逻辑
      return { processed: true };
    }, "数据处理");
  }
}
```

---

## 📝 环境变量说明

### 必需配置

```env
NODE_ENV=development
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_DEFAULT_MODEL=gemma2:2b
```

### 可选配置

```env
LOG_LEVEL=debug
MAX_FILE_SIZE=52428800
ENABLE_LANGGRAPH=true
ZHIPU_API_KEY=your_key_here
```

---

## 🔄 迁移指南

### 从旧 API 迁移到新 API

1. **文件上传 API**

   - 旧: `/api/upload-file`
   - 新: `/api/v2/upload-file`
   - 改进: 更好的错误处理、性能监控、文件验证

2. **响应格式标准化**

   ```javascript
   // 旧格式
   { success: true, data: {...} }

   // 新格式
   {
     success: true,
     data: {...},
     message: "操作成功",
     timestamp: "2025-01-10T..."
   }
   ```

3. **错误处理改进**
   - 统一错误码
   - 详细错误信息
   - 自动日志记录

---

## 🎯 下一步计划

### 短期优化

- [ ] 添加 API 文档生成
- [ ] 实现缓存机制
- [ ] 添加单元测试

### 中期规划

- [ ] 数据库集成
- [ ] 用户认证系统
- [ ] API 版本管理

### 长期目标

- [ ] 微服务拆分
- [ ] 容器化部署
- [ ] 监控和告警系统

---

## 🆘 故障排除

### 常见问题

1. **健康检查失败**

   ```bash
   # 检查服务状态
   npm run health

   # 查看日志
   tail -f logs/$(date +%Y-%m-%d).log
   ```

2. **文件上传失败**

   - 检查目录权限
   - 确认文件大小限制
   - 查看错误日志

3. **Python 脚本执行失败**
   - 确认 Python 环境
   - 检查依赖安装
   - 查看脚本输出

### 调试命令

```bash
# 检查配置
node -e "console.log(require('./config/index.js').default)"

# 测试文件服务
node -e "
const FileService = require('./services/FileService.js').default;
const fs = new FileService();
console.log('FileService 初始化成功');
"

# 清理并重新初始化
npm run clean && npm run setup
```
