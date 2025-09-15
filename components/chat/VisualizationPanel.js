// components/VisualizationPanel.js

import React, { useState, useEffect } from "react";
import DeckGLScatterPlot from "./DeckGLScatterPlot.js";
import {
  // ... (你的样式导入保持不变)
  titleStyles,
} from "../../styles";

// 导入测试数据
import testVisualizationData from "../../sample_data/test_visualization_data.json";

// 添加CSS动画
const GlobalStyle = () => (
  <style jsx global>{`
    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  `}</style>
);

const VisualizationPanel = ({ data, currentDataFile }) => {
  const [viewState, setViewState] = useState({
    zoom: 1,
    pan: { x: 0, y: 0 },
  });

  const [highlightedGroup, setHighlightedGroup] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null); // 将只存储数据对象
  const [selectedCell, setSelectedCell] = useState(null); // 将只存储数据对象
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 }); // 用于定位UI元素

  const [visualizationData, setVisualizationData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    if (data && data.x && data.y) {
      // 优先使用真实数据
      setVisualizationData(data);
      console.log("[VisualizationPanel] 使用真实数据", data);
    } else if (!data) {
      // 没有真实数据时使用测试数据作为后备
      console.log("[VisualizationPanel] 使用测试数据作为后备");
      setVisualizationData(testVisualizationData);
    } else {
      // 数据格式不正确
      console.error("[VisualizationPanel] 数据格式错误:", data);
      setVisualizationData(null);
    }

    // 重置视图状态
    setViewState({ zoom: 1, pan: { x: 0, y: 0 } });
    setHighlightedGroup(null);
    setHoveredCell(null);
    setSelectedCell(null);
    setIsLoading(false);
  }, [data]);

  const handleLegendClick = (groupIndex) => {
    setHighlightedGroup(groupIndex);
    setSelectedCell(null);
  };

  /**
   * 细胞悬停处理函数
   * 处理从 DeckGLScatterPlot 传递过来的完整对象信息
   */
  const handleCellHover = (info) => {
    if (info && info.object) {
      setHoveredCell(info.object);
      console.log("悬停坐标:", { x: info.x, y: info.y });
      setMousePos({ x: info.x, y: info.y });
    } else {
      setHoveredCell(null);
    }
  };

  /**
   * 细胞点击处理函数
   * 处理从 DeckGLScatterPlot 传递过来的完整对象信息
   */
  const handleCellClick = (info) => {
    if (info && info.object) {
      setSelectedCell(info.object);
      console.log("点击坐标:", { x: info.x, y: info.y });
      setMousePos({ x: info.x, y: info.y });
    } else {
      setSelectedCell(null);
    }
  };

  useEffect(() => {
    console.log("[VisualizationPanel] 接收到数据:", data);
  }, [data]);

  const styles = {
    loadingContainer: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      color: "#64748b",
      fontSize: "16px",
    },
    loadingSpinner: {
      width: "40px",
      height: "40px",
      border: "4px solid #e2e8f0",
      borderTop: "4px solid #3b82f6",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
      marginBottom: "16px",
    },
    errorMessage: {
      flex: 1,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      color: "#ef4444",
      fontSize: "16px",
      textAlign: "center",
    },
  };

  const renderVisualization = () => {
    if (isLoading) {
      return (
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
          <div>正在加载可视化数据...</div>
        </div>
      );
    }

    if (!visualizationData || !visualizationData.x || !visualizationData.y) {
      return (
        <div style={styles.errorMessage}>
          {data ? "❌ 数据格式错误，无法渲染可视化" : "📊 等待分析数据..."}
        </div>
      );
    }

    // 使用实际的 visualizationData
    const plotData = visualizationData;
    const isRealData = data && data.x && data.y;

    // 从数据中提取细胞信息，提供更丰富的显示
    const getCellInfo = (cellData) => {
      if (!cellData) return {};

      // 获取细胞名称
      const name =
        cellData.name ||
        cellData.cellId ||
        cellData.id ||
        cellData.label ||
        `Cell_${cellData.index || "unknown"}`;

      // 获取细胞类别
      let category = null;
      if (cellData.category || cellData.group || cellData.type) {
        category = cellData.category || cellData.group || cellData.type;
      } else if (
        cellData.colorValue !== undefined &&
        visualizationData.categories
      ) {
        // 从 color_values 索引获取类别
        category =
          visualizationData.categories[cellData.colorValue] ||
          `群组 ${cellData.colorValue}`;
      }

      // 获取坐标信息
      const position =
        cellData.position ||
        (cellData.x !== undefined && cellData.y !== undefined
          ? [cellData.x, cellData.y]
          : null);

      return { name, category, position };
    };

    const hoveredCellInfo = getCellInfo(hoveredCell);
    const selectedCellInfo = getCellInfo(selectedCell);

    return (
      <div
        style={{
          width: "100%",
          height: "calc(100vh - 240px)",
          position: "relative",
          minHeight: "400px",
        }}
      >
        <DeckGLScatterPlot
          data={plotData}
          width="100%"
          height="100%"
          colorBy={plotData.used_color_column || plotData.colorBy || null}
          showLegend={true}
          highlightedGroup={highlightedGroup}
          onLegendClick={handleLegendClick}
          onHover={handleCellHover}
          onClick={handleCellClick}
        />

        {/* 相对定位的tooltip */}
        {(hoveredCell || selectedCell) && (
          <div
            style={{
              position: "absolute",
              left: mousePos.x + 15,
              top: mousePos.y + 15,
              zIndex: 1000,
              background: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #cbd5e0",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              padding: "12px 16px",
              fontSize: "13px",
              color: "#333",
              pointerEvents: "none",
              whiteSpace: "nowrap",
              maxWidth: "280px",
              backdropFilter: "blur(4px)",
            }}
          >
            {(() => {
              const cell = hoveredCell || selectedCell;
              const cellInfo = hoveredCell ? hoveredCellInfo : selectedCellInfo;
              return (
                <>
                  <div
                    style={{
                      fontWeight: "600",
                      marginBottom: "8px",
                      fontSize: "14px",
                      color: "#2c5282",
                    }}
                  >
                    {cellInfo.name}
                  </div>
                  {cellInfo.category && (
                    <div style={{ marginBottom: "6px", fontSize: "12px" }}>
                      <span style={{ color: "#4a5568", fontWeight: "500" }}>
                        类别:{" "}
                      </span>
                      <span style={{ color: "#2b6cb0" }}>
                        {cellInfo.category}
                      </span>
                    </div>
                  )}
                  {cellInfo.position && (
                    <div style={{ marginBottom: "6px", fontSize: "12px" }}>
                      <span style={{ color: "#4a5568", fontWeight: "500" }}>
                        坐标:{" "}
                      </span>
                      <span>
                        ({cellInfo.position[0]?.toFixed(2)},{" "}
                        {cellInfo.position[1]?.toFixed(2)})
                      </span>
                    </div>
                  )}
                  {cell.index !== undefined && (
                    <div style={{ fontSize: "12px" }}>
                      <span style={{ color: "#4a5568", fontWeight: "500" }}>
                        索引:{" "}
                      </span>
                      <span>#{cell.index}</span>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>
    );
  };

  const getHeaderTitle = () => {
    const isRealData = data && data.x && data.y;
    if (isRealData) {
      return {
        title: "真实数据可视化",
        subtitle: "基于您的分析数据的交互式可视化",
      };
    } else if (!data) {
      return {
        title: "可视化面板",
        subtitle: "等待分析数据...",
      };
    } else {
      return {
        title: "测试数据可视化",
        subtitle: "使用示例数据进行演示",
      };
    }
  };

  const headerInfo = getHeaderTitle();

  return (
    <>
      <GlobalStyle />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "transparent",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            backgroundColor: "transparent",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <h3 style={titleStyles.chartpageTitle}>{headerInfo.title}</h3>
          <p style={titleStyles.chartsubTitle}>{headerInfo.subtitle}</p>
        </div>
        <div style={{ flex: 1, padding: 0 }}>{renderVisualization()}</div>
      </div>
    </>
  );
};

export default VisualizationPanel;
