#!/usr/bin/env python3
"""
Chat专用LangChain智能代理
用于处理BioChat界面的自然语言查询和智能分析
"""

import os
import sys
import json
import argparse
import subprocess
from pathlib import Path

# 导入统一错误处理
from error_handler import (
    ErrorHandler,
    AnalysisError,
    create_llm_error,
    create_analysis_error,
    handle_errors,
)

# 确保项目根目录在 sys.path 中
project_root = str(Path(__file__).parent.parent)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from langchain_core.prompts import ChatPromptTemplate

try:
    from pydantic.v1 import BaseModel, Field
except ImportError:
    from langchain_core.pydantic_v1 import BaseModel, Field
from langchain_community.chat_models import ChatOllama
from langchain_core.output_parsers import JsonOutputParser

print(f"DEBUG: Chat agent_executor.py started.", file=sys.stderr)
print(f"DEBUG: Project root: {project_root}", file=sys.stderr)


# --- Pydantic 模型定义 ---
class Action(BaseModel):
    """根据用户意图选择要执行的动作"""

    action_type: str = Field(
        description="要执行的动作类型: 'single_cell_analysis', 'convert_matrix' 或 'general_chat'"
    )
    arguments: dict = Field(description="所选动作的参数")


# --- LangChain 组件 ---
def get_llm():
    """初始化并返回 ChatOllama 实例"""
    return ChatOllama(model="gemma3:4b", temperature=0)


def get_parser():
    """初始化并返回 JSON 解析器"""
    return JsonOutputParser(pydantic_object=Action)


def get_prompt_template():
    """创建并返回简化的聊天提示模板"""
    return ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """
You are a single-cell data analysis assistant. Parse user requests into JSON format.

Available actions:
1. "single_cell_analysis" - for data analysis (UMAP, t-SNE, PCA, clustering)
2. "convert_matrix" - for file format conversion to H5AD
3. "general_chat" - for questions and general conversation

When user says things like:
- "进行UMAP降维分析" → single_cell_analysis with method="umap"  
- "对数据进行聚类" → single_cell_analysis with method="clustering"
- "转换成H5AD格式" → convert_matrix
- "你好" → general_chat with input field

ALWAYS respond with valid JSON in this exact format:

For analysis:
{{
    "action_type": "single_cell_analysis",
    "arguments": {{
        "method": "umap",
        "output_path": "output/umap_result.png",
        "params": {{}}
    }}
}}

For general chat:
{{
    "action_type": "general_chat",
    "arguments": {{
        "input": "user's original message"
    }}
}}

{format_instructions}
""",
            ),
            ("human", "User request: {query}"),
        ]
    )


# --- 核心功能 ---
def analyze_user_intent(query: str):
    """使用 LLM 分析用户意图并返回 JSON 格式的动作"""
    try:
        print(f"DEBUG: Starting intent analysis for query: '{query}'", file=sys.stderr)

        prompt = get_prompt_template()
        parser = get_parser()
        llm = get_llm()

        print(f"DEBUG: LLM model: {llm.model}", file=sys.stderr)

        # 先尝试直接调用LLM，不使用解析器
        messages = prompt.format_messages(
            query=query, format_instructions=parser.get_format_instructions()
        )

        print(
            f"DEBUG: Formatted prompt messages: {len(messages)} messages",
            file=sys.stderr,
        )

        # 调用LLM
        raw_response = llm.invoke(messages)
        print(f"DEBUG: Raw LLM response: {raw_response.content}", file=sys.stderr)

        # 尝试解析JSON
        try:
            # 清理响应内容，移除可能的markdown代码块
            content = raw_response.content.strip()
            if content.startswith("```json"):
                content = content[7:]  # 移除```json
            if content.endswith("```"):
                content = content[:-3]  # 移除```
            content = content.strip()

            result = json.loads(content)
            print(f"DEBUG: Successfully parsed JSON: {result}", file=sys.stderr)
            return result

        except json.JSONDecodeError as e:
            print(f"DEBUG: JSON decode failed: {e}", file=sys.stderr)
            print(f"DEBUG: Attempting to extract JSON from response", file=sys.stderr)

            # 使用统一错误处理记录JSON解析错误
            ErrorHandler.log_error(
                e, {"llm_operation": True, "response_content": content}
            )

            # 尝试基于关键词的简单规则匹配作为fallback
            query_lower = query.lower()
            if any(
                keyword in query_lower
                for keyword in ["umap", "降维", "dimensionality reduction"]
            ):
                fallback_result = {
                    "action_type": "single_cell_analysis",
                    "arguments": {
                        "method": "umap",
                        "output_path": "output/umap_analysis.png",
                        "params": {},
                    },
                }
                print(
                    f"DEBUG: Using fallback result for UMAP: {fallback_result}",
                    file=sys.stderr,
                )
                return fallback_result

            elif any(
                keyword in query_lower for keyword in ["聚类", "cluster", "clustering"]
            ):
                fallback_result = {
                    "action_type": "single_cell_analysis",
                    "arguments": {
                        "method": "clustering",
                        "output_path": "output/clustering_analysis.png",
                        "params": {},
                    },
                }
                print(
                    f"DEBUG: Using fallback result for clustering: {fallback_result}",
                    file=sys.stderr,
                )
                return fallback_result

            else:
                fallback_result = {
                    "action_type": "general_chat",
                    "arguments": {"input": query},
                }
                print(
                    f"DEBUG: Using fallback result for general chat: {fallback_result}",
                    file=sys.stderr,
                )
                return fallback_result

    except Exception as e:
        # 使用统一错误处理
        ErrorHandler.log_error(e, {"llm_operation": True, "query": query})

        # 返回一个默认的fallback结果而不是None
        fallback_result = {
            "action_type": "general_chat",
            "arguments": {"input": "分析过程中出现错误，请检查输入数据和系统配置"},
        }
        print(f"DEBUG: Using error fallback result: {fallback_result}", file=sys.stderr)
        return fallback_result


def execute_action(action: dict, file_path: str = None):
    """执行指定的动作"""
    action_type = action.get("action_type")
    arguments = action.get("arguments")

    print(f"DEBUG: Executing {action_type} with args: {arguments}", file=sys.stderr)

    if action_type == "single_cell_analysis":
        # 使用analysis_scripts中的处理器
        script_path = str(
            Path(project_root) / "chat_scripts" / "single_cell_processor.py"
        )

        # 如果没有提供文件路径，使用参数中的文件路径
        if not file_path:
            file_path = arguments.get("file_path", "")

        # 确保文件路径不为空
        if not file_path:
            return {
                "success": False,
                "error": "未提供数据文件路径",
                "action_type": "analysis",
            }

        # 根据文件类型选择命令
        if file_path.endswith(".h5ad"):
            args = [
                sys.executable,
                script_path,
                "process_h5ad",
                file_path,
                "none",  # metadata_file (不需要)
                str(arguments.get("method", "umap")),
                "cluster",  # color_by (默认使用cluster)
            ]
        else:
            # CSV/TSV文件
            args = [
                sys.executable,
                script_path,
                "convert_to_h5ad_and_process",
                file_path,
                "none",  # metadata_file (可选)
                str(arguments.get("method", "umap")),
                "cluster",  # color_by (默认使用cluster)
            ]

        print(f"DEBUG: Running: {' '.join(args)}", file=sys.stderr)

        try:
            # 设置环境变量确保UTF-8编码
            env = os.environ.copy()
            env["PYTHONIOENCODING"] = "utf-8"

            process = subprocess.run(
                args,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="ignore",  # 忽略编码错误
                timeout=120,
                env=env,
            )
            stdout, stderr = process.stdout, process.stderr

            if process.returncode == 0:
                # 提取JSON数据 - single_cell_processor输出格式为 === PLOT_DATA_START === {json} === PLOT_DATA_END ===
                json_data = None
                if (
                    "=== PLOT_DATA_START ===" in stdout
                    and "=== PLOT_DATA_END ===" in stdout
                ):
                    start_marker = "=== PLOT_DATA_START ==="
                    end_marker = "=== PLOT_DATA_END ==="
                    start_idx = stdout.find(start_marker) + len(start_marker)
                    end_idx = stdout.find(end_marker)
                    json_str = stdout[start_idx:end_idx].strip()
                    try:
                        result_data = json.loads(json_str)
                        json_data = result_data
                    except json.JSONDecodeError as e:
                        print(
                            f"DEBUG: Failed to parse extracted JSON: {e}",
                            file=sys.stderr,
                        )
                        print(
                            f"DEBUG: Extracted JSON string (first 500 chars): {json_str[:500]}",
                            file=sys.stderr,
                        )
                        return {
                            "success": False,
                            "error": f"JSON解析失败: {e}",
                            "action_type": "analysis",
                        }
                else:
                    # 尝试直接解析整个stdout作为JSON（向后兼容）
                    try:
                        result_data = json.loads(stdout)
                        json_data = result_data
                    except json.JSONDecodeError as e:
                        print(
                            f"DEBUG: No JSON markers found and direct parsing failed: {e}",
                            file=sys.stderr,
                        )
                        print(
                            f"DEBUG: Raw stdout (first 500 chars): {stdout[:500]}",
                            file=sys.stderr,
                        )
                        return {
                            "success": False,
                            "error": f"无法解析分析结果: {e}",
                            "action_type": "analysis",
                        }

                # 检查single_cell_processor的返回结果
                if isinstance(json_data, dict) and json_data.get("success") == False:
                    # 如果single_cell_processor返回了错误，传递错误信息
                    return {
                        "success": False,
                        "error": json_data.get("error", "分析过程中出现未知错误"),
                        "action_type": "analysis",
                    }
                else:
                    # 成功情况
                    return {
                        "success": True,
                        "data": json_data,
                        "action_type": "analysis",
                    }
            else:
                error_msg = stderr or "分析进程执行失败，未返回错误信息"
                return {"success": False, "error": error_msg, "action_type": "analysis"}
        except Exception as e:
            # 使用统一错误处理
            handled_error = ErrorHandler.handle_analysis_error(
                e, "single_cell_analysis"
            )
            return handled_error.to_dict()

    elif action_type == "convert_matrix":
        # 使用chat_scripts中的转换器
        script_path = str(Path(project_root) / "chat_scripts" / "matrix_converter.py")

        # 如果没有提供文件路径，使用参数中的文件路径
        if not file_path:
            file_path = arguments.get("input_file", "")

        # 确保文件路径不为空
        if not file_path:
            return {
                "success": False,
                "error": "未提供输入文件路径",
                "action_type": "conversion",
            }

        args = [
            sys.executable,
            script_path,
            "convert",
            "--input",
            file_path,
            "--output",
            str(arguments.get("output_file", "output/converted_file.h5ad")),
            "--format",
            str(arguments.get("format", "csv")),
        ]

        if "metadata_file" in arguments:
            args.extend(["--metadata", str(arguments["metadata_file"])])

        print(f"DEBUG: Running: {' '.join(args)}", file=sys.stderr)

        try:
            process = subprocess.Popen(
                args,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                encoding="utf-8",
                errors="replace",  # 处理编码错误
            )
            stdout, stderr = process.communicate()

            if process.returncode == 0:
                result_data = json.loads(stdout)
                # 检查转换器的返回结果
                if (
                    isinstance(result_data, dict)
                    and result_data.get("success") == False
                ):
                    # 如果转换器返回了错误，传递错误信息
                    return {
                        "success": False,
                        "error": result_data.get("error", "转换过程中出现未知错误"),
                        "action_type": "conversion",
                    }
                else:
                    # 成功情况
                    return {
                        "success": True,
                        "data": result_data,
                        "action_type": "conversion",
                    }
            else:
                error_msg = stderr or "转换进程执行失败，未返回错误信息"
                return {
                    "success": False,
                    "error": error_msg,
                    "action_type": "conversion",
                }
        except Exception as e:
            # 使用统一错误处理
            handled_error = ErrorHandler.handle_analysis_error(e, "matrix_conversion")
            return handled_error.to_dict()

    elif action_type == "general_chat":
        # 处理一般聊天，确保有input字段
        user_input = arguments.get("input", "用户进行了一般性对话")
        return {
            "success": True,
            "data": {"response": f"收到您的消息：{user_input}"},
            "action_type": "chat",
        }

    else:
        return {
            "success": False,
            "error": f"Unknown action type: {action_type}",
            "action_type": "error",
        }


# --- 主函数 ---
def main():
    """主函数 - 用于命令行调用"""
    parser = argparse.ArgumentParser(description="Chat智能分析代理")
    parser.add_argument("--query", required=True, help="用户查询")
    parser.add_argument("--file-path", help="数据文件路径")
    parser.add_argument("--session-id", help="会话ID")

    args = parser.parse_args()

    try:
        # 分析用户意图
        action = analyze_user_intent(args.query)
        if not action:
            error_result = {
                "success": False,
                "error": "无法分析用户意图",
                "data": {},
                "action_type": "error",
            }
            print(json.dumps(error_result, ensure_ascii=False))
            return

        # 执行动作，传递文件路径
        result = execute_action(action, args.file_path)

        # 确保结果包含必要的字段
        if not isinstance(result, dict):
            result = {"success": False, "error": "执行结果格式错误", "data": {}}

        # 确保包含success字段
        if "success" not in result:
            result["success"] = False

        print(json.dumps(result, ensure_ascii=False))

    except Exception as e:
        # 使用统一错误处理
        ErrorHandler.print_error_json(
            e, {"function": "main", "include_traceback": True}
        )


if __name__ == "__main__":
    main()
