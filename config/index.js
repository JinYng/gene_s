// config/index.js
// 统一配置管理

import { ErrorHandler, createError } from "../lib/errorHandler.js";

/**
 * 配置验证器
 */
class ConfigValidator {
  static validatePort(port) {
    const portNum = parseInt(port);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      throw createError.validation("port", `无效的端口号: ${port}`);
    }
    return portNum;
  }

  static validateUrl(url, name) {
    try {
      new URL(url);
      return url;
    } catch (error) {
      throw createError.validation(name, `无效的URL: ${url}`);
    }
  }

  static validateTimeout(timeout) {
    const timeoutNum = parseInt(timeout);
    if (isNaN(timeoutNum) || timeoutNum < 1000) {
      throw createError.validation(
        "timeout",
        `超时时间必须大于1000ms: ${timeout}`
      );
    }
    return timeoutNum;
  }

  static validateFileSize(size) {
    const sizeNum = parseInt(size);
    if (isNaN(sizeNum) || sizeNum < 1024) {
      throw createError.validation("fileSize", `文件大小必须大于1KB: ${size}`);
    }
    return sizeNum;
  }
}

/**
 * 配置管理类
 */
class ConfigManager {
  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  loadConfig() {
    return {
      // 服务器配置
      server: {
        port: ConfigValidator.validatePort(process.env.PORT || 3000),
        host: process.env.HOST || "localhost",
        cors: {
          origin: process.env.CORS_ORIGIN || "*",
          credentials: process.env.CORS_CREDENTIALS === "true",
        },
      },

      // AI 服务配置
      ai: {
        ollama: {
          baseUrl: ConfigValidator.validateUrl(
            process.env.OLLAMA_BASE_URL || "http://localhost:11434",
            "OLLAMA_BASE_URL"
          ),
          defaultModel: process.env.OLLAMA_DEFAULT_MODEL || "gemma3:4b",
          timeout: ConfigValidator.validateTimeout(
            process.env.OLLAMA_TIMEOUT || 30000
          ),
          maxRetries: parseInt(process.env.OLLAMA_MAX_RETRIES) || 3,
          retryDelay: parseInt(process.env.OLLAMA_RETRY_DELAY) || 1000,
        },
        zhipu: {
          apiKey: process.env.ZHIPU_API_KEY,
          baseUrl: ConfigValidator.validateUrl(
            process.env.ZHIPU_BASE_URL ||
              "https://open.bigmodel.cn/api/paas/v4",
            "ZHIPU_BASE_URL"
          ),
          defaultModel: process.env.ZHIPU_DEFAULT_MODEL || "glm-4.5v",
          timeout: ConfigValidator.validateTimeout(
            process.env.ZHIPU_TIMEOUT || 30000
          ),
        },
      },

      // Python服务配置
      python: {
        serviceUrl: ConfigValidator.validateUrl(
          process.env.PYTHON_SERVICE_URL || "http://localhost:8001",
          "PYTHON_SERVICE_URL"
        ),
        timeout: ConfigValidator.validateTimeout(
          process.env.PYTHON_TIMEOUT || 120000
        ),
        maxRetries: parseInt(process.env.PYTHON_MAX_RETRIES) || 2,
        retryDelay: parseInt(process.env.PYTHON_RETRY_DELAY) || 2000,
        executable: process.env.PYTHON_EXECUTABLE || "python",
        environment: process.env.PYTHON_ENVIRONMENT || "bio",
      },

      // 文件存储配置
      storage: {
        uploadDir: process.env.UPLOAD_DIR || "./public/uploads",
        tempDir: process.env.TEMP_DIR || "./tmp",
        maxFileSize: ConfigValidator.validateFileSize(
          process.env.MAX_FILE_SIZE || 2048 * 1024 * 1024 // 2GB
        ),
        maxTotalFileSize: ConfigValidator.validateFileSize(
          process.env.MAX_TOTAL_FILE_SIZE || 4096 * 1024 * 1024 // 4GB
        ),
        allowedExtensions: [".csv", ".tsv", ".h5ad", ".txt"],
        cleanupInterval: parseInt(process.env.CLEANUP_INTERVAL) || 3600000, // 1小时
        maxFileAge: parseInt(process.env.MAX_FILE_AGE) || 86400000, // 24小时
      },

      // 数据处理配置
      processing: {
        maxProcessingTime: ConfigValidator.validateTimeout(
          process.env.MAX_PROCESSING_TIME || 300000 // 5分钟
        ),
        maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS) || 5,
        memoryLimit: process.env.MEMORY_LIMIT || "2GB",
        enableGPU: process.env.ENABLE_GPU === "true",
      },

      // 会话管理配置
      session: {
        maxSessions: parseInt(process.env.MAX_SESSIONS) || 1000,
        sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 1800000, // 30分钟
        cleanupInterval:
          parseInt(process.env.SESSION_CLEANUP_INTERVAL) || 300000, // 5分钟
        maxMessagesPerSession:
          parseInt(process.env.MAX_MESSAGES_PER_SESSION) || 100,
      },

      // 日志配置
      logging: {
        level: process.env.LOG_LEVEL || "info",
        enableConsole: process.env.LOG_CONSOLE !== "false",
        enableFile: process.env.LOG_FILE === "true",
        logDir: process.env.LOG_DIR || "./logs",
        maxFileSize: process.env.LOG_MAX_FILE_SIZE || "10MB",
        maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
      },

      // 环境配置
      env: {
        nodeEnv: process.env.NODE_ENV || "development",
        isDevelopment: process.env.NODE_ENV === "development",
        isProduction: process.env.NODE_ENV === "production",
        isTest: process.env.NODE_ENV === "test",
        version: process.env.npm_package_version || "1.0.0",
      },

      // 安全配置
      security: {
        enableRateLimit: process.env.ENABLE_RATE_LIMIT !== "false",
        rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15分钟
        rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100,
        enableCors: process.env.ENABLE_CORS !== "false",
        trustProxy: process.env.TRUST_PROXY === "true",
      },
    };
  }

  validateConfig() {
    // 验证必需的配置项
    const requiredConfigs = [
      { path: "server.port", value: this.config.server.port },
      { path: "ai.ollama.baseUrl", value: this.config.ai.ollama.baseUrl },
      { path: "python.serviceUrl", value: this.config.python.serviceUrl },
      { path: "storage.tempDir", value: this.config.storage.tempDir },
    ];

    for (const { path, value } of requiredConfigs) {
      if (!value) {
        throw createError.validation(path, `必需的配置项缺失: ${path}`);
      }
    }

    // 验证端口冲突
    const ports = [
      this.config.server.port,
      new URL(this.config.ai.ollama.baseUrl).port || 11434,
      new URL(this.config.python.serviceUrl).port || 8001,
    ];

    const uniquePorts = new Set(ports);
    if (uniquePorts.size !== ports.length) {
      throw createError.validation("ports", "检测到端口冲突，请检查配置");
    }
  }

  get(path) {
    return path.split(".").reduce((obj, key) => obj?.[key], this.config);
  }

  set(path, value) {
    const keys = path.split(".");
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => obj[key], this.config);
    target[lastKey] = value;
  }

  getAll() {
    return { ...this.config };
  }

  // 获取环境特定的配置
  getForEnvironment(env = this.config.env.nodeEnv) {
    const envConfig = { ...this.config };

    // 生产环境特定配置
    if (env === "production") {
      envConfig.logging.level = "warn";
      envConfig.ai.ollama.timeout = 60000; // 增加超时时间
      envConfig.python.timeout = 180000; // 增加超时时间
    }

    // 开发环境特定配置
    if (env === "development") {
      envConfig.logging.level = "debug";
      envConfig.security.enableRateLimit = false;
    }

    // 测试环境特定配置
    if (env === "test") {
      envConfig.logging.level = "error";
      envConfig.ai.ollama.timeout = 5000;
      envConfig.python.timeout = 10000;
    }

    return envConfig;
  }

  // 打印配置摘要（隐藏敏感信息）
  printSummary() {
    const summary = {
      environment: this.config.env.nodeEnv,
      server: `${this.config.server.host}:${this.config.server.port}`,
      ollama: this.config.ai.ollama.baseUrl,
      python: this.config.python.serviceUrl,
      storage: {
        tempDir: this.config.storage.tempDir,
        maxFileSize: `${Math.round(
          this.config.storage.maxFileSize / 1024 / 1024
        )}MB`,
      },
      logging: this.config.logging.level,
    };

    console.log("📋 配置摘要:", JSON.stringify(summary, null, 2));
  }
}

// 创建单例实例
const configManager = new ConfigManager();

// 导出配置对象和管理器
export default configManager.getAll();
export { configManager, ConfigValidator };

// 便捷访问函数
export const getConfig = (path) => configManager.get(path);
export const setConfig = (path, value) => configManager.set(path, value);
export const getAllConfig = () => configManager.getAll();
