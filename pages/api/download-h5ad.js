// pages/api/download-h5ad.js
// 提供H5AD文件下载功能

import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Only GET requests are allowed" });
  }

  try {
    const { filename } = req.query;

    if (!filename) {
      return res.status(400).json({ error: "文件名参数缺失" });
    }

    // 安全检查：确保文件名不包含路径遍历字符
    if (
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\")
    ) {
      return res.status(400).json({ error: "无效的文件名" });
    }

    // 检查文件是否存在于输出目录
    const outputDir = "./sample_data/output";
    const filePath = path.join(outputDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "文件不存在" });
    }

    // 读取文件
    const fileBuffer = fs.readFileSync(filePath);

    // 设置响应头
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", fileBuffer.length);

    // 发送文件
    res.send(fileBuffer);
  } catch (error) {
    console.error("下载H5AD文件时出错:", error);
    res.status(500).json({
      error: "下载文件失败",
      details: error.message,
    });
  }
}
