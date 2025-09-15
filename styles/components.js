// styles/components.js - 组件样式常量

import {
  colors,
  fontSize,
  spacing,
  borderRadius,
  boxShadow,
  transition,
} from "./theme.js";

// 按钮样式
export const buttonStyles = {
  // 基础按钮
  base: {
    padding: `${spacing.sm} ${spacing.base}`,
    border: "none",
    borderRadius: borderRadius.base,
    fontSize: fontSize.base,
    fontWeight: "500",
    cursor: "pointer",
    transition: transition.base,
    display: "inline-flex",
    alignItems: "center",
    gap: spacing.sm,
  },

  // 主要按钮
  primary: {
    backgroundColor: colors.primary,
    color: colors.text.white,
    border: `2px solid ${colors.primary}`,
  },

  // 次要按钮
  secondary: {
    backgroundColor: colors.background.light,
    color: colors.text.secondary,
    border: `1px solid ${colors.border.secondary}`,
  },

  // 导航按钮
  nav: {
    padding: `${spacing.sm} ${spacing.lg}`,
    borderRadius: borderRadius.md,
    fontSize: fontSize.base,
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    transition: transition.base,
  },

  // 清空按钮
  clear: {
    padding: `${spacing.sm} ${spacing.base}`,
    backgroundColor: colors.background.light,
    border: `1px solid ${colors.border.secondary}`,
    borderRadius: borderRadius.base,
    color: colors.text.secondary,
    cursor: "pointer",
    fontSize: fontSize.base,
    transition: transition.base,
  },

  // 发送按钮
  send: {
    backgroundColor: colors.primary,
    color: colors.text.white,
    border: "none",
    borderRadius: borderRadius.md,
    padding: `${spacing.sm} ${spacing.md}`,
    cursor: "pointer",
    fontSize: fontSize.base,
    fontWeight: "500",
    marginLeft: spacing.sm,
    transition: transition.base,
  },

  // 禁用状态
  disabled: {
    backgroundColor: colors.border.tertiary,
    color: colors.text.light,
    cursor: "not-allowed",
  },
};

// 消息气泡样式
export const messageBubbleStyles = {
  // 用户消息气泡
  user: {
    backgroundColor: colors.primary,
    color: colors.text.white,
    padding: `${spacing.sm} ${spacing.base}`, // 减少内边距
    borderRadius: `${borderRadius.lg} ${borderRadius.lg} ${spacing.xs} ${borderRadius.lg}`,
    fontSize: fontSize.sm, // 减小字体
    lineHeight: "1.3", // 减小行高
    wordBreak: "break-word",
  },

  // AI助手消息气泡
  assistant: {
    backgroundColor: colors.background.primary,
    border: `1px solid ${colors.border.secondary}`,
    padding: `${spacing.sm} ${spacing.base}`, // 减少内边距
    borderRadius: `${borderRadius.lg} ${borderRadius.lg} ${borderRadius.lg} ${spacing.xs}`,
    fontSize: fontSize.sm, // 减小字体
    lineHeight: "1.4", // 减小行高
    wordBreak: "break-word",
    color: colors.text.primary,
  },

  // 错误消息气泡
  error: {
    backgroundColor: "#fed7d7",
    border: "1px solid #fc8181",
    color: "#9b2c2c",
  },

  // 加载消息气泡
  loading: {
    backgroundColor: colors.background.light,
    border: `1px solid ${colors.border.secondary}`,
    padding: `${spacing.base} ${spacing.md}`,
    borderRadius: `${borderRadius.xl} ${borderRadius.xl} ${borderRadius.xl} ${spacing.xs}`,
    fontSize: fontSize.base,
    color: colors.text.secondary,
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
  },
};

// 头像样式
export const avatarStyles = {
  base: {
    width: "28px", // 减小头像尺寸
    height: "28px", // 减小头像尺寸
    borderRadius: borderRadius.full,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: fontSize.sm, // 减小字体
    flexShrink: 0,
  },

  user: {
    backgroundColor: colors.primary,
  },

  assistant: {
    backgroundColor: colors.success,
  },

  error: {
    backgroundColor: colors.error,
  },

  loading: {
    backgroundColor: colors.border.tertiary,
  },
};

// 输入框样式
export const inputStyles = {
  // 文本输入框
  textarea: {
    flex: 1,
    border: "none",
    outline: "none",
    resize: "none",
    fontSize: fontSize.base,
    lineHeight: "1.4", // 减小行高
    padding: `${spacing.xs} ${spacing.sm}`, // 减小内边距
    minHeight: "18px", // 减小最小高度
    maxHeight: "100px", // 减小最大高度
    fontFamily: "inherit",
    backgroundColor: "transparent",
  },

  // 输入容器
  container: {
    position: "relative",
    border: `2px solid ${colors.border.secondary}`,
    borderRadius: borderRadius.md, // 减小圆角
    backgroundColor: colors.background.primary,
    transition: transition.base,
  },

  // 拖拽状态
  dragOver: {
    borderColor: colors.primary,
    backgroundColor: "#f0f8ff",
  },

  // 文件上传按钮
  fileButton: {
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "18px", // 减小图标大小
    padding: spacing.xs, // 减小内边距
    borderRadius: borderRadius.base,
    marginRight: spacing.xs, // 减小右边距
    transition: transition.base,
  },
};

// 标题样式
export const titleStyles = {
  // 页面主标题
  pageTitle: {
    margin: 0,
    color: colors.text.primary,
    fontSize: fontSize["3xl"],
    fontWeight: "600",
  },

  chartpageTitle: {
    margin: `${spacing.xs} 0 0 ${spacing.xs}`,
    color: colors.text.primary,
    fontSize: fontSize["2xl"],
    fontWeight: "600",
  },

  chartsubTitle: {
    margin: `${spacing.xs} 0 0 ${spacing.xs}`,
    color: colors.text.tertiary,
    fontSize: fontSize.base,
  },

  // 聊天标题
  chatTitle: {
    margin: `${spacing.xs} 0 ${spacing.xs} 0`, // 增加上边距
    color: colors.text.primary,
    fontSize: fontSize.lg,
    fontWeight: "600",
  },

  // 页面副标题
  subtitle: {
    margin: `${spacing.xs} 0 0 0`,
    color: colors.text.tertiary,
    fontSize: fontSize.base,
  },
};

// 文件显示样式
export const fileStyles = {
  // 文件列表容器
  fileList: {
    marginBottom: spacing.base,
    padding: spacing.base,
    backgroundColor: colors.background.light,
    borderRadius: borderRadius.md,
    border: `1px solid ${colors.border.secondary}`,
  },

  // 文件项
  fileItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.background.primary,
    padding: `${spacing.sm} ${spacing.base}`,
    borderRadius: borderRadius.base,
    marginBottom: spacing.xs,
    border: `1px solid ${colors.border.secondary}`,
  },

  // 文件信息
  fileInfo: {
    fontSize: fontSize.base,
    color: colors.text.primary,
  },

  // 文件状态标签
  fileStatus: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    backgroundColor: "#e6f3ff",
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: borderRadius.xs,
    display: "inline-block",
  },
};

// AI服务标签样式
export const aiServiceStyles = {
  // 服务标签
  tag: {
    padding: "2px 6px",
    borderRadius: borderRadius.xs,
    fontSize: fontSize.xs,
    fontWeight: "500",
    border: "1px solid",
  },

  // Ollama服务
  ollama: {
    backgroundColor: colors.ai.ollama.bg,
    color: colors.ai.ollama.text,
    border: `1px solid ${colors.ai.ollama.border}`,
  },

  // 智谱服务
  zhipu: {
    backgroundColor: colors.ai.zhipu.bg,
    color: colors.ai.zhipu.text,
    border: `1px solid ${colors.ai.zhipu.border}`,
  },
};

// ChatInput 组件样式
export const chatInputStyles = {
  // 容器样式 - 使用 flexbox 布局
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%", // 使用父容器高度
    overflow: "hidden", // 防止溢出
  },

  // 文件列表样式 - 使用 flexbox，不使用绝对定位
  fileList: {
    flexShrink: 0, // 不缩小
    backgroundColor: "rgba(248, 250, 252, 0.95)",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    borderBottom: "none",
    padding: spacing.sm,
    marginBottom: "1px", // 与输入框无缝连接
    maxHeight: "120px", // 限制最大高度
    overflowY: "auto", // 添加滚动条
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },

  fileListHeader: {
    fontSize: fontSize.xs, // 减小字体
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    fontWeight: "500",
  },

  fileItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.background.white,
    border: `1px solid ${colors.border.secondary}`,
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
    marginBottom: spacing.xs,
  },

  fileInfo: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
    flex: 1,
  },

  removeButton: {
    backgroundColor: "transparent",
    border: "none",
    color: colors.error,
    cursor: "pointer",
    fontSize: fontSize.lg,
    padding: "2px",
  },

  // 输入容器样式
  inputContainer: {
    position: "relative",
    backgroundColor: colors.background.white,
    border: `1px solid ${colors.border.secondary}`,
    borderRadius: borderRadius.md,
    boxShadow: boxShadow.sm,
    transition: transition.base,
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },

  // 拖拽悬停样式
  dragOver: {
    borderColor: colors.primary,
    backgroundColor: "rgba(0, 102, 204, 0.05)",
  },

  // 拖拽提示样式
  dragOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 102, 204, 0.1)",
    borderRadius: borderRadius.md,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    fontSize: fontSize.lg,
    color: colors.primary,
    fontWeight: "500",
  },

  // 输入区域布局 - 适配固定高度
  inputArea: {
    display: "flex",
    alignItems: "flex-end",
    padding: spacing.sm, // 减小内边距
    height: "60px", // 固定输入区域高度
  },

  // 文件上传按钮
  fileButton: {
    backgroundColor: "transparent",
    border: "none",
    color: colors.text.secondary,
    cursor: "pointer",
    fontSize: fontSize.lg,
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    transition: transition.base,
    marginRight: spacing.xs,
  },

  // 文本输入框
  textarea: {
    flex: 1,
    border: "none",
    outline: "none",
    resize: "none",
    fontSize: fontSize.base,
    lineHeight: "1.4",
    padding: `${spacing.xs} 0`,
    margin: `0 ${spacing.sm}`,
    backgroundColor: "transparent",
    color: colors.text.primary,
    minHeight: "20px",
    maxHeight: "100px",
  },

  // 发送按钮
  sendButton: {
    backgroundColor: colors.primary,
    color: colors.text.white,
    border: "none",
    borderRadius: borderRadius.md,
    padding: `${spacing.sm} ${spacing.md}`,
    cursor: "pointer",
    fontSize: fontSize.base,
    fontWeight: "500",
    marginLeft: spacing.sm,
    transition: transition.base,
  },

  // 隐藏的文件输入
  hiddenInput: {
    display: "none",
  },

  // 快捷指令样式
  shortcutsContainer: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    display: "flex",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  shortcutButton: {
    backgroundColor: colors.background.light,
    color: colors.text.secondary,
    border: `1px solid ${colors.border.secondary}`,
    borderRadius: borderRadius.sm,
    fontSize: fontSize.xs,
    padding: `2px ${spacing.xs}`,
    cursor: "pointer",
    transition: transition.base,
    minWidth: "auto",
  },
};
