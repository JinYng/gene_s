// pages/api/process-single-cell.js
// 优化后的单细胞数据处理API，采用“先转换再处理”的最佳实践。

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

    // 提取参数
    const dataType = fields.dataType?.[0] || "csv";
    const reductionMethod = fields.reductionMethod?.[0] || "umap";
    const colorBy = fields.colorBy?.[0] || ""; // 空字符串将触发自动选择
    const saveH5ad = fields.saveH5ad?.[0] === "true"; // 是否保存H5AD文件
    const customFilename = fields.customFilename?.[0] || ""; // 自定义文件名

    console.log("处理参数:", {
      dataType,
      reductionMethod,
      colorBy,
      saveH5ad,
      customFilename,
    });

    // 不再强制使用cluster着色，让Python脚本自动处理空字符串
    const finalColorBy = colorBy; // 保持原样传递给Python脚本
    console.log("最终着色参数:", finalColorBy);

    // 收集上传的文件
    uploadedFiles = collectUploadedFiles(files);

    if (uploadedFiles.length === 0) {
      return res.status(400).json({ error: "未找到上传的文件" });
    }

    // 验证文件存在
    validateFiles(uploadedFiles);

    // 构建Python命令 - 统一处理流程
    const pythonCommand = buildPythonCommand(
      dataType,
      uploadedFiles,
      reductionMethod,
      finalColorBy,
      saveH5ad,
      customFilename
    );

    console.log("执行Python命令:", pythonCommand);

    // 执行Python处理
    const outputData = await executePythonProcess(pythonCommand);

    // 返回成功结果
    res.status(200).json({
      success: true,
      data: outputData,
      dataType,
      reductionMethod,
      colorBy: finalColorBy, // 返回实际使用的colorBy
      fileCount: uploadedFiles.length,
    });

    // 延迟清理文件
    setTimeout(() => cleanupFiles(uploadedFiles), 1000);
  } catch (error) {
    console.error("处理错误:", error);

    // 立即清理文件
    cleanupFiles(uploadedFiles);

    res.status(500).json({
      error: "单细胞数据处理失败",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

// 收集上传的文件
function collectUploadedFiles(files) {
  const uploadedFiles = [];
  const fileMapping = {}; // 添加字段名映射

  ["expressionMatrix", "cellMetadata", "h5adFile"].forEach((fileType) => {
    if (files[fileType]) {
      const fileList = Array.isArray(files[fileType])
        ? files[fileType]
        : [files[fileType]];

      fileList.forEach((file) => {
        file.fieldName = fileType; // 添加字段名标记
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

// 构建Python命令 - 统一的最佳实践流程
function buildPythonCommand(
  dataType,
  uploadedFiles,
  reductionMethod,
  colorBy,
  saveH5ad = false,
  customFilename = ""
) {
  // Python环境配置
  const useConda = process.env.USE_CONDA !== "false";

  // 统一使用更稳健的 `conda run`，避免 `conda activate` 在子shell中的问题
  const pythonPrefix = useConda
    ? "conda run -n bio --no-capture-output python"
    : "python";

  if (dataType === "h5ad") {
    // 直接处理H5AD文件
    const h5adFile = uploadedFiles.find((f) =>
      f.originalFilename?.toLowerCase().endsWith(".h5ad")
    );

    if (!h5adFile) {
      throw new Error("未找到H5AD文件");
    }

    return `${pythonPrefix} analysis_scripts/single_cell_processor.py process_h5ad "${h5adFile.filepath}" "${reductionMethod}" "${colorBy}"`;
  } else {
    // 首先转换为H5AD，然后处理 - 最佳实践
    console.log("上传的文件列表:");
    uploadedFiles.forEach((file, index) => {
      console.log(
        `  ${index + 1}. ${file.originalFilename} (字段: ${
          file.fieldName
        }) -> ${file.filepath}`
      );
    });

    // 根据字段名直接查找文件，而不是根据文件名猜测
    const expressionFile = uploadedFiles.find(
      (f) => f.fieldName === "expressionMatrix"
    );
    const metadataFile = uploadedFiles.find(
      (f) => f.fieldName === "cellMetadata"
    );

    console.log("文件匹配结果:");
    console.log(
      `  表达矩阵文件: ${
        expressionFile ? expressionFile.originalFilename : "未找到"
      }`
    );
    console.log(
      `  元数据文件: ${metadataFile ? metadataFile.originalFilename : "未找到"}`
    );

    if (!expressionFile) {
      throw new Error("未找到表达矩阵文件");
    }

    const metaPath = metadataFile ? metadataFile.filepath : "";
    console.log(`  元数据路径: "${metaPath}"`);

    // 添加保存选项和自定义文件名参数
    const saveH5adFlag = saveH5ad ? "true" : "false";
    const filenameArg = customFilename ? customFilename : "";

    return `${pythonPrefix} analysis_scripts/single_cell_processor.py convert_to_h5ad_and_process "${expressionFile.filepath}" "${metaPath}" "${reductionMethod}" "${colorBy}" "${saveH5adFlag}" "${filenameArg}"`;
  }
}

// 执行Python处理
async function executePythonProcess(pythonCommand) {
  try {
    const { stdout, stderr } = await execAsync(pythonCommand, {
      cwd: process.cwd(),
      timeout: 600000, // 10分钟
      maxBuffer: 200 * 1024 * 1024, // 200MB
      env: {
        ...process.env,
        PYTHONIOENCODING: "utf-8",
        PYTHONUNBUFFERED: "1",
        LANG: "en_US.UTF-8",
        LC_ALL: "en_US.UTF-8",
      },
      shell: true,
    });

    console.log("Python输出:", stdout);
    if (stderr) console.log("Python警告:", stderr);

    // 检查严重错误 - 增强检查
    if (
      stderr &&
      (stderr.includes("Traceback") ||
        stderr.includes("Exception:") ||
        stderr.includes("Error:") ||
        stderr.includes("错误"))
    ) {
      throw new Error(`Python处理错误: ${stderr.substring(0, 1000)}`);
    }

    // 检查是否返回了HTML内容而不是JSON（这会导致"Unexpected token '<'"错误）
    if (stdout && stdout.trim().startsWith("<")) {
      throw new Error(
        "Python脚本返回了HTML内容而不是JSON数据，可能是脚本执行失败或文件路径错误"
      );
    }

    // 提取JSON数据
    const plotDataMatch = stdout.match(
      /=== PLOT_DATA_START ===([\s\S]*?)=== PLOT_DATA_END ===/
    );

    if (!plotDataMatch) {
      throw new Error(
        "未找到有效的图表数据输出。Python输出内容: " + stdout.substring(0, 500)
      );
    }

    const outputData = JSON.parse(plotDataMatch[1].trim());

    // 验证数据完整性
    if (!outputData.x || !outputData.y || outputData.x.length === 0) {
      throw new Error("生成的数据无效：缺少坐标信息");
    }

    console.log(
      `成功处理 ${outputData.x.length} 个细胞，方法: ${outputData.method}`
    );
    return outputData;
  } catch (execError) {
    console.error("Python执行错误:", execError);
    // 提供更详细的错误信息
    if (execError.message.includes("Unexpected token '<'")) {
      throw new Error(
        "服务器返回了HTML页面而不是JSON数据，这通常表示Python脚本执行失败或文件路径配置错误"
      );
    }
    throw new Error(`Python处理失败: ${execError.message}`);
  }
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
