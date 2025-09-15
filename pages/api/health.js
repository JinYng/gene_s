// pages/api/health.js
// 系统健康检查接口

import {
  withErrorHandling,
  withMethodValidation,
} from "../../lib/middleware.js";
import config from "../../config/index.js";
import logger from "../../lib/logger.js";
import aiServiceManager from "../../services/aiServiceManager.js";
import FileService from "../../services/FileService.js";

/**
 * 健康检查处理器
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function healthCheckHandler(req, res) {
  const startTime = Date.now();
  const healthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    environment: config.env.isDevelopment ? "development" : "production",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    services: {},
  };

  try {
    // 检查各个服务的健康状态
    // aiServiceManager 已经是实例，FileService 需要实例化
    const fileService = new FileService();

    // 并行检查服务健康状态
    const [
      aiStatus,
      fileStatus,
      pythonStatus,
      ollamaStatus,
      pythonServerStatus,
    ] = await Promise.allSettled([
      checkAIService(aiServiceManager),
      checkFileService(fileService),
      checkPythonEnvironment(),
      checkOllamaService(),
      checkPythonAnalysisServer(),
    ]);

    healthStatus.services.ai =
      aiStatus.status === "fulfilled"
        ? aiStatus.value
        : { status: "error", error: aiStatus.reason?.message };

    healthStatus.services.file =
      fileStatus.status === "fulfilled"
        ? fileStatus.value
        : { status: "error", error: fileStatus.reason?.message };

    healthStatus.services.python =
      pythonStatus.status === "fulfilled"
        ? pythonStatus.value
        : { status: "error", error: pythonStatus.reason?.message };

    healthStatus.services.ollama =
      ollamaStatus.status === "fulfilled"
        ? ollamaStatus.value
        : { status: "error", error: ollamaStatus.reason?.message };

    healthStatus.services.pythonAnalysisServer =
      pythonServerStatus.status === "fulfilled"
        ? pythonServerStatus.value
        : { status: "error", error: pythonServerStatus.reason?.message };

    // 提示信息：如果Python分析服务器未运行，提供具体的启动命令提示
    if (healthStatus.services.pythonAnalysisServer?.status === "error") {
      healthStatus.startupInstructions =
        "请在三个不同的终端中分别执行以下命令：\n1. npm run chat-server (Python分析服务器)\n2. ollama serve (Ollama本地模型服务)\n3. npm run dev (Next.js应用服务器)";
    }

    // 总体状态评估
    const allServicesHealthy = Object.values(healthStatus.services).every(
      (service) => service.status === "healthy"
    );

    if (!allServicesHealthy) {
      healthStatus.status = "degraded";
    }

    // 记录健康检查
    logger.info("健康检查完成", {
      status: healthStatus.status,
      responseTime: Date.now() - startTime,
      services: Object.keys(healthStatus.services),
    });

    const statusCode = healthStatus.status === "healthy" ? 200 : 503;
    res.status(statusCode).json({
      success: healthStatus.status === "healthy",
      data: healthStatus,
      message:
        healthStatus.status === "healthy" ? "系统运行正常" : "系统服务异常",
    });
  } catch (error) {
    logger.error("健康检查失败", { error: error.message });

    res.status(500).json({
      success: false,
      data: {
        ...healthStatus,
        status: "error",
        error: error.message,
      },
      message: "健康检查失败",
    });
  }
}

/**
 * 检查AI服务状态
 * @param {AIServiceManager} aiService - AI服务实例
 * @returns {Promise<Object>} 服务状态
 */
async function checkAIService(aiService) {
  try {
    const services = aiService.getAvailableServices();
    const availableCount = Object.keys(services).length;

    return {
      status: "healthy",
      availableServices: availableCount,
      currentService: aiService.currentService,
      services: Object.keys(services),
    };
  } catch (error) {
    return {
      status: "error",
      error: error.message,
    };
  }
}

/**
 * 检查文件服务状态
 * @param {FileService} fileService - 文件服务实例
 * @returns {Promise<Object>} 服务状态
 */
async function checkFileService(fileService) {
  try {
    // 检查上传目录是否可写
    const uploadDirExists = await fileService
      .getFileInfo(fileService.uploadDir)
      .then(() => true)
      .catch(() => false);

    const tempDirExists = await fileService
      .getFileInfo(fileService.tempDir)
      .then(() => true)
      .catch(() => false);

    return {
      status: uploadDirExists && tempDirExists ? "healthy" : "error",
      uploadDir: {
        path: fileService.uploadDir,
        exists: uploadDirExists,
      },
      tempDir: {
        path: fileService.tempDir,
        exists: tempDirExists,
      },
      maxFileSize: fileService.maxFileSize,
    };
  } catch (error) {
    return {
      status: "error",
      error: error.message,
    };
  }
}

/**
 * 检查Python环境
 * @returns {Promise<Object>} Python状态
 */
async function checkPythonEnvironment() {
  try {
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);

    const pythonCmd = config.processing.pythonExecutable;
    const { stdout } = await execAsync(`${pythonCmd} --version`, {
      timeout: 5000,
    });

    return {
      status: "healthy",
      version: stdout.trim(),
      executable: pythonCmd,
    };
  } catch (error) {
    return {
      status: "error",
      error: error.message,
      executable: config.processing.pythonExecutable,
    };
  }
}

/**
 * 检查Python分析服务器（FastAPI）
 * @returns {Promise<Object>} 服务器状态
 */
async function checkPythonAnalysisServer() {
  try {
    const serverUrl = "http://localhost:8001/health";
    const response = await fetch(serverUrl, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        status: "healthy",
        url: serverUrl,
        version: data.version || "unknown",
        uptime: data.uptime || "unknown",
      };
    } else {
      return {
        status: "error",
        error: `HTTP ${response.status}`,
        url: serverUrl,
        message: "请确保已运行 'npm run chat-server' 命令启动Python分析服务器",
      };
    }
  } catch (error) {
    return {
      status: "error",
      error: error.message,
      url: "http://localhost:8001/health",
      message:
        "Python分析服务器未运行。请在单独的终端中执行 'npm run chat-server' 命令启动它。",
    };
  }
}

/**
 * 检查Ollama服务
 * @returns {Promise<Object>} Ollama状态
 */
async function checkOllamaService() {
  try {
    const response = await fetch(`${config.ai.ollama.baseUrl}/api/tags`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        status: "healthy",
        baseUrl: config.ai.ollama.baseUrl,
        modelsCount: data.models?.length || 0,
        models: data.models?.map((m) => m.name) || [],
      };
    } else {
      return {
        status: "error",
        error: `HTTP ${response.status}`,
        baseUrl: config.ai.ollama.baseUrl,
      };
    }
  } catch (error) {
    return {
      status: "error",
      error: error.message,
      baseUrl: config.ai.ollama.baseUrl,
    };
  }
}

// 导出带中间件的处理器
export default withMethodValidation(["GET"])(
  withErrorHandling(healthCheckHandler)
);
