// components/chat/AIModelManager.js
// AI模型管理器 - Google AI Studio风格的Popover界面

import React, { useState, useEffect, useCallback } from "react";
import {
  models,
  MODEL_STATUS,
  getModelById,
  getAvailableModels,
} from "../../config/models.js";

const AIModelManager = ({
  activeModel,
  activeCustomConfig,
  onConfigChange,
}) => {
  // === Local State ===
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  // Popover内部的模型选择状态，与全局激活状态分离
  const [selectedModelIdInPopover, setSelectedModelIdInPopover] = useState(
    activeModel?.id || "ollama-gemma"
  );
  // Popover内部的自定义配置编辑状态
  const [localCustomConfig, setLocalCustomConfig] = useState(
    activeCustomConfig || {}
  );
  // 按钮验证状态
  const [verificationStatus, setVerificationStatus] = useState("idle"); // 'idle', 'verifying', 'success', 'error'
  const [verificationMessage, setVerificationMessage] = useState("");

  const availableModels = getAvailableModels();

  // === Effects ===

  // 当浮层面板打开时，同步一次父组件的最新状态
  useEffect(() => {
    if (isPopoverOpen) {
      if (activeModel?.id) {
        setSelectedModelIdInPopover(activeModel.id);
      }
      if (activeCustomConfig) {
        setLocalCustomConfig(activeCustomConfig);
      }
    }
  }, [isPopoverOpen, activeModel, activeCustomConfig]);

  // === Event Handlers ===

  // 快速切换到非自定义模型
  const handleQuickSwitch = useCallback(
    (modelId) => {
      const model = getModelById(modelId);
      if (!model) return;

      console.log(`🔄 快速切换到模型: ${model.name}`);
      // 上报给父组件，明确传递null作为customConfig
      onConfigChange(model, null);
      setIsPopoverOpen(false);
    },
    [onConfigChange]
  );

  // 处理自定义配置输入框的变化
  const handleCustomConfigChange = useCallback(
    (field, value) => {
      setLocalCustomConfig((prev) => ({ ...prev, [field]: value }));
      // 当用户开始重新编辑时，清除之前的错误或成功状态
      if (verificationStatus !== "idle") {
        setVerificationStatus("idle");
        setVerificationMessage("");
      }
    },
    [verificationStatus]
  );

  // 验证并应用自定义配置
  const handleVerifyAndApply = useCallback(async () => {
    const { name, baseUrl, apiKey, model } = localCustomConfig;

    if (
      !name?.trim() ||
      !baseUrl?.trim() ||
      !apiKey?.trim() ||
      !model?.trim()
    ) {
      setVerificationStatus("error");
      setVerificationMessage("请填写所有配置项");
      return;
    }

    setVerificationStatus("verifying");
    setVerificationMessage("正在验证配置...");

    try {
      const response = await fetch("/api/check-model-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: "custom-api",
          customConfig: localCustomConfig,
        }),
      });
      const result = await response.json();

      if (result.success || result.status === MODEL_STATUS.AVAILABLE) {
        setVerificationStatus("success");
        setVerificationMessage("配置已成功应用！");

        const customModel = getModelById("custom-api");
        // 关键：将最终确认的配置上报给父组件
        onConfigChange(customModel, localCustomConfig);

        setTimeout(() => {
          setIsPopoverOpen(false);
          setVerificationStatus("idle");
        }, 1500);
      } else {
        setVerificationStatus("error");
        setVerificationMessage(result.message || "验证失败，请检查配置");
      }
    } catch (error) {
      console.error("验证自定义配置异常:", error);
      setVerificationStatus("error");
      setVerificationMessage("验证请求失败，请检查网络连接");
    }
  }, [localCustomConfig, onConfigChange]);

  // === Helper Functions ===
  const getDisplayName = () =>
    activeModel?.id === "custom-api"
      ? activeCustomConfig?.name || activeModel?.name
      : activeModel?.name || "选择模型";

  const getDisplayModel = () =>
    activeModel?.id === "custom-api"
      ? activeCustomConfig?.model || "未配置"
      : activeModel?.modelId || "";

  // 简化的状态颜色逻辑
  const getActiveStatusColor = () => {
    if (!activeModel) return "#6b7280"; // gray (未配置)
    // 假设Ollama默认可用，自定义模型需要配置完整
    if (activeModel.id === "custom-api") {
      return activeCustomConfig?.apiKey && activeCustomConfig?.baseUrl
        ? "#10b981"
        : "#ef4444"; // green or red
    }
    return "#10b981"; // green (默认可用)
  };

  // === Styles (保持不变) ===
  const styles = {
    container: { position: "relative", display: "inline-block" },
    button: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "12px 16px",
      backgroundColor: "#ffffff",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
      color: "#374151",
      transition: "all 0.2s ease",
      minWidth: "300px",
    },
    modelInfo: {
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      flex: 1,
    },
    modelName: {
      fontWeight: "600",
      color: "#111827",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    modelProvider: { fontSize: "12px", color: "#6b7280", marginTop: "2px" },
    statusDot: {
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      backgroundColor: getActiveStatusColor(),
    },
    chevron: {
      fontSize: "12px",
      color: "#9ca3af",
      transform: isPopoverOpen ? "rotate(180deg)" : "rotate(0deg)",
      transition: "transform 0.2s ease",
    },
    popover: {
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      marginTop: "8px",
      backgroundColor: "#ffffff",
      border: "1px solid #e5e7eb",
      borderRadius: "12px",
      boxShadow:
        "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      padding: "16px",
      zIndex: 1000,
      minWidth: "400px",
    },
    section: { marginBottom: "16px" },
    sectionTitle: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#374151",
      marginBottom: "8px",
    },
    modelList: { display: "flex", flexDirection: "column", gap: "8px" },
    modelOption: (isSelected) => ({
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "12px",
      border: `1px solid ${isSelected ? "#3b82f6" : "#e5e7eb"}`,
      borderRadius: "8px",
      cursor: "pointer",
      transition: "all 0.2s ease",
      backgroundColor: isSelected ? "#eff6ff" : "#ffffff",
    }),
    modelIcon: { fontSize: "16px" },
    divider: { height: "1px", backgroundColor: "#e5e7eb", margin: "16px 0" },
    configForm: { display: "flex", flexDirection: "column", gap: "12px" },
    inputGroup: { display: "flex", flexDirection: "column", gap: "4px" },
    label: { fontSize: "12px", fontWeight: "500", color: "#6b7280" },
    input: {
      padding: "8px 12px",
      border: "1px solid #d1d5db",
      borderRadius: "6px",
      fontSize: "14px",
      fontFamily: "inherit",
    },
    verifyButton: {
      padding: "8px 16px",
      border: "none",
      borderRadius: "6px",
      fontSize: "14px",
      fontWeight: "500",
      transition: "all 0.2s ease",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
    },
    successButton: { backgroundColor: "#10b981", color: "#ffffff" },
    errorButton: { backgroundColor: "#ef4444", color: "#ffffff" },
    normalButton: { backgroundColor: "#3b82f6", color: "#ffffff" },
    disabledButton: {
      backgroundColor: "#f3f4f6",
      color: "#9ca3af",
      cursor: "not-allowed",
    },
    message: {
      fontSize: "12px",
      marginTop: "8px",
      padding: "6px 8px",
      borderRadius: "4px",
    },
    successMessage: { backgroundColor: "#ecfdf5", color: "#065f46" },
    errorMessage: { backgroundColor: "#fef2f2", color: "#991b1b" },
    spinner: {
      width: "14px",
      height: "14px",
      border: "2px solid transparent",
      borderTop: "2px solid currentColor",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
    },
  };

  useEffect(() => {
    if (!document.getElementById("popover-animations")) {
      const style = document.createElement("style");
      style.id = "popover-animations";
      style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
      document.head.appendChild(style);
    }
  }, []);

  // === Render ===
  const getButtonState = () => {
    switch (verificationStatus) {
      case "verifying":
        return {
          style: styles.disabledButton,
          text: "正在验证...",
          disabled: true,
        };
      case "success":
        return {
          style: styles.successButton,
          text: "应用成功 ✓",
          disabled: true,
        };
      case "error":
        return {
          style: styles.normalButton,
          text: "重新验证",
          disabled: false,
        };
      default:
        return {
          style: styles.normalButton,
          text: "验证并应用",
          disabled: false,
        };
    }
  };
  const buttonState = getButtonState();

  return (
    <div style={styles.container}>
      <button
        onClick={() => setIsPopoverOpen(!isPopoverOpen)}
        style={styles.button}
      >
        <span style={styles.modelIcon}>🧠</span>
        <div style={styles.modelInfo}>
          <div style={styles.modelName}>
            <div style={styles.statusDot}></div>
            {getDisplayName()}
          </div>
          <div style={styles.modelProvider}>{getDisplayModel()}</div>
        </div>
        <span style={styles.chevron}>▼</span>
      </button>

      {isPopoverOpen && (
        <div style={styles.popover}>
          <div style={styles.section}>
            <div style={styles.sectionTitle}>选择AI模型</div>
            <div style={styles.modelList}>
              {availableModels.map((model) => (
                <div
                  key={model.id}
                  style={styles.modelOption(
                    selectedModelIdInPopover === model.id
                  )}
                  onClick={() =>
                    model.id === "custom-api"
                      ? setSelectedModelIdInPopover(model.id)
                      : handleQuickSwitch(model.id)
                  }
                >
                  <span style={styles.modelIcon}>{model.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: "500" }}>
                      {model.name}
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>
                      {model.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedModelIdInPopover === "custom-api" && (
            <>
              <div style={styles.divider}></div>
              <div style={styles.section}>
                <div style={styles.sectionTitle}>自定义模型配置</div>
                <div style={styles.configForm}>
                  {["name", "baseUrl", "apiKey", "model"].map((field, idx) => {
                    const labels = [
                      "显示名称",
                      "Base URL",
                      "API 密钥",
                      "模型标识",
                    ];
                    const placeholders = [
                      "给这个AI模型起个名字",
                      "https://api.openai.com/v1",
                      "请输入您的API密钥",
                      "gpt-4-turbo",
                    ];
                    return (
                      <div key={field} style={styles.inputGroup}>
                        <label style={styles.label}>{labels[idx]}</label>
                        <input
                          type={field === "apiKey" ? "password" : "text"}
                          style={styles.input}
                          placeholder={placeholders[idx]}
                          value={localCustomConfig?.[field] || ""}
                          onChange={(e) =>
                            handleCustomConfigChange(field, e.target.value)
                          }
                        />
                      </div>
                    );
                  })}
                  <button
                    style={{ ...styles.verifyButton, ...buttonState.style }}
                    onClick={handleVerifyAndApply}
                    disabled={buttonState.disabled}
                  >
                    {verificationStatus === "verifying" && (
                      <div style={styles.spinner}></div>
                    )}
                    {buttonState.text}
                  </button>
                  {verificationMessage && (
                    <div
                      style={{
                        ...styles.message,
                        ...(verificationStatus === "success"
                          ? styles.successMessage
                          : styles.errorMessage),
                      }}
                    >
                      {verificationMessage}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AIModelManager;
