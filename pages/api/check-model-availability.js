// pages/api/check-model-availability.js
// AI模型可用性验证API

import { ErrorHandler, createError } from "../../lib/errorHandler.js";
import { getConfig } from "../../config/index.js";
import { getModelById } from "../../config/models.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    const error = createError.validation("method", "只支持POST请求");
    return res.status(405).json(ErrorHandler.formatErrorResponse(error));
  }

  try {
    const { modelId, apiKey } = req.body;

    // 验证请求参数
    if (!modelId) {
      return res.status(400).json({
        success: false,
        status: "unavailable",
        message: "模型ID不能为空",
      });
    }

    // 获取模型配置
    const model = getModelById(modelId);
    if (!model) {
      return res.status(400).json({
        success: false,
        status: "unavailable",
        message: "未知的模型ID",
      });
    }

    console.log(`🔍 检查模型可用性: ${model.name} (${model.provider})`);

    // 根据模型类型进行不同的验证
    let availabilityResult;

    switch (model.provider) {
      case 'Ollama':
        availabilityResult = await checkOllamaAvailability(model);
        break;
      case '智谱':
        availabilityResult = await checkZhipuAvailability(model, apiKey);
        break;
      case 'OpenAI':
        availabilityResult = await checkOpenAIAvailability(model, apiKey);
        break;
      default:
        return res.status(400).json({
          success: false,
          status: "unavailable",
          message: `不支持的模型提供商: ${model.provider}`,
        });
    }

    // 返回验证结果
    return res.status(200).json(availabilityResult);

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

/**
 * 检查Ollama本地模型可用性
 */
async function checkOllamaAvailability(model) {
  try {
    const ollamaConfig = getConfig("ai.ollama");
    const response = await fetch(`${ollamaConfig.baseUrl}/api/tags`, {
      method: 'GET',
      timeout: 5000,
    });

    if (!response.ok) {
      return {
        success: false,
        status: "unavailable",
        message: "Ollama服务不可用，请确保已启动 ollama serve",
      };
    }

    const data = await response.json();
    const availableModels = data.models?.map(m => m.name) || [];

    // 检查指定模型是否已下载
    const isModelAvailable = availableModels.some(name =>
      name.includes(model.modelId) || name.includes(model.modelId.split(':')[0])
    );

    if (isModelAvailable) {
      return {
        success: true,
        status: "available",
        message: "模型可用",
      };
    } else {
      return {
        success: false,
        status: "unavailable",
        message: `模型 ${model.modelId} 未找到，请运行: ollama pull ${model.modelId}`,
      };
    }

  } catch (error) {
    console.error("Ollama检查失败:", error);
    return {
      success: false,
      status: "unavailable",
      message: "无法连接到Ollama服务，请检查是否已启动",
    };
  }
}

/**
 * 检查智谱AI可用性
 */
async function checkZhipuAvailability(model, apiKey) {
  try {
    if (!apiKey) {
      return {
        success: false,
        status: "unconfigured",
        message: "请输入智谱AI的API密钥",
      };
    }

    const zhipuConfig = getConfig("ai.zhipu");
    const response = await fetch(`${zhipuConfig.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model.modelId,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1,
      }),
      timeout: 10000,
    });

    if (response.ok) {
      return {
        success: true,
        status: "available",
        message: "API密钥验证成功",
      };
    } else if (response.status === 401) {
      return {
        success: false,
        status: "unavailable",
        message: "API密钥无效，请检查后重试",
      };
    } else {
      return {
        success: false,
        status: "unavailable",
        message: `API调用失败 (${response.status})`,
      };
    }

  } catch (error) {
    console.error("智谱AI检查失败:", error);
    return {
      success: false,
      status: "unavailable",
      message: "网络错误，无法验证API密钥",
    };
  }
}

/**
 * 检查OpenAI可用性
 */
async function checkOpenAIAvailability(model, apiKey) {
  try {
    if (!apiKey) {
      return {
        success: false,
        status: "unconfigured",
        message: "请输入OpenAI的API密钥",
      };
    }

    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      timeout: 10000,
    });

    if (response.ok) {
      const data = await response.json();
      const isModelAvailable = data.data?.some(m => m.id === model.modelId);

      if (isModelAvailable) {
        return {
          success: true,
          status: "available",
          message: "API密钥验证成功",
        };
      } else {
        return {
          success: false,
          status: "unavailable",
          message: `模型 ${model.modelId} 不可用`,
        };
      }
    } else if (response.status === 401) {
      return {
        success: false,
        status: "unavailable",
        message: "API密钥无效，请检查后重试",
      };
    } else {
      return {
        success: false,
        status: "unavailable",
        message: `API调用失败 (${response.status})`,
      };
    }

  } catch (error) {
    console.error("OpenAI检查失败:", error);
    return {
      success: false,
      status: "unavailable",
      message: "网络错误，无法验证API密钥",
    };
  }
}