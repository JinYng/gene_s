// lib/llmFactory.js
// LangChain 统一模型工厂 - 将所有AI模型提供商统一到标准接口

import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { ChatOpenAI } from "@langchain/openai";
import { SimpleChatModel } from "@langchain/core/language_models/chat_models";
import axios from "axios";
import { getConfig } from "../config/index.js";
// 新增: 在文件顶部进行静态导入，解决 await 错误
import { getModelById } from "../config/models.js";

// --- 为非 OpenAI 兼容的模型创建自定义 LangChain 类 ---

/**
 * 自定义DashScope (通义千问) 聊天模型
 * (这部分代码保持不变，设计良好)
 */
class CustomDashScopeChat extends SimpleChatModel {
  constructor(fields) {
    super(fields);
    this.modelId = fields.modelId;
    this.apiKey = fields.apiKey;
    this.baseUrl = fields.baseUrl || "https://dashscope.aliyuncs.com/api/v1";
    this.temperature = fields.temperature ?? 0.7;
  }

  _llmType() {
    return "custom_dashscope_chat";
  }

  async _call(messages, options) {
    try {
      const history = messages.map((msg) => ({
        role: msg.role === "ai" ? "assistant" : msg.role,
        content: msg.content,
      }));
      const apiUrl = `${this.baseUrl}/services/aigc/text-generation/generation`;
      const requestBody = {
        model: this.modelId,
        input: { messages: history },
        parameters: {
          temperature: this.temperature,
          max_tokens: options?.max_tokens || 2000,
        },
      };
      console.log(`🌐 调用DashScope API: ${this.modelId}`);
      const response = await axios.post(apiUrl, requestBody, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: options?.timeout || 30000,
      });
      if (response.data?.output?.text) {
        return response.data.output.text;
      } else if (response.data?.output?.choices?.[0]?.message?.content) {
        return response.data.output.choices[0].message.content;
      } else {
        throw new Error(
          `DashScope API响应格式异常: ${JSON.stringify(response.data)}`
        );
      }
    } catch (error) {
      console.error(`❌ DashScope API调用失败:`, error.message);
      throw new Error(
        `DashScope模型调用失败: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }
}

/**
 * 根据模型配置动态创建并返回一个 LangChain ChatModel 实例
 * 这是整个系统的核心抽象 - 所有模型都通过这个工厂统一创建
 *
 * @param {object} modelPayload - 来自前端或API的完整模型配置对象
 * @param {string} modelPayload.id - 模型ID
 * @param {string} modelPayload.provider - 模型提供商
 * @param {string} [modelPayload.apiKey] - API密钥 (对于需要密钥的模型)
 * @param {object} [modelPayload.config] - 自定义模型配置 (用于Custom provider)
 * @returns {import("@langchain/core/language_models/chat_models").BaseChatModel}
 * @throws {Error} 当模型配置无效或创建失败时
 */
export function createChatModel(modelPayload) {
  if (!modelPayload) {
    throw new Error("模型配置(modelPayload)不能为空");
  }

  const { id, provider, config, apiKey } = modelPayload;

  console.log(`🏭 LLM工厂准备创建模型: ${id} (${provider})`);

  try {
    // 1. 处理自定义模型 (Provider: 'Custom')
    if (provider === "Custom") {
      if (!config || !config.baseUrl || !config.apiKey || !config.model) {
        throw new Error("自定义模型配置不完整：需要baseUrl、apiKey和model字段");
      }
      console.log(`🔗 使用自定义OpenAI兼容接口: ${config.baseUrl}`);
      return new ChatOpenAI({
        apiKey: config.apiKey,
        modelName: config.model,
        configuration: { baseURL: config.baseUrl },
        temperature: 0.7,
        maxTokens: 2000,
      });
    }

    // 2. 处理预定义模型 (从 config/models.js 中获取配置)
    const modelConfig = getModelById(id);
    if (!modelConfig) {
      throw new Error(`未在 config/models.js 中找到模型配置: ${id}`);
    }

    const { modelId, is_openai_compatible, base_url } = modelConfig;

    // 2a. 处理 OpenAI 兼容的预定义模型
    if (is_openai_compatible) {
      console.log(`🔗 使用预定义OpenAI兼容接口: ${base_url}`);
      return new ChatOpenAI({
        apiKey: apiKey, // 直接从 modelPayload 获取 apiKey
        modelName: modelId,
        configuration: { baseURL: base_url },
        temperature: 0.7,
        maxTokens: 2000,
      });
    }

    // 2b. 处理非兼容的特殊预定义模型
    switch (provider) {
      case "Ollama": {
        const ollamaConfig = getConfig("ai.ollama");
        const baseUrl = ollamaConfig?.baseUrl || "http://localhost:11434";
        console.log(`🖥️ 使用Ollama本地模型: ${baseUrl}`);
        return new ChatOllama({
          baseUrl: baseUrl,
          model: modelId,
          temperature: 0.7,
        });
      }

      case "ModelScope": {
        console.log(`⚡ 使用自定义DashScope模型: ${modelId}`);
        return new CustomDashScopeChat({
          apiKey: apiKey, // 直接从 modelPayload 获取 apiKey
          modelId: modelId,
          baseUrl: base_url,
          temperature: 0.7,
        });
      }

      default:
        throw new Error(
          `不支持的 LLM provider: ${provider}。请检查模型配置或实现对应的模型类。`
        );
    }
  } catch (error) {
    console.error(`❌ 创建模型 '${id}' 失败:`, error.message);
    // 抛出更具体的错误，便于调试
    throw new Error(`无法创建模型 '${id}' (${provider}): ${error.message}`);
  }
}

// --- 辅助函数 ---

/**
 * 获取支持的模型提供商列表
 * @returns {string[]} 提供商名称数组
 */
export function getSupportedProviders() {
  return ["Ollama", "OpenAI", "智谱", "ModelScope", "Custom"];
}

/**
 * 检查是否为OpenAI兼容模型
 * @param {object} modelConfig - 模型配置
 * @returns {boolean} 是否为OpenAI兼容
 */
export function isOpenAICompatible(modelConfig) {
  return Boolean(modelConfig?.is_openai_compatible);
}
