#!/usr/bin/env node
// scripts/validate-config.js
// 配置验证和环境检查脚本

import { configManager } from "../config/index.js";
import { ErrorHandler } from "../lib/errorHandler.js";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

class ConfigValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.config = configManager.getAll();
  }

  async validateAll() {
    console.log("🔍 开始配置验证...\n");

    await this.validateDirectories();
    await this.validateServices();
    await this.validatePythonEnvironment();
    await this.validateDependencies();

    this.printResults();

    return {
      success: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  validateDirectories() {
    console.log("📁 检查目录配置...");

    const directories = [
      { path: this.config.storage.tempDir, name: "临时目录" },
      { path: this.config.storage.uploadDir, name: "上传目录" },
    ];

    for (const { path, name } of directories) {
      try {
        if (!fs.existsSync(path)) {
          fs.mkdirSync(path, { recursive: true });
          console.log(`  ✅ 创建${name}: ${path}`);
        } else {
          console.log(`  ✅ ${name}存在: ${path}`);
        }

        // 检查写权限
        const testFile = `${path}/.write-test`;
        fs.writeFileSync(testFile, "test");
        fs.unlinkSync(testFile);
        console.log(`  ✅ ${name}可写`);
      } catch (error) {
        this.errors.push(`${name}配置错误: ${error.message}`);
        console.log(`  ❌ ${name}错误: ${error.message}`);
      }
    }
  }

  async validateServices() {
    console.log("\n🌐 检查服务连接...");

    // 检查Ollama服务
    await this.checkOllamaService();

    // 检查Python服务
    await this.checkPythonService();
  }

  async checkOllamaService() {
    try {
      const ollamaConfig = this.config.ai.ollama;
      const response = await fetch(`${ollamaConfig.baseUrl}/api/tags`, {
        method: "GET",
        timeout: 5000,
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`  ✅ Ollama服务可用: ${ollamaConfig.baseUrl}`);

        // 检查模型是否存在
        const hasModel = data.models?.some((model) =>
          model.name.includes(ollamaConfig.defaultModel.split(":")[0])
        );

        if (hasModel) {
          console.log(`  ✅ 模型已安装: ${ollamaConfig.defaultModel}`);
        } else {
          this.warnings.push(
            `模型未安装: ${ollamaConfig.defaultModel}，请运行 'ollama pull ${ollamaConfig.defaultModel}'`
          );
          console.log(`  ⚠️  模型未安装: ${ollamaConfig.defaultModel}`);
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      this.errors.push(`Ollama服务不可用: ${error.message}`);
      console.log(`  ❌ Ollama服务不可用: ${error.message}`);
      console.log(`  💡 请运行: ollama serve`);
    }
  }

  async checkPythonService() {
    try {
      const pythonConfig = this.config.python;
      const response = await fetch(`${pythonConfig.serviceUrl}/health`, {
        method: "GET",
        timeout: 5000,
      });

      if (response.ok) {
        console.log(`  ✅ Python服务可用: ${pythonConfig.serviceUrl}`);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      this.errors.push(`Python服务不可用: ${error.message}`);
      console.log(`  ❌ Python服务不可用: ${error.message}`);
      console.log(`  💡 请运行: npm run chat-server`);
    }
  }

  async validatePythonEnvironment() {
    console.log("\n🐍 检查Python环境...");

    try {
      // 检查Python版本
      const { stdout: pythonVersion } = await execAsync("python --version");
      console.log(`  ✅ Python版本: ${pythonVersion.trim()}`);

      // 检查关键依赖
      const dependencies = [
        "fastapi",
        "uvicorn",
        "langchain",
        "pydantic",
        "scanpy",
        "pandas",
        "numpy",
      ];

      for (const dep of dependencies) {
        try {
          await execAsync(
            `python -c "import ${dep}; print('${dep}:', ${dep}.__version__)"`
          );
          console.log(`  ✅ ${dep} 已安装`);
        } catch (error) {
          this.errors.push(`Python依赖缺失: ${dep}`);
          console.log(`  ❌ ${dep} 未安装`);
        }
      }
    } catch (error) {
      this.errors.push(`Python环境检查失败: ${error.message}`);
      console.log(`  ❌ Python环境检查失败: ${error.message}`);
    }
  }

  async validateDependencies() {
    console.log("\n📦 检查Node.js依赖...");

    try {
      // 检查package.json
      const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // 检查关键依赖
      const criticalDeps = ["next", "react", "formidable", "axios"];

      for (const dep of criticalDeps) {
        if (dependencies[dep]) {
          console.log(`  ✅ ${dep}: ${dependencies[dep]}`);
        } else {
          this.errors.push(`Node.js依赖缺失: ${dep}`);
          console.log(`  ❌ ${dep} 未安装`);
        }
      }

      // 检查node_modules
      if (!fs.existsSync("node_modules")) {
        this.errors.push("node_modules目录不存在，请运行 npm install");
        console.log("  ❌ node_modules目录不存在");
      } else {
        console.log("  ✅ node_modules目录存在");
      }
    } catch (error) {
      this.errors.push(`依赖检查失败: ${error.message}`);
      console.log(`  ❌ 依赖检查失败: ${error.message}`);
    }
  }

  printResults() {
    console.log("\n📋 验证结果:");
    console.log("=".repeat(50));

    if (this.errors.length === 0) {
      console.log("✅ 所有配置检查通过！");
    } else {
      console.log(`❌ 发现 ${this.errors.length} 个错误:`);
      this.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log(`\n⚠️  发现 ${this.warnings.length} 个警告:`);
      this.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }

    console.log("\n💡 修复建议:");
    if (this.errors.some((e) => e.includes("Ollama"))) {
      console.log("  - 启动Ollama服务: ollama serve");
      console.log("  - 下载模型: ollama pull gemma3:4b");
    }
    if (this.errors.some((e) => e.includes("Python服务"))) {
      console.log("  - 启动Python服务: npm run chat-server");
    }
    if (this.errors.some((e) => e.includes("依赖"))) {
      console.log("  - 安装Node.js依赖: npm install");
      console.log(
        "  - 安装Python依赖: pip install -r chat_scripts/requirements.txt"
      );
    }
  }

  // 生成配置报告
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      environment: this.config.env.nodeEnv,
      validation: {
        success: this.errors.length === 0,
        errors: this.errors,
        warnings: this.warnings,
      },
      configuration: {
        server: {
          port: this.config.server.port,
          host: this.config.server.host,
        },
        services: {
          ollama: this.config.ai.ollama.baseUrl,
          python: this.config.python.serviceUrl,
        },
        storage: {
          tempDir: this.config.storage.tempDir,
          maxFileSize: `${Math.round(
            this.config.storage.maxFileSize / 1024 / 1024
          )}MB`,
        },
      },
    };

    const reportPath = "config-validation-report.json";
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 详细报告已保存到: ${reportPath}`);

    return report;
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new ConfigValidator();

  validator
    .validateAll()
    .then((result) => {
      validator.generateReport();

      if (!result.success) {
        console.log("\n❌ 配置验证失败，请修复上述问题后重试");
        process.exit(1);
      } else {
        console.log("\n🎉 配置验证成���，系统已准备就绪！");
        process.exit(0);
      }
    })
    .catch((error) => {
      console.error("❌ 验证过程中发生错误:", error);
      process.exit(1);
    });
}

export default ConfigValidator;
