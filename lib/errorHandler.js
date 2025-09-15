// lib/errorHandler.js
// 统一错误处理模块

/**
 * 错误类型枚举
 */
export const ErrorTypes = {
  VALIDATION: "VALIDATION_ERROR",
  FILE_UPLOAD: "FILE_UPLOAD_ERROR",
  ANALYSIS: "ANALYSIS_ERROR",
  NETWORK: "NETWORK_ERROR",
  PYTHON_SERVICE: "PYTHON_SERVICE_ERROR",
  OLLAMA_SERVICE: "OLLAMA_SERVICE_ERROR",
  INTERNAL: "INTERNAL_ERROR",
  TIMEOUT: "TIMEOUT_ERROR",
  PERMISSION: "PERMISSION_ERROR",
};

/**
 * 错误码定义
 */
export const ErrorCodes = {
  // 文件相关错误 (1000-1099)
  FILE_TOO_LARGE: 1001,
  FILE_FORMAT_INVALID: 1002,
  FILE_UPLOAD_FAILED: 1003,
  FILE_NOT_FOUND: 1004,

  // 分析服务错误 (2000-2099)
  PYTHON_SERVICE_UNAVAILABLE: 2001,
  ANALYSIS_FAILED: 2002,
  INVALID_ANALYSIS_PARAMS: 2003,
  ANALYSIS_TIMEOUT: 2004,

  // AI服务错误 (3000-3099)
  OLLAMA_UNAVAILABLE: 3001,
  LLM_RESPONSE_INVALID: 3002,
  AI_SERVICE_TIMEOUT: 3003,

  // 网络错误 (4000-4099)
  NETWORK_TIMEOUT: 4001,
  CONNECTION_REFUSED: 4002,
  SERVICE_UNAVAILABLE: 4003,

  // 系统错误 (5000-5099)
  INTERNAL_SERVER_ERROR: 5001,
  CONFIGURATION_ERROR: 5002,
  PERMISSION_DENIED: 5003,
};

/**
 * 自定义错误类
 */
export class AppError extends Error {
  constructor(
    message,
    type = ErrorTypes.INTERNAL,
    code = ErrorCodes.INTERNAL_SERVER_ERROR,
    details = null
  ) {
    super(message);
    this.name = "AppError";
    this.type = type;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      success: false,
      error: {
        message: this.message,
        type: this.type,
        code: this.code,
        details: this.details,
        timestamp: this.timestamp,
      },
    };
  }
}

/**
 * 错误处理器类
 */
export class ErrorHandler {
  /**
   * 处理文件上传错误
   */
  static handleFileError(error, filename = null) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return new AppError(
        `文件 ${filename || ""} 超过大小限制`,
        ErrorTypes.FILE_UPLOAD,
        ErrorCodes.FILE_TOO_LARGE,
        { filename, maxSize: "2GB" }
      );
    }

    if (error.code === "INVALID_FILE_TYPE") {
      return new AppError(
        `不支持的文件格式: ${filename || ""}`,
        ErrorTypes.FILE_UPLOAD,
        ErrorCodes.FILE_FORMAT_INVALID,
        { filename, supportedFormats: ["H5AD", "CSV", "TSV", "TXT"] }
      );
    }

    return new AppError(
      `文件上传失败: ${error.message}`,
      ErrorTypes.FILE_UPLOAD,
      ErrorCodes.FILE_UPLOAD_FAILED,
      { filename, originalError: error.message }
    );
  }

  /**
   * 处理Python服务错误
   */
  static handlePythonServiceError(error) {
    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      return new AppError(
        "Python分析服务不可用，请确保服务已启动",
        ErrorTypes.PYTHON_SERVICE,
        ErrorCodes.PYTHON_SERVICE_UNAVAILABLE,
        {
          suggestion: "请在终端运行: npm run chat-server",
          port: 8001,
          service: "FastAPI",
        }
      );
    }

    if (error.code === "ETIMEDOUT") {
      return new AppError(
        "分析服务响应超时，请稍后重试",
        ErrorTypes.PYTHON_SERVICE,
        ErrorCodes.ANALYSIS_TIMEOUT,
        { timeout: "120秒" }
      );
    }

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      return new AppError(
        `分析服务错误: ${data?.detail || data?.message || error.message}`,
        ErrorTypes.ANALYSIS,
        ErrorCodes.ANALYSIS_FAILED,
        {
          httpStatus: status,
          serverResponse: data,
        }
      );
    }

    return new AppError(
      `Python服务调用失败: ${error.message}`,
      ErrorTypes.PYTHON_SERVICE,
      ErrorCodes.PYTHON_SERVICE_UNAVAILABLE,
      { originalError: error.message }
    );
  }

  /**
   * 处理Ollama服务错误
   */
  static handleOllamaError(error) {
    if (error.message.includes("connect ECONNREFUSED")) {
      return new AppError(
        "Ollama服务不可用，请确保服务已启动",
        ErrorTypes.OLLAMA_SERVICE,
        ErrorCodes.OLLAMA_UNAVAILABLE,
        {
          suggestion: "请在终端运行: ollama serve",
          port: 11434,
          model: "gemma3:4b",
        }
      );
    }

    if (error.message.includes("timeout")) {
      return new AppError(
        "AI服务响应超时，请稍后重试",
        ErrorTypes.OLLAMA_SERVICE,
        ErrorCodes.AI_SERVICE_TIMEOUT,
        { timeout: "30秒" }
      );
    }

    return new AppError(
      `AI服务错误: ${error.message}`,
      ErrorTypes.OLLAMA_SERVICE,
      ErrorCodes.OLLAMA_UNAVAILABLE,
      { originalError: error.message }
    );
  }

  /**
   * 处理验证错误
   */
  static handleValidationError(field, value, rule) {
    return new AppError(
      `参数验证失败: ${field}`,
      ErrorTypes.VALIDATION,
      ErrorCodes.INVALID_ANALYSIS_PARAMS,
      { field, value, rule }
    );
  }

  /**
   * 统一错误响应格式
   */
  static formatErrorResponse(error, req = null) {
    // 如果是AppError，直接返回格式化结果
    if (error instanceof AppError) {
      return error.toJSON();
    }

    // 处理其他类型的错误
    let appError;

    if (error.name === "ValidationError") {
      appError = this.handleValidationError(
        error.field,
        error.value,
        error.rule
      );
    } else if (error.code === "ECONNREFUSED") {
      appError = this.handlePythonServiceError(error);
    } else {
      appError = new AppError(
        error.message || "未知错误",
        ErrorTypes.INTERNAL,
        ErrorCodes.INTERNAL_SERVER_ERROR,
        {
          originalError: error.message,
          stack:
            process.env.NODE_ENV === "development" ? error.stack : undefined,
        }
      );
    }

    return appError.toJSON();
  }

  /**
   * Express错误处理中间件
   */
  static middleware() {
    return (error, req, res, next) => {
      console.error("🚨 错误处理中间件捕获错误:", error);

      const errorResponse = this.formatErrorResponse(error, req);

      // 根据错误类型设置HTTP状态码
      let statusCode = 500;

      switch (error.type) {
        case ErrorTypes.VALIDATION:
          statusCode = 400;
          break;
        case ErrorTypes.FILE_UPLOAD:
          statusCode = 400;
          break;
        case ErrorTypes.PERMISSION:
          statusCode = 403;
          break;
        case ErrorTypes.NETWORK:
        case ErrorTypes.PYTHON_SERVICE:
        case ErrorTypes.OLLAMA_SERVICE:
          statusCode = 503;
          break;
        case ErrorTypes.TIMEOUT:
          statusCode = 408;
          break;
        default:
          statusCode = 500;
      }

      res.status(statusCode).json(errorResponse);
    };
  }
}

/**
 * 便捷的错误创建函数
 */
export const createError = {
  fileUpload: (message, filename) =>
    new AppError(
      message,
      ErrorTypes.FILE_UPLOAD,
      ErrorCodes.FILE_UPLOAD_FAILED,
      { filename }
    ),

  analysis: (message, details) =>
    new AppError(
      message,
      ErrorTypes.ANALYSIS,
      ErrorCodes.ANALYSIS_FAILED,
      details
    ),

  pythonService: (message) =>
    new AppError(
      message,
      ErrorTypes.PYTHON_SERVICE,
      ErrorCodes.PYTHON_SERVICE_UNAVAILABLE
    ),

  ollama: (message) =>
    new AppError(
      message,
      ErrorTypes.OLLAMA_SERVICE,
      ErrorCodes.OLLAMA_UNAVAILABLE
    ),

  validation: (field, message) =>
    new AppError(
      message,
      ErrorTypes.VALIDATION,
      ErrorCodes.INVALID_ANALYSIS_PARAMS,
      { field }
    ),

  timeout: (service, timeout) =>
    new AppError(
      `${service}服务超时`,
      ErrorTypes.TIMEOUT,
      ErrorCodes.ANALYSIS_TIMEOUT,
      { timeout }
    ),
};

export default ErrorHandler;
