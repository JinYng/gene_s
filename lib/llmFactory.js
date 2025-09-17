// lib/llmFactory.js
// LangChain 统一模型工厂 - 将所有AI模型提供商统一到标准接口

import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { ChatOpenAI } from "@langchain/openai";
import { SimpleChatModel } from "@langchain/core/language_models/chat_models";
import axios from 'axios';
import { getConfig } from "../config/index.js";

// --- 为非 OpenAI 兼容的模型创建自定义 LangChain 类 ---

/**
 * 自定义DashScope (通义千问) 聊天模型
 * 实现LangChain接口以支持阿里云通义千问API
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
      // 转换消息格式到DashScope格式
      const history = messages.map(msg => ({
        role: msg.role === 'ai' ? 'assistant' : msg.role,
        content: msg.content
      }));

      const apiUrl = `${this.baseUrl}/services/aigc/text-generation/generation`;

      const requestBody = {
        model: this.modelId,
        input: { messages: history },
        parameters: {
          temperature: this.temperature,
          max_tokens: options?.max_tokens || 2000
        }
      };

      console.log(`🌐 调用DashScope API: ${this.modelId}`);

      const response = await axios.post(apiUrl, requestBody, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: options?.timeout || 30000
      });

      if (response.data?.output?.text) {
        return response.data.output.text;
      } else if (response.data?.output?.choices?.[0]?.message?.content) {
        return response.data.output.choices[0].message.content;
      } else {
        throw new Error(`DashScope API响应格式异常: ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      console.error(`❌ DashScope API调用失败:`, error.message);
      throw new Error(`DashScope模型调用失败: ${error.response?.data?.message || error.message}`);
    }
  }
}

/**
 * 根据模型配置动态创建并返回一个 LangChain ChatModel 实例
 * 这是整个系统的核心抽象 - 所有模型都通过这个工厂统一创建
 *
 * @param {object} modelConfig - 来自 config/models.js 的模型对象
 * @param {string} [apiKey] - 用户提供的 API Key (对需要密钥的模型)
 * @returns {import("@langchain/core/language_models/chat_models").BaseChatModel}
 * @throws {Error} 当模型配置无效或创建失败时
 */
export function createChatModel(modelConfig, apiKey) {
  if (!modelConfig) {
    throw new Error('模型配置不能为空');
  }

  const { provider, modelId, is_openai_compatible, base_url, requires_api_key } = modelConfig;

  // 验证API密钥要求
  if (requires_api_key && !apiKey) {
    throw new Error(`模型 ${modelConfig.name} 需要API密钥，但未提供`);
  }

  console.log(`🏭 LLM工厂创建模型: ${modelConfig.name} (${provider})`);

  try {
    // 优先处理所有 OpenAI 兼容的模型 - 这是最简单的情况
    if (is_openai_compatible) {
      console.log(`🔗 使用OpenAI兼容接口: ${base_url}`);
      return new ChatOpenAI({
        apiKey: apiKey,
        modelName: modelId,
        configuration: {
          baseURL: base_url
        },
        temperature: 0.7,
        maxTokens: 2000,
      });
    }

    // 处理非兼容的特殊模型
    switch (provider) {
      case 'Ollama': {
        const ollamaConfig = getConfig('ai.ollama');
        const baseUrl = ollamaConfig?.baseUrl || 'http://localhost:11434';
        console.log(`🖥️ 使用Ollama本地模型: ${baseUrl}`);
        return new ChatOllama({
          baseUrl: baseUrl,
          model: modelId,
          temperature: 0.7,
        });
      }

      case 'ModelScope': {
        console.log(`⚡ 使用自定义DashScope模型: ${modelId}`);
        return new CustomDashScopeChat({
          apiKey: apiKey,
          modelId: modelId,
          baseUrl: base_url,
          temperature: 0.7,
        });
      }

      default:
        throw new Error(`不支持的 LLM provider: ${provider}。请检查模型配置或实现对应的模型类。`);
    }
  } catch (error) {
    console.error(`❌ 创建模型失败:`, error.message);
    throw new Error(`无法创建模型 ${modelConfig.name}: ${error.message}`);
  }
}

/**
 * 验证模型是否可用
 * 发送一个简单的测试消息来检查模型连接性
 *
 * @param {object} modelConfig - 模型配置
 * @param {string} [apiKey] - API密钥
 * @returns {Promise<boolean>} 模型是否可用
 */
export async function validateModel(modelConfig, apiKey) {
  try {
    const model = createChatModel(modelConfig, apiKey);

    // 导入消息类型
    const { HumanMessage } = await import("@langchain/core/messages");

    // 发送简单测试消息
    const testMessage = new HumanMessage("测试连接");
    const response = await model.invoke([testMessage], { timeout: 10000 });

    console.log(`✅ 模型 ${modelConfig.name} 验证成功`);
    return true;
  } catch (error) {
    console.error(`❌ 模型 ${modelConfig.name} 验证失败:`, error.message);
    return false;
  }
}

/**
 * 获取支持的模型提供商列表
 * @returns {string[]} 提供商名称数组
 */
export function getSupportedProviders() {
  return ['Ollama', 'OpenAI', '智谱', 'ModelScope'];
}

/**
 * 检查是否为OpenAI兼容模型
 * @param {object} modelConfig - 模型配置
 * @returns {boolean} 是否为OpenAI兼容
 */
export function isOpenAICompatible(modelConfig) {
  return Boolean(modelConfig?.is_openai_compatible);
}