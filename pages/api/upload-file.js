// pages/api/v2/upload-file.js
// 优化后的文件上传API

import Papa from "papaparse";
import {
  combineMiddlewares,
  withErrorHandling,
  withMethodValidation,
  withRateLimit,
} from "../../lib/middleware.js";
import FileService from "../../services/FileService.js";
import logger from "../../lib/logger.js";

// 配置
export const config = {
  api: {
    bodyParser: false,
  },
};

// 文件服务实例
const fileService = new FileService();

/**
 * 文件上传处理器
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function uploadFileHandler(req, res) {
  const startTime = Date.now();

  try {
    // 解析上传的文件
    const { fields, files } = await fileService.parseUploadedFiles(req);

    // 获取上传的文件
    const uploadedFiles = files.file || [];
    if (uploadedFiles.length === 0) {
      return res
        .status(400)
        .json(fileService.createErrorResponse("没有上传文件", "NO_FILE"));
    }

    const file = uploadedFiles[0];

    // 验证文件
    if (!fileService.validateFile(file)) {
      await fileService.deleteFile(file.filepath);
      return res
        .status(400)
        .json(fileService.createErrorResponse("文件验证失败", "INVALID_FILE"));
    }

    // 检查文件类型
    const fileName = file.originalFilename || "";
    const fileExt = fileName.toLowerCase();
    const isCSV = fileExt.endsWith(".csv");
    const isTSV = fileExt.endsWith(".tsv") || fileExt.endsWith(".txt");

    if (!isCSV && !isTSV) {
      await fileService.deleteFile(file.filepath);
      return res
        .status(400)
        .json(
          fileService.createErrorResponse(
            "只支持 CSV 和 TSV 文件格式",
            "UNSUPPORTED_FORMAT"
          )
        );
    }

    // 读取并解析文件
    const fileContent = await fileService.readFile(file.filepath);
    const parseResult = await parseFileContent(fileContent, isCSV);

    // 清理临时文件
    await fileService.deleteFile(file.filepath);

    // 验证解析结果
    if (parseResult.errors && parseResult.errors.length > 0) {
      logger.warn("文件解析有错误", {
        fileName,
        errors: parseResult.errors.slice(0, 5), // 只记录前5个错误
      });

      return res.status(400).json(
        fileService.createErrorResponse("文件解析错误", "PARSE_ERROR", {
          details: parseResult.errors,
        })
      );
    }

    // 构建响应数据
    const responseData = {
      fileName,
      fileSize: file.size,
      rowCount: parseResult.data.length,
      columnCount: parseResult.meta.fields?.length || 0,
      columns: parseResult.meta.fields || [],
      data: parseResult.data,
      meta: {
        delimiter: parseResult.meta.delimiter,
        linebreak: parseResult.meta.linebreak,
        aborted: parseResult.meta.aborted,
        truncated: parseResult.meta.truncated,
      },
      processingTime: Date.now() - startTime,
    };

    // 记录成功的上传
    logger.info("文件上传成功", {
      fileName,
      fileSize: file.size,
      rowCount: parseResult.data.length,
      processingTime: responseData.processingTime,
    });

    res
      .status(200)
      .json(
        fileService.createSuccessResponse(responseData, "文件上传并解析成功")
      );
  } catch (error) {
    logger.error("文件上传失败", {
      error: error.message,
      stack: error.stack,
      processingTime: Date.now() - startTime,
    });

    // 确保清理临时文件
    if (req.files?.file?.[0]?.filepath) {
      await fileService.deleteFile(req.files.file[0].filepath).catch(() => {});
    }

    throw error; // 让错误处理中间件处理
  }
}

/**
 * 解析文件内容
 * @param {string} content - 文件内容
 * @param {boolean} isCSV - 是否为CSV格式
 * @returns {Promise<Object>} 解析结果
 */
async function parseFileContent(content, isCSV) {
  return new Promise((resolve) => {
    const delimiter = isCSV ? "," : "\t";

    Papa.parse(content, {
      header: true,
      delimiter,
      skipEmptyLines: true,
      dynamicTyping: true, // 自动类型转换
      transformHeader: (header) => header.trim(),
      transform: (value, field) => {
        if (typeof value === "string") {
          value = value.trim();
          // 尝试转换数字
          const num = parseFloat(value);
          return !isNaN(num) && isFinite(num) ? num : value;
        }
        return value;
      },
      complete: (results) => {
        resolve(results);
      },
      error: (error) => {
        resolve({
          data: [],
          errors: [error],
          meta: {},
        });
      },
    });
  });
}

// 应用中间件并导出处理器
export default combineMiddlewares(
  withMethodValidation(["POST"]),
  withRateLimit(50, 60000), // 每分钟最多50次请求
  withErrorHandling
)(uploadFileHandler);
