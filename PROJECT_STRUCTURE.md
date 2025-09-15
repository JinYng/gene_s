# 项目结构文档

## 目录结构

```
gene_simple/
├── 📁 analysis_scripts/          # 单细胞分析专用脚本
│   ├── single_cell_processor.py  # 核心分析处理器
│   └── matrix_to_h5ad_converter.py  # 格式转换器
│
├── 📁 chat_scripts/            # Chat专用脚本
│   ├── agent_executor.py       # LangChain智能代理
│   ├── main.py                # FastAPI服务器
│   ├── start.sh               # Unix启动脚本
│   ├── start.bat              # Windows启动脚本
│   └── server.log             # 服务器日志
│
├── 📁 scripts/                # 开发工具脚本
│   ├── cleanup.js             # 清理临时文件
│   ├── setup.js               # 环境初始化
│   └── fix-imports.js         # 导入修复
│
├── 📁 pages/                  # Next.js页面
│   └── api/                   # API接口
│       ├── chat-ollama.js     # Chat接口（调用chat_scripts）
│       ├── process-single-cell.js  # 单细胞分析接口（调用analysis_scripts）
│       └── convert-to-h5ad.js    # 格式转换接口（调用analysis_scripts）
│
├── 📁 public/                 # 静态资源
├── 📁 tmp/                    # 临时文件
├── package.json               # 项目配置
└── README.md                  # 项目说明
```

## 使用说明

### 1. 开发工具脚本
```bash
npm run setup      # 初始化环境
npm run clean      # 清理临时文件
npm run fix-imports # 修复导入问题
```

### 2. Chat服务 (完全独立)
```bash
# 启动Chat服务器
npm run chat-server     # 通用命令
npm run chat-server-win # Windows专用

# 或直接运行
python -m uvicorn chat_scripts.main:app --reload --port 8001
```

### 3. 单细胞分析服务 (可选)
单细胞分析可通过以下两种方式运行：
- **API接口**：通过Next.js API直接调用（推荐）
- **独立服务**：启动独立分析服务器

```bash
# 启动独立分析服务器
npm run analysis-server     # 通用命令
npm run analysis-server-win # Windows专用

# 或直接运行
python -m uvicorn analysis_scripts.main:app --reload --port 8002
```

## 职责分离

- **analysis_scripts/**: 专用于单细胞数据分析
- **chat_scripts/**: 专用于智能对话和AI分析
- **scripts/**: 专用于开发环境管理

## 依赖检查

运行前请确保已安装：

```bash
# Python依赖
pip install fastapi uvicorn pydantic langchain langchain-community

# Node.js依赖
npm install
```

## 端口配置

- **Next.js**: http://localhost:3000
- **Chat服务器**: http://localhost:8001
- **Ollama**: http://localhost:11434