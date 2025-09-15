import React, { useState } from "react";
import axios from "axios";
import Link from "next/link";

const MatrixConverter = () => {
  const [matrixFile, setMatrixFile] = useState(null);
  const [metaFile, setMetaFile] = useState(null);
  const [outputFileName, setOutputFileName] = useState("");
  const [converting, setConverting] = useState(false);
  const [result, setResult] = useState(null);
  const [log, setLog] = useState("");
  const [error, setError] = useState("");

  const handleMatrixFileChange = (e) => {
    const file = e.target.files[0];
    setMatrixFile(file);

    // 自动生成输出文件名
    if (file && !outputFileName) {
      const baseName = file.name.split(".").slice(0, -1).join(".");
      setOutputFileName(`${baseName}_converted.h5ad`);
    }
  };

  const handleMetaFileChange = (e) => {
    setMetaFile(e.target.files[0]);
  };

  const handleConvert = async () => {
    if (!matrixFile) {
      setError("请选择表达矩阵文件");
      return;
    }

    setConverting(true);
    setError("");
    setResult(null);
    setLog("");

    try {
      const formData = new FormData();
      formData.append("matrixFile", matrixFile);

      if (metaFile) {
        formData.append("metaFile", metaFile);
      }

      if (outputFileName) {
        formData.append("outputFileName", outputFileName);
      }

      const response = await axios.post(
        "/api/convert-to-h5ad",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 300000, // 5分钟超时
        }
      );

      setResult(response.data.result);
      setLog(response.data.log);
    } catch (err) {
      console.error("转换错误:", err);
      setError(err.response?.data?.error || "转换失败");
      if (err.response?.data?.stdout) {
        setLog(err.response.data.stdout);
      }
    } finally {
      setConverting(false);
    }
  };

  const resetForm = () => {
    setMatrixFile(null);
    setMetaFile(null);
    setOutputFileName("");
    setResult(null);
    setLog("");
    setError("");
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      {/* 导航提示 */}
      <div
        style={{
          marginBottom: "20px",
          padding: "15px",
          backgroundColor: "#e7f3ff",
          border: "1px solid #b3d9ff",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <p style={{ margin: 0, color: "#0369a1", fontSize: "14px" }}>
            💡
            转换完成后，您可以返回主分析页面使用转换后的H5AD文件进行UMAP/t-SNE分析
          </p>
        </div>
        <Link
          href="/?page=analysis"
          style={{
            padding: "8px 16px",
            backgroundColor: "#0ea5e9",
            color: "white",
            textDecoration: "none",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: "600",
            whiteSpace: "nowrap",
          }}
        >
          📊 返回分析页面
        </Link>
      </div>

      <h2>Matrix 转 H5AD 工具</h2>
      <p>将表达矩阵和细胞元数据转换为 H5AD 格式文件</p>

      <div style={{ marginBottom: "20px" }}>
        <h3>上传文件</h3>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            表达矩阵文件 (必需) *
          </label>
          <input
            type="file"
            accept=".csv,.tsv,.txt,.xlsx"
            onChange={handleMatrixFileChange}
            style={{
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              width: "100%",
            }}
          />
          <small style={{ color: "#666" }}>
            支持格式: CSV, TSV, TXT, XLSX。矩阵应为基因(行) x 细胞(列)格式
          </small>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            细胞元数据文件 (可选)
          </label>
          <input
            type="file"
            accept=".csv,.tsv,.txt,.xlsx"
            onChange={handleMetaFileChange}
            style={{
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              width: "100%",
            }}
          />
          <small style={{ color: "#666" }}>
            包含细胞类型、聚类等注释信息。细胞ID应与矩阵列名匹配
          </small>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            输出文件名
          </label>
          <input
            type="text"
            value={outputFileName}
            onChange={(e) => setOutputFileName(e.target.value)}
            placeholder="例如: my_data.h5ad"
            style={{
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              width: "100%",
            }}
          />
          <small style={{ color: "#666" }}>
            文件将保存在 public/sample_data/output/ 目录下
          </small>
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={handleConvert}
          disabled={converting || !matrixFile}
          style={{
            padding: "12px 24px",
            backgroundColor: converting ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: converting ? "not-allowed" : "pointer",
            marginRight: "10px",
            fontSize: "16px",
          }}
        >
          {converting ? "转换中..." : "开始转换"}
        </button>

        <button
          onClick={resetForm}
          disabled={converting}
          style={{
            padding: "12px 24px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: converting ? "not-allowed" : "pointer",
            fontSize: "16px",
          }}
        >
          重置
        </button>
      </div>

      {/* 错误信息 */}
      {error && (
        <div
          style={{
            padding: "15px",
            backgroundColor: "#f8d7da",
            color: "#721c24",
            border: "1px solid #f5c6cb",
            borderRadius: "4px",
            marginBottom: "20px",
          }}
        >
          <strong>错误:</strong> {error}
        </div>
      )}

      {/* 转换结果 */}
      {result && (
        <div
          style={{
            padding: "15px",
            backgroundColor: "#d4edda",
            color: "#155724",
            border: "1px solid #c3e6cb",
            borderRadius: "4px",
            marginBottom: "20px",
          }}
        >
          <h4>转换成功！</h4>
          <p>
            <strong>文件路径:</strong> {result.file_path}
          </p>
          <p>
            <strong>文件大小:</strong> {result.file_size_mb} MB
          </p>
          <p>
            <strong>细胞数量:</strong> {result.n_cells}
          </p>
          <p>
            <strong>基因数量:</strong> {result.n_genes}
          </p>
          {result.obs_columns && (
            <p>
              <strong>细胞注释:</strong> {result.obs_columns.join(", ")}
            </p>
          )}
          {result.var_columns && (
            <p>
              <strong>基因注释:</strong> {result.var_columns.join(", ")}
            </p>
          )}
        </div>
      )}

      {/* 处理日志 */}
      {log && (
        <div style={{ marginBottom: "20px" }}>
          <h4>处理日志</h4>
          <pre
            style={{
              backgroundColor: "#f8f9fa",
              padding: "15px",
              border: "1px solid #dee2e6",
              borderRadius: "4px",
              overflow: "auto",
              maxHeight: "300px",
              fontSize: "12px",
              lineHeight: "1.4",
            }}
          >
            {log}
          </pre>
        </div>
      )}

      {/* 使用说明 */}
      <div
        style={{
          backgroundColor: "#f8f9fa",
          padding: "15px",
          border: "1px solid #dee2e6",
          borderRadius: "4px",
          marginTop: "30px",
        }}
      >
        <h4>使用说明</h4>
        <ol>
          <li>
            <strong>表达矩阵文件:</strong> 基因作为行，细胞作为列的表达量矩阵
          </li>
          <li>
            <strong>元数据文件:</strong>{" "}
            细胞ID作为行，注释信息作为列（如细胞类型、聚类等）
          </li>
          <li>
            <strong>支持格式:</strong> CSV（逗号分隔）、TSV（制表符分隔）、Excel
          </li>
          <li>
            <strong>输出:</strong> 标准的 H5AD 格式文件，可用于 Scanpy、Seurat
            等分析
          </li>
          <li>
            <strong>文件位置:</strong> 转换后的文件保存在
            public/sample_data/output/ 目录
          </li>
        </ol>
      </div>
    </div>
  );
};

export default MatrixConverter;
