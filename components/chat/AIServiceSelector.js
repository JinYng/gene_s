// components/AIServiceSelector.js
// AI服务选择器组件

import React, { useState, useEffect } from "react";
import { chatService } from "../../services/chatService";
import {
  colors,
  spacing,
  fontSize,
  borderRadius,
  buttonStyles,
  aiServiceStyles,
  createHoverStyles,
  flexUtils,
  transition,
} from "../../styles";

const AIServiceSelector = ({
  onServiceChange,
  currentService,
  className = "",
}) => {
  const [availableServices, setAvailableServices] = useState({});
  const [serviceStatus, setServiceStatus] = useState({});
  const [isChecking, setIsChecking] = useState(false);

  // 初始化时获取可用服务
  useEffect(() => {
    const services = chatService.getAvailableServices();
    setAvailableServices(services);
    checkAllServicesStatus(services);
  }, []);

  // 检查所有服务状态
  const checkAllServicesStatus = async (services) => {
    setIsChecking(true);
    const status = {};

    for (const [serviceId, serviceConfig] of Object.entries(services)) {
      try {
        const isAvailable = await chatService.checkServiceAvailability(
          serviceId
        );
        status[serviceId] = {
          available: isAvailable,
          checking: false,
          error: null,
        };
      } catch (error) {
        status[serviceId] = {
          available: false,
          checking: false,
          error: error.message,
        };
      }
    }

    setServiceStatus(status);
    setIsChecking(false);
  };

  // 处理服务切换
  const handleServiceChange = async (serviceId) => {
    if (serviceId === currentService?.provider) return;

    try {
      const success = chatService.setCurrentService(serviceId);
      if (success) {
        const newService = chatService.getCurrentService();
        onServiceChange?.(newService);
      }
    } catch (error) {
      console.error("切换AI服务失败:", error);
    }
  };

  // 获取服务状态图标
  const getStatusIcon = (serviceId) => {
    const status = serviceStatus[serviceId];
    if (!status) return "⏳";
    if (status.checking) return "⏳";
    if (status.available) return "✅";
    return "❌";
  };

  // 获取服务状态描述
  const getStatusText = (serviceId) => {
    const status = serviceStatus[serviceId];
    if (!status) return "检查中...";
    if (status.checking) return "检查中...";
    if (status.available) return "可用";
    return `不可用${status.error ? `: ${status.error}` : ""}`;
  };

  // 创建组件样式
  const styles = {
    container: {
      backgroundColor: colors.background.tertiary,
      border: `1px solid ${colors.border.secondary}`,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      margin: `${spacing.md} 0`,
    },
    header: {
      ...flexUtils.spaceBetween,
      marginBottom: spacing.base,
    },
    title: {
      margin: 0,
      color: colors.text.primary,
      fontSize: fontSize.lg,
      fontWeight: "600",
    },
    refreshButton: {
      ...buttonStyles.secondary,
      fontSize: fontSize.lg,
      padding: spacing.xs,
      minWidth: "auto",
    },
    serviceList: {
      display: "flex",
      flexDirection: "column",
      gap: spacing.sm,
    },
    serviceItem: {
      ...flexUtils.spaceBetween,
      padding: spacing.base,
      border: `2px solid ${colors.border.secondary}`,
      borderRadius: borderRadius.base,
      cursor: "pointer",
      transition: transition.base,
      backgroundColor: colors.background.primary,
    },
    serviceItemSelected: {
      borderColor: colors.primary,
      backgroundColor: "#e7f3ff",
    },
    serviceItemDisabled: {
      cursor: "not-allowed",
      opacity: 0.6,
      backgroundColor: colors.background.light,
    },
    serviceInfo: {
      flex: 1,
    },
    serviceName: {
      ...flexUtils.centerVertical,
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    serviceIcon: {
      fontSize: fontSize.lg,
    },
    name: {
      fontWeight: "600",
      color: colors.text.primary,
      fontSize: fontSize.base,
    },
    currentBadge: {
      backgroundColor: colors.primary,
      color: colors.text.white,
      fontSize: fontSize.xs,
      padding: `2px ${spacing.xs}`,
      borderRadius: borderRadius.xs,
      fontWeight: "500",
    },
    serviceDetails: {
      display: "flex",
      gap: spacing.base,
      fontSize: fontSize.sm,
      color: colors.text.tertiary,
    },
    model: {
      fontFamily: "monospace",
      backgroundColor: colors.background.hover,
      padding: `1px ${spacing.xs}`,
      borderRadius: "3px",
    },
    serviceStatus: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: spacing.xs,
    },
    statusIcon: {
      fontSize: fontSize.lg,
    },
    statusText: {
      fontSize: fontSize.xs,
      color: colors.text.tertiary,
      textAlign: "center",
    },
    tips: {
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTop: `1px solid ${colors.border.secondary}`,
      fontSize: fontSize.sm,
      color: colors.text.tertiary,
    },
    tipsTitle: {
      margin: `0 0 ${spacing.sm} 0`,
      fontWeight: "600",
      color: colors.text.secondary,
    },
    tipsList: {
      margin: 0,
      paddingLeft: spacing.md,
    },
    tipsItem: {
      marginBottom: spacing.xs,
    },
  };

  // 刷新按钮样式
  const refreshButtonProps = createHoverStyles(styles.refreshButton, {
    backgroundColor: colors.background.hover,
  });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h4 style={styles.title}>🤖 AI模型选择</h4>
        <button
          onClick={() => checkAllServicesStatus(availableServices)}
          disabled={isChecking}
          title="刷新服务状态"
          {...refreshButtonProps}
        >
          {isChecking ? "⏳" : "🔄"}
        </button>
      </div>

      <div style={styles.serviceList}>
        {Object.entries(availableServices).map(([serviceId, serviceConfig]) => {
          const isSelected = currentService?.provider === serviceId;
          const status = serviceStatus[serviceId];
          const isAvailable = status?.available || false;

          // 动态样式
          const itemStyle = {
            ...styles.serviceItem,
            ...(isSelected ? styles.serviceItemSelected : {}),
            ...(!isAvailable ? styles.serviceItemDisabled : {}),
          };

          // 悬停效果
          const itemProps = isAvailable
            ? createHoverStyles(itemStyle, {
                borderColor: colors.primary,
                backgroundColor: "#f8f9ff",
              })
            : { style: itemStyle };

          return (
            <div
              key={serviceId}
              {...itemProps}
              onClick={() => isAvailable && handleServiceChange(serviceId)}
            >
              <div style={styles.serviceInfo}>
                <div style={styles.serviceName}>
                  <span style={styles.serviceIcon}>
                    {serviceConfig.isLocal ? "🏠" : "☁️"}
                  </span>
                  <span style={styles.name}>{serviceConfig.name}</span>
                  {isSelected && <span style={styles.currentBadge}>当前</span>}
                </div>
                <div style={styles.serviceDetails}>
                  <span style={styles.model}>{serviceConfig.model}</span>
                  <span>{serviceConfig.description}</span>
                </div>
              </div>
              <div style={styles.serviceStatus}>
                <span style={styles.statusIcon}>
                  {getStatusIcon(serviceId)}
                </span>
                <span style={styles.statusText}>
                  {getStatusText(serviceId)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={styles.tips}>
        <p style={styles.tipsTitle}>💡 提示：</p>
        <ul style={styles.tipsList}>
          <li style={styles.tipsItem}>☁️ 智谱AI：云端服务，需要API密钥</li>
          <li style={styles.tipsItem}>🏠 Ollama：本地服务，需要本地部署</li>
          <li style={styles.tipsItem}>系统会自动选择最适合的模型</li>
        </ul>
      </div>
    </div>
  );
};

export default AIServiceSelector;
