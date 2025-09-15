// styles/index.js - 统一样式导出

// 主题和基础常量
export * from "./theme.js";

// 布局样式
export * from "./layouts.js";

// 组件样式
export * from "./components.js";

// 工具函数
export * from "./utils.js";

// 预设样式组合
import { combineStyles } from "./utils.js";
import { layouts, chatLayouts, messageLayouts, flexUtils } from "./layouts.js";
import {
  buttonStyles,
  messageBubbleStyles,
  avatarStyles,
  inputStyles,
  titleStyles,
  fileStyles,
  aiServiceStyles,
} from "./components.js";

// 导出常用样式组合
export const presetStyles = {
  // 页面布局组合
  page: {
    container: layouts.pageContainer,
    header: layouts.header,
    main: layouts.main,
  },

  // 聊天界面组合
  chat: {
    analyzer: layouts.chatAnalyzer,
    panel: layouts.chatPanel,
    visualizationPanel: layouts.visualizationPanel,
    header: chatLayouts.chatHeader,
    messageArea: chatLayouts.messageArea,
    inputArea: chatLayouts.inputArea,
    aiServiceSelector: layouts.aiServiceSelector,
  },

  // 消息组合
  message: {
    list: messageLayouts.messageList,
    user: combineStyles(messageLayouts.userMessage, { marginBottom: "8px" }),
    assistant: combineStyles(messageLayouts.assistantMessage, {
      marginBottom: "8px",
    }),
  },

  // 按钮组合
  button: {
    primary: buttonStyles.primary,
    secondary: buttonStyles.secondary,
    nav: buttonStyles.nav,
    send: buttonStyles.send,
    clear: buttonStyles.clear,
  },

  // 工具类组合
  utils: {
    ...flexUtils,
    card: {
      backgroundColor: "#fff",
      borderRadius: "12px",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
      padding: "20px",
    },
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      zIndex: 50,
    },
  },
};

// 主题切换函数 (为未来扩展准备)
export const createTheme = (customColors = {}) => {
  // 可以在这里实现主题切换逻辑
  const { colors } = require("./theme.js");
  return {
    colors: { ...colors, ...customColors },
    // 其他主题相关设置
  };
};
