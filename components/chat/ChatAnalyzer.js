// components/ChatAnalyzer.js

import React, { useState, useRef, useEffect } from "react";
import ModernUnifiedChat from "./ModernUnifiedChat";
import VisualizationPanel from "./VisualizationPanel";
import AIServiceSelector from "./AIServiceSelector";
import { chatService } from "../../services/chatService";
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

  // 确保只在客户端生成唯一ID
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

  // 可视化数据状态
  const [visualizationData, setVisualizationData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDataFile, setCurrentDataFile] = useState(null);
  const [currentAIService, setCurrentAIService] = useState(null);
  const [showServiceSelector, setShowServiceSelector] = useState(false);
  // const [activeTab, setActiveTab] = useState("chat"); // 移除标签页控制

  // 初始化客户端和AI服务
  useEffect(() => {
    setIsClient(true);
    const initAIService = async () => {
      try {
        const service = chatService.getCurrentService();
        setCurrentAIService(service);
      } catch (error) {
        console.error("初始化AI服务失败:", error);
      }
    };

    initAIService();
  }, []);

  // 处理消息发送
  const handleSendMessage = async (message, files = []) => {
    // 处理消息内容，支持字符串或对象格式
    let messageText = "";
    let messageFiles = files; // 直接使用传入的 files 参数，这是原始的 File 对象数组

    if (typeof message === "object" && message !== null) {
      messageText = message.text || "";
      // 注意：不要从 message.files 中提取文件，因为那只是元信息
      // messageFiles = message.files || files; // ❌ 错误的做法
    } else if (typeof message === "string") {
      messageText = message;
    }

    if (!messageText.trim() && messageFiles.length === 0) return;
    if (!isClient) return; // 确保在客户端运行

    // 添加调试日志
    if (messageFiles.length > 0) {
      console.log('📄 ChatAnalyzer 收到文件:', messageFiles.map(f => ({
        name: f.name,
        size: f.size,
        constructor: f.constructor.name,
        isFileObject: f instanceof File
      })));
    }

    // 创建用户消息对象 - 支持文件信息显示（使用元信息）
    const userMessage = {
      id: Date.now(),
      type: "user",
      content: messageFiles.length > 0
        ? {
            text: messageText,
            files: messageFiles.map((f) => ({
              name: f.name,
              size: f.size,
              type: f.type,
            })),
          }
        : messageText,
      timestamp: new Date(),
    };

    // 立即添加用户消息到界面
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      let response;

      // 根据是否有文件选择不同的处理方式
      if (messageFiles.length > 0) {
        // 有文件：使用文件上传API，传递原始的 File 对象数组
        console.log(`🤖 上传${messageFiles.length}个文件并分析`);
        response = await uploadFilesAndAnalyze(messageFiles, messageText, sessionId);
      } else {
        // 纯文本：使用标准聊天API
        const useEnhanced = chatService.shouldUseEnhancedWorkflow(message, files);
        console.log(`🤖 消息处理: 使用${useEnhanced ? "增强工作流" : "标准模式"}`);

        response = useEnhanced
          ? await chatService.sendEnhancedWorkflowMessage(message, files, sessionId)
          : await chatService.sendMessage(message, files, sessionId);
      }

      // 处理响应（统一的响应处理逻辑）
      handleApiResponse(response);

    } catch (error) {
      console.error("发送消息失败:", error);
      const errorMessage = {
        id: Date.now(),
        type: "assistant",
        content: `抱歉，处理您的请求时出现了错误：${error.message}\n\n请稍后重试或检查您的输入。`,
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 文件上传和分析函数
  const uploadFilesAndAnalyze = async (files, message, sessionId) => {
    console.log('🔍 uploadFilesAndAnalyze 开始处理文件:', files.map(f => ({
      name: f.name,
      size: f.size,
      constructor: f.constructor.name,
      isFile: f instanceof File
    })));

    const formData = new FormData();

    // 添加消息文本和会话信息
    formData.append('message', message);
    formData.append('sessionId', sessionId);
    formData.append('useWorkflow', 'true'); // 启用工作流分析

    // 添加所有文件
    files.forEach((file, index) => {
      if (file instanceof File) {
        formData.append(`files`, file);
        console.log(`✅ 添加文件 ${index + 1}: ${file.name} (${file.size} bytes) - 是真实 File 对象`);
      } else {
        console.error(`❌ 文件 ${index + 1} 不是 File 对象:`, file);
      }
    });

    // 调试：查看FormData中的内容
    console.log('📦 FormData 内容:');
    for (let [key, value] of formData.entries()) {
      if (key === 'files') {
        console.log(`  ${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value);
      } else {
        console.log(`  ${key}:`, value);
      }
    }

    // 使用fetch发送请求
    const response = await fetch('/api/chat-ollama', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status: ${response.status}`);
    }

    return await response.json();
  };

  // 统一的API响应处理函数
  const handleApiResponse = (response) => {
    if (response.responses) {
      response.responses.forEach((res, index) => {
        setTimeout(() => {
          // 确保content是字符串而不是对象
          let content = res.content;
          if (typeof content !== "string") {
            if (content && typeof content === "object") {
              // 如果content是对象，尝试提取有用的信息
              if (content.message) {
                content = content.message;
              } else if (content.data) {
                content = JSON.stringify(content.data, null, 2);
              } else {
                content = JSON.stringify(content, null, 2);
              }
            } else {
              content = String(content);
            }
          }

          const assistantMessage = {
            id: Date.now() + index,
            type: "assistant",
            content: content,
            responseType: res.type,
            timestamp: new Date(),
            aiService: response.aiService, // 添加AI服务信息
            workflowUsed: response.workflowUsed, // 添加工作流信息
          };

          setMessages((prev) => [...prev, assistantMessage]);

          // 处理不同类型的响应
          if (res.type === "plot_data") {
            setVisualizationData(res.content);
          } else if (res.type === "file_uploaded") {
            // 处理文件上传响应
            if (res.files && res.files.length > 0) {
              setCurrentDataFile({
                name: res.files[0].name,
                files: res.files,
              });
            }
          } else if (res.type === "file_info") {
            // 处理文件信息响应
            if (res.files && res.files.length > 0) {
              setCurrentDataFile({
                name: res.files[0].name,
                files: res.files,
              });
            }
          } else if (
            res.type === "deckgl_visualization" &&
            res.visualizationData
          ) {
            setVisualizationData(res.visualizationData);
          }
        }, index * 500); // 逐条显示消息，模拟对话感
      });
    } else {
      // 处理没有responses字段的情况
      let content = "";
      if (response.message) {
        content = response.message;
      } else if (response.data) {
        content = JSON.stringify(response.data, null, 2);
      } else {
        content = "收到响应，但没有具体内容。";
      }

      const assistantMessage = {
        id: Date.now(),
        type: "assistant",
        content: content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    }
  };

  // 添加一个专门用于从ModernUnifiedChat立即显示用户消息的函数
  const addUserMessage = (userMessage) => {
    setMessages((prev) => [...prev, userMessage]);
  };

  // 增强handleSendMessage函数，支持立即显示用户消息
  const enhancedHandleSendMessage = (message, files = []) => {
    return handleSendMessage(message, files);
  };

  // 为ModernUnifiedChat提供addUserMessage方法
  enhancedHandleSendMessage.addUserMessage = addUserMessage;

  // 清空对话
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

  // 处理AI服务切换
  const handleServiceChange = (newService) => {
    if (!isClient) return;
    setCurrentAIService(newService);
    console.log(`已切换到AI服务: ${newService.name}`);

    // 在聊天中显示切换信息
    const switchMessage = {
      id: Date.now(),
      type: "assistant",
      content: `🤖 已切换到 ${newService.name} (${newService.model})\n\n现在可以继续进行对话和数据分析。`,
      timestamp: new Date(),
      aiService: {
        provider: newService.provider,
        model: newService.model,
        name: newService.name,
      },
    };

    setMessages((prev) => [...prev, switchMessage]);
  };

  // AI服务切换按钮样式
  const switchButtonProps = createHoverStyles(
    {
      ...buttonStyles.secondary,
      fontSize: fontSize.sm,
      padding: `${spacing.xs} ${spacing.sm}`,
    },
    {
      backgroundColor: colors.background.hover,
    }
  );

  return (
    <div style={presetStyles.chat.analyzer}>
      {/* 左侧聊天面板 */}
      <div style={presetStyles.chat.panel}>
        {/* AI服务选择器 */}
        <div style={presetStyles.chat.aiServiceSelector}>
          <div
            style={{
              ...flexUtils.spaceBetween,
              padding: `${spacing.base} ${spacing.md}`,
              backgroundColor: colors.background.tertiary,
            }}
          >
            <div style={{ ...flexUtils.centerVertical, gap: spacing.sm }}>
              <span>🤖</span>
              <span
                style={{
                  fontSize: fontSize.base,
                  fontWeight: "600",
                  color: colors.text.primary,
                }}
              >
                {currentAIService?.name || "加载中..."}
              </span>
              <span
                style={{
                  fontSize: fontSize.sm,
                  color: colors.text.tertiary,
                  fontFamily: "monospace",
                  background: colors.background.hover,
                  padding: `2px ${spacing.xs}`,
                  borderRadius: "4px",
                }}
              >
                {currentAIService?.model || "..."}
              </span>
            </div>
            <button
              onClick={() => setShowServiceSelector(!showServiceSelector)}
              {...switchButtonProps}
            >
              {showServiceSelector ? "隐藏" : "切换"}
            </button>
          </div>

          {showServiceSelector && (
            <AIServiceSelector
              currentService={currentAIService}
              onServiceChange={handleServiceChange}
            />
          )}
        </div>

        {/* 聊天内容 */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0, // 重要：允许flex子项缩小
          }}
        >
          {/* 聊天头部 */}
          <div style={presetStyles.chat.header}>
            <div style={presetStyles.utils.spaceBetween}>
              <div>
                <h3
                  style={{
                    ...titleStyles.chatTitle,
                    display: "block",
                    visibility: "visible",
                    margin: `${spacing.base} 0 ${spacing.xs} 0`,
                    color: colors.text.primary,
                    fontSize: fontSize.lg,
                    fontWeight: "600",
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

          {/* 聊天面板 */}
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
              onSendMessage={enhancedHandleSendMessage}
              isLoading={isLoading}
              height="100%"
            />
          </div>
        </div>
      </div>

      {/* 右侧可视化面板 */}
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
