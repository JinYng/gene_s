# 📡 API 接口文档

## 概述

本文档描述了智能单细胞数据分析平台的 API 接口规范。

## 基础信息

- **Base URL**: `http://localhost:3000/api`
- **Content-Type**: `multipart/form-data` (文件上传) 或 `application/json`
- **编码**: UTF-8

## 🔌 核心 API

### 1. 聊天分析接口

#### `POST /api/chat-ollama`

智能对话和数据分析的统一入口

**请求格式**: `multipart/form-data`

**请求参数**:

```javascript
{
  message: string,        // 用户消息内容
  sessionId: string,      // 会话ID (可选，自动生成)
  useWorkflow: boolean,   // 是否使用数据分析工作流
  files: File[]          // 上传的数据文件 (可选)
}
```

**响应格式**:

```javascript
{
  success: boolean,
  responses: [
    {
      type: string,      // 响应类型: "chat_response" | "agent_result" | "file_info" | "error"
      content: object    // 响应内容，根据type不同而变化
    }
  ],
  sessionId: string,
  processingTime: number,
  workflowUsed: boolean,
  aiService: string
}
```

#### 响应类型详解

##### 1. 对话响应 (`chat_response`)

```javascript
{
  type: "chat_response",
  content: "AI助手的回复文本内容"
}
```

##### 2. 数据分析结果 (`agent_result`)

```javascript
{
  type: "agent_result",
  content: {
    action: "dimensionality_reduction" | "summary",
    success: boolean,
    // 降维分析结果
    x: number[],           // X坐标数组
    y: number[],           // Y坐标数组
    color: number[],       // 颜色映射数组
    color_type: string,    // 颜色类型
    // 或数据摘要结果
    n_obs: number,         // 细胞数量
    n_vars: number,        // 基因数量
    obs_columns: string[]  // 观察变量列名
  }
}
```

##### 3. 文件信息 (`file_info`)

```javascript
{
  type: "file_info",
  content: "📁 **检测到上传文件**\n\n- filename.h5ad (1.2MB, .h5ad)"
}
```

##### 4. 错误响应 (`error`)

```javascript
{
  type: "error",
  content: "错误描述信息"
}
```

## 📝 使用示例

### 示例 1: 普通对话

```javascript
// 请求
const formData = new FormData();
formData.append('message', '你好，什么是单细胞测序？');
formData.append('useWorkflow', 'false');
formData.append('sessionId', 'session_123');

fetch('/api/chat-ollama', {
  method: 'POST',
  body: formData
});

// 响应
{
  "success": true,
  "responses": [{
    "type": "chat_response",
    "content": "单细胞测序是一种能够在单个细胞水平上检测基因表达的技术..."
  }],
  "sessionId": "session_123",
  "processingTime": 1500,
  "workflowUsed": false,
  "aiService": "Ollama Enhanced (gemma3:4b)"
}
```

### 示例 2: 数据分析

```javascript
// 请求
const formData = new FormData();
formData.append('message', '对这个数据进行UMAP降维分析');
formData.append('useWorkflow', 'true');
formData.append('sessionId', 'session_456');
formData.append('files', fileInput.files[0]); // H5AD文件

fetch('/api/chat-ollama', {
  method: 'POST',
  body: formData
});

// 响应
{
  "success": true,
  "responses": [{
    "type": "agent_result",
    "content": {
      "action": "dimensionality_reduction",
      "success": true,
      "x": [1.2, 2.3, -0.5, ...],
      "y": [0.8, -1.1, 2.7, ...],
      "color": [0, 1, 0, 1, 2, ...],
      "color_type": "cluster"
    }
  }],
  "sessionId": "session_456",
  "processingTime": 8500,
  "workflowUsed": true,
  "aiService": "Ollama Enhanced (gemma3:4b)"
}
```

### 示例 3: 文件上传

```javascript
// 请求
const formData = new FormData();
formData.append('message', '我上传了一个数据文件');
formData.append('useWorkflow', 'false');
formData.append('files', fileInput.files[0]);

// 响应
{
  "success": true,
  "responses": [{
    "type": "file_info",
    "content": "📁 **检测到上传文件**\n\n- processed_data.h5ad (2.1MB, .h5ad)\n\n💡 **提示**: 开启\"使用工作流\"选项，然后说\"分析这些数据\"、\"进行UMAP降维\"等，即可开始数据分析。"
  }],
  "sessionId": "session_789",
  "processingTime": 200,
  "workflowUsed": false,
  "aiService": "Ollama Enhanced (gemma3:4b)"
}
```

## 🔍 工作流触发条件

数据分析工作流在以下条件下触发：

- `useWorkflow === true` 且满足以下任一条件：
  - 上传了文件 (`files.length > 0`)
  - 消息包含关键词：`分析`、`降维`、`聚类`、`可视化`

## 📁 支持的文件格式

| 格式 | 扩展名  | 描述                                      | 优先级 |
| ---- | ------- | ----------------------------------------- | ------ |
| H5AD | `.h5ad` | Scanpy 标准格式，包含完整的单细胞数据对象 | 🟢 高  |
| CSV  | `.csv`  | 逗号分隔的表达矩阵                        | 🟡 中  |
| TSV  | `.tsv`  | 制表符分隔的表达矩阵                      | 🟡 中  |

## ⚡ 性能指标

| 操作类型   | 典型响应时间 | 最大文件大小 |
| ---------- | ------------ | ------------ |
| 普通对话   | 1-3 秒       | N/A          |
| 数据摘要   | 2-5 秒       | 50MB         |
| UMAP 分析  | 5-30 秒      | 50MB         |
| t-SNE 分析 | 10-60 秒     | 50MB         |

## 🚨 错误代码

### HTTP 状态码

- `200`: 成功 (注意检查 response.success 字段)
- `400`: 请求参数错误
- `500`: 服务器内部错误

### 业务错误类型

```javascript
// Python脚本执行失败
{
  "success": false,
  "error": "服务器内部错误",
  "message": "Python脚本执行失败: 模块导入错误",
  "responses": [{
    "type": "error",
    "content": "AI代理执行失败: Python脚本执行失败: 模块导入错误"
  }]
}

// Ollama服务不可用
{
  "success": false,
  "error": "服务器内部错误",
  "message": "fetch failed",
  "responses": [{
    "type": "error",
    "content": "对话处理失败: fetch failed"
  }]
}

// 文件格式不支持
{
  "success": true,
  "responses": [{
    "type": "agent_result",
    "content": {
      "action": "dimensionality_reduction",
      "error": "不支持的文件格式: .xlsx",
      "success": false
    }
  }]
}
```

## 🔧 开发调试

### 启用详细日志

在`.env.local`中设置：

```bash
LOG_LEVEL=debug
NODE_ENV=development
```

### API 测试工具

```bash
# 使用curl测试对话接口
curl -X POST http://localhost:3000/api/chat-ollama \
  -F "message=你好" \
  -F "useWorkflow=false"

# 使用curl测试文件上传
curl -X POST http://localhost:3000/api/chat-ollama \
  -F "message=分析这个数据" \
  -F "useWorkflow=true" \
  -F "files=@sample_data/processed_data.h5ad"
```

### 前端集成示例

```javascript
// React组件中的使用示例
const handleSubmit = async (message, files, useWorkflow) => {
  const formData = new FormData();
  formData.append("message", message);
  formData.append("useWorkflow", useWorkflow);

  files.forEach((file) => {
    formData.append("files", file);
  });

  try {
    const response = await fetch("/api/chat-ollama", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      // 处理成功响应
      data.responses.forEach((resp) => {
        if (resp.type === "agent_result") {
          // 渲染分析结果
          renderAnalysisResult(resp.content);
        } else if (resp.type === "chat_response") {
          // 显示对话内容
          displayMessage(resp.content);
        }
      });
    } else {
      // 处理错误
      console.error("API调用失败:", data.message);
    }
  } catch (error) {
    console.error("网络错误:", error);
  }
};
```

## 📊 会话管理

### 会话生命周期

- **创建**: 首次请求时自动创建或使用提供的 sessionId
- **存储**: 内存中存储，服务重启后清空
- **清理**: 长时间不活跃的会话会被自动清理

### 会话数据结构

```javascript
{
  id: string,
  messages: [{
    role: "user" | "assistant",
    content: string,
    files?: object[],
    timestamp: Date
  }],
  uploadedFiles: object[],
  workflowResults: object[],
  createdAt: Date,
  lastActivity: Date
}
```

---

此 API 文档涵盖了系统的所有核心接口和使用场景，为前端开发和系统集成提供了完整的参考。
