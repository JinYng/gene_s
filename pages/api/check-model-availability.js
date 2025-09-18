// pages/api/check-model-availability.js
// AI模型可用性验证API - 使用LangChain统一工厂

import { ErrorHandler, createError } from "../../lib/errorHandler.js";
import { getConfig } from "../../config/index.js";
import { getModelById } from "../../config/models.js";
import { createChatModel } from "../../lib/llmFactory.js";
import { HumanMessage } from "@langchain/core/messages";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    const error = createError.validation("method", "只支持POST请求");
    return res.status(405).json(ErrorHandler.formatErrorResponse(error));
  }

  try {
    const { modelId, apiKey, customConfig } = req.body;

    // 验证请求参数
    if (!modelId) {
      return res.status(400).json({
        success: false,
        status: "unavailable",
        message: "模型ID不能为空",
      });
    }

    // 获取模型配置
    const modelConfig = getModelById(modelId);
    if (!modelConfig) {
      return res.status(400).json({
        success: false,
        status: "unavailable",
        message: "未知的模型ID",
      });
    }

    console.log(`🔍 检查模型可用性: ${modelConfig.name} (${modelConfig.provider})`);

    // 使用LangChain统一工厂进行验证
    try {
      console.log(`🏭 使用LangChain工厂创建模型: ${modelConfig.provider}`);

      let model;

      // 如果是自定义模型，需要特殊处理
      if (modelConfig.provider === 'Custom') {
        if (!customConfig || !customConfig.baseUrl || !customConfig.apiKey || !customConfig.model) {
          return res.status(400).json({
            success: false,
            status: "unconfigured",
            message: "自定义模型配置信息不完整",
            suggestion: "请填写完整的配置信息（名称、Base URL、API密钥、模型标识）",
          });
        }

        // 构建完整的modelPayload对象
        const modelPayload = {
          id: modelConfig.id,
          provider: modelConfig.provider,
          config: customConfig
        };

        console.log('🤖 验证自定义模型配置:', modelPayload);
        model = createChatModel(modelPayload);
      } else {
        // 构建预定义模型的modelPayload对象
        const modelPayload = {
          id: modelConfig.id,
          provider: modelConfig.provider,
          apiKey: apiKey,
          config: null
        };

        console.log('🤖 验证预定义模型:', modelPayload);
        model = createChatModel(modelPayload);
      }

      // 发送一个简短的测试消息来验证连接
      console.log(`🧪 发送测试消息验证模型...`);
      const testMessage = new HumanMessage("测试");

      // 设置较短的超时时间进行快速验证
      await model.invoke([testMessage], { timeout: 10000 });

      console.log(`✅ 模型 ${modelConfig.name} 验证成功`);

      return res.status(200).json({
        success: true,
        status: "available",
        message: "模型验证成功",
        provider: modelConfig.provider,
        modelName: modelConfig.name,
      });

    } catch (modelError) {
      console.error(`❌ 模型验证失败:`, modelError.message);

      // 基于错误类型提供更精确的错误信息
      let errorMessage = "模型不可用";
      let suggestion = "";
      let status = "unavailable";

      if (modelError.message.includes("API") || modelError.message.includes("密钥")) {
        errorMessage = "API密钥验证失败";
        suggestion = "请检查您的API密钥是否正确";
        status = "unconfigured";
      } else if (modelError.message.includes("timeout") || modelError.message.includes("超时")) {
        errorMessage = "服务响应超时";
        suggestion = "请稍后重试";
      } else if (modelError.message.includes("Ollama") || modelError.message.includes("11434")) {
        errorMessage = "本地Ollama服务不可用";
        suggestion = "请确保Ollama服务正在运行 (ollama serve)";
      } else if (modelError.message.includes("模型") && modelError.message.includes("需要")) {
        errorMessage = "API密钥缺失";
        suggestion = "此模型需要API密钥才能使用";
        status = "unconfigured";
      } else if (modelError.message.includes("不支持的")) {
        errorMessage = "模型提供商不支持";
        suggestion = "请选择其他可用的模型";
      }

      return res.status(200).json({
        success: false,
        status: status,
        message: errorMessage,
        suggestion: suggestion,
        provider: modelConfig.provider,
        modelName: modelConfig.name,
        originalError: modelError.message,
      });
    }

  } catch (error) {
    console.error("❌ 模型可用性检查失败:", error);

    const errorResponse = ErrorHandler.formatErrorResponse(error);
    return res.status(500).json({
      success: false,
      status: "unavailable",
      message: errorResponse.message || "检查模型可用性时发生错误",
    });
  }
}

// 注意：所有原来的提供商特定检查函数（checkOllamaAvailability, checkZhipuAvailability, checkOpenAIAvailability）
// 现在都被LangChain统一工厂替代了，不再需要这些函数