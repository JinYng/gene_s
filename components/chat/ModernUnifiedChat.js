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

  // 输入区域样式 - Google AI Studio 风格
  inputArea: {
    padding: "16px 16px 16px 16px",
    borderTop: "1px solid #e5e7eb",
    backgroundColor: "#f9fafb",
  },

  // 输入框容器 - 包含文件标签和文本输入
  inputContainer: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: "28px",
    border: "1px solid #d1d5db",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    overflow: "hidden",
  },

  inputContainerFocused: {
    borderColor: "#a0a0a0",
    boxShadow: "0 0 0 3px rgba(190, 190, 190, 0.15)",
  },

  // 文件标签容器 - 在输入框内部
  fileChipsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    padding: "12px 16px 8px 16px",
    borderBottom: "1px solid #f3f4f6",
    backgroundColor: "#fafbfc",
  },

  // 文件标签样式 - Google AI Studio 风格
  fileChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 8px 6px 10px",
    backgroundColor: "#e8f4fd",
    border: "1px solid #b8e6ff",
    borderRadius: "16px",
    fontSize: "12px",
    color: "#1e40af",
    fontWeight: "500",
    transition: "all 0.2s ease",
  },

  // 移除文件按钮
  removeFileChipButton: {
    background: "none",
    border: "none",
    color: "#6b7280",
    cursor: "pointer",
    fontSize: "12px",
    padding: "2px",
    borderRadius: "50%",
    width: "16px",
    height: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
  },

  // 主输入行 - 包含文本框和按钮
  inputRow: {
    display: "flex",
    alignItems: "center",
    padding: "4px 4px 4px 20px",
  },

  // 文本输入框
  textInput: {
    flex: 1,
    minWidth: 0,
    border: "none",
    outline: "none",
    padding: "10px 8px",
    fontSize: "15px",
    lineHeight: "1.6",
    resize: "none",
    minHeight: "27px",
    maxHeight: "150px",
    backgroundColor: "transparent",
    color: "#374151",
    fontFamily: "inherit",
  },

  // 右侧操作按钮的容器
  actionsContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    paddingLeft: "12px",
  },

  // "添加文件"按钮 (+)
  addButton: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "none",
    background: "transparent",
    color: "#4b5563",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    fontWeight: "300",
    transition: "background-color 0.2s ease",
  },

  // "运行"按钮
  runButton: (disabled, isUploading) => ({
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    borderRadius: "20px",
    border: "1px solid #d1d5db",
    background: disabled ? "#f9fafb" : isUploading ? "#fef3c7" : "#ffffff",
    color: disabled ? "#9ca3af" : isUploading ? "#92400e" : "#374151",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap", // 防止文字换行
  }),

  // 上传进度条
  progressBar: {
    position: "absolute",
    bottom: "0",
    left: "0",
    height: "2px",
    backgroundColor: "#3b82f6",
    borderRadius: "1px",
    transition: "width 0.3s ease",
  },

  // 快捷键提示
  shortcutHint: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    color: "#9ca3af",
    fontSize: "13px",
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
// 现代化输入组件 - Google AI Studio 风格
const ModernChatInput = ({
  onSubmit,
  disabled,
  selectedFiles = [],
  onFilesChange,
  uploadProgress = 0,
  isUploading = false,
}) => {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // 自动调整文本框高度
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + "px";
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
    } else if (files.length > 0) {
      alert(`不支持的文件格式。支持的格式：CSV、TSV、TXT、H5AD`);
    }
    e.target.value = "";
  };

  const removeFile = (index) => {
    onFilesChange(selectedFiles.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.toLowerCase().split(".").pop();
    switch (ext) {
      case "h5ad": return "🧬";
      case "csv": return "📊";
      case "tsv":
      case "txt": return "📄";
      default: return "📎";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isSubmitDisabled = disabled || isUploading || (!value.trim() && selectedFiles.length === 0);

  return (
    <div style={modernChatStyles.inputArea}>
      <form onSubmit={handleSubmit}>
        <div
          style={{
            ...modernChatStyles.inputContainer,
            ...(isFocused ? modernChatStyles.inputContainerFocused : {}),
            position: "relative",
          }}
        >
          {/* 上传进度条 */}
          {isUploading && (
            <div
              style={{
                ...modernChatStyles.progressBar,
                width: `${uploadProgress}%`,
              }}
            />
          )}

          {/* 文件标签容器 - 在输入框内部 */}
          {selectedFiles.length > 0 && (
            <div style={modernChatStyles.fileChipsContainer}>
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  style={modernChatStyles.fileChip}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#dbeafe";
                    e.target.style.borderColor = "#93c5fd";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#e8f4fd";
                    e.target.style.borderColor = "#b8e6ff";
                  }}
                >
                  <span>{getFileIcon(file.name)}</span>
                  <span title={file.name}>
                    {file.name.length > 15 ? `${file.name.substring(0, 15)}...` : file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    style={modernChatStyles.removeFileChipButton}
                    title="移除文件"
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#f3f4f6";
                      e.target.style.color = "#ef4444";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "transparent";
                      e.target.style.color = "#6b7280";
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 主输入行 - 文本框和操作按钮 */}
          <div style={modernChatStyles.inputRow}>
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
                  : "Start typing a prompt"
              }
              disabled={disabled || isUploading}
              style={modernChatStyles.textInput}
              rows={1}
            />

            {/* 右侧操作区域 */}
            <div style={modernChatStyles.actionsContainer}>
              {/* 添加文件按钮 */}
              <button
                type="button"
                title="Attach files (.csv, .tsv, .txt, .h5ad)"
                onClick={() => fileInputRef.current?.click()}
                style={modernChatStyles.addButton}
                disabled={isUploading}
                onMouseEnter={(e) => {
                  if (!isUploading) e.target.style.backgroundColor = "#f0f0f0";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                }}
              >
                ⊕
              </button>

              {/* 运行按钮 */}
              <button
                type="submit"
                disabled={isSubmitDisabled}
                style={modernChatStyles.runButton(isSubmitDisabled, isUploading)}
                onMouseEnter={(e) => {
                  if (!isSubmitDisabled && !isUploading) e.target.style.borderColor = "#9ca3af";
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitDisabled && !isUploading) e.target.style.borderColor = "#d1d5db";
                }}
              >
                <span>{isUploading ? `Uploading ${uploadProgress}%` : "Run"}</span>
                {!isUploading && (
                  <span style={modernChatStyles.shortcutHint}>
                    <span>Ctrl</span>
                    <span>↩</span>
                  </span>
                )}
              </button>
            </div>
          </div>

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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // 文件上传进度模拟 - 仅用于UI反馈
  const simulateUploadProgress = () => {
    setIsUploading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90; // 保持在90%，等待真实响应
        }
        return prev + 10;
      });
    }, 100);

    return () => {
      clearInterval(progressInterval);
      setIsUploading(false);
      setUploadProgress(0);
    };
  };

  const handleSendMessage = useCallback(
    async (message, files) => {
      if (!onSendMessage) return;

      try {
        // 构造包含文件信息的消息内容 - 注意：这里只用于UI显示
        const messageContent = files && files.length > 0
          ? {
              text: message,
              files: files.map((file) => ({
                name: file.name,
                size: file.size,
                type: file.type,
              })),
            }
          : message;

        // 如果有文件，启动上传进度模拟
        let stopProgress = null;
        if (files && files.length > 0) {
          console.log(`Preparing ${files.length} files for upload:`, message);
          console.log('Original File objects:', files.map(f => ({name: f.name, constructor: f.constructor.name})));
          stopProgress = simulateUploadProgress();
        }

        // 调用父组件的处理函数，传递消息内容和原始文件对象
        // 关键修复：确保传递原始的 File 对象数组，而不是处理后的 messageContent.files
        await onSendMessage(messageContent, files);

        // 清空选中的文件
        setSelectedFiles([]);

        // 停止进度模拟
        if (stopProgress) {
          setTimeout(() => {
            stopProgress();
          }, 500); // 延迟停止，让用户看到完成效果
        }

      } catch (error) {
        console.error('Send message error:', error);

        // 停止上传状态
        setIsUploading(false);
        setUploadProgress(0);

        // 显示错误信息给用户 - 这里仍然调用父组件，让它来决定如何处理错误
        const errorMessage = {
          text: `发送失败: ${error.message}`,
          files: files ? files.map((file) => ({
            name: file.name,
            size: file.size,
            type: file.type,
          })) : [],
        };

        if (onSendMessage) {
          onSendMessage(errorMessage, files || [], { error: error.message });
        }
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
          disabled={isLoading || isUploading}
          selectedFiles={selectedFiles}
          onFilesChange={setSelectedFiles}
          uploadProgress={uploadProgress}
          isUploading={isUploading}
        />
      </div>
    </>
  );
};

export default ModernUnifiedChat;
