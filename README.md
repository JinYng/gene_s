# 智能单细胞数据分析平台

本项目是一个集成 AI 代理与本地模型的单细胞转录组数据分析平台，支持自然语言交互、自动化数据处理和可视化。采用模块化架构，前后端分离，便于扩展和维护。

## 主要特性

- 支持多种单细胞数据格式（H5AD、CSV、TSV）
- UMAP 等降维分析与聚类分析
- 数据摘要与统计
- 文件格式自动转换
- 基于自然语言的智能分析与意图识别
- 交互式可视化（DeckGL、Plotly）
- 支持本地大模型（如 Ollama）与云端 LLM

## 技术架构

- 前端：Next.js 15，React 19，Tailwind CSS，DeckGL
- 后端：Python 3.8+，FastAPI，Scanpy，LangChain
- 服务层：Node.js 16+，多服务解耦
- 本地 AI：Ollama

## 目录结构说明

```
├── analysis_scripts/      # 单细胞分析相关 Python 脚本
├── chat_scripts/          # Chat/AI 相关 Python 脚本与服务
├── components/            # React 组件（analysis, chat, layout）
├── config/                # 配置文件
├── docs/                  # 项目文档
├── lib/                   # Node.js 工具库
├── pages/                 # Next.js 页面与 API 路由
├── sample_data/           # 示例数据
├── scripts/               # Node.js 辅助脚本
├── services/              # Node.js 服务层
├── styles/                # 样式文件
├── requirements.txt       # Python 主依赖
├── package.json           # Node.js 依赖与脚本
├── README.md              # 项目说明
```

## 安装与启动

### 1. 安装依赖

- Python 依赖（建议使用 Conda 环境）：

  ```sh
  conda create -n bio python=3.10
  conda activate bio
  pip install -r requirements.txt
  pip install -r chat_scripts/requirements.txt
  ```

- Node.js 依赖：

  ```sh
  npm install
  ```

### 2. 启动服务

- 启动 Python 后端（FastAPI）：

  ```sh
  npm run chat-server
  # 或手动
  python -m uvicorn chat_scripts.main:app --reload --host 0.0.0.0 --port 8001
  ```

- 启动前端（Next.js）：

  ```sh
  npm run dev
  ```

- （可选）本地大模型 Ollama：
  参考 Ollama 官方文档安装并启动。

### 3. 访问

- 前端页面：http://localhost:3000
- 后端 API：http://localhost:8001/docs

## 依赖说明

- 主要 Python 包：scanpy, pandas, numpy, matplotlib, seaborn, anndata, scikit-learn, umap-learn, langchain, fastapi, uvicorn
- 主要 Node.js 包：next, react, deck.gl, axios, react-markdown, papaparse

## 贡献指南

1. Fork 本仓库并新建分支
2. 提交 PR 前请确保通过基本测试
3. 代码需遵循模块化、注释清晰、命名规范

## 许可协议

本项目采用 MIT License。

## 联系方式

如有问题或建议，请通过 Issue 反馈。
