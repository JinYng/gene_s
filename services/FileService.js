// services/FileService.js
// 文件处理服务

import formidable from "formidable";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import BaseService from "./base/BaseService.js";
import config from "../config/index.js";
import {
  ensureDirectoryExists,
  generateUniqueFileName,
  isValidFileType,
  safeDeleteFile,
} from "../lib/utils-server.js";

const execAsync = promisify(exec);

/**
 * 文件处理服务类
 */
export default class FileService extends BaseService {
  constructor() {
    super("FileService");
    this.uploadDir = config.storage.uploadDir;
    this.tempDir = config.storage.tempDir;
    this.maxFileSize = config.storage.maxFileSize;

    // 确保目录存在
    ensureDirectoryExists(this.uploadDir);
    ensureDirectoryExists(this.tempDir);
  }

  /**
   * 配置 formidable
   * @returns {Object} formidable 配置
   */
  getFormidableConfig() {
    return {
      uploadDir: this.tempDir,
      keepExtensions: true,
      maxFileSize: this.maxFileSize,
      multiples: true,
    };
  }

  /**
   * 解析上传的文件
   * @param {Object} req - 请求对象
   * @returns {Promise<Object>} 解析结果
   */
  async parseUploadedFiles(req) {
    return this.executeOperation(async () => {
      const form = formidable(this.getFormidableConfig());
      const [fields, files] = await form.parse(req);

      // 标准化文件对象
      const normalizedFiles = {};
      for (const [key, value] of Object.entries(files)) {
        normalizedFiles[key] = Array.isArray(value) ? value : [value];
      }

      return { fields, files: normalizedFiles };
    }, "解析上传文件");
  }

  /**
   * 验证上传的文件
   * @param {Object} file - 文件对象
   * @returns {boolean} 是否有效
   */
  validateFile(file) {
    if (!file || !file.originalFilename) {
      this.log("warn", "文件对象无效或缺少文件名");
      return false;
    }

    if (!isValidFileType(file.originalFilename)) {
      this.log("warn", `不支持的文件类型: ${file.originalFilename}`);
      return false;
    }

    if (file.size > this.maxFileSize) {
      this.log(
        "warn",
        `文件过大: ${file.originalFilename}, 大小: ${file.size}`
      );
      return false;
    }

    return true;
  }

  /**
   * 移动文件到目标目录
   * @param {Object} file - 文件对象
   * @param {string} targetDir - 目标目录
   * @param {string} newFileName - 新文件名（可选）
   * @returns {Promise<string>} 新文件路径
   */
  async moveFile(file, targetDir = this.uploadDir, newFileName = null) {
    return this.executeOperation(async () => {
      ensureDirectoryExists(targetDir);

      const fileName =
        newFileName ||
        generateUniqueFileName(
          file.originalFilename,
          path.extname(file.originalFilename)
        );

      const targetPath = path.join(targetDir, fileName);

      // 移动文件
      await fs.promises.rename(file.filepath, targetPath);

      this.log("info", `文件移动成功: ${file.originalFilename} -> ${fileName}`);
      return targetPath;
    }, "移动文件");
  }

  /**
   * 读取文件内容
   * @param {string} filePath - 文件路径
   * @param {string} encoding - 编码格式
   * @returns {Promise<string|Buffer>} 文件内容
   */
  async readFile(filePath, encoding = "utf8") {
    return this.executeOperation(async () => {
      if (!fs.existsSync(filePath)) {
        throw new Error(`文件不存在: ${filePath}`);
      }

      return await fs.promises.readFile(filePath, encoding);
    }, "读取文件");
  }

  /**
   * 写入文件
   * @param {string} filePath - 文件路径
   * @param {string|Buffer} content - 文件内容
   * @returns {Promise<void>}
   */
  async writeFile(filePath, content) {
    return this.executeOperation(async () => {
      const dir = path.dirname(filePath);
      ensureDirectoryExists(dir);

      await fs.promises.writeFile(filePath, content);
      this.log("info", `文件写入成功: ${filePath}`);
    }, "写入文件");
  }

  /**
   * 删除文件
   * @param {string} filePath - 文件路径
   * @returns {Promise<void>}
   */
  async deleteFile(filePath) {
    return this.executeOperation(async () => {
      await safeDeleteFile(filePath);
      this.log("info", `文件删除成功: ${filePath}`);
    }, "删除文件");
  }

  /**
   * 执行Python脚本处理文件
   * @param {string} scriptPath - 脚本路径
   * @param {string[]} args - 参数列表
   * @returns {Promise<string>} 执行结果
   */
  async executePythonScript(scriptPath, args = []) {
    return this.executeOperation(async () => {
      const pythonCmd = config.processing.pythonExecutable;
      const command = `${pythonCmd} "${scriptPath}" ${args
        .map((arg) => `"${arg}"`)
        .join(" ")}`;

      this.log("info", `执行Python脚本: ${command}`);

      const { stdout, stderr } = await execAsync(command, {
        timeout: config.processing.maxProcessingTime,
      });

      if (stderr) {
        this.log("warn", `Python脚本警告: ${stderr}`);
      }

      this.log("info", "Python脚本执行完成");
      return stdout;
    }, "Python脚本执行");
  }

  /**
   * 获取文件信息
   * @param {string} filePath - 文件路径
   * @returns {Promise<Object>} 文件信息
   */
  async getFileInfo(filePath) {
    return this.executeOperation(async () => {
      if (!fs.existsSync(filePath)) {
        throw new Error(`文件不存在: ${filePath}`);
      }

      const stats = await fs.promises.stat(filePath);
      return {
        path: filePath,
        name: path.basename(filePath),
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
      };
    }, "获取文件信息");
  }

  /**
   * 列出目录文件
   * @param {string} dirPath - 目录路径
   * @returns {Promise<Object[]>} 文件列表
   */
  async listFiles(dirPath) {
    return this.executeOperation(async () => {
      if (!fs.existsSync(dirPath)) {
        return [];
      }

      const files = await fs.promises.readdir(dirPath);
      const fileInfos = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(dirPath, file);
          return await this.getFileInfo(filePath);
        })
      );

      return fileInfos;
    }, "列出目录文件");
  }
}
