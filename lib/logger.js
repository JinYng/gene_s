// lib/logger.js
// 客户端安全的日志管理系统 - 移除 fs 依赖

class Logger {
  constructor() {
    this.logLevel = process.env.NODE_ENV === "development" ? "debug" : "info";
    this.isDevelopment = process.env.NODE_ENV === "development";
    this.logLevels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    };
  }

  /**
   * 格式化日志消息
   * @param {string} level - 日志级别
   * @param {string} message - 消息
   * @param {any} meta - 元数据
   * @returns {string} 格式化后的日志
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...meta,
    };

    return JSON.stringify(logEntry);
  }

  /**
   * 控制台输出日志
   * @param {string} level - 日志级别
   * @param {string} message - 消息
   * @param {any} meta - 元数据
   */
  writeToConsole(level, message, meta = {}) {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, meta);

    // 在浏览器和 Node.js 环境中都使用控制台输出
    switch (level) {
      case "error":
        console.error(formattedMessage);
        break;
      case "warn":
        console.warn(formattedMessage);
        break;
      case "info":
        console.info(formattedMessage);
        break;
      case "debug":
        console.debug(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
  }

  /**
   * 检查是否应该记录此级别的日志
   * @param {string} level - 日志级别
   * @returns {boolean} 是否记录
   */
  shouldLog(level) {
    return this.logLevels[level] <= this.logLevels[this.logLevel];
  }

  /**
   * 记录错误日志
   * @param {string} message - 消息
   * @param {any} meta - 元数据
   */
  error(message, meta = {}) {
    this.writeToConsole("error", message, meta);
  }

  /**
   * 记录警告日志
   * @param {string} message - 消息
   * @param {any} meta - 元数据
   */
  warn(message, meta = {}) {
    this.writeToConsole("warn", message, meta);
  }

  /**
   * 记录信息日志
   * @param {string} message - 消息
   * @param {any} meta - 元数据
   */
  info(message, meta = {}) {
    this.writeToConsole("info", message, meta);
  }

  /**
   * 记录调试日志
   * @param {string} message - 消息
   * @param {any} meta - 元数据
   */
  debug(message, meta = {}) {
    this.writeToConsole("debug", message, meta);
  }

  /**
   * 记录API请求
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @param {number} duration - 请求耗时（毫秒）
   */
  logRequest(req, res, duration) {
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.headers?.["user-agent"],
      ip: req.ip,
    };

    if (res.statusCode >= 400) {
      this.error("HTTP Error", logData);
    } else {
      this.info("HTTP Request", logData);
    }
  }

  /**
   * 记录性能指标
   * @param {string} operation - 操作名称
   * @param {number} duration - 耗时（毫秒）
   * @param {any} meta - 元数据
   */
  logPerformance(operation, duration, meta = {}) {
    this.info(`Performance: ${operation}`, {
      duration: `${duration}ms`,
      ...meta,
    });
  }
}

// 导出单例实例
const logger = new Logger();
export default logger;
