@echo off
chcp 65001

cd /d "%~dp0"

echo 正在启动Chat专用Python服务器...
echo 服务器地址: http://localhost:8001
echo 日志文件: server.log

REM 检查Python环境
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python未安装或未正确配置
    pause
    exit /b 1
)

echo 📦 安装Chat依赖...
pip install -r requirements.txt

echo 🚀 启动Chat服务器...
python -m uvicorn chat_scripts.main:app --reload --host 0.0.0.0 --port 8001 --log-level info 2>&1 | findstr /v "GET / HTTP" | findstr /v "GET /docs" | findstr /v "GET /openapi.json" > server.log

pause