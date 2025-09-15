# 🧬 智能单细胞数据分析平台

一个集成了 AI 代理和本地模型的智能单细胞转录组数据分析平台，支持自然语言交互和自动化数据处理。采用模块化架构设计，支持独立部署和扩展。

⚠️ **重要注意事项**：本应用需要同时启动两个服务器（Next.js 应用服务器和 Python FastAPI 分析服务器）才能正常运行！

## 🌟 核心功能

### 🤖 双模式 AI 交互

- **智能数据分析模式**: 使用 AI 代理进行复杂的单细胞数据分析
- **友好对话模式**: 基于本地模型的日常对话和专业咨询

### 📊 单细胞数据分析

- **多格式支持**: H5AD、CSV、TSV 文件格式
- **降维分析**: UMAP 可视化
- **数据摘要**: 细胞数量、基因数量、样本信息统计
- **聚类分析**: 自动细胞类型识别和分组
- **格式转换**: CSV/TSV 转 H5AD 格式

### 🔄 智能工作流

- **自然语言理解**: "对这个数据进行 UMAP 降维分析"
- **意图识别**: AI 自动判断用户需求并执行相应分析
- **结果可视化**: 交互式散点图展示
- **矩阵转换**: 自动格式转换和数据预处理

## 🏗️ 技术架构

### 🎯 模块化架构设计

项目采用**完全模块化**架构，各组件可独立部署：

```
📦 gene_simple/
├── 🗣️ chat_scripts/          # 完全独立的Chat服务
│   ├── agent_executor.py     # AI代理执行器
│   ├── main.py              # FastAPI服务器
│   ├── single_cell_processor.py  # 单细胞分析处理器
│   ├── matrix_converter.py   # 矩阵格式转换器
│   └── requirements.txt     # Chat专用依赖
├── 🔬 analysis_scripts/       # 可选的单细胞分析服务
│   ├── single_cell_processor.py  # 分析处理器
│   └── matrix_to_h5ad_converter.py  # 格式转换器
├── 🎨 components/           # React前端组件
├── 📡 services/           # Node.js服务层
├── 📱 pages/              # Next.js页面和API路由
└── ⚙️ config/             # 配置文件
```

### 🖥️ 前端技术栈

- **Next.js 15**: React 全栈框架
- **DeckGL**: 高性能数据可视化
- **React 19**: 用户界面构建
- **Tailwind CSS**: 样式框架

### 🐍 后端技术栈

#### Chat 服务（完全独立）

- **Python 3.8+**: 数据处理核心
- **FastAPI**: 高性能 API 框架
- **LangChain**: AI 代理框架
- **Pydantic**: 数据验证
- **Scanpy**: 单细胞数据分析

#### 服务层（Node.js）

- **Node.js**: 服务器运行环境
- **Express.js**: Web 框架（通过 Next.js）
- **Formidable**: 文件上传处理

## 🚀 环境配置

### 1. 系统要求

- **操作系统**: Windows 10/11, macOS, Linux
- **Python**: 3.8+ (推荐使用 conda 环境)
- **Node.js**: 16+
- **内存**: 至少 8GB RAM（推荐 16GB 以上）

### 2. 依赖安装

#### Python 环境配置（Chat 服务）

```bash
# 进入Chat服务目录
cd chat_scripts

# 创建conda环境
conda create -n bio python=3.10

# 激活conda环境
conda activate bio

# 安装Chat服务专用依赖
pip install -r requirements.txt
```

#### Node.js 依赖安装

```bash
# 在项目根目录安装前端依赖
npm install
```

### 3. 可选分析服务配置

如果需要使用独立的分析服务：

```bash
# 进入分析服务目录
cd analysis_scripts

# 安装分析服务依赖
pip install scanpy pandas numpy
```

## 🚀 快速开始

### 📋 前置依赖

- Node.js (v18+)
- Python (v3.8+)
- Ollama 本地模型 (gemma3:4b 或其他兼容模型)

### 🔧 安装步骤

1. **安装 Node.js 依赖**

   ```bash
   npm install
   ```
2. **安装 Python 依赖**

   ```bash
   cd chat_scripts
   pip install -r requirements.txt
   cd ..
   ```
3. **下载 Ollama 模型**

   ```bash
   ollama run gemma3:4b
   ```

### 🎯 运行应用

**⚠️ 重要：需要同时启动两个服务器！**

#### 1. 启动 Python FastAPI 分析服务器

打开第一个终端窗口，执行：

```bash
uvicorn chat_scripts.main:app --reload --port 8001
# 或在Windows上使用
npm run chat-server-win
```

这将在 http://localhost:8001 启动 Python 分析服务器

#### 2. 启动 Ollama 服务

打开第二个终端窗口，执行：

```bash
ollama serve
```

这将启动 Ollama 本地模型服务

#### 3. 启动 Next.js 应用服务器

打开第三个终端窗口，执行：

```bash
npm run dev
```

这将在 http://localhost:3000 启动 Next.js 应用

### 🖱️ 使用说明

1. 在浏览器中访问 http://localhost:3000
2. 上传您的单细胞数据文件（支持 H5AD、CSV、TSV 格式）
3. 使用自然语言描述您想要进行的分析，例如：
   - "对这个数据进行 UMAP 降维分析"
   - "用 cluster 给细胞着色"
   - "转换成 H5AD 格式"

## 📖 使用指南

### 🚀 启动服务

项目支持多种启动方式，可根据需求选择：

#### 方式 1：启动完整 Chat 服务（推荐）# 启动 Chat 服务（端口 8001）

#### 方式 2：启动前端开发服务

```bash
# 启动Next.js开发服务器（端口3000）
npm run dev
```

#### 方式 3：同时启动所有服务

```bash
# 终端1: 启动Chat服务
cd chat_scripts && python main.py

# 终端2: 启动前端服务
npm run dev
```

### 🎯 访问应用

服务启动后，打开浏览器访问：

- **前端界面**: `http://localhost:3000`
- **Chat API**: `http://localhost:8001`
- **健康检查**: `http://localhost:8001/health`

### 🗣️ 使用指南

#### 普通聊天模式

1. 在前端界面关闭"使用工作流"开关
2. 直接输入问题，例如：
   - "什么是单细胞测序？"
   - "UMAP 和 t-SNE 有什么区别？"

#### 智能分析模式

1. 开启"使用工作流"开关
2. 上传数据文件（支持 H5AD、CSV、TSV）
3. 输入分析请求：
   - "对这个数据进行 UMAP 降维分析"
   - "查看数据的基本信息"
   - "将 CSV 文件转换为 H5AD 格式"

#### 文件格式转换

1. 上传 CSV 或 TSV 格式的表达矩阵
2. 请求："将上传的文件转换为 H5AD 格式"
3. 系统自动完成格式转换

### 📁 示例数据

项目包含丰富的示例数据：

```
sample_data/
├── gene_expression.csv      # 基因表达数据示例
├── protein_analysis.tsv    # 蛋白质分析数据
├── time_series.csv         # 时间序列数据
└── adultpancreas/          # 完整单细胞数据集
    ├── exprMatrix.tsv     # 表达矩阵
    └── meta.tsv          # 细胞元数据
```

## ⚙️ 高级配置

### 环境变量配置

创建 `.env.local` 文件进行个性化配置：

```bash
# Chat服务配置
CHAT_SERVER_URL=http://localhost:8001

# Python环境配置
PYTHON_EXECUTABLE=python

# AI服务配置
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_DEFAULT_MODEL=gemma3:4b

# 智谱AI配置（可选）
ZHIPU_API_KEY=your_zhipu_api_key
```

### 端口配置

如需修改默认端口：

```bash
# Chat服务端口（修改main.py）
uvicorn.run(app, host="0.0.0.0", port=8002)

# 前端服务端口（修改package.json）
"dev": "next dev -p 3001"
```

## 🔧 故障排除

### 常见问题解决方案

#### 1. Chat 服务启动失败

**错误**: 端口 8001 被占用
**解决**:

```bash
# 检查端口占用
netstat -ano | findstr 8001

# 修改端口或关闭占用程序
python main.py --port 8002
```

#### 2. Python 依赖问题

**错误**: 缺少 scanpy 等依赖
**解决**:

```bash
# 确认conda环境
conda activate bio-chat

# 重新安装依赖
pip install -r chat_scripts/requirements.txt
```

#### 3. 前端连接失败

**错误**: 无法连接到 Chat 服务
**解决**:

```bash
# 检查Chat服务状态
curl http://localhost:8001/health

# 检查环境变量配置
echo $CHAT_SERVER_URL
```

#### 4. 文件处理超时

**错误**: 大文件处理超时
**解决**:

- 增加处理超时时间（修改 chat_scripts/main.py）
- 检查系统内存是否充足
- 使用更小的测试数据集

## ❓ 常见问题解决

### 1. HTTP 500: Internal Server Error

当您看到这个错误时，最可能的原因是 Python 分析服务器没有启动。请检查：

- **Python 服务器状态**：确认已在单独的终端中执行 `npm run chat-server`命令
- **Ollama 服务状态**：确认已在单独的终端中执行 `ollama serve`命令
- **端口占用情况**：确保端口 8001（Python 服务器）、11434（Ollama）和 3000（Next.js）没有被其他应用占用
- **Python 依赖安装**：确认已在 chat_scripts 目录中执行 `pip install -r requirements.txt`
- **gemma3:4b 模型**：确认已执行 `ollama pull gemma3:4b`下载模型

### 2. 文件上传失败

- 检查文件大小是否超过限制（当前最大支持 4GB）
- 确保文件格式正确（H5AD、CSV 或 TSV）
- 确认临时目录权限正确

### 3. AI 服务不可用

- 检查 Ollama 服务是否正在运行：http://localhost:11434
- 确认 gemma3:4b 模型已下载完成
- 检查网络连接是否正常

## 📊 性能优化建议

### 数据处理优化

- **首选 H5AD 格式**: 比 CSV/TSV 更高效
- **预处理数据**: 提前过滤低质量细胞和基因
- **分批处理**: 大数据集可分批分析

### 系统性能

- **内存管理**: 及时清理临时文件
- **并发控制**: 合理设置处理队列
- **服务监控**: 定期检查服务健康状态

## 🔒 安全与隐私

### 数据安全

- 所有计算在本地进行，无数据外泄
- 上传文件存储在本地临时目录
- 分析完成后自动清理临时文件

### 隐私保护

- 聊天记录仅存储在本地会话中
- 无需注册或登录
- 支持完全离线运行

## 🎯 开发扩展

### 添加新功能

#### 1. 扩展 Chat 服务

在 `chat_scripts/agent_executor.py` 中添加新的动作类型：

```python
# 添加新的分析类型
class Action(BaseModel):
    type: Literal["single_cell_analysis", "general_chat", "convert_matrix", "your_new_action"]
    # ... 其他配置
```

#### 2. 扩展前端组件

在 `components/analysis/` 中添加新的可视化组件

#### 3. 扩展文件格式支持

在 `chat_scripts/matrix_converter.py` 中添加新的格式转换器

### 部署建议

#### 开发环境

```bash
# 开发模式启动
npm run dev
python chat_scripts/main.py
```

#### 生产环境

```bash
# 构建前端
npm run build

# 生产模式启动
npm run start
python chat_scripts/main.py --host 0.0.0.0 --port 8001
```

## 📈 版本信息

- **当前版本**: v2.0.0
- **架构更新**: 2025 年 1 月 - 完全模块化重构
- **主要改进**: Chat 服务独立化、支持多实例部署

## 🤝 贡献指南

### 开发环境设置

```bash
# 克隆项目
git clone [repository_url]
cd gene_simple

# 安装所有依赖
npm install
cd chat_scripts && pip install -r requirements.txt

# 启动开发服务
# 终端1: Chat服务
python chat_scripts/main.py

# 终端2: 前端服务
npm run dev
```

### 代码规范

- 使用 ESLint 和 Prettier 格式化代码
- 遵循组件化开发原则
- 添加适当的错误处理和日志
- Python 代码遵循 PEP 8 规范

## 📄 许可证

本项目使用 MIT 许可证，详见 LICENSE 文件。

## 🆘 技术支持

遇到问题或需要帮助：

1. 查阅本文档的故障排除部分
2. 检查系统日志和错误信息
3. 确认所有依赖服务正常运行
4. 查看项目 GitHub Issues
