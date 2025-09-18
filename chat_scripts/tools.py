#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
LangChain 工具封装模块
将单细胞数据分析功能封装为LangChain工具，供Agent智能调用
"""

import sys
import json
import traceback
from pathlib import Path
from typing import Optional, Dict, Any, Union
from langchain.tools import tool

# 导入单细胞处理器
from .single_cell_processor import OptimizedSingleCellProcessor


@tool
def umap_analysis(file_path: str, color_by: str = "cluster") -> str:
    """
    对单细胞数据执行UMAP降维分析和可视化

    这个工具可以：
    1. 加载H5AD格式的单细胞数据文件
    2. 执行UMAP降维分析
    3. 根据指定的颜色编码方式进行可视化
    4. 返回可视化数据用于前端展示

    Args:
        file_path (str): H5AD数据文件的完整路径
        color_by (str): 用于着色的变量名，默认为"cluster"
                       常用选项包括: "cluster", "cell_type", "leiden", "louvain"

    Returns:
        str: JSON格式的分析结果，包含UMAP坐标和可视化数据

    示例用法:
        - "对这个数据进行UMAP降维分析"
        - "做个UMAP图，按cluster着色"
        - "用UMAP可视化这些细胞"
    """
    try:
        print(f"🧬 开始UMAP分析: {file_path}", file=sys.stderr)

        # 创建处理器实例
        processor = OptimizedSingleCellProcessor()

        # 执行UMAP分析
        result = processor.process_h5ad(
            h5ad_input=file_path, reduction_method="umap", color_by=color_by
        )

        print(f"✅ UMAP分析完成", file=sys.stderr)

        # 返回JSON字符串
        return json.dumps(result, ensure_ascii=False, indent=2)

    except Exception as e:
        error_msg = f"UMAP分析失败: {str(e)}"
        print(f"❌ {error_msg}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)

        return json.dumps(
            {"success": False, "error": error_msg, "details": str(e)},
            ensure_ascii=False,
        )


@tool
def tsne_analysis(file_path: str, color_by: str = "cluster") -> str:
    """
    对单细胞数据执行t-SNE降维分析和可视化

    这个工具可以：
    1. 加载H5AD格式的单细胞数据文件
    2. 执行t-SNE降维分析
    3. 根据指定的颜色编码方式进行可视化
    4. 返回可视化数据用于前端展示

    Args:
        file_path (str): H5AD数据文件的完整路径
        color_by (str): 用于着色的变量名，默认为"cluster"

    Returns:
        str: JSON格式的分析结果，包含t-SNE坐标和可视化数据

    示例用法:
        - "用t-SNE分析这个数据"
        - "做个tsne图"
        - "t-SNE降维可视化"
    """
    try:
        print(f"🧬 开始t-SNE分析: {file_path}", file=sys.stderr)

        # 创建处理器实例
        processor = OptimizedSingleCellProcessor()

        # 执行t-SNE分析
        result = processor.process_h5ad(
            h5ad_input=file_path, reduction_method="tsne", color_by=color_by
        )

        print(f"✅ t-SNE分析完成", file=sys.stderr)

        # 返回JSON字符串
        return json.dumps(result, ensure_ascii=False, indent=2)

    except Exception as e:
        error_msg = f"t-SNE分析失败: {str(e)}"
        print(f"❌ {error_msg}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)

        return json.dumps(
            {"success": False, "error": error_msg, "details": str(e)},
            ensure_ascii=False,
        )


@tool
def summarize_h5ad_data(file_path: str) -> str:
    """
    获取H5AD单细胞数据文件的详细摘要信息

    这个工具可以：
    1. 读取H5AD数据文件
    2. 提取基本统计信息（细胞数、基因数等）
    3. 分析数据质量指标
    4. 检查可用的元数据列
    5. 返回易于理解的数据摘要

    Args:
        file_path (str): H5AD数据文件的完整路径

    Returns:
        str: JSON格式的数据摘要，包含所有关键统计信息

    示例用法:
        - "这个文件里有多少细胞？"
        - "分析一下数据的基本信息"
        - "数据摘要"
        - "告诉我这个数据集的基本情况"
    """
    try:
        print(f"📊 开始数据摘要分析: {file_path}", file=sys.stderr)

        # 创建处理器实例
        processor = OptimizedSingleCellProcessor()

        # 获取数据摘要
        summary = processor.get_data_summary(file_path)

        print(f"✅ 数据摘要分析完成", file=sys.stderr)

        # 返回JSON字符串
        return json.dumps(summary, ensure_ascii=False, indent=2)

    except Exception as e:
        error_msg = f"数据摘要分析失败: {str(e)}"
        print(f"❌ {error_msg}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)

        return json.dumps(
            {"success": False, "error": error_msg, "details": str(e)},
            ensure_ascii=False,
        )


@tool
def pca_analysis(file_path: str, color_by: str = "cluster") -> str:
    """
    对单细胞数据执行PCA主成分分析和可视化

    这个工具可以：
    1. 加载H5AD格式的单细胞数据文件
    2. 执行PCA主成分分析
    3. 根据指定的颜色编码方式进行可视化
    4. 返回可视化数据用于前端展示

    Args:
        file_path (str): H5AD数据文件的完整路径
        color_by (str): 用于着色的变量名，默认为"cluster"

    Returns:
        str: JSON格式的分析结果，包含PCA坐标和可视化数据

    示例用法:
        - "用PCA分析这个数据"
        - "做个主成分分析"
        - "PCA降维可视化"
    """
    try:
        print(f"🧬 开始PCA分析: {file_path}", file=sys.stderr)

        # 创建处理器实例
        processor = OptimizedSingleCellProcessor()

        # 执行PCA分析
        result = processor.process_h5ad(
            h5ad_input=file_path, reduction_method="pca", color_by=color_by
        )

        print(f"✅ PCA分析完成", file=sys.stderr)

        # 返回JSON字符串
        return json.dumps(result, ensure_ascii=False, indent=2)

    except Exception as e:
        error_msg = f"PCA分析失败: {str(e)}"
        print(f"❌ {error_msg}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)

        return json.dumps(
            {"success": False, "error": error_msg, "details": str(e)},
            ensure_ascii=False,
        )


# 导出所有可用工具
available_tools = [umap_analysis, tsne_analysis, summarize_h5ad_data, pca_analysis]

# 工具名称到函数的映射（方便调试）
tool_registry = {
    "umap_analysis": umap_analysis,
    "tsne_analysis": tsne_analysis,
    "summarize_h5ad_data": summarize_h5ad_data,
    "pca_analysis": pca_analysis,
}

if __name__ == "__main__":
    """
    测试工具功能
    """
    print("🧪 LangChain 工具测试", file=sys.stderr)
    print(f"可用工具数量: {len(available_tools)}", file=sys.stderr)

    for tool in available_tools:
        print(f"  - {tool.name}: {tool.description.split('.')[0]}...", file=sys.stderr)

    # 如果提供了测试文件路径，进行简单测试
    if len(sys.argv) > 1:
        test_file = sys.argv[1]
        print(f"\n🧪 测试文件: {test_file}", file=sys.stderr)

        # 测试数据摘要
        print("\n📊 测试数据摘要:", file=sys.stderr)
        try:
            summary_result = summarize_h5ad_data.invoke({"file_path": test_file})
            result_preview = (
                summary_result[:200] + "..."
                if len(summary_result) > 200
                else summary_result
            )
            print(result_preview, file=sys.stderr)
        except Exception as e:
            print(f"测试失败: {e}", file=sys.stderr)
