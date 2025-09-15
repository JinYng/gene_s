import pandas as pd
import numpy as np
import scanpy as sc
import anndata as ad
import os
import sys
import json
from pathlib import Path


class MatrixToH5adConverter:
    def __init__(self):
        """初始化转换器"""
        self.output_dir = "public/sample_data/output"
        # 确保输出目录存在
        os.makedirs(self.output_dir, exist_ok=True)

    def load_matrix_data(self, matrix_file, meta_file=None, matrix_format="csv"):
        """
        加载矩阵数据和元数据

        参数:
        - matrix_file: 表达矩阵文件路径
        - meta_file: 细胞元数据文件路径（可选）
        - matrix_format: 矩阵文件格式 ('csv', 'tsv', 'excel')
        """
        try:
            # 读取表达矩阵
            if matrix_format.lower() in ["csv"]:
                matrix_df = pd.read_csv(matrix_file, index_col=0)
            elif matrix_format.lower() in ["tsv", "txt"]:
                matrix_df = pd.read_csv(matrix_file, sep="\t", index_col=0)
            elif matrix_format.lower() in ["xlsx", "excel"]:
                matrix_df = pd.read_excel(matrix_file, index_col=0)
            else:
                raise ValueError(f"不支持的矩阵文件格式: {matrix_format}")

            print(f"表达矩阵维度: {matrix_df.shape}")
            print(f"基因数量: {matrix_df.shape[0]}")
            print(f"细胞数量: {matrix_df.shape[1]}")

            # 读取细胞元数据（如果提供）
            meta_df = None
            print(f"检查元数据文件参数: '{meta_file}'")

            # 处理空字符串和None的情况
            if meta_file and meta_file.strip() and os.path.exists(meta_file):
                print(f"正在加载元数据文件: {meta_file}")
                if meta_file.endswith(".csv"):
                    meta_df = pd.read_csv(meta_file, index_col=0)
                elif meta_file.endswith(".tsv") or meta_file.endswith(".txt"):
                    meta_df = pd.read_csv(meta_file, sep="\t", index_col=0)
                elif meta_file.endswith(".xlsx"):
                    meta_df = pd.read_excel(meta_file, index_col=0)

                print(f"元数据维度: {meta_df.shape}")
                print(f"元数据列: {list(meta_df.columns)}")
                print(f"元数据索引前5个: {list(meta_df.index[:5])}")
            else:
                if not meta_file or not meta_file.strip():
                    print("元数据文件参数为空，跳过元数据加载")
                elif not os.path.exists(meta_file):
                    print(f"元数据文件不存在: {meta_file}")
                print("将创建不含元数据的AnnData对象")

            return matrix_df, meta_df

        except Exception as e:
            print(f"加载数据时出错: {str(e)}")
            return None, None

    def create_anndata(self, matrix_df, meta_df=None):
        """
        创建 AnnData 对象，采用 umap_pancreas.py 的成功做法

        参数:
        - matrix_df: 表达矩阵 DataFrame (基因 x 细胞)
        - meta_df: 细胞元数据 DataFrame (细胞 x 注释)
        """
        try:
            print("=== 使用成功验证的方法创建 AnnData 对象 ===")

            # 如果有元数据，先进行细胞ID对齐
            if meta_df is not None:
                print("检查细胞ID对齐...")
                print(f"表达矩阵细胞数: {matrix_df.shape[1]}")
                print(f"元数据细胞数: {meta_df.shape[0]}")

                # 获取共同的细胞
                expr_cells = set(matrix_df.columns)
                meta_cells = set(meta_df.index)
                common_cells = expr_cells & meta_cells

                print(f"共同细胞数: {len(common_cells)}")

                if len(common_cells) > 0:
                    # 只保留共同的细胞
                    matrix_df = matrix_df[list(common_cells)]
                    meta_df = meta_df.loc[list(common_cells)]
                    print(
                        f"过滤后的数据 - 表达矩阵: {matrix_df.shape}, 元数据: {meta_df.shape}"
                    )
                else:
                    print("警告: 没有共同的细胞ID，将尝试按顺序对齐")
                    if matrix_df.shape[1] == meta_df.shape[0]:
                        # 按顺序对齐：假设两个文件中细胞的顺序相同
                        print("细胞数量相同，按顺序对齐")
                        meta_df.index = matrix_df.columns
                    else:
                        print("无法对齐，将不使用元数据")
                        meta_df = None

            # 使用 umap_pancreas.py 的成功方法创建 AnnData 对象
            print("创建 AnnData 对象...")
            adata = sc.AnnData(matrix_df.T)  # 转置: (细胞 x 基因)

            # 直接赋值元数据 - 这是 umap_pancreas.py 的成功做法
            if meta_df is not None:
                print(f"添加元数据列: {list(meta_df.columns)}")
                adata.obs = meta_df  # 直接赋值，简单有效！

            # 添加基本信息
            adata.var["gene_name"] = adata.var.index
            adata.obs["cell_id"] = adata.obs.index
            adata.obs["n_genes"] = (adata.X > 0).sum(axis=1)
            adata.var["n_cells"] = (adata.X > 0).sum(axis=0)

            print(f"创建的 AnnData 对象:")
            print(f"- 细胞数量: {adata.n_obs}")
            print(f"- 基因数量: {adata.n_vars}")
            print(f"- 观测数据列: {list(adata.obs.columns)}")

            # 检查是否有 cluster 列
            if "cluster" in adata.obs.columns:
                print(f"✓ 成功保留 cluster 列！")
                print(f"cluster 分布: {adata.obs['cluster'].value_counts().to_dict()}")
            else:
                print("⚠ 未找到 cluster 列")

            return adata

        except Exception as e:
            print(f"创建 AnnData 对象时出错: {str(e)}")
            import traceback

            traceback.print_exc()
            return None

    def _smart_align_metadata(self, adata, meta_df):
        """
        智能对齐元数据和表达矩阵的细胞ID

        解决exprMatrix.tsv和meta.tsv中细胞ID不直接对应的问题
        """
        expression_cells = set(adata.obs.index)
        metadata_cells = set(meta_df.index)

        print(f"表达矩阵细胞数: {len(expression_cells)}")
        print(f"元数据细胞数: {len(metadata_cells)}")

        # 策略1: 精确匹配
        exact_match = expression_cells & metadata_cells
        if len(exact_match) > 0:
            print(f"精确匹配的细胞数: {len(exact_match)}")
            if len(exact_match) >= len(expression_cells) * 0.8:  # 80%以上匹配
                aligned_meta = meta_df.loc[adata.obs.index.intersection(meta_df.index)]
                for col in aligned_meta.columns:
                    adata.obs[col] = aligned_meta[col]
                print("使用精确匹配策略")
                return adata

        # 策略2: 模糊匹配（处理细微的ID差异）
        print("尝试模糊匹配...")
        mapping = self._fuzzy_match_cell_ids(expression_cells, metadata_cells)

        if len(mapping) >= len(expression_cells) * 0.5:  # 50%以上可以匹配
            print(f"模糊匹配成功: {len(mapping)} 个细胞")

            # 创建对齐的元数据
            aligned_data = {}
            for expr_id, meta_id in mapping.items():
                if expr_id in adata.obs.index:
                    for col in meta_df.columns:
                        if col not in aligned_data:
                            aligned_data[col] = {}
                        aligned_data[col][expr_id] = meta_df.loc[meta_id, col]

            # 添加到adata.obs
            for col, values in aligned_data.items():
                col_series = pd.Series(index=adata.obs.index, dtype="object")
                for cell_id, value in values.items():
                    col_series[cell_id] = value
                adata.obs[col] = col_series

            print("使用模糊匹配策略")
            return adata

        # 策略3: 按顺序对齐（当细胞数量相同但ID完全不同时）
        if len(expression_cells) == len(metadata_cells):
            print("尝试按顺序对齐...")
            print("警告：按顺序对齐假设两个文件中的细胞顺序相同")

            # 按顺序对齐
            meta_reindexed = meta_df.copy()
            meta_reindexed.index = adata.obs.index

            for col in meta_reindexed.columns:
                adata.obs[col] = meta_reindexed[col].values

            print("使用按顺序对齐策略")
            return adata

        # 策略4: 部分匹配
        print("警告：只能部分匹配元数据")
        print("将为未匹配的细胞设置默认值")

        # 使用精确匹配的部分
        if len(exact_match) > 0:
            for col in meta_df.columns:
                col_series = pd.Series(index=adata.obs.index, dtype="object")
                for cell_id in exact_match:
                    if cell_id in adata.obs.index:
                        col_series[cell_id] = meta_df.loc[cell_id, col]
                # 为未匹配的细胞设置默认值
                col_series = col_series.fillna("未知")
                adata.obs[col] = col_series

        return adata

    def _fuzzy_match_cell_ids(self, expr_cells, meta_cells):
        """
        模糊匹配细胞ID，处理常见的ID差异模式
        """
        mapping = {}

        expr_list = list(expr_cells)
        meta_list = list(meta_cells)

        # 模式1: 前缀/后缀差异
        for expr_id in expr_list:
            for meta_id in meta_list:
                if self._ids_similar(expr_id, meta_id):
                    mapping[expr_id] = meta_id
                    break

        return mapping

    def _ids_similar(self, id1, id2):
        """
        判断两个ID是否相似（处理常见的差异模式）
        """
        id1_str = str(id1).strip()
        id2_str = str(id2).strip()

        # 完全相同
        if id1_str == id2_str:
            return True

        # 忽略大小写
        if id1_str.lower() == id2_str.lower():
            return True

        # 去除常见前缀/后缀
        prefixes = ["cell_", "Cell_", "CELL_", "barcode_", "Barcode_"]
        suffixes = ["_1", "_2", ".1", ".2", "-1", "-2"]

        id1_clean = id1_str
        id2_clean = id2_str

        for prefix in prefixes:
            id1_clean = id1_clean.replace(prefix, "")
            id2_clean = id2_clean.replace(prefix, "")

        for suffix in suffixes:
            if id1_clean.endswith(suffix):
                id1_clean = id1_clean[: -len(suffix)]
            if id2_clean.endswith(suffix):
                id2_clean = id2_clean[: -len(suffix)]

        if id1_clean == id2_clean:
            return True

        # 包含关系（一个ID包含另一个）
        if id1_clean in id2_clean or id2_clean in id1_clean:
            return True

        return False

    def save_h5ad(self, adata, output_filename):
        """
        保存 AnnData 对象为 h5ad 文件

        参数:
        - adata: AnnData 对象
        - output_filename: 输出文件名
        """
        try:
            output_path = os.path.join(self.output_dir, output_filename)

            # 确保文件名以 .h5ad 结尾
            if not output_filename.endswith(".h5ad"):
                output_path += ".h5ad"

            # 保存文件
            adata.write(output_path)

            print(f"成功保存 h5ad 文件: {output_path}")

            # 返回文件信息
            file_size = os.path.getsize(output_path) / (1024 * 1024)  # MB

            return {
                "success": True,
                "file_path": output_path,
                "file_size_mb": round(file_size, 2),
                "n_cells": adata.n_obs,
                "n_genes": adata.n_vars,
                "obs_columns": list(adata.obs.columns),
                "var_columns": list(adata.var.columns),
            }

        except Exception as e:
            print(f"保存 h5ad 文件时出错: {str(e)}")
            return {"success": False, "error": str(e)}

    def convert_to_h5ad(
        self, matrix_file, meta_file=None, output_filename=None, matrix_format="csv"
    ):
        """
        完整的转换流程

        参数:
        - matrix_file: 表达矩阵文件路径
        - meta_file: 细胞元数据文件路径（可选）
        - output_filename: 输出文件名（可选，默认基于输入文件名生成）
        - matrix_format: 矩阵文件格式
        """
        try:
            print("开始数据转换流程...")

            # 1. 加载数据
            matrix_df, meta_df = self.load_matrix_data(
                matrix_file, meta_file, matrix_format
            )
            if matrix_df is None:
                return {"success": False, "error": "无法加载矩阵数据"}

            # 2. 创建 AnnData 对象
            adata = self.create_anndata(matrix_df, meta_df)
            if adata is None:
                return {"success": False, "error": "无法创建 AnnData 对象"}

            # 3. 生成输出文件名
            if output_filename is None:
                base_name = os.path.splitext(os.path.basename(matrix_file))[0]
                output_filename = f"{base_name}_converted.h5ad"

            # 4. 保存文件
            result = self.save_h5ad(adata, output_filename)

            print("数据转换完成!")
            return result

        except Exception as e:
            print(f"转换过程中出错: {str(e)}")
            return {"success": False, "error": str(e)}


def main():
    """命令行入口"""
    if len(sys.argv) < 2:
        print(
            "用法: python matrix_to_h5ad_converter.py <matrix_file> [meta_file] [output_filename]"
        )
        print(
            "示例: python matrix_to_h5ad_converter.py expression_matrix.csv cell_metadata.csv output.h5ad"
        )
        return

    matrix_file = sys.argv[1]
    meta_file = sys.argv[2] if len(sys.argv) > 2 else None
    output_filename = sys.argv[3] if len(sys.argv) > 3 else None

    # 检测文件格式
    matrix_format = "csv"
    if matrix_file.endswith(".tsv") or matrix_file.endswith(".txt"):
        matrix_format = "tsv"
    elif matrix_file.endswith(".xlsx"):
        matrix_format = "excel"

    # 创建转换器并执行转换
    converter = MatrixToH5adConverter()
    result = converter.convert_to_h5ad(
        matrix_file, meta_file, output_filename, matrix_format
    )

    # 输出结果
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
