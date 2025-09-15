// services/aiServiceManager.js
// AI服务管理器 - 统一管理多种AI模型（智谱AI、Ollama等）

import config from "../config/index.js";

/**
 * AI服务管理器类
 * 支持多种AI模型的统一接口
 */
class AIServiceManager {
  constructor() {
    this.serviceName = "AIServiceManager";

    this.availableServices = {
      ollama: {
        name: "Ollama本地模型",
        provider: "ollama",
        model: config.ai.ollama.defaultModel,
        endpoint: "/api/chat-ollama",
        description: "本地部署的AI模型 - 快速、私密、免费",
        isLocal: true,
        requiresApiKey: false,
        priority: 1, // 最高优先级
        baseUrl: config.ai.ollama.baseUrl,
      },
      zhipu: {
        name: "智谱AI",
        provider: "zhipu",
        model: config.ai.zhipu.defaultModel,
        endpoint: "/api/chat-zhipu",
        description: "智谱AI 模型",
        isLocal: false,
        requiresApiKey: true,
        priority: 2,
        baseUrl: config.ai.zhipu.baseUrl,
      },
    };

    // 默认使用Ollama服务
    this.defaultService = "ollama";
    this.currentService = this.defaultService;
  }

  /**
   * 获取所有可用的AI服务
   * @returns {Object} 可用的AI服务列表
   */
  getAvailableServices() {
    return this.availableServices;
  }

  /**
   * 获取当前服务的API端点
   * @param {string} serviceId - 指定的服务ID（可选）
   * @returns {string} API端点路径
   */
  getApiEndpoint(serviceId = null) {
    const service = serviceId
      ? this.availableServices[serviceId]
      : this.getCurrentService();

    if (!service) {
      throw new Error("没有可用的AI服务");
    }

    // 返回对应的API端点
    const endpoints = {
      ollama: "/api/chat-ollama",
      zhipu: "/api/chat-zhipu",
    };

    return endpoints[service.provider] || "/api/chat-ollama";
  }

  /**
   * 获取当前使用的AI服务
   * @returns {Object} 当前AI服务配置
   */
  getCurrentService() {
    return this.availableServices[this.currentService];
  }

  /**
   * 设置当前使用的AI服务
   * @param {string} serviceId - 服务ID
   * @returns {boolean} 设置是否成功
   */
  setCurrentService(serviceId) {
    if (this.availableServices[serviceId]) {
      this.currentService = serviceId;
      return true;
    }
    return false;
  }

  /**
   * 检查服务是否可用
   * @param {string} serviceId - 服务ID
   * @returns {Promise<boolean>} 服务是否可用
   */
  async checkServiceAvailability(serviceId) {
    const service = this.availableServices[serviceId];
    if (!service) return false;

    try {
      // 对于智谱AI，进行实际API测试
      if (service.provider === "zhipu") {
        const apiKey =
          process.env.ZHIPU_LLM_API_KEY || process.env.ZHIPU_API_KEY;
        if (!apiKey) return false;

        try {
          const testResponse = await fetch(
            "https://open.bigmodel.cn/api/paas/v4/chat/completions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model: "glm-4",
                messages: [{ role: "user", content: "test" }],
                max_tokens: 1,
              }),
              timeout: 5000,
            }
          );

          // API密钥无效
          if (testResponse.status === 401 || testResponse.status === 403) {
            return false;
          }

          // 其他情况认为服务可用
          return true;
        } catch (error) {
          console.warn("智谱AI服务测试失败:", error.message);
          return false;
        }
      }

      // 对于Ollama，检查本地服务
      if (service.provider === "ollama") {
        const ollamaUrl =
          process.env.OLLAMA_BASE_URL || "http://localhost:11434";
        try {
          const response = await fetch(`${ollamaUrl}/api/tags`, {
            method: "GET",
            timeout: 3000,
          });
          return response.ok;
        } catch (error) {
          console.warn("Ollama服务不可用:", error.message);
          return false;
        }
      }

      return false;
    } catch (error) {
      console.error(`检查服务可用性失败 (${serviceId}):`, error);
      return false;
    }
  }

  /**
   * 获取服务的配置信息
   * @param {string} serviceId - 服务ID
   * @returns {Object|null} 服务配置
   */
  getServiceConfig(serviceId) {
    return this.availableServices[serviceId] || null;
  }

  /**
   * 更新服务配置
   * @param {string} serviceId - 服务ID
   * @param {Object} config - 新的配置
   */
  updateServiceConfig(serviceId, config) {
    if (this.availableServices[serviceId]) {
      this.availableServices[serviceId] = {
        ...this.availableServices[serviceId],
        ...config,
      };
    }
  }

  /**
   * 构建聊天请求的配置
   * @param {string} message - 用户消息
   * @param {Array} files - 上传的文件
   * @param {string} sessionId - 会话ID
   * @param {string} serviceId - 指定的服务ID（可选）
   * @returns {Object} 请求配置
   */
  buildChatRequest(message, files = [], sessionId, serviceId = null) {
    const service = serviceId
      ? this.availableServices[serviceId]
      : this.getCurrentService();

    if (!service) {
      throw new Error(`AI服务不可用: ${serviceId || this.currentService}`);
    }

    // 构建FormData
    const formData = new FormData();
    formData.append("message", message);
    formData.append("sessionId", sessionId);
    formData.append("aiService", service.provider);
    formData.append("modelName", service.model);

    // 添加文件
    files.forEach((file, index) => {
      formData.append(`file_${index}`, file);
    });

    return {
      endpoint: service.endpoint,
      formData,
      service,
    };
  }

  /**
   * 发送聊天请求
   * @param {string} message - 用户消息
   * @param {Array} files - 上传的文件
   * @param {string} sessionId - 会话ID
   * @param {string} serviceId - 指定的服务ID（可选）
   * @returns {Promise} API响应
   */
  async sendChatRequest(message, files = [], sessionId, serviceId = null) {
    try {
      const { endpoint, formData, service } = this.buildChatRequest(
        message,
        files,
        sessionId,
        serviceId
      );

      console.log(`使用AI服务: ${service.name} (${service.provider})`);

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json();

      // 添加服务信息到响应中
      result.aiService = {
        provider: service.provider,
        model: service.model,
        name: service.name,
      };

      return result;
    } catch (error) {
      console.error("AI服务请求失败:", error);
      throw error;
    }
  }

  /**
   * 获取推荐的AI服务
   * 根据任务类型推荐最适合的AI服务
   * @param {string} taskType - 任务类型 ("analysis", "conversation", "code", etc.)
   * @returns {string} 推荐的服务ID
   */
  getRecommendedService(taskType = "analysis") {
    // 可以根据不同任务类型推荐不同的模型
    switch (taskType) {
      case "analysis":
        // 数据分析任务优先使用智谱AI
        return "zhipu";
      case "conversation":
        // 对话任务可以使用本地模型
        return "ollama";
      case "code":
        // 代码相关任务
        return "zhipu";
      default:
        return this.currentService;
    }
  }
}

// 创建单例实例
const aiServiceManager = new AIServiceManager();

export default aiServiceManager;

// 导出便捷函数
export const {
  getAvailableServices,
  getCurrentService,
  setCurrentService,
  checkServiceAvailability,
  sendChatRequest,
  getRecommendedService,
} = aiServiceManager;
