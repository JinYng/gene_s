// styles/layouts.js - 布局样式常量

import {
  colors,
  spacing,
  borderRadius,
  boxShadow,
  transition,
} from "./theme.js";

// 主容器布局
export const layouts = {
  // 页面主容器
  pageContainer: {
    minHeight: "100vh",
    backgroundColor: colors.background.secondary,
  },

  // 导航栏
  header: {
    padding: "8px 0", // 从16px减少到8px
    backgroundColor: colors.background.primary,
    borderBottom: `1px solid ${colors.border.primary}`, // 从2px减少到1px
    boxShadow: boxShadow.sm,
  },

  headerContent: {
    maxWidth: "1600px",
    margin: "0 auto",
    padding: `0 ${spacing.lg}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  // 主内容区域
  main: {
    paddingTop: spacing.lg, // 移除顶部内边距
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    paddingBottom: 0, // 移除底部内边距
    height: "calc(100vh - 100px)", // 进一步调整高度计算，头部现在更小
    maxWidth: "1600px", // 设置最大宽度与头部对齐
    margin: "0 auto", // 居中对齐
    overflow: "hidden", // 防止溢出
  },

  // 对话分析器主容器
  chatAnalyzer: {
    display: "flex",
    height: "100%", // 使用100%高度，依赖父容器的高度设置
    width: "100%", // 改为100%宽度，不使用maxWidth和margin
    gap: "0",
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    boxShadow: boxShadow.lg,
  },

  // 左侧聊天面板
  chatPanel: {
    width: "35%",
    minWidth: "420px", // 稍微增加最小宽度
    borderRight: `1px solid ${colors.border.primary}`,
    display: "flex",
    flexDirection: "column",
    backgroundColor: colors.background.secondary,
    height: "calc(100vh - 100px)", // 固定高度：减去导航栏100px
    position: "relative", // 为绝对定位的输入框提供定位上下文
    overflow: "hidden", // 防止内容溢出
  },

  // 右侧可视化面板
  visualizationPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    backgroundColor: colors.background.primary,
    height: "100%", // 明确设置高度
    position: "relative", // 明确设置位置
    overflow: "visible", // 确保内容可见
    minHeight: 0,
  },
};

// 聊天界面布局
export const chatLayouts = {
  // 聊天头部
  chatHeader: {
    padding: `${spacing.md} ${spacing.md} ${spacing.base} ${spacing.md}`, // 进一步增加上内边距
    borderBottom: `1px solid ${colors.border.primary}`,
    backgroundColor: colors.background.primary,
    flexShrink: 0, // 防止头部被压缩
    minHeight: "36px", // 增加最小高度
    display: "block", // 确保显示
    visibility: "visible",
    position: "relative", // 明确位置
    zIndex: 10, // 确保在上层显示
  },

  chatHeaderContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  // 消息列表区域 - 独立滚动容器
  messageArea: {
    flex: 1,
    overflow: "auto",
    padding: spacing.base,
    paddingBottom: spacing.base, // 减少底部间距，不需要为输入框留太多空间
    backgroundColor: colors.background.secondary,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    minHeight: 0,
  },

  messageContainer: {
    flex: "0 0 auto",
  },

  // 输入区域 - 绝对固定在底部
  inputArea: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTop: `1px solid ${colors.border.primary}`,
    backgroundColor: colors.background.primary,
    padding: `${spacing.xs} ${spacing.base}`, // 使用较小的内边距
    zIndex: 100,
    boxShadow: "0 -2px 8px rgba(0, 0, 0, 0.1)",
  },

  // AI服务选择器
  aiServiceSelector: {
    borderBottom: `1px solid ${colors.border.primary}`,
    backgroundColor: colors.background.primary,
  },

  aiServiceHeader: {
    padding: `${spacing.base} ${spacing.md}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.background.tertiary,
  },
};

// 消息样式布局
export const messageLayouts = {
  // 消息列表容器
  messageList: {
    display: "flex",
    flexDirection: "column",
    gap: spacing.md,
    minHeight: "100%",
    justifyContent: "flex-start",
  },

  // 用户消息布局
  userMessage: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "flex-start",
    gap: spacing.base,
  },

  userMessageContent: {
    maxWidth: "80%",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
  },

  // AI消息布局
  assistantMessage: {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: spacing.base,
  },

  assistantMessageContent: {
    maxWidth: "80%",
    display: "flex",
    flexDirection: "column",
  },

  // 加载状态布局
  loadingMessage: {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: spacing.base,
  },
};

// Flex 工具类
export const flexUtils = {
  center: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  centerVertical: {
    display: "flex",
    alignItems: "center",
  },

  centerHorizontal: {
    display: "flex",
    justifyContent: "center",
  },

  spaceBetween: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  column: {
    display: "flex",
    flexDirection: "column",
  },

  columnCenter: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
};
