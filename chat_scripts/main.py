#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Chat专用FastAPI服务器
提供BioChat界面的后端API服务 - 使用LangChain Agent架构
"""

import os
import sys
import json
import traceback
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# 确保项目根目录在 sys.path 中
project_root = str(Path(__file__).parent.parent)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# 导入我们的Agent执行器
from .agent_executor import run_analysis

app = FastAPI(title="Single Cell Analysis API", description="基于LangChain Agent的单细胞分析API服务")

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
    message: str
    agent_ready: bool


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """健康检查端点"""
    try:
        # 尝试获取Agent实例来验证系统是否就绪
        from agent_executor import get_agent_instance
        agent = get_agent_instance()

        return HealthResponse(
            status="healthy",
            message="FastAPI服务和LangChain Agent都已就绪",
            agent_ready=True
        )
    except Exception as e:
        return HealthResponse(
            status="degraded",
            message=f"Agent初始化失败: {str(e)}",
            agent_ready=False
        )


@app.post("/analyze", response_model=ChatResponse)
async def analyze_with_agent(request: ChatRequest):
    """
    使用LangChain Agent进行智能分析
    这是新的、简化的分析端点，完全基于Agent架构
    """
    try:
        print(f"🚀 收到分析请求: {request.query}", file=sys.stderr)
        print(f"📁 文件路径: {request.file_path}", file=sys.stderr)

        # 验证请求
        if not request.query.strip():
            raise HTTPException(status_code=400, detail="查询内容不能为空")

        if not request.file_path:
            raise HTTPException(status_code=400, detail="必须提供数据文件路径")

        # 检查文件是否存在
        if not os.path.exists(request.file_path):
            raise HTTPException(status_code=404, detail=f"数据文件不存在: {request.file_path}")

        # 直接调用Agent执行分析
        print(f"🤖 调用LangChain Agent执行分析...", file=sys.stderr)
        analysis_result = run_analysis(
            query=request.query,
            file_path=request.file_path
        )

        print(f"✅ Agent分析完成", file=sys.stderr)

        # 返回结果
        return ChatResponse(
            success=analysis_result.get("success", True),
            data=analysis_result.get("data", {}),
            message=analysis_result.get("message", "分析完成")
        )

    except HTTPException:
        # 重新抛出HTTP异常
        raise
    except Exception as e:
        error_msg = f"分析过程中发生错误: {str(e)}"
        print(f"❌ {error_msg}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)

        return ChatResponse(
            success=False,
            data={},
            message=error_msg
        )


@app.post("/chat", response_model=ChatResponse)
async def chat_with_agent(request: ChatRequest):
    """
    通用聊天接口
    当没有文件路径时可以用于一般性查询
    """
    try:
        print(f"💬 收到聊天请求: {request.query}", file=sys.stderr)

        # 验证请求
        if not request.query.strip():
            raise HTTPException(status_code=400, detail="查询内容不能为空")

        # 如果有文件路径，转发到分析端点
        if request.file_path and os.path.exists(request.file_path):
            return await analyze_with_agent(request)

        # 一般性查询响应
        response_message = f"""
感谢您的查询: {request.query}

我是单细胞转录组数据分析助手。要进行数据分析，请：
1. 上传您的H5AD格式数据文件
2. 使用分析接口 (/analyze) 并提供具体的分析需求

我可以帮助您进行：
- UMAP降维分析和可视化
- t-SNE降维分析
- PCA主成分分析
- 数据摘要和基本统计

请上传数据文件并告诉我您想要进行什么类型的分析！
"""

        return ChatResponse(
            success=True,
            data={"response_type": "general_chat"},
            message=response_message
        )

    except Exception as e:
        error_msg = f"处理聊天请求时发生错误: {str(e)}"
        print(f"❌ {error_msg}", file=sys.stderr)

        return ChatResponse(
            success=False,
            data={},
            message=error_msg
        )


@app.get("/")
async def root():
    """根路径"""
    return {
        "service": "Single Cell Analysis API",
        "version": "2.0.0",
        "description": "基于LangChain Agent的智能单细胞数据分析服务",
        "endpoints": {
            "health": "/health",
            "analyze": "/analyze",
            "chat": "/chat"
        },
        "features": [
            "智能自然语言理解",
            "多种降维分析方法",
            "数据摘要和统计",
            "可视化数据生成"
        ]
    }


if __name__ == "__main__":
    print("启动Single Cell Analysis API服务器...", file=sys.stderr)
    print("使用LangChain Agent架构", file=sys.stderr)
    print("监听端口: 8001", file=sys.stderr)

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001,
        log_level="info"
    )