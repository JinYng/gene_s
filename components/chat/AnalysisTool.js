// components/chat/AnalysisTool.js
// 聊天界面专用的图表分析工具

import React, { useState, useEffect } from "react";
import DeckGLScatterPlot from "../analysis/DeckGLScatterPlot";
import {
  colors,
  spacing,
  fontSize,
  buttonStyles,
  createHoverStyles,
  flexUtils,
} from "../../styles";

const AnalysisTool = ({ onDataGenerated, currentDataFile }) => {
  const [analysisParams, setAnalysisParams] = useState({
    method: "umap",
    colorBy: "louvain",
  });

  const [visualizationData, setVisualizationData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [highlightedGroup, setHighlightedGroup] = useState(null);

  // 当数据文件变化时重置可视化
  useEffect(() => {
    setVisualizationData(null);
    setError("");
  }, [currentDataFile]);

  // 处理参数变化
  const handleParamChange = (param, value) => {
    setAnalysisParams((prev) => ({
      ...prev,
      [param]: value,
    }));
  };

  // 生成分析图表
  const generateAnalysis = async () => {
    if (!currentDataFile) {
      setError("请先上传数据文件");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // 构建分析请求
      const formData = new FormData();
      formData.append(
        "message",
        `对数据进行${analysisParams.method}降维分析，使用${analysisParams.colorBy}着色`
      );
      formData.append("sessionId", `analysis_${Date.now()}`);
      formData.append("useWorkflow", "true");

      // 发送到聊天API进行分析
      const response = await fetch("/api/chat-ollama", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`分析失败: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      // 查找可视化数据
      const visualizationResponse = result.responses.find(
        (r) => r.type === "deckgl_visualization"
      );

      if (visualizationResponse && visualizationResponse.visualizationData) {
        setVisualizationData(visualizationResponse.visualizationData);
        onDataGenerated?.(visualizationResponse.visualizationData);
      } else {
        throw new Error("未生成可视化数据");
      }
    } catch (err) {
      console.error("分析失败:", err);
      setError(`分析失败: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 图例点击处理
  const handleLegendClick = (groupIndex) => {
    setHighlightedGroup(groupIndex);
  };

  // 渲染参数控制面板
  const renderControlPanel = () => (
    <div
      style={{
        padding: spacing.lg,
        backgroundColor: colors.background.tertiary,
        borderRadius: "8px",
        marginBottom: spacing.lg,
      }}
    >
      <h4
        style={{
          margin: `0 0 ${spacing.base} 0`,
          color: colors.text.primary,
          fontSize: fontSize.lg,
        }}
      >
        🧬 分析参数设置
      </h4>

      <div
        style={{
          display: "flex",
          gap: spacing.lg,
          flexWrap: "wrap",
          marginBottom: spacing.base,
        }}
      >
        {/* 降维方法选择 */}
        <div style={{ flex: 1, minWidth: "200px" }}>
          <label
            style={{
              display: "block",
              marginBottom: spacing.xs,
              fontSize: fontSize.sm,
              color: colors.text.secondary,
            }}
          >
            降维方法
          </label>
          <select
            value={analysisParams.method}
            onChange={(e) => handleParamChange("method", e.target.value)}
            style={{
              width: "100%",
              padding: spacing.sm,
              border: `1px solid ${colors.border.primary}`,
              borderRadius: "4px",
              backgroundColor: colors.background.primary,
              color: colors.text.primary,
              fontSize: fontSize.base,
            }}
          >
            <option value="umap">UMAP</option>
            <option value="tsne">t-SNE</option>
            <option value="pca">PCA</option>
          </select>
        </div>

        {/* 着色方式选择 */}
        <div style={{ flex: 1, minWidth: "200px" }}>
          <label
            style={{
              display: "block",
              marginBottom: spacing.xs,
              fontSize: fontSize.sm,
              color: colors.text.secondary,
            }}
          >
            着色方式
          </label>
          <select
            value={analysisParams.colorBy}
            onChange={(e) => handleParamChange("colorBy", e.target.value)}
            style={{
              width: "100%",
              padding: spacing.sm,
              border: `1px solid ${colors.border.primary}`,
              borderRadius: "4px",
              backgroundColor: colors.background.primary,
              color: colors.text.primary,
              fontSize: fontSize.base,
            }}
          >
            <option value="louvain">Louvain聚类</option>
            <option value="cell_type">细胞类型</option>
            <option value="seurat_clusters">Seurat聚类</option>
          </select>
        </div>
      </div>

      {/* 生成按钮 */}
      <button
        onClick={generateAnalysis}
        disabled={isLoading || !currentDataFile}
        style={{
          ...buttonStyles.primary,
          width: "100%",
          padding: `${spacing.sm} ${spacing.base}`,
          fontSize: fontSize.base,
          opacity: isLoading || !currentDataFile ? 0.6 : 1,
          cursor: isLoading || !currentDataFile ? "not-allowed" : "pointer",
        }}
      >
        {isLoading ? "⏳ 分析中..." : "🚀 生成分析图表"}
      </button>

      {/* 错误信息 */}
      {error && (
        <div
          style={{
            marginTop: spacing.base,
            padding: spacing.sm,
            backgroundColor: "#fee",
            border: `1px solid #fcc`,
            borderRadius: "4px",
            color: "#c33",
            fontSize: fontSize.sm,
          }}
        >
          ❌ {error}
        </div>
      )}
    </div>
  );

  // 渲染可视化区域
  const renderVisualization = () => {
    if (!visualizationData) {
      return (
        <div
          style={{
            ...flexUtils.center,
            height: "400px",
            backgroundColor: colors.background.secondary,
            borderRadius: "8px",
            border: `1px dashed ${colors.border.primary}`,
          }}
        >
          <div style={{ textAlign: "center", color: colors.text.tertiary }}>
            <div style={{ fontSize: "48px", marginBottom: spacing.base }}>
              📊
            </div>
            <h4
              style={{
                margin: `0 0 ${spacing.sm} 0`,
                color: colors.text.secondary,
                fontSize: fontSize.lg,
              }}
            >
              等待生成可视化图表
            </h4>
            <p
              style={{
                margin: 0,
                fontSize: fontSize.base,
                maxWidth: "300px",
                lineHeight: "1.5",
              }}
            >
              设置分析参数并点击"生成分析图表"按钮开始分析
            </p>
          </div>
        </div>
      );
    }

    return (
      <div
        style={{
          backgroundColor: colors.background.primary,
          borderRadius: "8px",
          overflow: "hidden",
          border: `1px solid ${colors.border.primary}`,
        }}
      >
        <div
          style={{
            padding: `${spacing.md} ${spacing.lg}`,
            borderBottom: `1px solid ${colors.border.primary}`,
            backgroundColor: colors.background.tertiary,
          }}
        >
          <h4
            style={{
              margin: 0,
              color: colors.text.primary,
              fontSize: fontSize.lg,
            }}
          >
            📈 {visualizationData.method} 可视化结果
          </h4>
          <div
            style={{
              marginTop: spacing.xs,
              fontSize: fontSize.sm,
              color: colors.text.secondary,
            }}
          >
            {visualizationData.n_cells || visualizationData.x?.length} 个细胞
          </div>
        </div>

        <div style={{ padding: spacing.lg }}>
          <DeckGLScatterPlot
            data={visualizationData}
            width={800}
            height={500}
            colorBy={analysisParams.colorBy}
            reductionMethod={visualizationData.method?.toLowerCase() || "umap"}
            showLegend={true}
            highlightedGroup={highlightedGroup}
            onLegendClick={handleLegendClick}
          />
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      {renderControlPanel()}
      {renderVisualization()}
    </div>
  );
};

export default AnalysisTool;
