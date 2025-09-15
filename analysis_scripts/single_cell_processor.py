#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
优化后的单细胞转录组数据处理模块
采用最佳实践：统一转换为H5AD格式，然后进行处理
支持CSV/TSV -> H5AD -> 分析的完整流程
"""

import sys
import os
import json
import traceback
import pandas as pd
import numpy as np
import scanpy as sc
import warnings
from pathlib import Path
from typing import Optional, Any, Union
from scipy.sparse import issparse

# 导入转换器
try:
    from analysis_scripts.matrix_to_h5ad_converter import MatrixToH5adConverter

    CONVERTER_AVAILABLE = True
except ImportError:
    CONVERTER_AVAILABLE = False
    print("警告: matrix_to_h5ad_converter 模块不可用", file=sys.stderr)

# 抑制警告
warnings.filterwarnings("ignore")
sc.settings.verbosity = 0  # 最小化输出


class OptimizedSingleCellProcessor:
    """优化的单细胞数据处理器，采用最佳实践流程"""

    def __init__(self):
        self.adata: Optional[sc.AnnData] = None

    def convert_to_h5ad_and_process(
        self,
        expression_file,
        metadata_file,
        reduction_method,
        color_by,
        save_h5ad="false",
        custom_filename="",
    ):
        """
        最佳实践流程：直接在内存中转换并处理，避免中间文件。
        这确保了数据的完整性和cluster信息的正确对齐。
        """
        try:
            print(
                "=== 开始内存处理流程：CSV/TSV -> AnnData -> 分析 ===", file=sys.stderr
            )

            if not CONVERTER_AVAILABLE:
                raise ImportError("转换器模块不可用，无法执行此流程")

            # Step 1: 在内存中创建完整的AnnData对象
            print("Step 1: 加载并转换数据到内存中的AnnData对象...", file=sys.stderr)
            converter = MatrixToH5adConverter()

            # 检测文件格式
            expr_format = "tsv" if expression_file.endswith((".tsv", ".txt")) else "csv"

            # 加载数据
            print(f"正在加载表达矩阵: {expression_file}", file=sys.stderr)
            print(f"正在加载元数据文件: {metadata_file}", file=sys.stderr)
            matrix_df, meta_df = converter.load_matrix_data(
                expression_file, metadata_file if metadata_file else None, expr_format
            )
            if matrix_df is None:
                raise ValueError("无法加载表达矩阵")

            # 详细检查加载结果
            print(
                f"表达矩阵加载结果: {matrix_df.shape if matrix_df is not None else 'None'}",
                file=sys.stderr,
            )
            print(
                f"元数据加载结果: {meta_df.shape if meta_df is not None else 'None'}",
                file=sys.stderr,
            )
            if meta_df is not None:
                print(f"元数据列名: {list(meta_df.columns)}", file=sys.stderr)
                print(f"元数据索引前5个: {list(meta_df.index[:5])}", file=sys.stderr)
            else:
                print("⚠️ 警告：元数据文件未能成功加载！", file=sys.stderr)

            # 创建AnnData对象
            adata = converter.create_anndata(matrix_df, meta_df)
            if adata is None:
                raise ValueError("无法创建AnnData对象")

            print("内存中的AnnData对象创建成功。", file=sys.stderr)
            print(
                f"数据维度: {adata.shape[0]} 细胞 x {adata.shape[1]} 基因",
                file=sys.stderr,
            )
            print(f"最终的观测数据列: {list(adata.obs.columns)}", file=sys.stderr)

            # 根据save_h5ad参数决定是否保存H5AD文件
            h5ad_filename = None
            if save_h5ad.lower() == "true":
                import os
                from datetime import datetime

                output_dir = "./sample_data/output"
                os.makedirs(output_dir, exist_ok=True)

                # 生成文件名
                if custom_filename:
                    # 清理自定义文件名，移除可能的.h5ad后缀，确保只有一个.h5ad后缀
                    clean_filename = custom_filename.replace(".h5ad", "")
                    h5ad_filename = f"{clean_filename}.h5ad"
                else:
                    # 生成带时间戳的文件名
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    h5ad_filename = f"converted_{timestamp}.h5ad"

                h5ad_path = os.path.join(output_dir, h5ad_filename)

                print(f"正在保存H5AD文件到: {h5ad_path}", file=sys.stderr)
                adata.write_h5ad(h5ad_path)
                print(f"H5AD文件保存成功: {h5ad_filename}", file=sys.stderr)
            else:
                print("跳过H5AD文件保存（仅在内存中处理）", file=sys.stderr)

            # Step 2: 直接处理内存中的AnnData对象
            result = self.process_h5ad(adata, reduction_method, color_by)

            # 在结果中添加H5AD文件名信息（如果保存了文件）
            if result and result.get("success") and h5ad_filename:
                # result 已经是一个字典，直接添加 h5ad_filename
                result["h5ad_filename"] = h5ad_filename

                # 重新输出修改后的JSON数据
                print("=== PLOT_DATA_START ===")
                print(json.dumps(result, ensure_ascii=False))
                print("=== PLOT_DATA_END ===")

                return result

            return result

        except Exception as e:
            error_msg = f"转换和处理流程失败: {str(e)}"
            print(error_msg, file=sys.stderr)
            traceback.print_exc(file=sys.stderr)
            return self._output_error(error_msg)

    def process_h5ad(self, h5ad_input, reduction_method, color_by):
        """
        处理H5AD文件或内存中的AnnData对象 - 统一的处理入口
        """
        try:
            if isinstance(h5ad_input, sc.AnnData):
                print("Step 2: 处理内存中的AnnData对象...", file=sys.stderr)
                self.adata = h5ad_input
            else:
                print(
                    f"Step 2: 从路径加载并处理H5AD文件: {h5ad_input}", file=sys.stderr
                )
                self.adata = sc.read_h5ad(h5ad_input)

            # 检查adata是否成功加载
            if self.adata is None:
                raise ValueError("无法加载AnnData对象")

            print(
                f"加载数据: {self.adata.shape[0]} 细胞 x {self.adata.shape[1]} 基因",
                file=sys.stderr,
            )

            # 快速预处理
            self._quick_preprocess()

            # 降维
            self._perform_dimensionality_reduction(reduction_method)

            # 生成可视化数据
            return self._generate_plot_data(reduction_method, color_by)

        except Exception as e:
            error_msg = f"H5AD处理失败: {str(e)}"
            print(error_msg, file=sys.stderr)
            traceback.print_exc(file=sys.stderr)
            return self._output_error(error_msg)

    def _quick_preprocess(self):
        """快速预处理流程"""
        # 检查adata是否已加载
        if self.adata is None:
            raise ValueError("AnnData对象未初始化")

        print("执行快速预处理...", file=sys.stderr)

        # 基本过滤
        sc.pp.filter_cells(self.adata, min_genes=50)
        sc.pp.filter_genes(self.adata, min_cells=1)

        # 标准化
        sc.pp.normalize_total(self.adata, target_sum=1e4)
        sc.pp.log1p(self.adata)

        # 选择高变基因
        n_top_genes = min(2000, self.adata.shape[1])
        if self.adata.shape[1] > n_top_genes:
            try:
                sc.pp.highly_variable_genes(self.adata, n_top_genes=n_top_genes)
                self.adata.raw = self.adata
                self.adata = self.adata[:, self.adata.var.highly_variable]
            except:
                # 如果高变基因选择失败，使用方差选择
                try:
                    # 处理稀疏矩阵
                    X_data = self.adata.X
                    # 检查是否为稀疏矩阵并转换
                    if issparse(X_data):
                        # 稀疏矩阵转换为密集矩阵
                        gene_var = np.var(X_data.toarray(), axis=0)
                    else:
                        # 已经是密集矩阵或其他类型
                        gene_var = np.var(X_data, axis=0)

                    # 处理可能的矩阵包装类型
                    if hasattr(gene_var, "A1"):
                        gene_var = gene_var.A1
                    top_genes_idx = np.argsort(gene_var)[-n_top_genes:]
                    self.adata = self.adata[:, top_genes_idx]
                except Exception as e:
                    print(f"高变基因选择失败: {e}", file=sys.stderr)
                    # 继续使用所有基因

        print(
            f"预处理后维度: {self.adata.shape[0]} 细胞 x {self.adata.shape[1]} 基因",
            file=sys.stderr,
        )

    def _perform_dimensionality_reduction(self, method):
        """执行降维"""
        # 检查adata是否已加载
        if self.adata is None:
            raise ValueError("AnnData对象未初始化")

        print(f"执行{method.upper()}降维...", file=sys.stderr)

        # PCA
        sc.tl.pca(self.adata, svd_solver="arpack")

        # 计算邻域图
        sc.pp.neighbors(self.adata, n_neighbors=10, n_pcs=40)

        # 执行指定的降维方法
        if method.lower() == "tsne":
            sc.tl.tsne(self.adata)
        else:  # 默认UMAP
            sc.tl.umap(self.adata)

    def _generate_plot_data(self, method, color_by):
        """生成绘图数据"""
        # 检查adata是否已加载
        if self.adata is None:
            raise ValueError("AnnData对象未初始化")

        try:
            # 获取坐标
            coord_key = f"X_{method.lower()}"
            if coord_key not in self.adata.obsm:
                coord_key = "X_umap"  # 备用

            coordinates = self.adata.obsm[coord_key]
            x_coords = coordinates[:, 0].tolist()
            y_coords = coordinates[:, 1].tolist()

            # 打印可用的列信息，帮助调试
            print(f"可用的观测数据列: {list(self.adata.obs.columns)}", file=sys.stderr)
            print(f"请求的着色列: {color_by}", file=sys.stderr)

            # 处理颜色数据 - 增强逻辑
            color_data = None
            color_type = "default"
            used_color_column = None

            # 清理color_by参数：如果是空字符串，设为None
            if color_by == "" or color_by == '""':
                color_by = None
                print(f"清理空字符串，设置color_by为None", file=sys.stderr)

            # 如果没有指定color_by或者指定的列不存在，尝试自动选择
            if not color_by or color_by not in self.adata.obs.columns:
                # 自动寻找最佳的着色列
                priority_columns = [
                    "cluster",
                    "clusters",
                    "louvain",
                    "leiden",
                    "cell_type",
                    "celltype",
                    "cell_types",
                    "seurat_clusters",
                    "RNA_snn_res",
                ]

                print(f"寻找着色列，当前color_by: {color_by}", file=sys.stderr)
                for col in priority_columns:
                    if col in self.adata.obs.columns:
                        color_by = col
                        print(f"自动选择着色列: {color_by}", file=sys.stderr)
                        break
                else:
                    print(f"未找到优先着色列，将使用第一个分类列", file=sys.stderr)

                # 如果还是没找到，使用第一个分类列
                if not color_by or color_by not in self.adata.obs.columns:
                    categorical_columns = [
                        col
                        for col in self.adata.obs.columns
                        if self.adata.obs[col].dtype == "object"
                        or self.adata.obs[col].dtype.name == "category"
                    ]
                    if categorical_columns:
                        color_by = categorical_columns[0]
                        print(f"使用第一个分类列作为着色: {color_by}", file=sys.stderr)
                        print(f"可用的分类列: {categorical_columns}", file=sys.stderr)

            if color_by and color_by in self.adata.obs.columns:
                color_values = self.adata.obs[color_by]

                # 检查数据类型和内容
                print(
                    f"着色列 '{color_by}' 的数据类型: {color_values.dtype}",
                    file=sys.stderr,
                )
                print(f"唯一值示例: {color_values.unique()[:10]}", file=sys.stderr)
                print(
                    f"非空值数量: {color_values.notna().sum()}/{len(color_values)}",
                    file=sys.stderr,
                )

                if (
                    color_values.dtype == "object"
                    or color_values.dtype.name == "category"
                ):
                    # 分类数据
                    color_type = "categorical"
                    # 处理分类数据，创建数值映射
                    unique_values = color_values.dropna().unique()
                    if len(unique_values) > 0:
                        value_to_index = {val: i for i, val in enumerate(unique_values)}
                        # 为缺失值预留最后一个索引
                        unknown_index = len(unique_values)
                        color_data = [
                            (
                                value_to_index.get(val, unknown_index)
                                if pd.notna(val)
                                else unknown_index
                            )
                            for val in color_values
                        ]
                        # 添加类别信息
                        categories = unique_values.tolist()
                        if unknown_index in color_data:  # 有缺失值
                            categories.append("未知")
                            print(
                                f"发现 {color_data.count(unknown_index)} 个未知类型的细胞",
                                file=sys.stderr,
                            )
                    else:
                        color_data = [0] * len(x_coords)
                        categories = ["默认"]
                else:
                    # 数值数据
                    color_type = "continuous"
                    color_data = color_values.fillna(0).tolist()
                    categories = None

                used_color_column = color_by
                print(f"使用{color_by}进行着色 (类型: {color_type})", file=sys.stderr)
            else:
                # 默认颜色 - 创建简单的基于位置的分组
                print("无有效着色列，创建默认分组", file=sys.stderr)
                n_groups = min(
                    8, max(2, len(x_coords) // 500)
                )  # 根据细胞数量决定分组数
                x_array = np.array(x_coords)
                # 根据X坐标分组
                bins = np.linspace(x_array.min(), x_array.max(), n_groups + 1)
                color_data = np.digitize(x_array, bins) - 1
                color_data = np.clip(color_data, 0, n_groups - 1).tolist()
                color_type = "categorical"
                categories = [f"组{i+1}" for i in range(n_groups)]
                used_color_column = "位置分组"

            # 构建输出数据
            plot_data = {
                "x": x_coords,
                "y": y_coords,
                "color": color_data,  # 保持兼容性
                "color_values": color_data,  # 前端期望的字段名
                "color_type": color_type,
                "method": method.upper(),
                "n_cells": len(x_coords),
                "available_columns": list(self.adata.obs.columns),
                "used_color_column": used_color_column,
                "success": True,
            }

            # 如果是分类数据，添加类别信息
            if color_type == "categorical" and categories is not None:
                plot_data["categories"] = categories
                category_display = (
                    categories[:10]
                    if len(categories) <= 10
                    else categories[:10] + ["..."]
                )
                print(
                    f"分类信息: {category_display}",
                    file=sys.stderr,
                )

            print(
                f"成功生成{len(x_coords)}个细胞的{method.upper()}坐标", file=sys.stderr
            )
            print(
                f"颜色数据范围: {min(color_data) if color_data else 'N/A'} - {max(color_data) if color_data else 'N/A'}",
                file=sys.stderr,
            )

            # 输出JSON数据
            print("=== PLOT_DATA_START ===")
            print(json.dumps(plot_data, ensure_ascii=False))
            print("=== PLOT_DATA_END ===")

            return plot_data

        except Exception as e:
            error_msg = f"生成绘图数据失败: {str(e)}"
            print(error_msg, file=sys.stderr)
            traceback.print_exc(file=sys.stderr)
            return self._output_error(error_msg)

    def _output_error(self, error_message):
        """输出错误信息"""
        error_data = {
            "error": error_message,
            "success": False,
            "x": [],
            "y": [],
            "color": [],
            "color_type": "error",
        }

        print("=== PLOT_DATA_START ===")
        print(json.dumps(error_data, ensure_ascii=False))
        print("=== PLOT_DATA_END ===")

        return error_data


def main():
    """主函数 - 简化的命令行接口"""

    if len(sys.argv) < 4:
        print(
            "用法: python single_cell_processor.py <command> <file1> [file2] <method> [color_by]",
            file=sys.stderr,
        )
        print("命令:", file=sys.stderr)
        print("  convert_to_h5ad_and_process: 转换CSV/TSV为H5AD并处理", file=sys.stderr)
        print("  process_h5ad: 直接处理H5AD文件", file=sys.stderr)
        sys.exit(1)

    processor = OptimizedSingleCellProcessor()

    command = sys.argv[1]

    try:
        if command == "convert_to_h5ad_and_process":
            # 最佳实践流程
            expression_file = sys.argv[2]
            metadata_file = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] else None
            reduction_method = sys.argv[4] if len(sys.argv) > 4 else "umap"
            color_by = sys.argv[5] if len(sys.argv) > 5 and sys.argv[5] else None
            save_h5ad = sys.argv[6] if len(sys.argv) > 6 else "false"
            custom_filename = sys.argv[7] if len(sys.argv) > 7 and sys.argv[7] else ""

            processor.convert_to_h5ad_and_process(
                expression_file,
                metadata_file,
                reduction_method,
                color_by,
                save_h5ad,
                custom_filename,
            )

        elif command == "process_h5ad":
            # 直接处理H5AD
            h5ad_file = sys.argv[2]
            reduction_method = sys.argv[3] if len(sys.argv) > 3 else "umap"
            color_by = sys.argv[4] if len(sys.argv) > 4 and sys.argv[4] else None

            processor.process_h5ad(h5ad_file, reduction_method, color_by)

        else:
            raise ValueError(f"未知命令: {command}")

    except Exception as e:
        processor._output_error(f"执行失败: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
