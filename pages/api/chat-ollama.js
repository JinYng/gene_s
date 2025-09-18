// pages/api/chat-ollama.js

import formidable from "formidable";
import fs from "fs";
import path from "path";
import axios from "axios";
import { ErrorHandler, createError, AppError } from "../../lib/errorHandler.js";
import appConfig, { getConfig } from "../../config/index.js";
import { getModelById } from "../../config/models.js";
import { createChatModel } from "../../lib/llmFactory.js";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

export const config = {
  api: {
    bodyParser: false,
  },
};

// 会话管理 - 增强版
const sessions = new Map();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    const error = createError.validation("method", "只支持POST请求");
    return res.status(405).json(ErrorHandler.formatErrorResponse(error));
  }

  let uploadedFiles = [];
  const startTime = Date.now();

  try {
    // 使用配置中的设置
    const storageConfig = getConfig("storage");
    const tempDir = storageConfig.tempDir;

    // 解析请求
    const form = formidable({
      uploadDir: tempDir,
      keepExtensions: true,
      maxFileSize: storageConfig.maxFileSize,
      maxTotalFileSize: storageConfig.maxTotalFileSize,
      multiples: true,
    });

    // 确保临时目录存在
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const [fields, files] = await form.parse(req);

    const message = fields.message?.[0] || "";
    const sessionId = fields.sessionId?.[0] || `enhanced_session_${Date.now()}`;
    const useWorkflow = fields.useWorkflow?.[0] === "true";

    // 新的模型配置处理逻辑
    const modelPayloadString = fields.modelPayload?.[0];
    let modelPayload;

    if (modelPayloadString) {
      try {
        modelPayload = JSON.parse(modelPayloadString);
        console.log('🤖 接收到模型配置:', modelPayload);
      } catch (error) {
        console.error('解析模型配置失败:', error);
        return res.status(400).json({
          success: false,
          message: "无效的模型配置格式"
        });
      }
    } else {
      // 向后兼容：如果没有modelPayload，使用旧的逻辑
      const selectedModelId = fields.selectedModelId?.[0] || 'ollama-gemma';
      const apiKey = fields.apiKey?.[0];

      modelPayload = {
        id: selectedModelId,
        provider: getModelById(selectedModelId)?.provider || 'Ollama',
        config: null
      };

      console.log('🔄 使用向后兼容的模型配置:', modelPayload);
    }

    // 处理上传的文件
    uploadedFiles = Object.values(files).flat().filter(Boolean);

    console.log(`\n🚀 处理开始:`);
    console.log(`📝 消息: ${message}`);
    console.log(`🆔 会话: ${sessionId}`);
    console.log(`🤖 选择模型: ${modelPayload.id} (${modelPayload.provider})`);
    console.log(`📁 文件: ${uploadedFiles.length}个`);
    console.log(`⚙️ 使用工作流: ${useWorkflow}`);

    // 获取或创建会话
    let session = sessions.get(sessionId) || {
      id: sessionId,
      messages: [],
      uploadedFiles: [],
      workflowResults: [],
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    // 更新会话信息
    session.lastActivity = new Date();
    session.messages.push({
      role: "user",
      content: message,
      files: uploadedFiles.map((f) => ({
        name: f.originalFilename,
        size: f.size,
      })),
      timestamp: new Date(),
    });

    // 如果有文件上传，添加到会话中
    if (uploadedFiles.length > 0) {
      session.uploadedFiles.push(...uploadedFiles);
    }

    sessions.set(sessionId, session);

    // 初始化响应数组
    let responses = [];

    // 如果有文件上传但没有分析指令，添加简洁的文件确认
    if (uploadedFiles.length > 0 && !useWorkflow) {
      const fileInfos = uploadedFiles.map((file) => {
        const ext = file.originalFilename.toLowerCase().split(".").pop();
        let icon = "📎";
        switch (ext) {
          case "h5ad":
            icon = "🧬";
            break;
          case "csv":
            icon = "📊";
            break;
          case "tsv":
          case "txt":
            icon = "📄";
            break;
        }
        return {
          name: file.originalFilename,
          size: file.size,
          type: file.mimetype || "unknown",
          path: file.filepath,
          icon: icon,
          ext: ext,
        };
      });

      const fileNames = fileInfos.map((f) => `${f.icon} ${f.name}`).join(", ");
      responses.push({
        type: "file_uploaded",
        content: `📁 文件已上传: ${fileNames}`,
        files: fileInfos,
      });
    }

    // 检查是否应该调用Python代理 - 简化逻辑，移除关键词匹配
    if (useWorkflow) {
      console.log("🐍 调用Python LangChain代理 (基于useWorkflow标志)...");

      // 优先查找H5AD文件，然后是CSV/TSV文件
      const h5adFile = uploadedFiles.find((f) =>
        f.originalFilename.endsWith(".h5ad")
      );
      const expressionFile = uploadedFiles.find(
        (f) =>
          f.originalFilename.endsWith(".csv") ||
          f.originalFilename.endsWith(".tsv")
      );
      const metadataFile = uploadedFiles.find(
        (f) =>
          f.originalFilename.includes("meta") &&
          f.originalFilename.endsWith(".tsv")
      );

      // 确定主文件路径和元数据文件路径
      let mainFilePath = null;
      let metadataFilePath = null;

      if (h5adFile) {
        mainFilePath = h5adFile.filepath;
        console.log(
          `📂 检测到H5AD文件: ${h5adFile.originalFilename}, 路径: ${mainFilePath}`
        );
      } else if (expressionFile) {
        mainFilePath = expressionFile.filepath;
        console.log(
          `📂 检测到表达文件: ${expressionFile.originalFilename}, 路径: ${mainFilePath}`
        );
        if (metadataFile) {
          metadataFilePath = metadataFile.filepath;
          console.log(
            `📂 检测到元数据文件: ${metadataFile.originalFilename}, 路径: ${metadataFilePath}`
          );
        }
      } else if (uploadedFiles.length > 0) {
        // 备用逻辑：如果分不出来，就用第一个
        mainFilePath = uploadedFiles[0].filepath;
        console.log(
          `📂 使用第一个文件: ${uploadedFiles[0].originalFilename}, 路径: ${mainFilePath}`
        );
      }

      try {
        // 调用新的 Python FastAPI 服务器
        const agentResult = await callAnalysisServer(
          message,
          mainFilePath,
          sessionId
        );

        // 检查Python分析服务器的响应类型
        if (agentResult && agentResult.success && agentResult.data) {
          // 合并分析完成和可视化响应
          responses.push({
            type: "deckgl_visualization",
            content: "✅ 分析完成！",
            visualizationData: agentResult.data,
          });
        } else if (agentResult && agentResult.success === false) {
          responses.push({
            type: "error",
            content: `❌ ${agentResult.message || "分析失败"}`,
          });
        } else {
          responses.push({
            type: "agent_result",
            content: agentResult,
          });
        }
      } catch (agentError) {
        console.error("Python分析服务器调用失败:", agentError);

        // 使用统一错误处理
        const handledError = ErrorHandler.handlePythonServiceError(agentError);

        responses.push({
          type: "error",
          content: `AI分析服务调用失败: ${handledError.message}`,
          errorDetails: handledError.details,
        });
      }
    } else {
      // 💬 使用 LangChain 通用对话模式 (重构后的部分)
      console.log("💬 执行LangChain统一聊天模式...");

      try {
        // 1. 使用工厂创建模型实例 - 传递新的modelPayload
        console.log(`🤖 使用模型: ${modelPayload.id} (${modelPayload.provider})`);
        const chatModel = createChatModel(modelPayload);

        // 3. 构建标准化的对话历史 (HumanMessage, AIMessage)
        const chatHistory = session.messages.slice(-5).map(msg => {
          const content = typeof msg.content === 'object' ?
            (msg.content.text || JSON.stringify(msg.content)) :
            (msg.content || '');

          return msg.role === 'user' ?
            new HumanMessage(content) :
            new AIMessage(content);
        });

        // 4. 如果有文件上传，添加文件信息到提示中
        let enhancedMessage = message;
        if (uploadedFiles.length > 0) {
          const fileList = uploadedFiles.map(file => {
            const ext = file.originalFilename.toLowerCase().split(".").pop();
            let icon = "📎";
            switch (ext) {
              case "h5ad": icon = "🧬"; break;
              case "csv": icon = "📊"; break;
              case "tsv":
              case "txt": icon = "📄"; break;
            }
            return `${icon} ${file.originalFilename} (${(file.size / 1024 / 1024).toFixed(2)}MB)`;
          }).join(", ");

          enhancedMessage = `用户已上传文件: ${fileList}\n\n用户消息: ${message}\n\n请根据用户的问题和上传的文件提供有帮助的回答。如果用户想要分析数据，建议他们开启"使用工作流"选项来进行深入的数据分析。`;
        }

        // 添加当前消息到历史中
        chatHistory.push(new HumanMessage(enhancedMessage));

        // 5. 调用模型 (所有模型都使用统一的 .invoke() 方法!)
        console.log(`🚀 调用${modelPayload.provider}模型...`);
        const result = await chatModel.invoke(chatHistory);

        // 6. 格式化标准响应
        const finalResponses = [{
          type: 'chat_response',
          content: result.content || result.text || result.response || String(result)
        }];

        responses.push(...finalResponses);

        console.log(`✅ ${modelPayload.provider}模型响应成功`);

      } catch (chatError) {
        console.error("LangChain聊天模式失败:", chatError);

        // 详细的错误处理
        let errorMessage = "AI聊天服务暂时不可用";
        let suggestion = "";

        if (chatError.message.includes("API") || chatError.message.includes("密钥")) {
          errorMessage = "API密钥验证失败";
          suggestion = "请检查您的API密钥是否正确配置";
        } else if (chatError.message.includes("timeout") || chatError.message.includes("超时")) {
          errorMessage = "服务响应超时";
          suggestion = "请稍后重试";
        } else if (chatError.message.includes("Ollama") || chatError.message.includes("11434")) {
          errorMessage = "本地Ollama服务不可用";
          suggestion = "请确保Ollama服务正在运行 (ollama serve)";
        }

        responses.push({
          type: "error",
          content: `${errorMessage}: ${chatError.message}${suggestion ? `\n\n💡 ${suggestion}` : ''}`,
          errorDetails: {
            provider: modelPayload.provider,
            originalError: chatError.message
          }
        });
      }
    }

    // 添加AI响应到会话
    responses.forEach((response) => {
      session.messages.push({
        role: "assistant",
        content: response.content,
        type: response.type,
        timestamp: new Date(),
      });
    });

    const processingTime = Date.now() - startTime;
    console.log(`✅ 处理完成，耗时: ${processingTime}ms`);

    // 返回响应
    res.status(200).json({
      responses,
      aiService: `${modelPayload.id} (${modelPayload.provider})`,
      sessionId,
      processingTime,
      workflowUsed: useWorkflow,
      success: true,
    });
  } catch (error) {
    console.error("❌ 聊天处理失败:", error);

    // 清理临时文件
    await cleanupTempFiles(uploadedFiles);

    // 使用统一错误处理
    const errorResponse = ErrorHandler.formatErrorResponse(error);

    // 添加响应格式以保持兼容性
    errorResponse.responses = [
      {
        type: "error",
        content: `处理请求时发生错误: ${error.message}`,
      },
    ];

    // 根据错误类型设置状态码
    let statusCode = 500;
    if (error instanceof AppError) {
      switch (error.type) {
        case "VALIDATION_ERROR":
        case "FILE_UPLOAD_ERROR":
          statusCode = 400;
          break;
        case "PYTHON_SERVICE_ERROR":
        case "OLLAMA_SERVICE_ERROR":
          statusCode = 503;
          break;
        case "TIMEOUT_ERROR":
          statusCode = 408;
          break;
        default:
          statusCode = 500;
      }
    }

    res.status(statusCode).json(errorResponse);
  }
}

/**
 * 清理临时文件
 */
async function cleanupTempFiles(files) {
  if (!files || files.length === 0) return;

  try {
    await Promise.all(
      files.map(async (file) => {
        if (file.filepath && fs.existsSync(file.filepath)) {
          await fs.promises.unlink(file.filepath);
          console.log(`🗑️ 清理临时文件: ${file.filepath}`);
        }
      })
    );
  } catch (error) {
    console.error("清理临时文件失败:", error);
  }
}

/**
 * 调用 Python FastAPI 分析服务器
 * @param {string} query - 用户的自然语言查询
 * @param {string} filePath - 数据文件路径
 * @param {string} sessionId - 会话ID
 * @returns {Promise<object>} - 从Python服务器返回的JSON对象
 */
async function callAnalysisServer(query, filePath, sessionId) {
  const pythonConfig = getConfig("python");
  const serverUrl = `${pythonConfig.serviceUrl}/analyze`;

  console.log(`🚀 向Python分析服务器发送请求: ${serverUrl}`);

  const requestBody = {
    query: query,
    file_path: filePath,
    session_id: sessionId,
  };

  let retries = 0;
  const maxRetries = pythonConfig.maxRetries;

  while (retries <= maxRetries) {
    try {
      const response = await axios.post(serverUrl, requestBody, {
        headers: { "Content-Type": "application/json" },
        timeout: pythonConfig.timeout,
      });

      console.log("✅ 成功从Python服务器接收到响应:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        `❌ 调用Python分析服务器时出错 (尝试 ${retries + 1}/${
          maxRetries + 1
        }):`,
        error.message
      );

      // 如果是最后一次重试，抛出错误
      if (retries === maxRetries) {
        throw ErrorHandler.handlePythonServiceError(error);
      }

      // 等待后重试
      retries++;
      await new Promise((resolve) =>
        setTimeout(resolve, pythonConfig.retryDelay)
      );
    }
  }
}
