// components/chat/ModelSettingsModal.js
// 模型设置弹窗 - 纯UI组件，类似Google AI Studio风格

import React, { useState, useEffect } from "react";
import { MODEL_STATUS } from "../../config/models.js";

const ModelSettingsModal = ({
  isOpen,
  onClose,
  models,
  statuses,
  apiKeys,
  selectedModelId,
  onSelectModel,
  onSaveApiKey,
}) => {
  // === Local State ===
  const [currentApiKey, setCurrentApiKey] = useState("");
  const [verifyingModel, setVerifyingModel] = useState(null);
  const [verificationMessage, setVerificationMessage] = useState("");

  // === Effects ===

  // 当选中的模型改变时，更新API密钥输入框
  useEffect(() => {
    const selectedModel = models.find(m => m.id === selectedModelId);
    if (selectedModel && selectedModel.requires_api_key) {
      setCurrentApiKey(apiKeys[selectedModelId] || "");
    } else {
      setCurrentApiKey("");
    }
    setVerificationMessage("");
  }, [selectedModelId, apiKeys, models]);

  // === Event Handlers ===

  const handleModelSelect = (modelId) => {
    onSelectModel(modelId);
  };

  const handleApiKeyChange = (e) => {
    setCurrentApiKey(e.target.value);
    setVerificationMessage(""); // 清除之前的验证消息
  };

  const handleVerifyAndSave = async () => {
    const selectedModel = models.find(m => m.id === selectedModelId);
    if (!selectedModel || !currentApiKey.trim()) {
      setVerificationMessage("请输入API密钥");
      return;
    }

    setVerifyingModel(selectedModelId);
    setVerificationMessage("正在验证...");

    try {
      const result = await onSaveApiKey(selectedModelId, currentApiKey.trim());

      if (result.success) {
        setVerificationMessage("✅ " + result.message);
      } else {
        setVerificationMessage("❌ " + result.message);
      }
    } catch (error) {
      setVerificationMessage("❌ 验证失败: " + error.message);
    } finally {
      setVerifyingModel(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && currentApiKey.trim()) {
      handleVerifyAndSave();
    }
  };

  // === Helper Functions ===

  const getStatusColor = (status) => {
    switch (status) {
      case MODEL_STATUS.AVAILABLE:
        return '#10b981'; // green-500
      case MODEL_STATUS.UNAVAILABLE:
        return '#ef4444'; // red-500
      case MODEL_STATUS.CHECKING:
        return '#f59e0b'; // amber-500
      case MODEL_STATUS.UNCONFIGURED:
        return '#6b7280'; // gray-500
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case MODEL_STATUS.AVAILABLE:
        return '可用';
      case MODEL_STATUS.UNAVAILABLE:
        return '不可用';
      case MODEL_STATUS.CHECKING:
        return '检查中...';
      case MODEL_STATUS.UNCONFIGURED:
        return '未配置';
      default:
        return '未知';
    }
  };

  // === Styles ===

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      opacity: isOpen ? 1 : 0,
      visibility: isOpen ? 'visible' : 'hidden',
      transition: 'all 0.3s ease',
    },

    modal: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      width: '480px',
      maxWidth: '90vw',
      maxHeight: '80vh',
      overflow: 'hidden',
      transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)',
      transition: 'all 0.3s ease',
    },

    header: {
      padding: '20px 24px',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    title: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#111827',
      margin: 0,
    },

    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#6b7280',
      padding: '4px',
      borderRadius: '4px',
      transition: 'all 0.2s ease',
    },

    content: {
      padding: '24px',
      maxHeight: 'calc(80vh - 140px)',
      overflowY: 'auto',
    },

    section: {
      marginBottom: '24px',
    },

    sectionTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '12px',
    },

    modelList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },

    modelOption: (isSelected) => ({
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '16px',
      border: `2px solid ${isSelected ? '#3b82f6' : '#e5e7eb'}`,
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
    }),

    radioButton: (isSelected) => ({
      width: '16px',
      height: '16px',
      borderRadius: '50%',
      border: `2px solid ${isSelected ? '#3b82f6' : '#d1d5db'}`,
      position: 'relative',
      marginTop: '2px',
      flexShrink: 0,
    }),

    radioButtonInner: (isSelected) => ({
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: '#3b82f6',
      position: 'absolute',
      top: '2px',
      left: '2px',
      opacity: isSelected ? 1 : 0,
      transition: 'opacity 0.2s ease',
    }),

    modelInfo: {
      flex: 1,
    },

    modelHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '4px',
    },

    modelName: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#111827',
    },

    modelIcon: {
      fontSize: '16px',
    },

    statusIndicator: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      marginLeft: 'auto',
    },

    statusDot: (status) => ({
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: getStatusColor(status),
    }),

    statusText: {
      fontSize: '12px',
      color: '#6b7280',
    },

    modelDescription: {
      fontSize: '12px',
      color: '#6b7280',
      lineHeight: '1.4',
    },

    apiKeySection: {
      backgroundColor: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '16px',
      marginTop: '16px',
      animation: 'slideDown 0.3s ease',
    },

    apiKeyLabel: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '8px',
      display: 'block',
    },

    apiKeyInput: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      fontFamily: 'monospace',
      marginBottom: '12px',
      boxSizing: 'border-box',
    },

    verifyButton: (isLoading) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      backgroundColor: isLoading ? '#f3f4f6' : '#3b82f6',
      color: isLoading ? '#9ca3af' : '#ffffff',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: isLoading ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease',
    }),

    spinner: {
      width: '14px',
      height: '14px',
      border: '2px solid transparent',
      borderTop: '2px solid currentColor',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },

    verificationMessage: {
      fontSize: '12px',
      marginTop: '8px',
      padding: '6px 8px',
      borderRadius: '4px',
      backgroundColor: verificationMessage.includes('✅') ? '#ecfdf5' : '#fef2f2',
      color: verificationMessage.includes('✅') ? '#065f46' : '#991b1b',
    },

    footer: {
      padding: '16px 24px',
      borderTop: '1px solid #e5e7eb',
      display: 'flex',
      justifyContent: 'flex-end',
    },

    doneButton: {
      padding: '8px 16px',
      backgroundColor: '#3b82f6',
      color: '#ffffff',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
  };

  // 添加CSS动画
  useEffect(() => {
    if (!document.getElementById('modal-animations')) {
      const style = document.createElement('style');
      style.id = 'modal-animations';
      style.textContent = `
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  if (!isOpen) return null;

  const selectedModel = models.find(m => m.id === selectedModelId);
  const showApiKeySection = selectedModel && selectedModel.requires_api_key;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>模型设置</h2>
          <button
            style={styles.closeButton}
            onClick={onClose}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {/* 模型选择 */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>选择AI模型</div>
            <div style={styles.modelList}>
              {models.map((model) => {
                const isSelected = model.id === selectedModelId;
                const status = statuses[model.id] || MODEL_STATUS.CHECKING;

                return (
                  <div
                    key={model.id}
                    style={styles.modelOption(isSelected)}
                    onClick={() => handleModelSelect(model.id)}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.target.style.borderColor = '#d1d5db';
                        e.target.style.backgroundColor = '#f9fafb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.backgroundColor = '#ffffff';
                      }
                    }}
                  >
                    {/* Radio Button */}
                    <div style={styles.radioButton(isSelected)}>
                      <div style={styles.radioButtonInner(isSelected)}></div>
                    </div>

                    {/* Model Info */}
                    <div style={styles.modelInfo}>
                      <div style={styles.modelHeader}>
                        <span style={styles.modelIcon}>{model.icon}</span>
                        <span style={styles.modelName}>{model.name}</span>
                        <div style={styles.statusIndicator}>
                          <div style={styles.statusDot(status)}></div>
                          <span style={styles.statusText}>
                            {getStatusText(status)}
                          </span>
                        </div>
                      </div>
                      <div style={styles.modelDescription}>
                        {model.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* API密钥配置区 */}
          {showApiKeySection && (
            <div style={styles.apiKeySection}>
              <label style={styles.apiKeyLabel}>
                API密钥 - {selectedModel.provider}
              </label>
              <input
                type="password"
                style={styles.apiKeyInput}
                placeholder={`请输入${selectedModel.provider}的API密钥`}
                value={currentApiKey}
                onChange={handleApiKeyChange}
                onKeyPress={handleKeyPress}
              />
              <button
                style={styles.verifyButton(verifyingModel === selectedModelId)}
                onClick={handleVerifyAndSave}
                disabled={!currentApiKey.trim() || verifyingModel === selectedModelId}
                onMouseEnter={(e) => {
                  if (verifyingModel !== selectedModelId && currentApiKey.trim()) {
                    e.target.style.backgroundColor = '#2563eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (verifyingModel !== selectedModelId) {
                    e.target.style.backgroundColor = '#3b82f6';
                  }
                }}
              >
                {verifyingModel === selectedModelId && (
                  <div style={styles.spinner}></div>
                )}
                {verifyingModel === selectedModelId ? '验证中...' : '验证并保存'}
              </button>
              {verificationMessage && (
                <div style={styles.verificationMessage}>
                  {verificationMessage}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button
            style={styles.doneButton}
            onClick={onClose}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#3b82f6';
            }}
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModelSettingsModal;