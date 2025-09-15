# 🚀 快速入门指南

## 📋 启动清单

### 1. 确认环境 ✅

- [x] Python 3.10+ (conda 环境: bio)
- [x] Node.js 16+
- [x] Ollama 已安装
- [x] gemma3:4b 模型已下载

### 2. 启动服务 (按顺序)

#### 步骤 1: 启动 Ollama 服务

```bash
ollama serve
```

✅ 看到 `Listening on 127.0.0.1:11434` 表示成功

#### 步骤 2: 启动开发服务器

```bash
npm run dev
```

✅ 访问 http://localhost:3000

## 🎯 5 分钟体验

### 🗣️ 试试对话功能

1. 打开网页，确保 **关闭** "使用工作流"
2. 输入: "你好，介绍一下单细胞测序"
3. 🎉 享受 AI 对话

### 🔬 试试数据分析

1. **开启** "使用工作流" 开关
2. 上传示例文件: `sample_data/processed_data.h5ad`
3. 输入: "对这个数据进行 UMAP 降维分析"
4. 🎉 查看可视化结果

## ⚡ 常用命令

```bash
# 检查Ollama模型
ollama list

# 重启Ollama服务
# Ctrl+C 停止，然后重新运行
ollama serve

# 检查Python环境
conda activate bio
python -c "import scanpy, langchain; print('环境OK')"

# 重启开发服务器
# Ctrl+C 停止，然后重新运行
npm run dev
```

## 🆘 遇到问题？

| 问题               | 快速解决                                  |
| ------------------ | ----------------------------------------- |
| 🔴 ECONNREFUSED    | 运行 `ollama serve`                       |
| 🔴 Python 模块缺失 | `conda activate bio` + `pip install 包名` |
| 🔴 文件上传失败    | 确认文件<50MB，格式为 h5ad/csv/tsv        |
| 🔴 分析卡住        | 检查终端错误信息，重启服务                |

## 💡 使用技巧

### 对话模式技巧

- 关键词: "什么是"、"如何"、"区别"、"建议"
- 示例: "UMAP 和 t-SNE 的区别是什么？"

### 分析模式技巧

- 关键词: "分析"、"降维"、"聚类"、"可视化"
- 示例: "查看数据摘要"、"进行 t-SNE 分析"

---

🎯 **目标**: 让 AI 助手帮您轻松分析单细胞数据！
