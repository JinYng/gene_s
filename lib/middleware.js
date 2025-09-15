// lib/middleware.js
// API 中间件函数

import { createResponse } from "./utils.js";
import config from "../config/index.js";

/**
 * 错误处理中间件
 * @param {Function} handler - API 处理函数
 * @returns {Function} 包装后的处理函数
 */
export function withErrorHandling(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error("API Error:", error);

      // 根据错误类型返回适当的状态码
      let statusCode = 500;
      let message = "服务器内部错误";

      if (error.name === "ValidationError") {
        statusCode = 400;
        message = "请求数据无效";
      } else if (error.name === "NotFoundError") {
        statusCode = 404;
        message = "资源未找到";
      } else if (error.name === "UnauthorizedError") {
        statusCode = 401;
        message = "未授权访问";
      }

      const response = createResponse(
        false,
        null,
        error.message || message,
        error.code
      );
      res.status(statusCode).json(response);
    }
  };
}

/**
 * 方法验证中间件
 * @param {string[]} allowedMethods - 允许的HTTP方法
 * @returns {Function} 中间件函数
 */
export function withMethodValidation(allowedMethods) {
  return (handler) => {
    return async (req, res) => {
      if (!allowedMethods.includes(req.method)) {
        const response = createResponse(
          false,
          null,
          `只支持 ${allowedMethods.join(", ")} 请求`,
          405
        );
        return res.status(405).json(response);
      }

      return handler(req, res);
    };
  };
}

/**
 * 请求限流中间件（简单实现）
 * @param {number} maxRequests - 最大请求数
 * @param {number} windowMs - 时间窗口（毫秒）
 * @returns {Function} 中间件函数
 */
export function withRateLimit(maxRequests = 100, windowMs = 60000) {
  const requests = new Map();

  return (handler) => {
    return async (req, res) => {
      const clientId = req.ip || req.connection.remoteAddress || "unknown";
      const now = Date.now();

      if (!requests.has(clientId)) {
        requests.set(clientId, []);
      }

      const clientRequests = requests.get(clientId);
      // 清理过期请求
      const validRequests = clientRequests.filter(
        (timestamp) => now - timestamp < windowMs
      );

      if (validRequests.length >= maxRequests) {
        const response = createResponse(
          false,
          null,
          "请求过于频繁，请稍后重试",
          429
        );
        return res.status(429).json(response);
      }

      validRequests.push(now);
      requests.set(clientId, validRequests);

      return handler(req, res);
    };
  };
}

/**
 * 文件上传验证中间件
 * @param {Object} options - 验证选项
 * @returns {Function} 中间件函数
 */
export function withFileValidation(options = {}) {
  const {
    maxSize = config.storage.maxFileSize,
    allowedTypes = config.storage.allowedExtensions,
    required = true,
  } = options;

  return (handler) => {
    return async (req, res) => {
      // 这里可以添加文件验证逻辑
      // 由于使用 formidable，文件验证会在具体的handler中处理
      return handler(req, res);
    };
  };
}

/**
 * CORS 中间件
 * @param {Object} options - CORS选项
 * @returns {Function} 中间件函数
 */
export function withCORS(options = {}) {
  const {
    origin = "*",
    methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders = ["Content-Type", "Authorization"],
  } = options;

  return (handler) => {
    return async (req, res) => {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Methods", methods.join(", "));
      res.setHeader("Access-Control-Allow-Headers", allowedHeaders.join(", "));

      if (req.method === "OPTIONS") {
        res.status(200).end();
        return;
      }

      return handler(req, res);
    };
  };
}

/**
 * 组合多个中间件
 * @param {...Function} middlewares - 中间件函数
 * @returns {Function} 组合后的中间件
 */
export function combineMiddlewares(...middlewares) {
  return (handler) => {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      handler
    );
  };
}
