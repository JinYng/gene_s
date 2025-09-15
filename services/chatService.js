// services/chatService.js
// 聊天服务 - 支持多种AI模型的统一接口

import aiServiceManager from "./aiServiceManager.js";

export const chatService = {
  /**
   * 发送消息到聊天API
   * @param {string} message - 用户消息
   * @param {File[]} files - 上传的文件
   * @param {string} sessionId - 会话ID
   * @param {string} aiService - 指定的AI服务（可选）
   * @param {boolean} useEnhancedWorkflow - 是否使用增强工作流
   * @returns {Promise} API响应
   */
  async sendMessage(
    message,
    files = [],
    sessionId,
    aiService = null,
    useEnhancedWorkflow = false
  ) {
    try {
      // 决定使用哪个API端点
      const endpoint = useEnhancedWorkflow
        ? "/api/chat-ollama"
        : await aiServiceManager.getApiEndpoint(aiService);

      // 构建请求数据
      const formData = new FormData();

      // 处理消息内容 - 确保正确序列化对象或提取文本
      const messageContent =
        typeof message === "string"
          ? message
          : typeof message === "object" && message !== null
          ? message.text || JSON.stringify(message)
          : String(message);

      formData.append("message", messageContent);
      formData.append("sessionId", sessionId || `session_${Date.now()}`);
      formData.append("useWorkflow", useEnhancedWorkflow.toString());

      // 添加文件
      if (files && files.length > 0) {
        files.forEach((file, index) => {
          formData.append(`file_${index}`, file);
        });
      }

      // 发送请求
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 500) {
          throw new Error(
            `服务器内部错误。请确保Python分析服务器已启动（运行npm run chat-server命令），并且Ollama服务正在运行。`
          );
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // 添加工作流信息到响应
      if (useEnhancedWorkflow) {
        data.workflowEnhanced = true;
        data.workflowUsed = data.workflowUsed || false;
      }

      return data;
    } catch (error) {
      console.error("聊天服务错误:", error);
      throw error;
    }
  },

  /**
   * 发送增强工作流请求
   * @param {string} message - 用户消息
   * @param {File[]} files - 上传的文件
   * @param {string} sessionId - 会话ID
   * @returns {Promise} API响应
   */
  async sendEnhancedWorkflowMessage(message, files = [], sessionId) {
    return this.sendMessage(message, files, sessionId, null, true);
  },

  /**
   * 检查是否应该使用增强工作流
   * @param {string|object} message - 用户消息（可能是字符串或包含text字段的对象）
   * @param {File[]} files - 文件列表
   * @returns {boolean} 是否使用增强工作流
   */
  shouldUseEnhancedWorkflow(message, files = []) {
    // 提取消息文本内容
    const messageText =
      typeof message === "string" ? message : message?.text || "";
    const message_lower = messageText.toLowerCase();
    const analysisKeywords = [
      "分析",
      "umap",
      "tsne",
      "聚类",
      "降维",
      "可视化",
      "质控",
      "标准化",
      "差异表达",
      "cluster",
      "analysis",
      "visualization",
    ];

    const hasAnalysisKeywords = analysisKeywords.some((keyword) =>
      message_lower.includes(keyword)
    );

    const hasFiles = files && files.length > 0;

    return hasAnalysisKeywords || hasFiles;
  },

  /**
   * 获取可用的AI服务列表
   * @returns {Object} 可用的AI服务
   */
  getAvailableServices() {
    return aiServiceManager.getAvailableServices();
  },

  /**
   * 获取当前使用的AI服务
   * @returns {Object} 当前AI服务配置
   */
  getCurrentService() {
    return aiServiceManager.getCurrentService();
  },

  /**
   * 设置当前使用的AI服务
   * @param {string} serviceId - 服务ID
   * @returns {boolean} 设置是否成功
   */
  setCurrentService(serviceId) {
    return aiServiceManager.setCurrentService(serviceId);
  },

  /**
   * 检查AI服务可用性
   * @param {string} serviceId - 服务ID
   * @returns {Promise<boolean>} 服务是否可用
   */
  async checkServiceAvailability(serviceId) {
    return await aiServiceManager.checkServiceAvailability(serviceId);
  },

  /**
   * 获取推荐的AI服务
   * @param {string} taskType - 任务类型
   * @returns {string} 推荐的服务ID
   */
  getRecommendedService(taskType = "analysis") {
    return aiServiceManager.getRecommendedService(taskType);
  },

  /**
   * 下载生成的文件
   * @param {string} filename - 文件名
   * @returns {Promise} 下载响应
   */
  async downloadFile(filename) {
    try {
      const response = await fetch(
        `/api/download-h5ad?filename=${encodeURIComponent(filename)}`
      );

      if (!response.ok) {
        throw new Error(`下载失败: ${response.status} ${response.statusText}`);
      }

      return response;
    } catch (error) {
      console.error("文件下载错误:", error);
      throw error;
    }
  },
};
