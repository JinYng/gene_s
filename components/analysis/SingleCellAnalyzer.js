// components/SingleCellAnalyzer.js

import React, { useState } from "react";
import axios from "axios";
import DeckGLScatterPlot from "./DeckGLScatterPlot";
import SeparateFileUploader from "./SeparateFileUploader";

const SingleCellAnalyzer = () => {
  // 统一管理分析参数
  const [analysisParams, setAnalysisParams] = useState({
    dataType: "csv",
    reductionMethod: "umap",
    colorBy: "",
  });

  // H5AD下载选项
  const [downloadOptions, setDownloadOptions] = useState({
    autoDownload: false,
    customFilename: "",
  });

  // 单细胞数据相关状态
  const [singleCellData, setSingleCellData] = useState(null);
  const [availableColors, setAvailableColors] = useState({
    categorical: [],
    numeric: [],
  });
  const [hoverInfo, setHoverInfo] = useState(null);
  const [highlightedGroup, setHighlightedGroup] = useState(null);

  // 文件和处理状态
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fileUploadLoading, setFileUploadLoading] = useState(false);
  const [chartGenerationLoading, setChartGenerationLoading] = useState(false);
  const [error, setError] = useState("");
  const [h5adFilename, setH5adFilename] = useState(null); // 存储生成的H5AD文件名
  const [activeTab, setActiveTab] = useState("analysis"); // 控制导航标签页

  const handleParamChange = (param, value) => {
    setAnalysisParams((prev) => ({ ...prev, [param]: value }));
  };

  // 处理分离的文件上传
  const handleSeparateFileUpload = (file, fieldType) => {
    if (!file) {
      // 移除该类型的文件
      setUploadedFiles((prev) => prev.filter((f) => f.fieldType !== fieldType));
      return;
    }

    // 将fieldType作为文件对象的属性添加，而不是创建新对象
    file.fieldType = fieldType;

    setUploadedFiles((prev) => {
      // 移除该类型的旧文件，添加新文件
      const filtered = prev.filter((f) => f.fieldType !== fieldType);
      return [...filtered, file];
    });

    // 清除之前的分析结果
    setSingleCellData(null);
    setAvailableColors({ categorical: [], numeric: [] });
    setAnalysisParams((prev) => ({ ...prev, colorBy: "" }));
  };

  // 处理参数变化
  const handleAnalysisSuccess = (plotData) => {
    // 数据验证
    if (!plotData.x || !plotData.y || plotData.x.length === 0) {
      console.error("返回的数据缺少坐标信息", plotData);
      setError("返回的数据无效：缺少坐标信息");
      return;
    }

    console.log(`成功获取数据: ${plotData.x.length}个数据点`);
    setSingleCellData(plotData);

    // 检查是否有H5AD文件名（表示从TSV转换而来）
    if (plotData.h5ad_filename) {
      setH5adFilename(plotData.h5ad_filename);
      console.log(`H5AD文件已生成: ${plotData.h5ad_filename}`);

      // 如果用户选择了自动下载，则立即开始下载
      if (downloadOptions.autoDownload) {
        setTimeout(() => {
          downloadH5adFile(plotData.h5ad_filename);
        }, 1000); // 延迟1秒以确保界面更新完成
      }
    } else {
      setH5adFilename(null);
    }

    // 更新可用的着色选项
    const newAvailableColors = plotData.available_colors || {
      categorical: [],
      numeric: [],
    };
    setAvailableColors(newAvailableColors);

    // 智能设置默认着色方式
    // 优先使用后端推荐的着色方式
    if (plotData.recommended_color) {
      handleParamChange("colorBy", plotData.recommended_color);
      console.log(`自动设置着色方式为: ${plotData.recommended_color}`);
    } else if (analysisParams.colorBy === "") {
      // 如果没有推荐，并且用户没有选择，则使用第一个分类选项
      if (newAvailableColors.categorical.length > 0) {
        handleParamChange("colorBy", newAvailableColors.categorical[0]);
      }
    }
  };

  // 生成单细胞图表
  const generateSingleCellChart = async () => {
    if (uploadedFiles.length === 0) {
      setError("请先上传文件");
      return;
    }

    setChartGenerationLoading(true);
    setError("");
    setSingleCellData(null);

    try {
      const formData = new FormData();

      if (analysisParams.dataType === "h5ad") {
        // H5AD文件
        const h5adFile = uploadedFiles.find((f) =>
          f.name.toLowerCase().endsWith(".h5ad")
        );
        if (!h5adFile) {
          throw new Error("未找到H5AD文件");
        }
        formData.append("h5adFile", h5adFile);
      } else {
        // CSV/TSV文件 - 使用新的分离上传逻辑
        const expressionFile = uploadedFiles.find(
          (f) => f.fieldType === "expressionMatrix"
        );
        const metadataFile = uploadedFiles.find(
          (f) => f.fieldType === "cellMetadata"
        );

        if (!expressionFile) {
          throw new Error("请上传表达矩阵文件");
        }

        formData.append("expressionMatrix", expressionFile);
        if (metadataFile) {
          formData.append("cellMetadata", metadataFile);
        }

        console.log("上传的文件:", {
          expression: expressionFile?.name,
          metadata: metadataFile?.name || "无",
        });

        // 调试信息：检查文件对象
        console.log("表达矩阵文件详情:", {
          name: expressionFile?.name,
          size: expressionFile?.size,
          type: expressionFile?.type,
          isFile: expressionFile instanceof File,
          constructor: expressionFile?.constructor?.name,
        });

        if (metadataFile) {
          console.log("元数据文件详情:", {
            name: metadataFile?.name,
            size: metadataFile?.size,
            type: metadataFile?.type,
            isFile: metadataFile instanceof File,
            constructor: metadataFile?.constructor?.name,
          });
        }
      }

      formData.append("dataType", analysisParams.dataType);
      formData.append("reductionMethod", analysisParams.reductionMethod);
      if (analysisParams.colorBy) {
        formData.append("colorBy", analysisParams.colorBy);
      }

      // 传递下载选项
      formData.append("saveH5ad", downloadOptions.autoDownload.toString());
      if (downloadOptions.customFilename) {
        formData.append("customFilename", downloadOptions.customFilename);
      }

      console.log("发送的参数:", {
        dataType: analysisParams.dataType,
        reductionMethod: analysisParams.reductionMethod,
        colorBy: analysisParams.colorBy,
        files: uploadedFiles.map((f) => ({ name: f.name, type: f.fieldType })),
      });

      const response = await axios.post("/api/process-single-cell", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 600000, // 10分钟超时
      });

      // 检查响应是否为JSON格式
      const contentType = response.headers["content-type"];
      if (contentType && contentType.includes("text/html")) {
        throw new Error(
          "服务器返回了HTML页面而不是JSON数据，可能是服务器错误或路由问题"
        );
      }

      if (!response.data || !response.data.data) {
        console.error("处理结果没有返回有效数据", response.data);
        setError("处理结果返回无效数据，请检查服务器日志");
        return;
      }

      handleAnalysisSuccess(response.data.data);
    } catch (error) {
      console.error("处理单细胞数据失败:", error);
      let errorMessage = "处理单细胞数据失败";

      // 检查是否是JSON解析错误
      if (error.message && error.message.includes("Unexpected token")) {
        errorMessage =
          "服务器返回了非JSON格式的响应，可能是服务器错误或路由配置问题。请检查后端服务是否正常运行。";
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      } else {
        errorMessage += ": 服务器没有响应";
      }

      setError(errorMessage);
    } finally {
      setChartGenerationLoading(false);
    }
  };

  // 下载H5AD文件
  const downloadH5adFile = async (filename = null) => {
    const targetFilename = filename || h5adFilename;
    if (!targetFilename) {
      setError("没有可下载的H5AD文件");
      return;
    }

    try {
      // 显示下载开始提示
      console.log(`开始下载H5AD文件: ${targetFilename}`);

      const response = await fetch(
        `/api/download-h5ad?filename=${encodeURIComponent(targetFilename)}`
      );

      if (!response.ok) {
        throw new Error(`下载失败: ${response.status} ${response.statusText}`);
      }

      // 创建下载链接
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = targetFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log(`H5AD文件下载成功: ${targetFilename}`);

      // 显示成功提示（可选：可以用更友好的通知组件替代console.log）
      if (!downloadOptions.autoDownload) {
        alert(
          `✅ H5AD文件下载成功！\n文件名: ${targetFilename}\n\n该文件可用于 Scanpy、Seurat 等工具进行后续分析。`
        );
      }
    } catch (error) {
      console.error("下载H5AD文件失败:", error);
      setError(`下载失败: ${error.message}`);
    }
  };

  // 仅生成H5AD文件（不进行分析）
  const generateH5adOnly = async () => {
    const expressionFile = uploadedFiles.find(
      (f) => f.fieldType === "expressionMatrix"
    );

    if (!expressionFile) {
      setError("请先上传表达矩阵文件");
      return;
    }

    setChartGenerationLoading(true);
    setError("");

    try {
      const formData = new FormData();
      const metadataFile = uploadedFiles.find(
        (f) => f.fieldType === "cellMetadata"
      );

      formData.append("expressionMatrix", expressionFile);
      if (metadataFile) {
        formData.append("cellMetadata", metadataFile);
      }
      formData.append("dataType", "csv");
      formData.append("convertOnly", "true"); // 标记仅转换

      const response = await axios.post("/api/convert-to-h5ad", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 300000, // 5分钟超时
      });

      // 检查响应是否为JSON格式
      const contentType = response.headers["content-type"];
      if (contentType && contentType.includes("text/html")) {
        throw new Error(
          "服务器返回了HTML页面而不是JSON数据，可能是服务器错误或路由问题"
        );
      }

      if (response.data && response.data.h5ad_filename) {
        setH5adFilename(response.data.h5ad_filename);
        console.log(`H5AD文件生成成功: ${response.data.h5ad_filename}`);
      } else {
        throw new Error("服务器未返回文件名");
      }
    } catch (error) {
      console.error("生成H5AD文件失败:", error);
      let errorMessage = "生成H5AD文件失败";

      // 检查是否是JSON解析错误
      if (error.message && error.message.includes("Unexpected token")) {
        errorMessage =
          "服务器返回了非JSON格式的响应，可能是服务器错误或路由配置问题。请检查后端服务是否正常运行。";
      } else if (error.response) {
        errorMessage += `: ${error.response.status} ${error.response.statusText}`;
        if (error.response.data && error.response.data.error) {
          errorMessage += `\n${error.response.data.error}`;
        }
      } else {
        errorMessage += `: ${error.message}`;
      }

      setError(errorMessage);
    } finally {
      setChartGenerationLoading(false);
    }
  };

  // 重置所有状态
  const resetAnalyzer = () => {
    setUploadedFiles([]);
    setSingleCellData(null);
    setError("");
    setH5adFilename(null);
    setAnalysisParams({
      dataType: "csv",
      reductionMethod: "umap",
      colorBy: "",
    });
    setDownloadOptions({
      autoDownload: false,
      customFilename: "",
    });
    setAvailableColors({ categorical: [], numeric: [] });
    setHoverInfo(null);
    setHighlightedGroup(null);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
      <h2 style={{ color: "#333", marginBottom: "20px" }}>
        🧬 单细胞转录组数据分析
      </h2>

      {/* 导航标签 */}
      <div
        style={{
          marginBottom: "30px",
          borderBottom: "1px solid #ddd",
          display: "flex",
          gap: "0",
        }}
      >
        <button
          onClick={() => setActiveTab("analysis")}
          style={{
            padding: "12px 24px",
            backgroundColor:
              activeTab === "analysis" ? "#007bff" : "transparent",
            color: activeTab === "analysis" ? "white" : "#007bff",
            border: "1px solid #007bff",
            borderBottom:
              activeTab === "analysis" ? "1px solid #007bff" : "1px solid #ddd",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: activeTab === "analysis" ? "bold" : "normal",
            transition: "all 0.3s ease",
          }}
        >
          📊 数据分析
        </button>
        <button
          onClick={() => setActiveTab("converter")}
          style={{
            padding: "12px 24px",
            backgroundColor:
              activeTab === "converter" ? "#28a745" : "transparent",
            color: activeTab === "converter" ? "white" : "#28a745",
            border: "1px solid #28a745",
            borderBottom:
              activeTab === "converter"
                ? "1px solid #28a745"
                : "1px solid #ddd",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: activeTab === "converter" ? "bold" : "normal",
            transition: "all 0.3s ease",
            marginLeft: "-1px",
          }}
        >
          🔄 格式转换
        </button>
      </div>

      {/* 标签页内容 */}
      {activeTab === "analysis" && (
        <>
          {/* 文件上传区域 */}
          <div style={{ marginBottom: "20px" }}>
            <h3>1. 数据上传</h3>
            {analysisParams.dataType === "h5ad" ? (
              <SeparateFileUploader
                uploadedFile={uploadedFiles.find(
                  (f) => f.fieldType === "h5adFile"
                )}
                onFileUpload={(file) =>
                  handleSeparateFileUpload(file, "h5adFile")
                }
                fileUploadLoading={fileUploadLoading}
                setFileUploadLoading={setFileUploadLoading}
                acceptedTypes=".h5ad"
                helpText="上传单个H5AD文件"
                required={true}
              />
            ) : (
              <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                {/* 表达矩阵上传区域 */}
                <div style={{ flex: 1, minWidth: "300px" }}>
                  <h4 style={{ marginBottom: "10px", color: "#333" }}>
                    📊 表达矩阵文件 (必需)
                  </h4>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#666",
                      marginBottom: "10px",
                    }}
                  >
                    上传如 exprMatrix.tsv 格式的文件，包含基因表达数据
                  </p>
                  <SeparateFileUploader
                    uploadedFile={uploadedFiles.find(
                      (f) => f.fieldType === "expressionMatrix"
                    )}
                    onFileUpload={(file) =>
                      handleSeparateFileUpload(file, "expressionMatrix")
                    }
                    fileUploadLoading={fileUploadLoading}
                    setFileUploadLoading={setFileUploadLoading}
                    acceptedTypes=".csv,.tsv,.txt"
                    helpText="拖拽表达矩阵文件到此处或点击选择"
                    required={true}
                  />
                </div>

                {/* 元数据上传区域 */}
                <div style={{ flex: 1, minWidth: "300px" }}>
                  <h4 style={{ marginBottom: "10px", color: "#333" }}>
                    🏷️ 细胞元数据文件 (推荐)
                  </h4>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#666",
                      marginBottom: "10px",
                    }}
                  >
                    上传如 meta.tsv 格式的文件，包含细胞类型、聚类等信息
                  </p>
                  <SeparateFileUploader
                    uploadedFile={uploadedFiles.find(
                      (f) => f.fieldType === "cellMetadata"
                    )}
                    onFileUpload={(file) =>
                      handleSeparateFileUpload(file, "cellMetadata")
                    }
                    fileUploadLoading={fileUploadLoading}
                    setFileUploadLoading={setFileUploadLoading}
                    acceptedTypes=".csv,.tsv,.txt"
                    helpText="拖拽元数据文件到此处或点击选择（可选）"
                    required={false}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 参数设置 */}
          <div style={{ marginBottom: "20px" }}>
            <h3>2. 分析参数</h3>
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
              {/* 数据类型选择 */}
              <div>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  数据类型:
                </label>
                <select
                  value={analysisParams.dataType}
                  onChange={(e) => {
                    handleParamChange("dataType", e.target.value);
                    setUploadedFiles([]);
                    setSingleCellData(null);
                  }}
                  style={{
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                >
                  <option value="csv">CSV/TSV 文件</option>
                  <option value="h5ad">H5AD 文件</option>
                </select>
              </div>

              {/* 降维方法 */}
              <div>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  降维方法:
                </label>
                <select
                  value={analysisParams.reductionMethod}
                  onChange={(e) =>
                    handleParamChange("reductionMethod", e.target.value)
                  }
                  style={{
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                >
                  <option value="umap">UMAP</option>
                </select>
              </div>

              {/* 着色选项 */}
              {(availableColors.categorical.length > 0 ||
                availableColors.numeric.length > 0) && (
                <div>
                  <label style={{ display: "block", marginBottom: "5px" }}>
                    着色方式:
                  </label>
                  <select
                    value={analysisParams.colorBy}
                    onChange={(e) =>
                      handleParamChange("colorBy", e.target.value)
                    }
                    style={{
                      padding: "8px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      minWidth: "150px",
                    }}
                  >
                    {availableColors.categorical.length === 0 &&
                    availableColors.numeric.length === 0 ? (
                      <option value="">--无可用选项--</option>
                    ) : (
                      <>
                        <option value="">--选择着色--</option>
                        {availableColors.categorical.length > 0 && (
                          <optgroup label="分类">
                            {availableColors.categorical.map((col) => (
                              <option key={col} value={col}>
                                {col}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {availableColors.numeric.length > 0 && (
                          <optgroup label="数值">
                            {availableColors.numeric.map((col) => (
                              <option key={col} value={col}>
                                {col}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </>
                    )}
                  </select>
                </div>
              )}
            </div>

            {/* H5AD文件下载选项 - 仅在CSV/TSV模式下显示 */}
            {analysisParams.dataType === "csv" && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "15px",
                  backgroundColor: "#f8f9fa",
                  border: "1px solid #dee2e6",
                  borderRadius: "8px",
                }}
              >
                <h4
                  style={{
                    marginBottom: "15px",
                    color: "#495057",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  💾 H5AD文件保存选项
                </h4>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {/* 自动下载复选框 */}
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={downloadOptions.autoDownload}
                      onChange={(e) =>
                        setDownloadOptions((prev) => ({
                          ...prev,
                          autoDownload: e.target.checked,
                        }))
                      }
                      style={{
                        width: "16px",
                        height: "16px",
                        cursor: "pointer",
                      }}
                    />
                    <span style={{ fontSize: "14px", color: "#495057" }}>
                      分析后自动下载H5AD文件
                    </span>
                  </label>

                  {/* 自定义文件名输入框 */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "14px",
                        color: "#495057",
                        minWidth: "80px",
                      }}
                    >
                      文件名称:
                    </label>
                    <input
                      type="text"
                      placeholder="留空使用默认名称 (如: my_analysis)"
                      value={downloadOptions.customFilename}
                      onChange={(e) =>
                        setDownloadOptions((prev) => ({
                          ...prev,
                          customFilename: e.target.value,
                        }))
                      }
                      style={{
                        padding: "6px 10px",
                        border: "1px solid #ced4da",
                        borderRadius: "4px",
                        fontSize: "14px",
                        flex: "1",
                        maxWidth: "300px",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#6c757d",
                        fontStyle: "italic",
                      }}
                    >
                      .h5ad
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: "12px",
                      color: "#6c757d",
                      margin: "0",
                      fontStyle: "italic",
                    }}
                  >
                    💡
                    勾选后，分析完成时会自动开始下载生成的H5AD文件，方便后续在Scanpy、Seurat等工具中使用。
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 生成按钮 */}
          <div style={{ marginBottom: "20px" }}>
            <button
              onClick={generateSingleCellChart}
              disabled={chartGenerationLoading || uploadedFiles.length === 0}
              style={{
                padding: "12px 24px",
                backgroundColor:
                  chartGenerationLoading || uploadedFiles.length === 0
                    ? "#ccc"
                    : "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor:
                  chartGenerationLoading || uploadedFiles.length === 0
                    ? "not-allowed"
                    : "pointer",
                fontSize: "16px",
                marginRight: "10px",
              }}
            >
              {chartGenerationLoading ? "正在分析..." : "🚀 开始分析"}
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
                whiteSpace: "pre-line",
              }}
            >
              ❌ {error}
            </div>
          )}

          {/* 结果显示 */}
          {singleCellData && (
            <div>
              <h3>3. 分析结果</h3>
              <div
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "10px",
                  backgroundColor: "#f9f9f9",
                }}
              >
                <div style={{ marginBottom: "10px" }}>
                  <strong>数据概览：</strong>
                  <span style={{ marginLeft: "10px" }}>
                    📊 {singleCellData.n_cells} 个细胞
                  </span>
                  <span style={{ marginLeft: "10px" }}>
                    🧬 降维方法: {singleCellData.method}
                  </span>
                  {singleCellData.color_name && (
                    <span style={{ marginLeft: "10px" }}>
                      🎨 着色: {singleCellData.color_name}
                    </span>
                  )}
                </div>

                {/* 图表工具栏 */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "4px",
                    marginBottom: "10px",
                    border: "1px solid #dee2e6",
                  }}
                >
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: "#495057",
                    }}
                  >
                    📈 {singleCellData.method} 可视化图表
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                    }}
                  >
                    {/* H5AD下载按钮 */}
                    {h5adFilename && (
                      <button
                        onClick={downloadH5adFile}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#17a2b8",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "bold",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        💾 下载 H5AD
                      </button>
                    )}

                    {/* 重置按钮 */}
                    <button
                      onClick={resetAnalyzer}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#6c757d",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      🔄 重新开始
                    </button>
                  </div>
                </div>

                {/* UMAP图表和图例的容器 */}
                <div
                  style={{
                    display: "flex",
                    gap: "20px",
                    alignItems: "flex-start",
                  }}
                >
                  {/* 3D散点图 */}
                  <DeckGLScatterPlot
                    data={singleCellData}
                    width={
                      typeof window !== "undefined"
                        ? Math.min(900, window.innerWidth - 400)
                        : 900
                    }
                    height={800}
                    colorBy={analysisParams.colorBy}
                    reductionMethod={analysisParams.reductionMethod}
                    onHover={setHoverInfo}
                    highlightedGroup={highlightedGroup}
                    onLegendClick={setHighlightedGroup}
                    showLegend={false}
                  />

                  {/* 独立的图例面板 */}
                  {singleCellData.categories && (
                    <div
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        padding: "16px",
                        borderRadius: "8px",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
                        border: "1px solid #e0e0e0",
                        minWidth: "200px",
                        maxWidth: "250px",
                        maxHeight: "600px",
                        overflowY: "auto",
                      }}
                    >
                      <h4
                        style={{
                          margin: "0 0 12px 0",
                          fontSize: "16px",
                          fontWeight: "600",
                          color: "#333",
                          borderBottom: "1px solid #eee",
                          paddingBottom: "8px",
                        }}
                      >
                        细胞类型
                      </h4>
                      <div style={{ fontSize: "12px" }}>
                        {singleCellData.categories.map((category, index) => {
                          // 使用与 DeckGLScatterPlot 相同的颜色逻辑
                          const groupColors = [
                            [31, 119, 180],
                            [174, 199, 232],
                            [255, 127, 14],
                            [255, 187, 120],
                            [44, 160, 44],
                            [152, 223, 138],
                            [214, 39, 40],
                            [255, 152, 150],
                            [148, 103, 189],
                            [197, 176, 213],
                            [140, 86, 75],
                            [196, 156, 148],
                            [227, 119, 194],
                            [247, 182, 210],
                            [127, 127, 127],
                            [199, 199, 199],
                            [188, 189, 34],
                            [219, 219, 141],
                            [23, 190, 207],
                            [158, 218, 229],
                            [64, 64, 64],
                          ];
                          const color = groupColors[index % groupColors.length];

                          return (
                            <div
                              key={`legend-${index}-${category}`}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                marginBottom: "6px",
                                cursor: "pointer",
                                padding: "4px",
                                borderRadius: "4px",
                                opacity:
                                  highlightedGroup === null ||
                                  highlightedGroup === index
                                    ? 1
                                    : 0.5,
                                transition: "all 0.2s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "rgba(0,0,0,0.05)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "transparent";
                              }}
                              onClick={() =>
                                setHighlightedGroup(
                                  highlightedGroup === index ? null : index
                                )
                              }
                            >
                              <div
                                style={{
                                  width: "16px",
                                  height: "16px",
                                  backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})`,
                                  marginRight: "10px",
                                  borderRadius: "3px",
                                  flexShrink: 0,
                                  border: "1px solid rgba(0,0,0,0.1)",
                                }}
                              />
                              <span
                                style={{
                                  fontSize: "13px",
                                  lineHeight: "1.3",
                                  wordBreak: "break-word",
                                  color: "#444",
                                }}
                              >
                                {category || `群组 ${index}`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 悬停信息 */}
                {hoverInfo && (
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "10px",
                      backgroundColor: "#e7f3ff",
                      border: "1px solid #b3d9ff",
                      borderRadius: "4px",
                    }}
                  >
                    <strong>细胞信息：</strong>
                    <div>
                      坐标: ({hoverInfo.x?.toFixed(2)},{" "}
                      {hoverInfo.y?.toFixed(2)})
                    </div>
                    {hoverInfo.cellId && <div>ID: {hoverInfo.cellId}</div>}
                    {hoverInfo.group && <div>分组: {hoverInfo.group}</div>}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* 格式转换标签页 */}
      {activeTab === "converter" && (
        <div>
          <h3>🔄 Matrix 转 H5AD 工具</h3>
          <p style={{ color: "#666", marginBottom: "20px" }}>
            将表达矩阵和细胞元数据转换为 H5AD 格式文件
          </p>

          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            {/* 表达矩阵上传区域 */}
            <div style={{ flex: 1, minWidth: "300px" }}>
              <h4 style={{ marginBottom: "10px", color: "#333" }}>
                📊 表达矩阵文件 (必需)
              </h4>
              <SeparateFileUploader
                uploadedFile={uploadedFiles.find(
                  (f) => f.fieldType === "expressionMatrix"
                )}
                onFileUpload={(file) =>
                  handleSeparateFileUpload(file, "expressionMatrix")
                }
                fileUploadLoading={fileUploadLoading}
                setFileUploadLoading={setFileUploadLoading}
                acceptedTypes=".csv,.tsv,.txt"
                helpText="上传表达矩阵文件"
                required={true}
              />
            </div>

            {/* 元数据上传区域 */}
            <div style={{ flex: 1, minWidth: "300px" }}>
              <h4 style={{ marginBottom: "10px", color: "#333" }}>
                🏷️ 细胞元数据文件 (可选)
              </h4>
              <SeparateFileUploader
                uploadedFile={uploadedFiles.find(
                  (f) => f.fieldType === "cellMetadata"
                )}
                onFileUpload={(file) =>
                  handleSeparateFileUpload(file, "cellMetadata")
                }
                fileUploadLoading={fileUploadLoading}
                setFileUploadLoading={setFileUploadLoading}
                acceptedTypes=".csv,.tsv,.txt"
                helpText="上传元数据文件（可选）"
                required={false}
              />
            </div>
          </div>

          {/* 转换按钮 */}
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button
              onClick={generateH5adOnly}
              disabled={
                !uploadedFiles.find((f) => f.fieldType === "expressionMatrix")
              }
              style={{
                padding: "12px 24px",
                backgroundColor: uploadedFiles.find(
                  (f) => f.fieldType === "expressionMatrix"
                )
                  ? "#28a745"
                  : "#ccc",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: uploadedFiles.find(
                  (f) => f.fieldType === "expressionMatrix"
                )
                  ? "pointer"
                  : "not-allowed",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              🔄 生成 H5AD 文件
            </button>
          </div>

          {/* 下载区域 */}
          {h5adFilename && (
            <div
              style={{
                marginTop: "20px",
                padding: "20px",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
                border: "1px solid #dee2e6",
              }}
            >
              <h4 style={{ color: "#28a745", marginBottom: "10px" }}>
                ✅ H5AD 文件生成成功！
              </h4>
              <p style={{ marginBottom: "15px", color: "#666" }}>
                文件名: <code>{h5adFilename}</code>
              </p>
              <button
                onClick={downloadH5adFile}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#17a2b8",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                💾 下载到本地
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SingleCellAnalyzer;
