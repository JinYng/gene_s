#!/usr/bin/env python3
"""
Python端统一错误处理模块
与Node.js端的错误处理保持一致
"""

import json
import sys
import traceback
from enum import Enum
from typing import Dict, Any, Optional
from datetime import datetime


class ErrorType(Enum):
    """错误类型枚举"""

    VALIDATION = "VALIDATION_ERROR"
    FILE_PROCESSING = "FILE_PROCESSING_ERROR"
    ANALYSIS = "ANALYSIS_ERROR"
    LLM = "LLM_ERROR"
    INTERNAL = "INTERNAL_ERROR"
    TIMEOUT = "TIMEOUT_ERROR"
    DEPENDENCY = "DEPENDENCY_ERROR"


class ErrorCode(Enum):
    """错误码枚举"""

    # 文件处理错误 (1000-1099)
    FILE_NOT_FOUND = 1004
    FILE_FORMAT_INVALID = 1002
    FILE_PROCESSING_FAILED = 1005

    # 分析错误 (2000-2099)
    ANALYSIS_FAILED = 2002
    INVALID_ANALYSIS_PARAMS = 2003
    ANALYSIS_TIMEOUT = 2004
    INSUFFICIENT_DATA = 2005

    # LLM错误 (3000-3099)
    LLM_UNAVAILABLE = 3001
    LLM_RESPONSE_INVALID = 3002
    LLM_TIMEOUT = 3003

    # 依赖错误 (6000-6099)
    MISSING_DEPENDENCY = 6001
    DEPENDENCY_VERSION_MISMATCH = 6002

    # 系统错误 (5000-5099)
    INTERNAL_SERVER_ERROR = 5001
    MEMORY_ERROR = 5004
    PERMISSION_DENIED = 5003


class AnalysisError(Exception):
    """自定义分析错误类"""

    def __init__(
        self,
        message: str,
        error_type: ErrorType = ErrorType.INTERNAL,
        error_code: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message)
        self.message = message
        self.error_type = error_type
        self.error_code = error_code
        self.details = details or {}
        self.timestamp = datetime.now().isoformat()

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            "success": False,
            "error": {
                "message": self.message,
                "type": self.error_type.value,
                "code": self.error_code.value,
                "details": self.details,
                "timestamp": self.timestamp,
            },
        }

    def to_json(self) -> str:
        """转换为JSON字符串"""
        return json.dumps(self.to_dict(), ensure_ascii=False, indent=2)


class ErrorHandler:
    """错误处理器类"""

    @staticmethod
    def handle_file_error(error: Exception, file_path: str = None) -> AnalysisError:
        """处理文件相关错误"""
        if isinstance(error, FileNotFoundError):
            return AnalysisError(
                f"文件未找到: {file_path or '未知文件'}",
                ErrorType.FILE_PROCESSING,
                ErrorCode.FILE_NOT_FOUND,
                {"file_path": file_path},
            )

        if isinstance(error, PermissionError):
            return AnalysisError(
                f"文件权限不足: {file_path or '未知文件'}",
                ErrorType.FILE_PROCESSING,
                ErrorCode.PERMISSION_DENIED,
                {"file_path": file_path},
            )

        # 检查是否是pandas相关的文件格式错误
        error_msg = str(error).lower()
        if any(
            keyword in error_msg
            for keyword in ["parse", "decode", "format", "delimiter"]
        ):
            return AnalysisError(
                f"文件格式错误: {error}",
                ErrorType.FILE_PROCESSING,
                ErrorCode.FILE_FORMAT_INVALID,
                {"file_path": file_path, "original_error": str(error)},
            )

        return AnalysisError(
            f"文件处理失败: {error}",
            ErrorType.FILE_PROCESSING,
            ErrorCode.FILE_PROCESSING_FAILED,
            {"file_path": file_path, "original_error": str(error)},
        )

    @staticmethod
    def handle_analysis_error(
        error: Exception, analysis_type: str = None
    ) -> AnalysisError:
        """处理分析相关错误"""
        error_msg = str(error).lower()

        # 内存错误
        if isinstance(error, MemoryError) or "memory" in error_msg:
            return AnalysisError(
                "内存不足，请尝试使用更小的数据集或增加系统内存",
                ErrorType.ANALYSIS,
                ErrorCode.MEMORY_ERROR,
                {"analysis_type": analysis_type, "suggestion": "减少数据量或增加内存"},
            )

        # 数据不足错误
        if any(
            keyword in error_msg for keyword in ["empty", "insufficient", "too few"]
        ):
            return AnalysisError(
                "数据不足以进行分析，请检查数据质量和数量",
                ErrorType.ANALYSIS,
                ErrorCode.INSUFFICIENT_DATA,
                {"analysis_type": analysis_type, "suggestion": "检查数据预处理步骤"},
            )

        # 参数错误
        if any(
            keyword in error_msg for keyword in ["parameter", "argument", "invalid"]
        ):
            return AnalysisError(
                f"分析参数错误: {error}",
                ErrorType.VALIDATION,
                ErrorCode.INVALID_ANALYSIS_PARAMS,
                {"analysis_type": analysis_type, "original_error": str(error)},
            )

        return AnalysisError(
            f"分析执行失败: {error}",
            ErrorType.ANALYSIS,
            ErrorCode.ANALYSIS_FAILED,
            {"analysis_type": analysis_type, "original_error": str(error)},
        )

    @staticmethod
    def handle_llm_error(error: Exception) -> AnalysisError:
        """处理LLM相关错误"""
        error_msg = str(error).lower()

        if "timeout" in error_msg:
            return AnalysisError(
                "AI服务响应超时，请稍后重试",
                ErrorType.LLM,
                ErrorCode.LLM_TIMEOUT,
                {"suggestion": "检查网络连接或稍后重试"},
            )

        if "connection" in error_msg or "refused" in error_msg:
            return AnalysisError(
                "无法连接到AI服务，请确保Ollama服务正在运行",
                ErrorType.LLM,
                ErrorCode.LLM_UNAVAILABLE,
                {"suggestion": "运行 'ollama serve' 启动服务"},
            )

        if "json" in error_msg or "parse" in error_msg:
            return AnalysisError(
                "AI服务返回格式错误",
                ErrorType.LLM,
                ErrorCode.LLM_RESPONSE_INVALID,
                {"original_error": str(error)},
            )

        return AnalysisError(
            f"AI服务错误: {error}",
            ErrorType.LLM,
            ErrorCode.LLM_UNAVAILABLE,
            {"original_error": str(error)},
        )

    @staticmethod
    def handle_dependency_error(
        error: Exception, dependency: str = None
    ) -> AnalysisError:
        """处理依赖相关错误"""
        if isinstance(error, ImportError) or isinstance(error, ModuleNotFoundError):
            return AnalysisError(
                f"缺少必需的依赖: {dependency or error}",
                ErrorType.DEPENDENCY,
                ErrorCode.MISSING_DEPENDENCY,
                {
                    "dependency": dependency,
                    "suggestion": (
                        f"请安装依赖: pip install {dependency}"
                        if dependency
                        else "请检查Python环境"
                    ),
                },
            )

        return AnalysisError(
            f"依赖错误: {error}",
            ErrorType.DEPENDENCY,
            ErrorCode.DEPENDENCY_VERSION_MISMATCH,
            {"original_error": str(error)},
        )

    @staticmethod
    def format_error_response(
        error: Exception, context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """格式化错误响应"""
        context = context or {}

        # 如果已经是AnalysisError，直接返回
        if isinstance(error, AnalysisError):
            return error.to_dict()

        # 根据错误类型进行处理
        if isinstance(error, (FileNotFoundError, PermissionError)):
            handled_error = ErrorHandler.handle_file_error(
                error, context.get("file_path")
            )
        elif isinstance(error, (ImportError, ModuleNotFoundError)):
            handled_error = ErrorHandler.handle_dependency_error(
                error, context.get("dependency")
            )
        elif context.get("analysis_type"):
            handled_error = ErrorHandler.handle_analysis_error(
                error, context.get("analysis_type")
            )
        elif context.get("llm_operation"):
            handled_error = ErrorHandler.handle_llm_error(error)
        else:
            # 通用错误处理
            handled_error = AnalysisError(
                str(error),
                ErrorType.INTERNAL,
                ErrorCode.INTERNAL_SERVER_ERROR,
                {
                    "original_error": str(error),
                    "traceback": (
                        traceback.format_exc()
                        if context.get("include_traceback")
                        else None
                    ),
                },
            )

        return handled_error.to_dict()

    @staticmethod
    def print_error_json(error: Exception, context: Dict[str, Any] = None):
        """打印错误JSON到stdout（用于与Node.js通信）"""
        error_response = ErrorHandler.format_error_response(error, context)
        print(json.dumps(error_response, ensure_ascii=False))

    @staticmethod
    def log_error(error: Exception, context: Dict[str, Any] = None):
        """记录错误到stderr"""
        error_info = {
            "timestamp": datetime.now().isoformat(),
            "error_type": type(error).__name__,
            "message": str(error),
            "context": context or {},
            "traceback": traceback.format_exc(),
        }

        print(f"ERROR: {json.dumps(error_info, ensure_ascii=False)}", file=sys.stderr)


# 便捷的错误创建函数
def create_file_error(message: str, file_path: str = None) -> AnalysisError:
    """创建文件错误"""
    return AnalysisError(
        message,
        ErrorType.FILE_PROCESSING,
        ErrorCode.FILE_PROCESSING_FAILED,
        {"file_path": file_path},
    )


def create_analysis_error(message: str, analysis_type: str = None) -> AnalysisError:
    """创建分析错误"""
    return AnalysisError(
        message,
        ErrorType.ANALYSIS,
        ErrorCode.ANALYSIS_FAILED,
        {"analysis_type": analysis_type},
    )


def create_validation_error(field: str, message: str) -> AnalysisError:
    """创建验证错误"""
    return AnalysisError(
        message,
        ErrorType.VALIDATION,
        ErrorCode.INVALID_ANALYSIS_PARAMS,
        {"field": field},
    )


def create_llm_error(message: str) -> AnalysisError:
    """创建LLM错误"""
    return AnalysisError(message, ErrorType.LLM, ErrorCode.LLM_UNAVAILABLE)


# 装饰器：自动错误处理
def handle_errors(include_traceback: bool = False):
    """错误处理装饰器"""

    def decorator(func):
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                context = {
                    "function": func.__name__,
                    "include_traceback": include_traceback,
                }
                ErrorHandler.log_error(e, context)
                ErrorHandler.print_error_json(e, context)
                sys.exit(1)

        return wrapper

    return decorator


if __name__ == "__main__":
    # 测试错误处理
    try:
        raise FileNotFoundError("测试文件未找到")
    except Exception as e:
        ErrorHandler.print_error_json(e, {"file_path": "/test/file.csv"})
