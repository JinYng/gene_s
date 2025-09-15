// components/chat/UnifiedChat.js
// 统一的聊天组件，整合消息列表、输入框和文件上传功能

import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { colors, spacing, fontSize, buttonStyles } from "../../styles";

// 样式定义
const chatStyles = {
  // 消息组件样式
  messageItem: {
    container: (isUser) => ({
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: spacing.sm,
      padding: `0 ${spacing.md}`,
    }),
    message: (isUser) => ({
      maxWidth: "70%",
      padding: spacing.md,
      borderRadius: isUser ? "12px 12px 0 12px" : "12px 12px 12px 0",
      backgroundColor: isUser ? colors.primary : colors.background.light,
      color: isUser ? colors.text.white : colors.text.primary,
      wordWrap: "break-word",
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
    }),
    content: {
      fontSize: fontSize.sm,
      lineHeight: 1.4,
    },
    timestamp: (isUser) => ({
      fontSize: "11px",
      color: isUser ? "rgba(255,255,255,0.8)" : colors.text.tertiary,
      marginTop: "4px",
      textAlign: "right",
    }),
    avatar: (isUser) => ({
      width: "32px",
      height: "32px",
      borderRadius: "50%",
      backgroundColor: isUser ? colors.primary : colors.background.medium,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "14px",
      marginRight: isUser ? "0" : spacing.sm,
      marginLeft: isUser ? spacing.sm : "0",
      flexShrink: 0,
    }),
    fileTag: {
      display: "inline-flex",
      alignItems: "center",
      backgroundColor: "#f0f9ff",
      border: "1px solid #0ea5e9",
      padding: `${spacing.xs} ${spacing.sm}`,
      borderRadius: "8px",
      marginRight: spacing.xs,
      marginBottom: spacing.xs,
      fontSize: fontSize.xs,
      color: "#0c4a6e",
      boxShadow: "0 1px 3px rgba(14, 165, 233, 0.1)",
    },
    fileIcon: {
      marginRight: "6px",
      fontSize: "14px",
    },
    fileInfo: {
      display: "flex",
      flexDirection: "column",
      gap: "2px",
    },
    fileName: {
      fontWeight: "600",
      color: "#0c4a6e",
    },
    fileSize: {
      fontSize: "10px",
      color: "#64748b",
    },
  },

  // 消息列表样式
  messageList: {
    container: {
      height: "100%",
      overflowY: "auto",
      padding: spacing.md,
    },
    loading: {
      textAlign: "center",
      color: colors.text.secondary,
      fontSize: fontSize.sm,
      padding: spacing.md,
    },
    empty: {
      textAlign: "center",
      color: colors.text.tertiary,
      fontSize: fontSize.sm,
      padding: spacing.xl,
      marginTop: "20%",
    },
    thinkingContent: {
      display: "flex",
      alignItems: "center",
      gap: spacing.sm,
    },
    thinkingText: {
      color: colors.text.secondary,
      fontSize: fontSize.sm,
      fontStyle: "italic",
    },
  },

  // 文件列表样式 - 改为内嵌式
  fileList: {
    container: {
      padding: `0 ${spacing.sm}`,
      backgroundColor: colors.background.light,
    },
    bubbleContainer: {
      backgroundColor: colors.background.white,
      border: `1px solid ${colors.primary}`,
      borderRadius: "8px",
      padding: spacing.sm,
      boxShadow: "0 2px 4px rgba(0, 102, 204, 0.1)",
    },
    header: {
      fontSize: fontSize.xs,
      fontWeight: "bold",
      color: colors.primary,
      marginBottom: spacing.xs,
    },
    filesWrapper: {
      display: "flex",
      flexWrap: "wrap",
      gap: spacing.xs,
    },
    fileBubble: {
      display: "inline-flex",
      alignItems: "center",
      backgroundColor: colors.background.light,
      border: `1px solid #e2e8f0`,
      borderRadius: "20px",
      padding: `${spacing.xs} ${spacing.sm}`,
      fontSize: fontSize.xs,
      maxWidth: "200px",
    },
    fileName: {
      color: colors.text.primary,
      marginRight: spacing.xs,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      flex: 1,
    },
    fileSize: {
      color: colors.text.tertiary,
      fontSize: "10px",
      marginRight: spacing.xs,
    },
    removeButton: {
      backgroundColor: "transparent",
      border: "none",
      color: colors.error,
      cursor: "pointer",
      fontSize: "12px",
      padding: "2px",
      borderRadius: "50%",
      width: "18px",
      height: "18px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
  },

  // 聊天输入样式
  chatInput: {
    container: {
      display: "flex",
      flexDirection: "column",
      height: "100%",
    },
    inputContainer: {
      display: "flex",
      alignItems: "center",
      padding: spacing.sm,
      height: "60px",
      backgroundColor: colors.background.secondary,
      position: "relative",
    },
    textarea: {
      flex: 1,
      border: "none",
      outline: "none",
      padding: spacing.sm,
      fontSize: fontSize.sm,
      resize: "none",
      maxHeight: "100px",
      minHeight: "40px",
      backgroundColor: "transparent",
    },
    fileButton: {
      ...buttonStyles.secondary,
      padding: "8px",
      marginRight: spacing.sm,
    },
    sendButton: {
      ...buttonStyles.primary,
      padding: "8px 16px",
    },
    dragOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 102, 204, 0.1)",
      borderRadius: "10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10,
      fontSize: fontSize.sm,
      color: colors.primary,
    },
    hiddenInput: {
      display: "none",
    },
    shortcutsContainer: {
      position: "absolute",
      bottom: "2px",
      left: spacing.sm,
      fontSize: "9px",
      color: colors.text.tertiary,
      display: "flex",
      gap: "4px",
    },
    shortcutButton: {
      ...buttonStyles.secondary,
      fontSize: "9px",
      padding: "1px 3px",
      minWidth: "auto",
    },
  },

  // 统一聊天样式
  unifiedChat: {
    container: (height) => ({
      display: "flex",
      flexDirection: "column",
      height: height,
      width: "100%",
      overflow: "hidden",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      backgroundColor: colors.background.white,
    }),
    messageArea: {
      flex: 1,
      minHeight: 0,
    },
    inputArea: {
      minHeight: "100px",
      maxHeight: "200px",
      borderTop: `1px solid #e2e8f0`,
      backgroundColor: colors.background.secondary,
      flexShrink: 0,
      overflow: "hidden",
    },
  },
};

// 思考动画组件
const ThinkingDots = () => {
  const [dotCount, setDotCount] = React.useState(1);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev >= 3 ? 1 : prev + 1));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <span style={{ color: colors.primary, fontSize: "16px", minWidth: "30px" }}>
      {"●".repeat(dotCount)}
    </span>
  );
};

// 消息组件
const MessageItem = ({ message }) => {
  const isUser = message.type === "user";

  // 处理消息内容
  const processMessageContent = (content) => {
    if (typeof content === "object" && content !== null) {
      if (content.files && Array.isArray(content.files)) {
        return {
          text: content.text || "",
          files: content.files,
        };
      }
      return {
        text: JSON.stringify(content, null, 2),
        files: [],
      };
    }
    return {
      text: typeof content === "string" ? content : String(content),
      files: [],
    };
  };

  const { text: displayText, files: messageFiles } = processMessageContent(
    message.content
  );

  return (
    <div style={chatStyles.messageItem.container(isUser)}>
      {!isUser && <div style={chatStyles.messageItem.avatar(isUser)}>🤖</div>}
      <div style={chatStyles.messageItem.message(isUser)}>
        <div style={chatStyles.messageItem.content}>
          {/* 显示文件信息 - 简洁版 */}
          {messageFiles && messageFiles.length > 0 && (
            <div
              style={{
                marginBottom: spacing.sm,
                fontSize: fontSize.xs,
                color: colors.text.secondary,
              }}
            >
              {messageFiles.map((file, idx) => {
                const getFileIcon = (fileName) => {
                  const ext = fileName.toLowerCase().split(".").pop();
                  switch (ext) {
                    case "h5ad":
                      return "🧬";
                    case "csv":
                      return "📊";
                    case "tsv":
                    case "txt":
                      return "📄";
                    default:
                      return "📎";
                  }
                };
                return (
                  <span key={idx} style={{ marginRight: spacing.sm }}>
                    {getFileIcon(file.name)} {file.name}
                  </span>
                );
              })}
            </div>
          )}

          {/* 显示文本内容 */}
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {displayText}
          </ReactMarkdown>
        </div>

        <div style={chatStyles.messageItem.timestamp(isUser)}>
          {new Date(message.timestamp).toLocaleTimeString("zh-CN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
      {isUser && <div style={chatStyles.messageItem.avatar(isUser)}>👤</div>}
    </div>
  );
};

// 消息列表组件
const MessageList = ({ messages, isLoading }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div style={chatStyles.messageList.container}>
      {messages.length === 0 && !isLoading ? (
        <div style={chatStyles.messageList.empty}>
          💬 开始对话吧！上传文件或输入问题开始分析...
        </div>
      ) : (
        <>
          {messages.map((message, index) => (
            <MessageItem key={index} message={message} />
          ))}
          {isLoading && (
            <div style={chatStyles.messageItem.container(false)}>
              <div style={chatStyles.messageItem.avatar(false)}>🤖</div>
              <div style={chatStyles.messageItem.message(false)}>
                <div style={chatStyles.messageItem.content}>
                  <div style={chatStyles.messageList.thinkingContent}>
                    <ThinkingDots />
                    <span style={chatStyles.messageList.thinkingText}>
                      AI正在分析中...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

// 聊天输入组件
const ChatInput = ({
  onSubmit,
  disabled,
  selectedFiles = [],
  onFilesChange,
}) => {
  const [value, setValue] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim() || selectedFiles.length > 0) {
      onSubmit(value, selectedFiles);
      setValue("");
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter((file) => {
      const extension = file.name.toLowerCase().split(".").pop();
      return ["csv", "tsv", "txt", "h5ad"].includes(extension);
    });

    if (validFiles.length > 0) {
      if (onFilesChange) {
        onFilesChange([...selectedFiles, ...validFiles]);
      }
      // 优化用户体验：自动聚焦到输入框
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    } else {
      const invalidFileNames = files.map((f) => f.name).join(", ");
      alert(
        `文件格式不支持: ${invalidFileNames}\n\n支持的格式: CSV、TSV、TXT、H5AD`
      );
    }
    // 清除input值以允许重复选择同一文件
    e.target.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter((file) => {
      const extension = file.name.toLowerCase().split(".").pop();
      return ["csv", "tsv", "txt", "h5ad"].includes(extension);
    });

    if (validFiles.length > 0) {
      if (onFilesChange) {
        onFilesChange([...selectedFiles, ...validFiles]);
      }
      // 优化用户体验：自动聚焦到输入框
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    } else {
      // 更友好的错误提示
      const invalidFileNames = files.map((f) => f.name).join(", ");
      alert(
        `文件格式不支持: ${invalidFileNames}\n\n支持的格式: CSV、TSV、TXT、H5AD`
      );
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const shortcutCommands =
    selectedFiles.length > 0
      ? [
          { text: "UMAP", command: "UMAP降维分析" },
          { text: "聚类", command: "聚类分析" },
          { text: "预览", command: "预览数据信息" },
        ]
      : [
          { text: "帮助", command: "如何使用？" },
          { text: "示例", command: "分析示例" },
        ];

  return (
    <div style={chatStyles.chatInput.container}>
      <form
        onSubmit={handleSubmit}
        style={{ flex: 1, display: "flex", flexDirection: "column" }}
      >
        {/* 文件列表区域 */}
        {selectedFiles.length > 0 && (
          <div style={chatStyles.fileList.container}>
            <div style={chatStyles.fileList.bubbleContainer}>
              <div style={chatStyles.fileList.filesWrapper}>
                {selectedFiles.map((file, index) => {
                  const getFileIcon = (fileName) => {
                    const ext = fileName.toLowerCase().split(".").pop();
                    switch (ext) {
                      case "h5ad":
                        return "🧬";
                      case "csv":
                        return "📊";
                      case "tsv":
                      case "txt":
                        return "📄";
                      default:
                        return "📎";
                    }
                  };
                  return (
                    <div key={index} style={chatStyles.fileList.fileBubble}>
                      <span style={chatStyles.fileList.fileName}>
                        {getFileIcon(file.name)} {file.name}
                      </span>
                      <button
                        onClick={() =>
                          onFilesChange(
                            selectedFiles.filter((_, i) => i !== index)
                          )
                        }
                        style={chatStyles.fileList.removeButton}
                        title="移除文件"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div
          style={chatStyles.chatInput.inputContainer}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {dragOver && (
            <div style={chatStyles.chatInput.dragOverlay}>
              📁 拖拽文件到此处上传
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedFiles.length > 0
                ? (() => {
                    const firstFile = selectedFiles[0];
                    const ext = firstFile.name.toLowerCase().split(".").pop();
                    if (ext === "h5ad") {
                      return "建议: UMAP降维分析、聚类分析、预览数据信息...";
                    } else if (ext === "csv" || ext === "tsv") {
                      return "建议: 转换成H5AD格式并进行UMAP分析...";
                    }
                    return `已选择 ${selectedFiles.length} 个文件，请输入分析指令...`;
                  })()
                : "输入您的分析指令，或上传文件开始分析..."
            }
            disabled={disabled}
            style={chatStyles.chatInput.textarea}
          />

          <button
            type="submit"
            disabled={disabled || (!value.trim() && selectedFiles.length === 0)}
            style={{
              ...chatStyles.chatInput.sendButton,
              opacity:
                disabled || (!value.trim() && selectedFiles.length === 0)
                  ? 0.5
                  : 1,
            }}
          >
            {disabled ? "处理中..." : "发送"}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.tsv,.txt,.h5ad"
            multiple
            style={chatStyles.chatInput.hiddenInput}
            onChange={handleFileSelect}
          />
        </div>

        <div style={chatStyles.chatInput.shortcutsContainer}>
          <span>
            {selectedFiles.length > 0 ? "💡 分析指令:" : "💡 快捷指令:"}
          </span>
          {shortcutCommands.map((shortcut, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                setValue(shortcut.command);
                textareaRef.current?.focus();
              }}
              style={{
                ...chatStyles.chatInput.shortcutButton,
                backgroundColor:
                  selectedFiles.length > 0
                    ? "#e3f2fd"
                    : chatStyles.chatInput.shortcutButton.backgroundColor,
              }}
            >
              {shortcut.text}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
};

// 统一的聊天面板组件
const UnifiedChat = ({
  messages = [],
  onSendMessage,
  isLoading = false,
  height = "calc(100vh - 100px)",
}) => {
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleSendMessage = useCallback(
    (message, files) => {
      if (onSendMessage) {
        // 将文件信息包含在消息内容中
        const messageContent =
          files.length > 0
            ? {
                text: message,
                files: files.map((file) => ({
                  name: file.name,
                  size: file.size,
                  type: file.type,
                })),
              }
            : message;
        onSendMessage(messageContent, files);
        setSelectedFiles([]); // 发送后重置文件列表
      }
    },
    [onSendMessage]
  );

  return (
    <div style={chatStyles.unifiedChat.container(height)}>
      <div style={chatStyles.unifiedChat.messageArea}>
        <MessageList messages={messages} isLoading={isLoading} />
      </div>
      <div style={chatStyles.unifiedChat.inputArea}>
        <ChatInput
          onSubmit={handleSendMessage}
          disabled={isLoading}
          selectedFiles={selectedFiles}
          onFilesChange={setSelectedFiles}
        />
      </div>
    </div>
  );
};

export default UnifiedChat;
