# 🏗️ 系统架构说明

## 📊 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    🌐 前端 (Next.js)                        │
├─────────────────────────────────────────────────────────────┤
│  ChatPanel.js    │  SingleCellAnalyzer.js  │  DeckGLScatter │
│  (对话界面)       │  (分析控制)              │  (可视化)      │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP API调用
                      ▼
┌─────────────────────────────────────────────────────────────┐
│               🚀 Node.js API中间层                          │
├─────────────────────────────────────────────────────────────┤
│  chat-ollama.js: 路由分发和会话管理                        │
│  ├── 对话模式 → Ollama API (http://localhost:11434)        │
│  └── 分析模式 → Python子进程调用                           │
└─────────────────────┬───────────────────────────────────────┘
                      │ spawn调用
                      ▼
┌─────────────────────────────────────────────────────────────┐
│               🐍 Python分析层                               │
├─────────────────────────────────────────────────────────────┤
│  agent_executor.py: LangChain智能代理                      │
│  ├── 意图分析 → Ollama/外部LLM                             │
│  ├── 任务执行 → single_cell_processor.py                   │
│  └── 结果返回 → JSON格式                                   │
└─────────────────────┬───────────────────────────────────────┘
                      │ 数据处理
                      ▼
┌─────────────────────────────────────────────────────────────┐
│               📊 数据处理层                                 │
├─────────────────────────────────────────────────────────────┤
│  single_cell_processor.py: 核心分析引擎                    │
│  ├── scanpy: 单细胞数据处理                                │
│  ├── 降维算法: UMAP, t-SNE                                 │
│  └── 可视化数据生成                                        │
└─────────────────────────────────────────────────────────────┘

                      ⚡ 本地AI服务
┌─────────────────────────────────────────────────────────────┐
│               🤖 Ollama服务                                 │
├─────────────────────────────────────────────────────────────┤
│  端口: 11434                                               │
│  模型: gemma3:4b                                           │
│  功能: 自然语言理解和对话生成                              │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 数据流详解

### 1. 对话模式流程

```
用户输入 → Next.js前端 → chat-ollama.js → processDirectChat()
         ↓
callOllamaForChat() → Ollama API → 返回对话结果 → 前端显示
```

### 2. 分析模式流程

```
文件上传 + 分析请求 → Next.js前端 → chat-ollama.js → runAgentExecutor()
                    ↓
         创建临时查询文件 (解决中文编码问题)
                    ↓
conda run -n bio python agent_executor.py --query_file tmp/query.txt --file_path data.h5ad
                    ↓
         analyze_user_intent() → Ollama分析用户意图 → 返回JSON执行计划
                    ↓
         execute_action() → 根据计划调用相应函数
                    ↓
         single_cell_processor.py → scanpy处理数据 → 生成可视化数据
                    ↓
         返回JSON结果 → Node.js解析 → 前端显示图表
```

## 🧩 核心组件详解

### Frontend Components

#### `UnifiedChat.js`

- **职责**: 统一聊天组件（整合了ChatPanel、ChatInput、MessageList）
- **功能**: 消息发送、文件上传、拖拽上传、悬浮文件列表
- **状态管理**: 会话历史、加载状态、文件管理
- **优势**: 单文件管理，避免组件间复杂通信

#### `SingleCellAnalyzer.js`

- **职责**: 数据分析控制面板
- **功能**: 文件选择、分析参数配置
- **集成**: 与 ChatPanel 协作

#### `DeckGLScatterPlot.js`

- **职责**: 高性能数据可视化
- **技术**: DeckGL WebGL 渲染
- **特性**: 交互式散点图、缩放、选择

### Backend APIs

#### `chat-ollama.js`

```javascript
// 核心路由函数
export default async function handler(req, res) {
  // 1. 解析请求 (multipart/form-data)
  // 2. 会话管理
  // 3. 模式判断 (对话 vs 分析)
  // 4. 结果处理和返回
}

// 关键函数
- runAgentExecutor(): Python子进程调用
- processDirectChat(): 直接对话处理
- callOllamaForChat(): Ollama API调用
```

### Python Analysis Engine

#### `agent_executor.py`

```python
# LangChain智能代理
def main():
    # 1. 参数解析 (支持文件输入避免编码问题)
    # 2. LLM意图分析
    # 3. 任务执行
    # 4. 结果输出 (JSON格式)

# 核心函数
- analyze_user_intent(): 使用LLM理解用户需求
- execute_action(): 根据意图执行相应操作
- get_file_summary(): 数据摘要生成
- run_dimensionality_analysis(): 降维分析调用
```

#### `single_cell_processor.py`

```python
# 单细胞数据处理核心
class OptimizedSingleCellProcessor:
    def process_h5ad(self, file_path, method, color_by):
        # 1. 数据加载和预处理
        # 2. 降维计算 (UMAP/t-SNE)
        # 3. 可视化数据生成
        # 4. 结果输出 (带标记的JSON)
```

## 🔧 关键技术决策

### 1. 编码问题解决方案

**问题**: Windows 下中文参数传递给 Python 时出现编码错误
**解决**:

- Node.js 写入临时文件 (UTF-8 编码)
- Python 从文件读取参数
- 执行完成后清理临时文件

### 2. 进程间通信

**方案**: spawn 子进程 + JSON 通信
**优势**:

- 隔离 Python 环境
- 支持 conda 环境
- 错误处理明确

### 3. AI 服务架构

**本地优先**: Ollama (无需 API 密钥)
**云端备选**: 支持 Zhipu API、OpenAI API
**智能切换**: 根据环境变量自动选择

### 4. 数据格式标准化

**统一格式**: H5AD 作为内部标准
**兼容性**: 支持 CSV/TSV 自动转换
**优化**: 内存高效的处理流程

## 🛡️ 错误处理策略

### Frontend

```javascript
// 多层错误捕获
try {
  const response = await fetch('/api/chat-ollama', {...});
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message);
  }
} catch (error) {
  // 用户友好的错误提示
}
```

### Backend

```javascript
// 子进程错误处理
pythonProcess.on("error", (err) => {
  console.error("启动Python进程失败:", err);
  reject(new Error("无法启动Python子进程"));
});

pythonProcess.on("close", (code) => {
  if (code !== 0) {
    return reject(new Error(`Python脚本执行失败: ${stderrData}`));
  }
});
```

### Python

```python
# 异常捕获和JSON输出
try:
    result = execute_action(action_plan)
    print(json.dumps(result, ensure_ascii=False))
except Exception as e:
    error_result = {"error": f"执行失败: {str(e)}", "success": False}
    print(json.dumps(error_result, ensure_ascii=False))
```

## 📈 性能优化点

### 1. 前端优化

- 组件懒加载
- 大数据集虚拟滚动
- WebGL 加速渲染

### 2. 后端优化

- 会话复用
- 临时文件及时清理
- 并发请求控制

### 3. Python 优化

- scanpy 高效数据结构
- 内存管理优化
- GPU 加速 (如果可用)

## 🔮 扩展性设计

### 1. 新增分析方法

```python
# 在single_cell_processor.py中添加新方法
def new_analysis_method(self, params):
    # 实现新的分析逻辑
    return results

# 在agent_executor.py中注册
def execute_action(action_plan):
    if action == "new_analysis":
        return new_analysis_method(params)
```

### 2. 新增 AI 模型

```javascript
// 在config/index.js中配置
ai: {
  newModel: {
    baseUrl: "http://localhost:xxxx",
    model: "new-model:latest"
  }
}
```

### 3. 新增数据格式

```python
# 扩展文件读取逻辑
def read_data_file(file_path):
    ext = os.path.splitext(file_path)[1]
    if ext == '.new_format':
        return read_new_format(file_path)
```

---

这个架构设计确保了系统的**可维护性**、**可扩展性**和**用户友好性**，同时保持了良好的性能和错误处理能力。
