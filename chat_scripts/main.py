#!/usr/bin/env python3
"""
Chat专用FastAPI服务器
提供BioChat界面的后端API服务
"""

import os
import sys
import json
import tempfile
import subprocess
from pathlib import Path
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# 确保项目根目录在 sys.path 中
project_root = str(Path(__file__).parent.parent)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

app = FastAPI(title="Chat API Server", description="BioChat专用API服务")

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 数据模型
class ChatRequest(BaseModel):
    query: str
    file_path: Optional[str] = None
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    success: bool
    data: dict
    message: str = ""


class HealthResponse(BaseModel):
    status: str
    timestamp: str


# 全局变量
CHAT_AGENT_PATH = str(Path(__file__).parent / "agent_executor.py")


# 路由定义
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """健康检查接口"""
    import datetime

    return HealthResponse(
        status="healthy", timestamp=datetime.datetime.now().isoformat()
    )


@app.post("/analyze", response_model=ChatResponse)
async def analyze_with_chat(request: ChatRequest):
    """Chat智能分析接口"""
    try:
        # 构建命令参数
        cmd = [sys.executable, CHAT_AGENT_PATH, "--query", request.query]

        if request.file_path:
            cmd.extend(["--file-path", request.file_path])

        if request.session_id:
            cmd.extend(["--session-id", request.session_id])

        print(f"DEBUG: Executing command: {' '.join(cmd)}", file=sys.stderr)

        # 执行命令
        process = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=120,
            cwd=project_root,
            encoding="utf-8",
            errors="replace",  # 处理编码错误
        )

        print(f"DEBUG: Process return code: {process.returncode}", file=sys.stderr)
        print(f"DEBUG: Process stdout: {process.stdout}", file=sys.stderr)
        if process.stderr:
            print(f"DEBUG: Process stderr: {process.stderr}", file=sys.stderr)

        if process.returncode != 0:
            error_msg = process.stderr or "未知错误"
            raise HTTPException(status_code=500, detail=f"分析失败: {error_msg}")

        # 解析结果
        try:
            # 检查stdout是否为空
            if not process.stdout or process.stdout.strip() == "":
                print(f"DEBUG: Empty stdout from Python process", file=sys.stderr)
                return ChatResponse(
                    success=False,
                    data={},
                    message="Python进程没有返回任何输出，可能是分析过程中出现了错误",
                )

            result = json.loads(process.stdout)
            # 确保message字段不为None
            error_msg = result.get("error") or result.get("message") or ""
            return ChatResponse(
                success=result.get("success", False),
                data=result.get("data", {}),
                message=error_msg,
            )
        except json.JSONDecodeError as e:
            print(f"DEBUG: JSON decode error: {e}", file=sys.stderr)
            print(f"DEBUG: Raw stdout: {process.stdout}", file=sys.stderr)
            return ChatResponse(
                success=False, data={}, message=f"返回结果格式错误: {e}"
            )

    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="分析超时 (超过120秒)")
    except Exception as e:
        print(f"DEBUG: Unexpected error: {e}", file=sys.stderr)
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")


@app.post("/chat", response_model=ChatResponse)
async def general_chat(request: ChatRequest):
    """一般聊天接口"""
    try:
        # 构建命令参数
        cmd = [sys.executable, CHAT_AGENT_PATH, "--query", request.query]

        # 执行命令
        process = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=30,
            cwd=project_root,
            encoding="utf-8",
            errors="replace",  # 处理编码错误
        )

        if process.returncode != 0:
            error_msg = process.stderr or "未知错误"
            return ChatResponse(
                success=False, data={}, message=f"聊天处理失败: {error_msg}"
            )

        # 解析结果
        try:
            result = json.loads(process.stdout)
            # 确保message字段不为None
            error_msg = result.get("error") or result.get("message") or ""
            return ChatResponse(
                success=result.get("success", False),
                data=result.get("data", {}),
                message=error_msg,
            )
        except json.JSONDecodeError:
            return ChatResponse(success=False, data={}, message="返回结果格式错误")

    except Exception as e:
        return ChatResponse(success=False, data={}, message=str(e))


# 启动函数
def start_server():
    """启动服务器"""
    uvicorn.run(
        "chat_scripts.main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info",
    )


if __name__ == "__main__":
    start_server()
