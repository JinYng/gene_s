#!/usr/bin/env python3
"""
Chat专用矩阵转换器
为BioChat提供独立的CSV/TSV转H5AD功能
"""

import os
import sys
import json
import pandas as pd
import numpy as np
import scanpy as sc
from pathlib import Path
from typing import Optional, Tuple


class ChatMatrixConverter:
    """Chat专用矩阵转换器"""
    
    def __init__(self):
        self.expression_df = None
        self.metadata_df = None
    
    def convert_csv_to_h5ad(self, csv_path: str, output_path: str, metadata_path: str = None) -> dict:
        """转换CSV到H5AD"""
        return self._convert_matrix_to_h5ad(csv_path, output_path, metadata_path, 'csv')
    
    def convert_tsv_to_h5ad(self, tsv_path: str, output_path: str, metadata_path: str = None) -> dict:
        """转换TSV到H5AD"""
        return self._convert_matrix_to_h5ad(tsv_path, output_path, metadata_path, 'tsv')
    
    def _convert_matrix_to_h5ad(self, matrix_path: str, output_path: str, metadata_path: str = None, file_format: str = 'csv') -> dict:
        """通用矩阵转H5AD转换"""
        try:
            print(f"🔄 开始转换: {matrix_path} -> {output_path}", file=sys.stderr)
            
            # 加载表达矩阵
            separator = '\t' if file_format == 'tsv' else ','
            self.expression_df = pd.read_csv(matrix_path, sep=separator, index_col=0)
            
            print(f"📊 表达矩阵维度: {self.expression_df.shape}", file=sys.stderr)
            print(f"🔢 数据类型: {self.expression_df.dtypes.iloc[0]}", file=sys.stderr)
            
            # 加载元数据（如果有）
            if metadata_path and os.path.exists(metadata_path):
                metadata_separator = '\t' if metadata_path.endswith('.tsv') else ','
                self.metadata_df = pd.read_csv(metadata_path, sep=metadata_separator, index_col=0)
                print(f"📋 元数据维度: {self.metadata_df.shape}", file=sys.stderr)
                print(f"📋 元数据列: {list(self.metadata_df.columns)}", file=sys.stderr)
            else:
                self.metadata_df = None
                print("ℹ️  无元数据文件", file=sys.stderr)
            
            # 验证数据
            validation_result = self._validate_data()
            if not validation_result['success']:
                return validation_result
            
            # 创建AnnData对象
            adata = self._create_anndata()
            if adata is None:
                return {'success': False, 'error': '无法创建AnnData对象'}
            
            # 保存H5AD
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            adata.write_h5ad(output_path)
            
            print(f"✅ 转换完成: {output_path}", file=sys.stderr)
            print(f"📊 最终维度: {adata.shape[0]}细胞 × {adata.shape[1]}基因", file=sys.stderr)
            
            return {
                'success': True,
                'h5ad_path': output_path,
                'n_cells': adata.shape[0],
                'n_genes': adata.shape[1],
                'has_metadata': self.metadata_df is not None,
                'message': f'成功转换为H5AD格式'
            }
            
        except Exception as e:
            error_msg = f"转换失败: {str(e)}"
            print(f"❌ {error_msg}", file=sys.stderr)
            return {'success': False, 'error': error_msg}
    
    def _validate_data(self) -> dict:
        """验证数据有效性"""
        try:
            if self.expression_df is None:
                return {'success': False, 'error': '表达矩阵未加载'}
            
            # 检查缺失值
            missing_ratio = self.expression_df.isnull().sum().sum() / (self.expression_df.shape[0] * self.expression_df.shape[1])
            if missing_ratio > 0.1:
                print(f"⚠️  缺失值比例: {missing_ratio:.2%}", file=sys.stderr)
            
            # 检查数据类型
            numeric_cols = pd.to_numeric(self.expression_df.iloc[:, 0], errors='coerce').notna().sum()
            if numeric_cols == 0:
                return {'success': False, 'error': '表达矩阵数据格式错误'}
            
            # 验证元数据
            if self.metadata_df is not None:
                # 检查索引是否匹配
                expression_cells = set(self.expression_df.columns)
                metadata_cells = set(self.metadata_df.index)
                
                overlap = len(expression_cells.intersection(metadata_cells))
                if overlap == 0:
                    print("⚠️  表达矩阵和元数据索引不匹配，将创建空元数据", file=sys.stderr)
                    self.metadata_df = None
                else:
                    print(f"✅ 索引匹配: {overlap}/{len(expression_cells)}个细胞", file=sys.stderr)
            
            return {'success': True}
            
        except Exception as e:
            return {'success': False, 'error': f'验证失败: {str(e)}'}
    
    def _create_anndata(self) -> Optional[sc.AnnData]:
        """创建AnnData对象"""
        try:
            if self.expression_df is None:
                return None
            
            # 转置数据：行为细胞，列为基因
            expression_matrix = self.expression_df.T
            
            # 创建obs（细胞信息）
            if self.metadata_df is not None:
                # 对齐索引
                common_cells = expression_matrix.index.intersection(self.metadata_df.index)
                if len(common_cells) > 0:
                    expression_matrix = expression_matrix.loc[common_cells]
                    metadata_aligned = self.metadata_df.loc[common_cells]
                else:
                    metadata_aligned = pd.DataFrame(index=expression_matrix.index)
            else:
                metadata_aligned = pd.DataFrame(index=expression_matrix.index)
            
            # 创建var（基因信息）
            gene_info = pd.DataFrame(index=expression_matrix.columns)
            gene_info['gene_ids'] = expression_matrix.columns
            
            # 创建AnnData对象
            adata = sc.AnnData(
                X=expression_matrix.values,
                obs=metadata_aligned,
                var=gene_info
            )
            
            # 设置名称
            adata.obs_names = expression_matrix.index
            adata.var_names = expression_matrix.columns
            
            return adata
            
        except Exception as e:
            print(f"❌ 创建AnnData失败: {str(e)}", file=sys.stderr)
            return None
    
    def get_data_info(self, file_path: str) -> dict:
        """获取文件信息"""
        try:
            if not os.path.exists(file_path):
                return {'success': False, 'error': '文件不存在'}
            
            # 检测文件格式
            file_format = 'tsv' if file_path.endswith('.tsv') else 'csv'
            separator = '\t' if file_format == 'tsv' else ','
            
            # 预览数据
            df = pd.read_csv(file_path, sep=separator, index_col=0, nrows=5)
            
            # 加载完整数据获取统计信息
            full_df = pd.read_csv(file_path, sep=separator, index_col=0)
            
            return {
                'success': True,
                'format': file_format,
                'n_rows': full_df.shape[0],
                'n_cols': full_df.shape[1],
                'preview_shape': df.shape,
                'index_example': list(df.index[:3]),
                'columns_example': list(df.columns[:3]),
                'file_size': os.path.getsize(file_path)
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}


def main():
    """命令行接口"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Chat专用矩阵转换器')
    parser.add_argument('action', choices=['convert', 'info'], help='执行操作')
    parser.add_argument('--input', required=True, help='输入文件路径')
    parser.add_argument('--output', help='输出H5AD文件路径')
    parser.add_argument('--metadata', help='元数据文件路径')
    parser.add_argument('--format', choices=['csv', 'tsv'], default='csv', help='输入文件格式')
    
    args = parser.parse_args()
    
    converter = ChatMatrixConverter()
    
    if args.action == 'convert':
        if not args.output:
            print("错误: --output 参数为必填项", file=sys.stderr)
            sys.exit(1)
            
        if args.format == 'csv':
            result = converter.convert_csv_to_h5ad(args.input, args.output, args.metadata)
        else:
            result = converter.convert_tsv_to_h5ad(args.input, args.output, args.metadata)
            
    elif args.action == 'info':
        result = converter.get_data_info(args.input)
    
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()