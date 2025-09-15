// lib/utils-client.js
// 客户端通用工具函数（不包含Node.js模块）

/**
 * 创建标准化响应对象
 * @param {boolean} success - 是否成功
 * @param {any} data - 返回数据
 * @param {string} message - 消息
 * @param {number|null} code - 错误码
 * @returns {Object} 标准化响应对象
 */
function createResponse(success, data = null, message = "", code = null) {
  return {
    success,
    data,
    message,
    code,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 生成唯一ID
 * @returns {string} 唯一ID
 */
function generateId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 检查文件类型是否有效（客户端版本）
 * @param {string} fileName - 文件名
 * @param {string[]} allowedTypes - 允许的文件类型
 * @returns {boolean} 是否有效
 */
function isValidFileType(
  fileName,
  allowedTypes = [".csv", ".tsv", ".txt", ".h5ad"]
) {
  const ext = fileName.toLowerCase().split(".").pop();
  return allowedTypes.some((type) => type.toLowerCase().endsWith(ext));
}

/**
 * 深度合并对象
 * @param {...Object} objects - 要合并的对象
 * @returns {Object} 合并后的对象
 */
function deepMerge(...objects) {
  const isObject = (obj) => obj && typeof obj === "object";

  return objects.reduce((prev, obj) => {
    Object.keys(obj).forEach((key) => {
      const pVal = prev[key];
      const oVal = obj[key];

      if (Array.isArray(pVal) && Array.isArray(oVal)) {
        prev[key] = pVal.concat(...oVal);
      } else if (isObject(pVal) && isObject(oVal)) {
        prev[key] = deepMerge(pVal, oVal);
      } else {
        prev[key] = oVal;
      }
    });

    return prev;
  }, {});
}

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 限制时间（毫秒）
 * @returns {Function} 节流后的函数
 */
function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的文件大小
 */
function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean} 是否为有效邮箱
 */
function validateEmail(email) {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

/**
 * 验证手机号格式
 * @param {string} phone - 手机号
 * @returns {boolean} 是否为有效手机号
 */
function validatePhone(phone) {
  const re = /^1[3-9]\d{9}$/;
  return re.test(String(phone));
}

/**
 * 休眠函数
 * @param {number} ms - 毫秒数
 * @returns {Promise} Promise对象
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 获取URL参数
 * @param {string} name - 参数名
 * @returns {string|null} 参数值
 */
function getUrlParam(name) {
  if (typeof window === "undefined") return null;
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

/**
 * 设置URL参数
 * @param {string} name - 参数名
 * @param {string} value - 参数值
 */
function setUrlParam(name, value) {
  if (typeof window === "undefined") return;
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.set(name, value);
  const newUrl =
    window.location.protocol +
    "//" +
    window.location.host +
    window.location.pathname +
    "?" +
    urlParams.toString();
  window.history.replaceState({ path: newUrl }, "", newUrl);
}

export {
  createResponse,
  generateId,
  isValidFileType,
  deepMerge,
  debounce,
  throttle,
  formatFileSize,
  validateEmail,
  validatePhone,
  sleep,
  getUrlParam,
  setUrlParam,
};
