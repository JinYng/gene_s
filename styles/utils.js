// styles/utils.js - 样式工具函数

import { colors, spacing } from "./theme.js";

/**
 * 组合多个样式对象
 * @param {...Object} styles - 样式对象
 * @returns {Object} 合并后的样式对象
 */
export const combineStyles = (...styles) => {
  return Object.assign({}, ...styles);
};

/**
 * 根据条件应用样式
 * @param {boolean} condition - 条件
 * @param {Object} trueStyles - 条件为真时的样式
 * @param {Object} falseStyles - 条件为假时的样式
 * @returns {Object} 条件样式
 */
export const conditionalStyles = (condition, trueStyles, falseStyles = {}) => {
  return condition ? trueStyles : falseStyles;
};

/**
 * 创建悬停样式
 * @param {Object} baseStyles - 基础样式
 * @param {Object} hoverStyles - 悬停样式
 * @returns {Object} 包含悬停事件的样式对象
 */
export const createHoverStyles = (baseStyles, hoverStyles) => {
  return {
    style: baseStyles,
    onMouseEnter: (e) => {
      Object.assign(e.target.style, hoverStyles);
    },
    onMouseLeave: (e) => {
      Object.assign(e.target.style, baseStyles);
    },
  };
};

/**
 * 生成间距样式
 * @param {string|number} size - 间距大小
 * @param {string} direction - 方向 (all, top, bottom, left, right, x, y)
 * @returns {Object} 间距样式
 */
export const createSpacing = (size, direction = "all") => {
  const value = spacing[size] || size;

  switch (direction) {
    case "top":
      return { paddingTop: value };
    case "bottom":
      return { paddingBottom: value };
    case "left":
      return { paddingLeft: value };
    case "right":
      return { paddingRight: value };
    case "x":
      return { paddingLeft: value, paddingRight: value };
    case "y":
      return { paddingTop: value, paddingBottom: value };
    case "all":
    default:
      return { padding: value };
  }
};

/**
 * 生成边距样式
 * @param {string|number} size - 边距大小
 * @param {string} direction - 方向
 * @returns {Object} 边距样式
 */
export const createMargin = (size, direction = "all") => {
  const value = spacing[size] || size;

  switch (direction) {
    case "top":
      return { marginTop: value };
    case "bottom":
      return { marginBottom: value };
    case "left":
      return { marginLeft: value };
    case "right":
      return { marginRight: value };
    case "x":
      return { marginLeft: value, marginRight: value };
    case "y":
      return { marginTop: value, marginBottom: value };
    case "all":
    default:
      return { margin: value };
  }
};

/**
 * 创建响应式样式
 * @param {Object} baseStyles - 基础样式
 * @param {Object} breakpoints - 断点样式
 * @returns {Object} 响应式样式
 */
export const createResponsiveStyles = (baseStyles, breakpoints = {}) => {
  // 这里可以根据屏幕尺寸返回不同样式
  // 简化版本，可以根据需要扩展
  return baseStyles;
};

/**
 * 创建渐变背景
 * @param {string} from - 起始颜色
 * @param {string} to - 结束颜色
 * @param {string} direction - 渐变方向
 * @returns {Object} 渐变样式
 */
export const createGradient = (from, to, direction = "to right") => {
  return {
    background: `linear-gradient(${direction}, ${from}, ${to})`,
  };
};

/**
 * 创建按钮状态样式
 * @param {boolean} disabled - 是否禁用
 * @param {boolean} loading - 是否加载中
 * @param {string} variant - 按钮变体
 * @returns {Object} 按钮样式
 */
export const createButtonState = (
  disabled = false,
  loading = false,
  variant = "primary"
) => {
  let backgroundColor = colors.primary;
  let color = colors.text.white;
  let cursor = "pointer";

  if (disabled || loading) {
    backgroundColor = colors.border.tertiary;
    color = colors.text.light;
    cursor = "not-allowed";
  }

  return {
    backgroundColor,
    color,
    cursor,
    opacity: loading ? 0.7 : 1,
  };
};

/**
 * 创建阴影样式
 * @param {number} depth - 阴影深度 (1-4)
 * @returns {Object} 阴影样式
 */
export const createShadow = (depth = 1) => {
  const shadows = {
    1: "0 1px 3px rgba(0, 0, 0, 0.1)",
    2: "0 4px 6px rgba(0, 0, 0, 0.1)",
    3: "0 4px 20px rgba(0, 0, 0, 0.08)",
    4: "0 8px 25px rgba(0, 0, 0, 0.15)",
  };

  return {
    boxShadow: shadows[depth] || shadows[1],
  };
};

/**
 * 创建文本省略样式
 * @param {number} lines - 行数限制
 * @returns {Object} 文本省略样式
 */
export const createTextEllipsis = (lines = 1) => {
  if (lines === 1) {
    return {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    };
  }

  return {
    display: "-webkit-box",
    WebkitLineClamp: lines,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  };
};
