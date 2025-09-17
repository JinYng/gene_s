// components/chat/AIModelManager.js
// AI模型管理器 - 主入口组件，类似Google AI Studio风格

import React, { useState, useEffect, useRef, useCallback } from "react";
import ModelSettingsModal from "./ModelSettingsModal";
import {
  models,
  DEFAULT_MODEL_ID,
  MODEL_STATUS,
  getModelById,
  getAvailableModels,
  STORAGE_KEYS
} from "../../config/models.js";

const AIModelManager = ({ onModelChange, currentModelId = null }) => {
  // === State Management ===
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableModels] = useState(getAvailableModels());
  const [selectedModelId, setSelectedModelId] = useState(currentModelId || DEFAULT_MODEL_ID);
  const [apiKeys, setApiKeys] = useState({});
  const [modelStatuses, setModelStatuses] = useState({});

  // 使用ref来跟踪是否已经初始化，避免重复执行
  const hasInitialized = useRef(false);

  // === Effects ===

  // 初始化：从localStorage加载数据
  useEffect(() => {
    // 加载保存的模型选择
    const savedModelId = localStorage.getItem(STORAGE_KEYS.SELECTED_MODEL);
    if (savedModelId && getModelById(savedModelId)) {
      setSelectedModelId(savedModelId);
    }

    // 加载保存的API密钥
    try {
      const savedApiKeys = localStorage.getItem(STORAGE_KEYS.API_KEYS);
      if (savedApiKeys) {
        setApiKeys(JSON.parse(savedApiKeys));
      }
    } catch (error) {
      console.error("加载API密钥失败:", error);
    }

    // 加载保存的模型状态
    try {
      const savedStatuses = localStorage.getItem(STORAGE_KEYS.MODEL_STATUSES);
      if (savedStatuses) {
        setModelStatuses(JSON.parse(savedStatuses));
      }
    } catch (error) {
      console.error("加载模型状态失败:", error);
    }
  }, []);

  // 初始验证所有模型状态 - 只在组件首次挂载时执行
  useEffect(() => {
    if (hasInitialized.current) return;

    const initializeModelStatuses = async () => {
      console.log("🔍 初始化模型状态检查...");
      hasInitialized.current = true;

      // 获取当前的apiKeys值（因为state可能还没更新）
      const currentApiKeys = JSON.parse(localStorage.getItem(STORAGE_KEYS.API_KEYS) || '{}');

      for (const model of availableModels) {
        try {
          // 设置为检查中状态
          setModelStatuses(prev => ({
            ...prev,
            [model.id]: MODEL_STATUS.CHECKING
          }));

          const result = await checkModelAvailability(model.id, currentApiKeys[model.id]);

          setModelStatuses(prev => {
            const newStatuses = {
              ...prev,
              [model.id]: result.status
            };

            // 保存到localStorage
            localStorage.setItem(STORAGE_KEYS.MODEL_STATUSES, JSON.stringify(newStatuses));
            return newStatuses;
          });

        } catch (error) {
          console.error(`检查模型 ${model.id} 状态失败:`, error);
          setModelStatuses(prev => ({
            ...prev,
            [model.id]: MODEL_STATUS.UNAVAILABLE
          }));
        }
      }
    };

    // 延迟执行以避免启动时过多请求
    const timer = setTimeout(initializeModelStatuses, 1000);
    return () => clearTimeout(timer);
  }, []); // 移除所有依赖项，只在挂载时执行一次

  // 使用useCallback包装onModelChange回调，避免每次渲染都触发
  const handleModelChangeCallback = useCallback((model) => {
    if (onModelChange) {
      onModelChange(model);
    }
  }, [onModelChange]);

  // 监听selectedModelId变化，通知父组件
  useEffect(() => {
    if (selectedModelId) {
      const model = getModelById(selectedModelId);
      handleModelChangeCallback(model);
    }
  }, [selectedModelId, handleModelChangeCallback]);

  // === Core Functions ===

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleModelSelection = (modelId) => {
    setSelectedModelId(modelId);
    // 保存到localStorage
    localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, modelId);
  };

  const handleSaveAndVerifyApiKey = async (modelId, apiKey) => {
    try {
      // 设置检查中状态
      setModelStatuses(prev => ({
        ...prev,
        [modelId]: MODEL_STATUS.CHECKING
      }));

      // 更新API密钥状态
      const newApiKeys = {
        ...apiKeys,
        [modelId]: apiKey
      };
      setApiKeys(newApiKeys);

      // 保存到localStorage
      localStorage.setItem(STORAGE_KEYS.API_KEYS, JSON.stringify(newApiKeys));

      // 调用验证API
      const result = await checkModelAvailability(modelId, apiKey);

      // 更新模型状态
      const newStatuses = {
        ...modelStatuses,
        [modelId]: result.status
      };
      setModelStatuses(newStatuses);

      // 保存状态到localStorage
      localStorage.setItem(STORAGE_KEYS.MODEL_STATUSES, JSON.stringify(newStatuses));

      return result;

    } catch (error) {
      console.error("验证API密钥失败:", error);

      // 设置为不可用状态
      setModelStatuses(prev => ({
        ...prev,
        [modelId]: MODEL_STATUS.UNAVAILABLE
      }));

      return {
        success: false,
        status: MODEL_STATUS.UNAVAILABLE,
        message: "验证过程中发生错误"
      };
    }
  };

  // 调用后端API检查模型可用性
  const checkModelAvailability = async (modelId, apiKey) => {
    const response = await fetch('/api/check-model-availability', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        modelId,
        apiKey: apiKey || null,
      }),
    });

    if (!response.ok) {
      throw new Error(`API调用失败: ${response.status}`);
    }

    return await response.json();
  };

  // === Render ===

  const currentModel = getModelById(selectedModelId);
  const currentStatus = modelStatuses[selectedModelId] || MODEL_STATUS.CHECKING;

  // 状态指示器颜色
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

  const styles = {
    container: {
      position: 'relative',
      display: 'inline-block',
    },

    button: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      transition: 'all 0.2s ease',
      minWidth: '200px',
      ':hover': {
        backgroundColor: '#f9fafb',
        borderColor: '#d1d5db',
      }
    },

    icon: {
      fontSize: '18px',
    },

    modelInfo: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      flex: 1,
    },

    modelName: {
      fontWeight: '600',
      color: '#111827',
    },

    modelProvider: {
      fontSize: '12px',
      color: '#6b7280',
      marginTop: '2px',
    },

    statusDot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: getStatusColor(currentStatus),
      marginRight: '4px',
    },

    chevron: {
      fontSize: '12px',
      color: '#9ca3af',
      transform: isModalOpen ? 'rotate(180deg)' : 'rotate(0deg)',
      transition: 'transform 0.2s ease',
    },
  };

  return (
    <div style={styles.container}>
      {/* 主按钮 */}
      <button
        onClick={handleOpenModal}
        style={styles.button}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#f9fafb';
          e.target.style.borderColor = '#d1d5db';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#ffffff';
          e.target.style.borderColor = '#e5e7eb';
        }}
      >
        {/* 模型图标 */}
        <span style={styles.icon}>🧠</span>

        {/* 模型信息 */}
        <div style={styles.modelInfo}>
          <div style={styles.modelName}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={styles.statusDot}></div>
              {currentModel.provider}
            </div>
          </div>
          <div style={styles.modelProvider}>
            {currentModel.modelId}
          </div>
        </div>

        {/* 下拉箭头 */}
        <span style={styles.chevron}>▼</span>
      </button>

      {/* 设置弹窗 */}
      <ModelSettingsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        models={availableModels}
        statuses={modelStatuses}
        apiKeys={apiKeys}
        selectedModelId={selectedModelId}
        onSelectModel={handleModelSelection}
        onSaveApiKey={handleSaveAndVerifyApiKey}
      />
    </div>
  );
};

export default AIModelManager;