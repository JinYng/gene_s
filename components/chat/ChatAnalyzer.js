// components/ChatAnalyzer.js

import React, { useState, useRef, useEffect, useCallback } from "react";
import ModernUnifiedChat from "./ModernUnifiedChat";
import VisualizationPanel from "./VisualizationPanel";
import AIModelManager from "./AIModelManager";
import { STORAGE_KEYS } from "../../config/models.js";
// 移除不再使用的 chatService
// import { chatService } from "../../services/chatService";
import {
  presetStyles,
  colors,
  spacing,
  fontSize,
  buttonStyles,
  titleStyles,
  flexUtils,
  createHoverStyles,
} from "../../styles";

const ChatAnalyzer = () => {
  const [isClient, setIsClient] = useState(false);

  const [sessionId] = useState(() => {
    if (typeof window !== "undefined") {
      return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return "session_placeholder";
  });

  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "assistant",
      content:
        '你好！我是你的AI单细胞数据分析助手。你可以上传数据文件，然后用自然语言告诉我你想要进行什么分析。\n例如：\n\n"对这个数据进行UMAP降维分析"\n\n"用cluster给细胞着色"\n\n"转换成H5AD格式"\n请先上传你的数据文件开始分析吧！',
    },
  ]);

  const [visualizationData, setVisualizationData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDataFile, setCurrentDataFile] = useState(null);
  const [currentAIService, setCurrentAIService] = useState(null);
  const [customConfig, setCustomConfig] = useState({});
  const [apiKeys, setApiKeys] = useState({}); // 新增：管理API密钥的状态

  // 初始化客户端和AI模型
  useEffect(() => {
    setIsClient(true);
    const initAIService = async () => {
      try {
        const { getModelById, DEFAULT_MODEL_ID } = await import(
          "../../config/models.js"
        );

        const savedModelId =
          localStorage.getItem(STORAGE_KEYS.SELECTED_MODEL) || DEFAULT_MODEL_ID;
        const model = getModelById(savedModelId);
        setCurrentAIService(model);

        // 加载自定义配置
        const savedCustomConfig = localStorage.getItem(
          STORAGE_KEYS.CUSTOM_CONFIG
        );
        if (savedCustomConfig) setCustomConfig(JSON.parse(savedCustomConfig));

        // 新增：加载API密钥
        const savedApiKeys = localStorage.getItem(STORAGE_KEYS.API_KEYS);
        if (savedApiKeys) setApiKeys(JSON.parse(savedApiKeys));

        console.log(`初始化AI模型: ${model.name}`);
      } catch (error) {
        console.error("初始化AI模型失败:", error);
        setCurrentAIService({
          id: "ollama-gemma",
          name: "Ollama 本地模型",
          provider: "Ollama",
          modelId: "gemma3:4b",
        });
      }
    };
    initAIService();
  }, []);

  // 将所有API调用逻辑统一到一个函数中
  const sendApiRequest = async (messageText, files = []) => {
    const formData = new FormData();
    formData.append("message", messageText);
    formData.append("sessionId", sessionId);
    formData.append("useWorkflow", String(files.length > 0));

    files.forEach((file) => {
      if (file instanceof File) {
        formData.append(`files`, file);
      }
    });

    // --- 关键修复：统一构建并添加模型配置信息 ---
    if (currentAIService) {
      const modelPayload = {
        id: currentAIService.id,
        provider: currentAIService.provider,
        config: currentAIService.id === "custom-api" ? customConfig : null,
        apiKey: apiKeys[currentAIService.id] || null,
      };
      formData.append("modelPayload", JSON.stringify(modelPayload));
      console.log("🤖 发送模型配置:", modelPayload);
    } else {
      console.error("❌ 未能发送模型配置，因为 currentAIService 未设置!");
    }

    const response = await fetch("/api/chat-ollama", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `API请求失败，状态码: ${response.status}`
      );
    }
    return response.json();
  };

  // 处理消息发送
  const handleSendMessage = async (message, files = []) => {
    let messageText =
      typeof message === "object" && message !== null
        ? message.text || ""
        : message;
    if (!messageText.trim() && files.length === 0) return;
    if (!isClient) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content:
        files.length > 0
          ? {
              text: messageText,
              files: files.map((f) => ({
                name: f.name,
                size: f.size,
                type: f.type,
              })),
            }
          : messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await sendApiRequest(messageText, files);
      handleApiResponse(response);
    } catch (error) {
      console.error("发送消息失败:", error);
      const errorMessage = {
        id: Date.now(),
        type: "assistant",
        content: `抱歉，处理您的请求时出现了错误：${error.message}`,
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 统一的API响应处理函数
  const handleApiResponse = (response) => {
    if (response && response.responses) {
      response.responses.forEach((res, index) => {
        setTimeout(() => {
          let content = res.content;
          if (typeof content !== "string") {
            content = JSON.stringify(content, null, 2);
          }
          const assistantMessage = {
            id: Date.now() + index,
            type: "assistant",
            content: content,
            responseType: res.type,
            timestamp: new Date(),
            aiService: response.aiService,
            workflowUsed: response.workflowUsed,
          };
          setMessages((prev) => [...prev, assistantMessage]);

          if (res.type === "deckgl_visualization" && res.visualizationData) {
            setVisualizationData(res.visualizationData);
          } else if (res.type === "file_uploaded" && res.files?.length > 0) {
            setCurrentDataFile({ name: res.files[0].name, files: res.files });
          }
        }, index * 100);
      });
    } else {
      const errorMessage = {
        id: Date.now(),
        type: "assistant",
        content: "收到一个无法解析的响应。",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleClearChat = () => {
    if (!isClient) return;
    setMessages([
      {
        id: 1,
        type: "assistant",
        content: "对话已清空。请上传新的数据文件开始分析！",
        timestamp: new Date(),
      },
    ]);
    setVisualizationData(null);
    setCurrentDataFile(null);
  };

  // 统一的模型配置变更回调函数
  const handleModelConfigChange = useCallback(
    (newModel, newCustomConfig = null) => {
      if (!isClient) return;

      setCurrentAIService(newModel);
      localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, newModel.id);

      if (newCustomConfig) {
        setCustomConfig(newCustomConfig);
        localStorage.setItem(
          STORAGE_KEYS.CUSTOM_CONFIG,
          JSON.stringify(newCustomConfig)
        );
      }

      // 更新API密钥状态（如果适用）
      if (newModel.requires_api_key && newCustomConfig?.apiKey) {
        setApiKeys((prev) => ({
          ...prev,
          [newModel.id]: newCustomConfig.apiKey,
        }));
        // 注意：API密钥的保存由AIModelManager负责
      }

      const modelDisplayName =
        newModel.id === "custom-api"
          ? newCustomConfig?.name || newModel.name
          : newModel.name;
      const systemMessage = {
        id: `sys_${Date.now()}`,
        type: "system",
        content: `🤖 已切换到 ${modelDisplayName}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, systemMessage]);
      console.log(`已切换到AI模型: ${modelDisplayName}`);
    },
    [isClient]
  );

  return (
    <div style={presetStyles.chat.analyzer}>
      <div style={presetStyles.chat.panel}>
        <div
          style={{
            padding: `${spacing.base} ${spacing.md}`,
            backgroundColor: colors.background.tertiary,
            borderBottom: `1px solid ${colors.border.secondary}`,
          }}
        >
          <AIModelManager
            activeModel={currentAIService}
            activeCustomConfig={customConfig}
            onConfigChange={handleModelConfigChange}
          />
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <div style={presetStyles.chat.header}>
            <div style={presetStyles.utils.spaceBetween}>
              <div>
                <h3
                  style={{
                    ...titleStyles.chatTitle,
                    ...{
                      margin: `${spacing.base} 0 ${spacing.xs} 0`,
                      color: colors.text.primary,
                      fontSize: fontSize.lg,
                      fontWeight: "600",
                    },
                  }}
                >
                  💬 AI对话分析
                </h3>
                {currentDataFile && (
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#4a5568",
                      backgroundColor: "#e6f3ff",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      display: "inline-block",
                      marginTop: "4px",
                    }}
                  >
                    📁 {currentDataFile.name || "数据文件已加载"}
                  </div>
                )}
              </div>
              <button
                onClick={handleClearChat}
                {...createHoverStyles(buttonStyles.clear, {
                  backgroundColor: "#edf2f7",
                })}
              >
                🗑️ 清空对话
              </button>
            </div>
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            <ModernUnifiedChat
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              height="100%"
            />
          </div>
        </div>
      </div>
      <div style={presetStyles.chat.visualizationPanel}>
        <VisualizationPanel
          data={visualizationData}
          currentDataFile={currentDataFile}
        />
      </div>
    </div>
  );
};

export default ChatAnalyzer;
