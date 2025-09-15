// services/base/BaseService.js
// 基础服务类

import logger from "../../lib/logger.js";
// 使用内联的createResponse函数，避免引用服务端utils
const createResponse = (success, data = null, message = "", code = null) => {
  return {
    success,
    data,
    message,
    code,
    timestamp: new Date().toISOString(),
  };
};

/**
 * 基础服务类
 * 提供通用的服务功能
 */
export default class BaseService {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.logger = logger;
  }

  /**
   * 记录服务日志
   * @param {string} level - 日志级别
   * @param {string} message - 消息
   * @param {any} meta - 元数据
   */
  log(level, message, meta = {}) {
    this.logger[level](`[${this.serviceName}] ${message}`, meta);
  }

  /**
   * 创建成功响应
   * @param {any} data - 数据
   * @param {string} message - 消息
   * @returns {Object} 响应对象
   */
  createSuccessResponse(data, message = "操作成功") {
    return createResponse(true, data, message);
  }

  /**
   * 创建错误响应
   * @param {string} message - 错误消息
   * @param {number} code - 错误码
   * @returns {Object} 响应对象
   */
  createErrorResponse(message, code = null) {
    return createResponse(false, null, message, code);
  }

  /**
   * 处理异步操作
   * @param {Function} operation - 异步操作
   * @param {string} operationName - 操作名称
   * @returns {Promise} 操作结果
   */
  async executeOperation(operation, operationName) {
    const startTime = Date.now();

    try {
      this.log("info", `开始执行: ${operationName}`);
      const result = await operation();

      const duration = Date.now() - startTime;
      this.logger.logPerformance(operationName, duration, {
        service: this.serviceName,
      });

      this.log("info", `完成执行: ${operationName}`, {
        duration: `${duration}ms`,
      });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.log("error", `执行失败: ${operationName}`, {
        error: error.message,
        duration: `${duration}ms`,
      });
      throw error;
    }
  }

  /**
   * 验证必需参数
   * @param {Object} data - 数据对象
   * @param {string[]} requiredFields - 必需字段
   * @throws {Error} 如果缺少必需字段
   */
  validateRequiredFields(data, requiredFields) {
    const missingFields = requiredFields.filter(
      (field) =>
        !(field in data) || data[field] === null || data[field] === undefined
    );

    if (missingFields.length > 0) {
      throw new Error(`缺少必需参数: ${missingFields.join(", ")}`);
    }
  }

  /**
   * 获取服务健康状态
   * @returns {Object} 健康状态
   */
  async getHealthStatus() {
    return {
      service: this.serviceName,
      status: "healthy",
      timestamp: new Date().toISOString(),
    };
  }
}
