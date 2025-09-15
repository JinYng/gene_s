// pages/api/convert-to-h5ad.js
// 专门用于转换文件格式

import formidable from "formidable";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests are allowed" });
  }

  let uploadedFiles = [];

  try {
    // 初始化表单解析器 - 按照项目规范设置文件大小限制
    const form = formidable({
      uploadDir: "./tmp",
      keepExtensions: true,
      maxFileSize: 2048 * 1024 * 1024, // 2048MB (项目规范推荐值)
      maxTotalFileSize: 4096 * 1024 * 1024, // 4096MB (项目规范推荐值)
      multiples: true,
    });

    // 确保临时目录存在
    if (!fs.existsSync("./tmp")) {
      fs.mkdirSync("./tmp", { recursive: true });
    }

    const [fields, files] = await form.parse(req);

    // 收集上传的文件
    uploadedFiles = collectUploadedFiles(files);

    if (uploadedFiles.length === 0) {
      return res.status(400).json({ error: "未找到上传的文件" });
    }

    // 验证文件存在
    validateFiles(uploadedFiles);

    // 找到文件
    const expressionFile = uploadedFiles.find(
      (f) => f.fieldName === "expressionMatrix"
    );
    const metadataFile = uploadedFiles.find(
      (f) => f.fieldName === "cellMetadata"
    );

    if (!expressionFile) {
      return res.status(400).json({ error: "未找到表达矩阵文件" });
    }

    console.log("转换文件:", {
      expression: expressionFile.originalFilename,
      metadata: metadataFile?.originalFilename || "无",
    });

    // 调用Python转换脚本
    const useConda = process.env.USE_CONDA !== "false";
    const pythonPrefix = useConda
      ? "conda run -n bio --no-capture-output python"
      : "python";

    const metaPath = metadataFile ? metadataFile.filepath : "";
    const pythonCommand = `${pythonPrefix} analysis_scripts/matrix_to_h5ad_converter.py "${expressionFile.filepath}" "${metaPath}"`;

    console.log("执行转换命令:", pythonCommand);

    const { stdout, stderr } = await execAsync(pythonCommand, {
      cwd: process.cwd(),
      timeout: 300000, // 5分钟
      maxBuffer: 50 * 1024 * 1024, // 50MB
      env: {
        ...process.env,
        PYTHONIOENCODING: "utf-8",
        PYTHONUNBUFFERED: "1",
      },
      shell: true,
    });

    console.log("Python输出:", stdout);
    if (stderr) console.log("Python警告:", stderr);

    // 检查是否有错误
    if (stderr && (stderr.includes("Traceback") || stderr.includes("Error:"))) {
      throw new Error(`转换失败: ${stderr.substring(0, 500)}`);
    }

    // 从输出中提取文件名
    const filenameMatch = stdout.match(/H5AD文件保存成功:\s*(.+)/);
    if (!filenameMatch) {
      throw new Error("未能获取生成的文件名");
    }

    const h5adFilename = filenameMatch[1].trim();

    // 返回成功结果
    res.status(200).json({
      success: true,
      h5ad_filename: h5adFilename,
      message: "H5AD文件转换成功",
    });

    // 延迟清理文件
    setTimeout(() => cleanupFiles(uploadedFiles), 1000);
  } catch (error) {
    console.error("转换错误:", error);

    // 立即清理文件
    cleanupFiles(uploadedFiles);

    res.status(500).json({
      error: "文件转换失败",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

// 收集上传的文件
function collectUploadedFiles(files) {
  const uploadedFiles = [];

  ["expressionMatrix", "cellMetadata"].forEach((fileType) => {
    if (files[fileType]) {
      const fileList = Array.isArray(files[fileType])
        ? files[fileType]
        : [files[fileType]];

      fileList.forEach((file) => {
        file.fieldName = fileType;
        uploadedFiles.push(file);
      });
    }
  });

  return uploadedFiles;
}

// 验证文件存在
function validateFiles(uploadedFiles) {
  uploadedFiles.forEach((file) => {
    if (!fs.existsSync(file.filepath)) {
      throw new Error(`文件不存在: ${file.filepath}`);
    }
  });
}

// 清理文件
function cleanupFiles(uploadedFiles) {
  uploadedFiles.forEach((file) => {
    try {
      if (fs.existsSync(file.filepath)) {
        fs.unlinkSync(file.filepath);
        console.log(`已清理文件: ${file.filepath}`);
      }
    } catch (error) {
      console.warn(`清理文件失败: ${file.filepath}`, error.message);
    }
  });
}
