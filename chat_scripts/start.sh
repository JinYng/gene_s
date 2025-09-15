#!/bin/bash
# Chat服务器启动脚本 (Unix/Linux/macOS)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 启动Chat专用Python服务器..."
echo "📍 服务器地址: http://localhost:8001"
echo "📁 日志文件: server.log"

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3未安装"
    exit 1
fi

python_version=$(python3 --version 2>&1)
echo "✅ Python版本: $python_version"

# 安装依赖
echo "📦 安装Chat依赖..."
pip3 install -r requirements.txt

# 启动服务器
echo "🚀 启动Chat服务器..."
python3 -m uvicorn chat_scripts.main:app --reload --host 0.0.0.0 --port 8001 --log-level info 2>&1 | tee server.log