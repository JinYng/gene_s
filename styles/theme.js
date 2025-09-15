// styles/theme.js - 统一的主题和样式常量

// 颜色主题
export const colors = {
  // 主色调
  primary: "#0066cc",
  primaryLight: "#4d94ff",
  primaryDark: "#004d99",

  // 功能色
  success: "#48bb78",
  warning: "#ed8936",
  error: "#e53e3e",
  info: "#3182ce",

  // 背景色
  background: {
    primary: "#fff",
    secondary: "#fafbfc",
    tertiary: "#f8f9fa",
    light: "#f7fafc",
    hover: "#edf2f7",
    overlay: "rgba(0, 0, 0, 0.08)",
  },

  // 文字色
  text: {
    primary: "#1a202c",
    secondary: "#4a5568",
    tertiary: "#718096",
    light: "#a0aec0",
    white: "#fff",
  },

  // 边框色
  border: {
    primary: "#e1e5e9",
    secondary: "#e2e8f0",
    tertiary: "#cbd5e0",
    focus: "#0066cc",
  },

  // AI服务标识色
  ai: {
    ollama: {
      bg: "#f0f9ff",
      text: "#0369a1",
      border: "#bae6fd",
    },
    zhipu: {
      bg: "#fef7f0",
      text: "#ea580c",
      border: "#fed7aa",
    },
  },
};

// 字体大小
export const fontSize = {
  xs: "10px",
  sm: "12px",
  base: "14px",
  lg: "16px",
  xl: "18px",
  "2xl": "20px",
  "3xl": "24px",
};

// 间距
export const spacing = {
  xs: "4px",
  sm: "8px",
  base: "12px",
  md: "16px",
  lg: "20px",
  xl: "24px",
  xxl: "32px",
  xxxl: "40px",
};

// 圆角
export const borderRadius = {
  sm: "4px",
  base: "6px",
  md: "8px",
  lg: "12px",
  xl: "18px",
  full: "50%",
};

// 阴影
export const boxShadow = {
  sm: "0 1px 3px rgba(0, 0, 0, 0.1)",
  base: "0 4px 6px rgba(0, 0, 0, 0.1)",
  lg: "0 4px 20px rgba(0, 0, 0, 0.08)",
  xl: "0 8px 25px rgba(0, 0, 0, 0.15)",
};

// 过渡动画
export const transition = {
  fast: "all 0.15s ease",
  base: "all 0.2s ease",
  slow: "all 0.3s ease",
};

// Z-index层级
export const zIndex = {
  dropdown: 10,
  modal: 50,
  tooltip: 100,
};
