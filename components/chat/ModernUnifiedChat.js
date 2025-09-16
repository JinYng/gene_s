// components/chat/ModernUnifiedChat.js
// 现代化的ChatGPT风格聊天组件，具有优雅的设计和流畅的交互

import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// 现代化的样式定义，参考ChatGPT设计
const modernChatStyles = {
  // 主容器样式
  container: (height) => ({
    display: "flex",
    flexDirection: "column",
    height: height,
    width: "100%",
    backgroundColor: "#fafafa",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 4px 24px rgba(0, 0, 0, 0.08)",
    border: "1px solid #e5e7eb",
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  }),

  // 消息区域样式
  messageArea: {
    flex: 1,
    overflowY: "auto",
    padding: "24px 20px",
    scrollBehavior: "smooth",
    background: "linear-gradient(to bottom, #fafafa 0%, #ffffff 100%)",
  },

  // 消息样式 - ChatGPT风格
  message: {
    container: (isUser) => ({
      display: "flex",
      marginBottom: "24px",
      alignItems: "flex-start",
      gap: "12px",
      animation: "messageSlideIn 0.3s ease-out",
      flexDirection: isUser ? "row-reverse" : "row",
    }),

    avatar: (isUser) => ({
      width: "32px",
      height: "32px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "16px",
      flexShrink: 0,
      background: isUser
        ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "white",
      boxShadow: "0 2px 8px rgba(102, 126, 234, 0.3)",
    }),

    content: (isUser) => ({
      maxWidth: "75%",
      minWidth: "0",
      background: isUser ? "#353535ff" : "#ffffff",
      color: isUser ? "#ffffff" : "#374151",
      padding: "12px 12px 8px 12px",
      borderRadius: isUser ? "20px 20px 20px 20px" : "20px 20px 20px 20px",
      boxShadow: isUser
        ? "0 2px 12px rgba(37, 99, 235, 0.2)"
        : "0 2px 12px rgba(0, 0, 0, 0.08)",
      border: isUser ? "none" : "1px solid #f3f4f6",
      lineHeight: "1.6",
      fontSize: "15px",
      position: "relative",
    }),

    timestamp: (isUser) => ({
      fontSize: "12px",
      color: isUser ? "rgba(255,255,255,0.7)" : "#9ca3af",
      marginTop: "8px",
      textAlign: isUser ? "right" : "left",
    }),
  },

  // 输入区域样式 - ChatGPT风格
  inputArea: {
    padding: "20px",
    borderTop: "1px solid #e5e7eb",
    backgroundColor: "#ffffff",
    position: "relative",
  },

  // 输入框容器
  inputContainer: {
    position: "relative",
    background: "#ffffff",
    borderRadius: "24px",
    border: "1px solid #d1d5db",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
    transition: "all 0.2s ease",
    overflow: "hidden",
  },

  inputContainerFocused: {
    borderColor: "#2563eb",
    boxShadow: "0 4px 16px rgba(37, 99, 235, 0.15)",
    transform: "translateY(-1px)",
  },

  inputContainerDragOver: {
    borderColor: "#10b981",
    backgroundColor: "#f0fdf4",
    boxShadow: "0 4px 16px rgba(16, 185, 129, 0.2)",
    animation: "dragOverlay 0.2s ease-out",
  },

  // 文件显示区域
  filePreview: {
    padding: "6px 12px",
    borderBottom: "1px solid #f3f4f6",
    background: "#f9fafb",
  },

  fileItem: {
    display: "inline-flex",
    alignItems: "center",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "8px 12px",
    margin: "4px 8px 4px 0",
    fontSize: "13px",
    color: "#374151",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    transition: "all 0.2s ease",
    animation: "fileUploadSuccess 0.4s ease-out",
  },

  fileIcon: {
    marginRight: "8px",
    fontSize: "16px",
  },

  removeFileButton: {
    marginLeft: "8px",
    background: "none",
    border: "none",
    color: "#9ca3af",
    cursor: "pointer",
    borderRadius: "50%",
    width: "18px",
    height: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    transition: "all 0.2s ease",
  },

  // 输入框本体
  textInput: {
    width: "100%",
    border: "none",
    outline: "none",
    padding: "16px 60px 16px 20px",
    fontSize: "15px",
    lineHeight: "1.5",
    resize: "none",
    minHeight: "24px",
    maxHeight: "120px",
    backgroundColor: "transparent",
    color: "#374151",
    fontFamily: "inherit",
  },

  // 发送按钮
  sendButton: (disabled) => ({
    position: "absolute",
    right: "8px",
    top: "80%",
    transform: "translateY(-50%)",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "none",
    background: disabled
      ? "#d1d5db"
      : "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "#ffffff",
    cursor: disabled ? "not-allowed" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    transition: "all 0.2s ease",
    boxShadow: disabled ? "none" : "0 2px 8px rgba(37, 99, 235, 0.3)",
  }),

  // 附件按钮
  attachButton: {
    position: "absolute",
    left: "12px",
    top: "70%",
    transform: "translateY(-50%)",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    border: "none",
    background: "#f3f4f6",
    color: "#6b7280",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    transition: "all 0.2s ease",
  },

  // 拖拽覆盖层
  dragOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(16, 185, 129, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    color: "#059669",
    fontWeight: "500",
    borderRadius: "24px",
    animation: "dragOverlay 0.2s ease-out",
  },

  // 思考动画
  thinkingDots: {
    display: "inline-flex",
    gap: "4px",
  },

  thinkingDot: (delay) => ({
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "#9ca3af",
    animation: `thinkingPulse 1.4s ease-in-out ${delay}s infinite`,
  }),

  // 空状态
  emptyState: {
    textAlign: "center",
    color: "#9ca3af",
    fontSize: "15px",
    marginTop: "40px",
    lineHeight: "1.6",
  },

  // 快捷指令
  quickActions: {
    display: "flex",
    gap: "8px",
    marginTop: "12px",
    flexWrap: "wrap",
  },

  quickActionButton: {
    padding: "6px 12px",
    fontSize: "12px",
    color: "#6b7280",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
};

// 全局样式组件
const GlobalStyles = () => {
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = `
      @keyframes messageSlideIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes thinkingPulse {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 1; }
      }

      @keyframes buttonHover {
        from { transform: scale(1); }
        to { transform: scale(1.02); }
      }

      @keyframes dragOverlay {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      @keyframes fileUploadSuccess {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
    `;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  return null;
};
const ModernThinkingDots = () => (
  <div style={modernChatStyles.thinkingDots}>
    <div style={modernChatStyles.thinkingDot(0)}></div>
    <div style={modernChatStyles.thinkingDot(0.2)}></div>
    <div style={modernChatStyles.thinkingDot(0.4)}></div>
  </div>
);

// 现代化消息组件
const ModernMessage = ({ message }) => {
  const isUser = message.type === "user";

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
    <div style={modernChatStyles.message.container(isUser)}>
      <div style={modernChatStyles.message.avatar(isUser)}>
        {isUser ? "👤" : "🤖"}
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>  
        <div style={modernChatStyles.message.content(isUser)}>
          {/* 文件信息显示 */}
          {messageFiles && messageFiles.length > 0 && (
            <div
              style={{ marginBottom: "12px", fontSize: "13px", opacity: 0.8 }}
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
                  <span key={idx} style={{ marginRight: "12px" }}>
                    {getFileIcon(file.name)} {file.name}
                  </span>
                );
              })}
            </div>
          )}

          {/* 消息文本 */}
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => (
                <p style={{ margin: "0 0 8px 0", lineHeight: "1.6" }}>
                  {children}
                </p>
              ),
              code: ({ children }) => (
                <code
                  style={{
                    background: isUser ? "rgba(255,255,255,0.2)" : "#f3f4f6",
                    padding: "2px 2px",
                    borderRadius: "4px",
                    fontSize: "12px",
                  }}
                >
                  {children}
                </code>
              ),
            }}
          >
            {displayText}
          </ReactMarkdown>
        </div>

        <div style={modernChatStyles.message.timestamp(isUser)}>
          {new Date(message.timestamp).toLocaleTimeString("zh-CN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
};

// 现代化消息列表组件
const ModernMessageList = ({ messages, isLoading }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div style={modernChatStyles.messageArea}>
      {messages.length === 0 && !isLoading ? (
        <div style={modernChatStyles.emptyState}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>💬</div>
          <div
            style={{ fontSize: "18px", fontWeight: "500", marginBottom: "8px" }}
          >
            开始对话
          </div>
          <div>上传文件或输入问题开始分析...</div>
        </div>
      ) : (
        <>
          {messages.map((message, index) => (
            <ModernMessage key={index} message={message} />
          ))}
          {isLoading && (
            <div style={modernChatStyles.message.container(false)}>
              <div style={modernChatStyles.message.avatar(false)}>🤖</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={modernChatStyles.message.content(false)}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <ModernThinkingDots />
                    <span style={{ color: "#6b7280", fontStyle: "italic" }}>
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

// 现代化输入组件
const ModernChatInput = ({
  onSubmit,
  disabled,
  selectedFiles = [],
  onFilesChange,
}) => {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // 自动调整文本框高度
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
  }, [value]);

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
      onFilesChange([...selectedFiles, ...validFiles]);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
    e.target.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOver(false);
    }
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
      onFilesChange([...selectedFiles, ...validFiles]);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

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

  const quickCommands =
    selectedFiles.length > 0
      ? ["UMAP降维分析", "聚类分析", "预览数据信息"]
      : ["如何使用？", "分析示例", "支持的文件格式"];

  return (
    <div style={modernChatStyles.inputArea}>
      {/* 快捷指令 */}
      {quickCommands.length > 0 && (
        <div style={modernChatStyles.quickActions}>
          {quickCommands.map((command, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                setValue(command);
                textareaRef.current?.focus();
              }}
              style={{
                ...modernChatStyles.quickActionButton,
                ":hover": {
                  background: "#f3f4f6",
                  borderColor: "#d1d5db",
                },
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#f3f4f6";
                e.target.style.borderColor = "#d1d5db";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "#f9fafb";
                e.target.style.borderColor = "#e5e7eb";
              }}
            >
              {command}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div
          style={{
            ...modernChatStyles.inputContainer,
            ...(isFocused ? modernChatStyles.inputContainerFocused : {}),
            ...(dragOver ? modernChatStyles.inputContainerDragOver : {}),
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* 文件预览 */}
          {selectedFiles.length > 0 && (
            <div style={modernChatStyles.filePreview}>
              {selectedFiles.map((file, index) => (
                <div key={index} style={modernChatStyles.fileItem}>
                  <span style={modernChatStyles.fileIcon}>
                    {getFileIcon(file.name)}
                  </span>
                  <span>{file.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      onFilesChange(selectedFiles.filter((_, i) => i !== index))
                    }
                    style={modernChatStyles.removeFileButton}
                    onMouseEnter={(e) => {
                      e.target.style.background = "#fee2e2";
                      e.target.style.color = "#dc2626";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "none";
                      e.target.style.color = "#9ca3af";
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 拖拽覆盖层 */}
          {dragOver && (
            <div style={modernChatStyles.dragOverlay}>
              📁 拖拽文件到此处上传
            </div>
          )}

          {/* 附件按钮 */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={modernChatStyles.attachButton}
            onMouseEnter={(e) => {
              e.target.style.background = "#e5e7eb";
              e.target.style.color = "#374151";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "#f3f4f6";
              e.target.style.color = "#6b7280";
            }}
          >
            📎
          </button>

          {/* 文本输入框 */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={
              selectedFiles.length > 0
                ? "描述您想要进行的分析..."
                : "输入您的分析指令，或上传文件开始分析..."
            }
            disabled={disabled}
            style={modernChatStyles.textInput}
            rows={1}
          />

          {/* 发送按钮 */}
          <button
            type="submit"
            disabled={disabled || (!value.trim() && selectedFiles.length === 0)}
            style={modernChatStyles.sendButton(
              disabled || (!value.trim() && selectedFiles.length === 0)
            )}
            onMouseEnter={(e) => {
              if (!disabled && (value.trim() || selectedFiles.length > 0)) {
                e.target.style.transform = "translateY(-50%) scale(1.1)";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(-50%) scale(1)";
            }}
          >
            {disabled ? "⏳" : "↗"}
          </button>

          {/* 隐藏的文件输入 */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.tsv,.txt,.h5ad"
            multiple
            style={{ display: "none" }}
            onChange={handleFileSelect}
          />
        </div>
      </form>
    </div>
  );
};

// 主要的现代化聊天组件
const ModernUnifiedChat = ({
  messages = [],
  onSendMessage,
  isLoading = false,
  height = "calc(100vh - 100px)",
}) => {
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleSendMessage = useCallback(
    (message, files) => {
      if (onSendMessage) {
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
        setSelectedFiles([]);
      }
    },
    [onSendMessage]
  );

  return (
    <>
      <GlobalStyles />
      <div style={modernChatStyles.container(height)}>
        <ModernMessageList messages={messages} isLoading={isLoading} />
        <ModernChatInput
          onSubmit={handleSendMessage}
          disabled={isLoading}
          selectedFiles={selectedFiles}
          onFilesChange={setSelectedFiles}
        />
      </div>
    </>
  );
};

export default ModernUnifiedChat;
