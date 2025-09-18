#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LangChain Agent执行器 - ChatOllama兼容版本
使用对话式工具选择替代tool calling，实现与ChatOllama的兼容性
"""

import os
import sys
import json
import re
import argparse
import traceback
from pathlib import Path
from typing import Optional, Dict, Any, List

# LangChain imports
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

# 导入我们的工具
from .tools import available_tools, tool_registry

# 导入统一错误处理
try:
    from error_handler import ErrorHandler, AnalysisError, create_analysis_error
except ImportError:
    print("警告: error_handler 模块不可用，将使用简单错误处理", file=sys.stderr)
    ErrorHandler = None


class SingleCellAnalysisAgent:
    """基于ChatOllama的单细胞分析智能代理（兼容版本）"""

    def __init__(self, model_name: str = "gemma3:4b", base_url: str = "http://localhost:11434"):
        """
        初始化Agent

        Args:
            model_name: Ollama模型名称
            base_url: Ollama服务URL
        """
        self.model_name = model_name
        self.base_url = base_url

        # 初始化LLM
        print(f"初始化ChatOllama: {model_name}", file=sys.stderr)
        self.llm = ChatOllama(
            model=model_name,
            base_url=base_url,
            temperature=0.1,  # 较低温度确保一致性
        )

        # 创建系统提示
        self.system_prompt = """你是一个专业的单细胞转录组数据分析助手。你可以使用以下工具：

可用工具：
1. summarize_h5ad_data - 获取H5AD数据文件的基本信息和统计摘要
2. umap_analysis - 执行UMAP降维分析，生成2D可视化散点图
3. tsne_analysis - 执行t-SNE降维分析，生成2D可视化散点图
4. pca_analysis - 执行PCA主成分分析，生成2D可视化散点图

工具选择指南：
- 如果用户询问数据基本信息、细胞数量、基因数量等，使用 summarize_h5ad_data
- 如果用户要求UMAP分析或UMAP可视化，使用 umap_analysis
- 如果用户要求t-SNE分析或t-SNE可视化，使用 tsne_analysis
- 如果用户要求PCA分析或PCA可视化，使用 pca_analysis

请根据用户查询，选择最合适的工具。回复格式：
TOOL_CALL: [工具名称]
PARAMETERS: {"file_path": "文件路径", "color_by": "着色方式"}

例如：
TOOL_CALL: umap_analysis
PARAMETERS: {"file_path": "/path/to/data.h5ad", "color_by": "cluster"}"""

        print(f"SingleCellAnalysisAgent 初始化完成", file=sys.stderr)
        print(f"   - 模型: {model_name}", file=sys.stderr)
        print(f"   - 可用工具: {len(available_tools)}个", file=sys.stderr)

    def analyze(self, query: str, file_path: str) -> Dict[str, Any]:
        """
        执行分析任务

        Args:
            query: 用户的自然语言查询
            file_path: 数据文件路径

        Returns:
            分析结果字典
        """
        try:
            print(f"Agent开始分析: {query}", file=sys.stderr)
            print(f"数据文件: {file_path}", file=sys.stderr)

            # 构建对话消息
            messages = [
                SystemMessage(content=self.system_prompt),
                HumanMessage(content=f"""
用户查询: {query}
数据文件路径: {file_path}

请分析用户需求，选择合适的工具处理这个H5AD格式的单细胞数据文件。
""")
            ]

            # 调用LLM获取工具选择
            response = self.llm.invoke(messages)
            llm_output = response.content

            print(f"LLM响应: {llm_output}", file=sys.stderr)

            # 解析工具调用
            tool_name, parameters = self._parse_tool_call(llm_output, file_path)

            if tool_name and tool_name in tool_registry:
                print(f"执行工具: {tool_name}, 参数: {parameters}", file=sys.stderr)

                # 调用工具
                tool_func = tool_registry[tool_name]
                tool_result = tool_func.invoke(parameters)

                # 解析工具结果
                return self._parse_tool_result(tool_result)
            else:
                return {
                    "success": False,
                    "data": {},
                    "message": f"无法识别合适的工具，LLM输出: {llm_output}"
                }

        except Exception as e:
            error_msg = f"Agent分析失败: {str(e)}"
            print(f"❌ {error_msg}", file=sys.stderr)
            traceback.print_exc(file=sys.stderr)

            return {
                "success": False,
                "data": {},
                "message": error_msg
            }

    def _parse_tool_call(self, llm_output: str, file_path: str) -> tuple[Optional[str], Dict[str, Any]]:
        """
        解析LLM输出中的工具调用

        Args:
            llm_output: LLM的输出文本
            file_path: 数据文件路径

        Returns:
            (工具名称, 参数字典)
        """
        try:
            # 查找TOOL_CALL和PARAMETERS
            tool_pattern = r'TOOL_CALL:\s*(\w+)'
            param_pattern = r'PARAMETERS:\s*({.*?})'

            tool_match = re.search(tool_pattern, llm_output)
            param_match = re.search(param_pattern, llm_output, re.DOTALL)

            if tool_match:
                tool_name = tool_match.group(1).strip()

                # 解析参数
                if param_match:
                    try:
                        param_str = param_match.group(1).strip()
                        parameters = json.loads(param_str)
                    except json.JSONDecodeError:
                        print(f"参数JSON解析失败，使用默认参数", file=sys.stderr)
                        parameters = {}
                else:
                    parameters = {}

                # 确保file_path参数存在
                if 'file_path' not in parameters:
                    parameters['file_path'] = file_path

                # 为分析工具添加默认color_by参数
                if tool_name in ['umap_analysis', 'tsne_analysis', 'pca_analysis']:
                    if 'color_by' not in parameters:
                        parameters['color_by'] = 'cluster'

                return tool_name, parameters

            # 备用逻辑：基于关键词推断工具
            print("未找到明确的工具调用，使用关键词推断", file=sys.stderr)

            query_lower = llm_output.lower()
            if any(word in query_lower for word in ['umap', 'umap分析', 'umap降维']):
                return 'umap_analysis', {'file_path': file_path, 'color_by': 'cluster'}
            elif any(word in query_lower for word in ['tsne', 't-sne', 'tsne分析', 'tsne降维']):
                return 'tsne_analysis', {'file_path': file_path, 'color_by': 'cluster'}
            elif any(word in query_lower for word in ['pca', 'pca分析', '主成分分析']):
                return 'pca_analysis', {'file_path': file_path, 'color_by': 'cluster'}
            elif any(word in query_lower for word in ['摘要', '基本信息', '数据信息', '统计']):
                return 'summarize_h5ad_data', {'file_path': file_path}
            else:
                # 默认使用数据摘要工具
                return 'summarize_h5ad_data', {'file_path': file_path}

        except Exception as e:
            print(f"工具调用解析失败: {e}", file=sys.stderr)
            return None, {}

    def _parse_tool_result(self, tool_result: str) -> Dict[str, Any]:
        """
        解析工具执行结果

        Args:
            tool_result: 工具返回的JSON字符串

        Returns:
            标准化的结果字典
        """
        try:
            # 尝试解析JSON结果
            if isinstance(tool_result, str):
                result_data = json.loads(tool_result)
            else:
                result_data = tool_result

            # 检查是否有错误
            if isinstance(result_data, dict):
                if result_data.get('success') == False:
                    return {
                        "success": False,
                        "data": {},
                        "message": result_data.get('error', '工具执行失败')
                    }
                else:
                    return {
                        "success": True,
                        "data": result_data,
                        "message": "分析完成"
                    }
            else:
                return {
                    "success": True,
                    "data": {"result": result_data},
                    "message": "分析完成"
                }

        except json.JSONDecodeError as e:
            print(f"工具结果JSON解析失败: {e}", file=sys.stderr)
            return {
                "success": False,
                "data": {},
                "message": f"工具结果解析失败: {str(e)}"
            }
        except Exception as e:
            print(f"工具结果处理失败: {e}", file=sys.stderr)
            return {
                "success": False,
                "data": {},
                "message": f"工具结果处理失败: {str(e)}"
            }

    def run_analysis(self, query: str, file_path: str) -> Dict[str, Any]:
        """
        执行分析的主方法（保持向后兼容）
        """
        return self.analyze(query, file_path)


# 全局Agent实例（用于函数式接口）
_agent_instance: Optional[SingleCellAnalysisAgent] = None


def get_agent_instance() -> SingleCellAnalysisAgent:
    """
    获取全局Agent实例（单例模式）
    """
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = SingleCellAnalysisAgent()
    return _agent_instance


def run_analysis(query: str, file_path: str) -> Dict[str, Any]:
    """
    执行分析的函数式接口
    供其他模块（如FastAPI服务器）调用

    Args:
        query: 用户查询
        file_path: 数据文件路径

    Returns:
        Dict[str, Any]: 分析结果
    """
    try:
        agent = get_agent_instance()
        return agent.analyze(query, file_path)

    except Exception as e:
        error_msg = f"分析执行失败: {str(e)}"
        print(f"❌ {error_msg}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)

        return {
            "success": False,
            "data": {},
            "message": error_msg
        }


def main():
    """
    命令行接口
    """
    parser = argparse.ArgumentParser(description="单细胞数据分析智能代理")
    parser.add_argument("--query", "-q", required=True, help="分析查询")
    parser.add_argument("--file-path", "-f", required=True, help="数据文件路径")
    parser.add_argument("--model", "-m", default="gemma3:4b", help="Ollama模型名称")
    parser.add_argument("--base-url", "-u", default="http://localhost:11434", help="Ollama服务地址")

    args = parser.parse_args()

    # 创建Agent实例
    try:
        agent = SingleCellAnalysisAgent(
            model_name=args.model,
            base_url=args.base_url
        )

        # 执行分析
        result = agent.analyze(args.query, args.file_path)

        # 输出结果
        print("=== ANALYSIS_RESULT_START ===")
        print(json.dumps(result, ensure_ascii=False, indent=2))
        print("=== ANALYSIS_RESULT_END ===")

        # 退出码
        sys.exit(0 if result.get("success", False) else 1)

    except Exception as e:
        error_result = {
            "success": False,
            "error": f"Agent初始化或执行失败: {str(e)}",
            "details": str(e)
        }

        print("=== ANALYSIS_RESULT_START ===")
        print(json.dumps(error_result, ensure_ascii=False, indent=2))
        print("=== ANALYSIS_RESULT_END ===")

        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        main()
    else:
        """测试Agent功能"""
        print("测试LangChain Agent (ChatOllama兼容版本)", file=sys.stderr)

        # 测试Agent创建
        try:
            agent = get_agent_instance()
            print("✅ Agent创建成功", file=sys.stderr)

            # 简单功能测试
            print("Agent初始化完成，可以接受分析请求", file=sys.stderr)

        except Exception as e:
            print(f"❌ Agent测试失败: {e}", file=sys.stderr)
            traceback.print_exc(file=sys.stderr)