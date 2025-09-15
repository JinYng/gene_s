// lib/utils-server.js
// 服务端通用工具函数（包含Node.js模块）

const fs = require("fs");
const path = require("path");

/**
 * 确保目录存在
 * @param {string} dirPath - 目录路径
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * 生成唯一文件名
 * @param {string} originalName - 原始文件名
 * @returns {string} 唯一文件名
 */
function generateUniqueFileName(originalName) {
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${name}_${timestamp}_${random}${ext}`;
}

/**
 * 检查文件类型是否有效
 * @param {string} fileName - 文件名
 * @param {string[]} allowedTypes - 允许的文件类型
 * @returns {boolean} 是否有效
 */
function isValidFileType(
  fileName,
  allowedTypes = [".csv", ".tsv", ".txt", ".h5ad"]
) {
  const ext = path.extname(fileName).toLowerCase();
  return allowedTypes.includes(ext);
}

/**
 * 安全删除文件
 * @param {string} filePath - 文件路径
 * @returns {Promise<boolean>} 是否删除成功
 */
async function safeDeleteFile(filePath) {
  try {
    await fs.promises.unlink(filePath);
    return true;
  } catch (error) {
    console.warn(`删除文件失败: ${filePath}`, error);
    return false;
  }
}

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

module.exports = {
  ensureDirectoryExists,
  generateUniqueFileName,
  isValidFileType,
  safeDeleteFile,
  createResponse,
  generateId,
};
