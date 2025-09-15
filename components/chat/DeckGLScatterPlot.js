import React, { useMemo } from "react";
import DeckGL from "@deck.gl/react";
import { ScatterplotLayer } from "@deck.gl/layers";
import { OrthographicView } from "@deck.gl/core";

const DeckGLScatterPlot = ({
  data,
  width = 1000,
  height = 700,
  colorBy = null,
  onHover = null,
  onClick = null, // 新增：点击事件回调
  highlightedGroup = null,
  onLegendClick = null,
  fileName = null,
  showLegend = true, // 新增：控制是否显示图例
}) => {
  // 调试信息
  console.log("DeckGLScatterPlot received data:", data);

  // 数据验证
  if (!data) {
    console.error("DeckGLScatterPlot: No data provided");
    return (
      <div
        style={{
          padding: "20px",
          backgroundColor: "#f8d7da",
          border: "1px solid #f5c6cb",
          borderRadius: "4px",
        }}
      >
        错误：没有提供数据
      </div>
    );
  }

  if (!data.x || !data.y) {
    console.error("DeckGLScatterPlot: Missing x or y coordinates", {
      hasX: !!data.x,
      hasY: !!data.y,
      dataKeys: Object.keys(data),
    });
    return (
      <div
        style={{
          padding: "20px",
          backgroundColor: "#f8d7da",
          border: "1px solid #f5c6cb",
          borderRadius: "4px",
        }}
      >
        错误：缺少坐标数据 (x: {data.x ? "✓" : "✗"}, y: {data.y ? "✓" : "✗"})
        <pre style={{ fontSize: "10px", marginTop: "5px" }}>
          可用字段: {Object.keys(data).join(", ")}
        </pre>
      </div>
    );
  }

  // 修改 getPointColor 函数以支持高亮逻辑
  const getPointColor = (dataObj, pointIndex, colorBy) => {
    const defaultColor = [200, 200, 200, 80]; // 灰色，透明度降低
    const highlightedColor = [255, 215, 0, 180]; // 金色高亮
    const groupColors = [
      [31, 119, 180, 180], // 蓝色
      [174, 199, 232, 180], // 浅蓝色
      [255, 127, 14, 180], // 橙色
      [255, 187, 120, 180], // 浅橙色
      [44, 160, 44, 180], // 绿色
      [152, 223, 138, 180], // 浅绿色
      [214, 39, 40, 180], // 红色
      [255, 152, 150, 180], // 浅红色
      [148, 103, 189, 180], // 紫色
      [197, 176, 213, 180], // 浅紫色
      [140, 86, 75, 180], // 棕色
      [196, 156, 148, 180], // 浅棕色
      [227, 119, 194, 180], // 粉色
      [247, 182, 210, 180], // 浅粉色
      [127, 127, 127, 180], // 灰色
      [199, 199, 199, 180], // 浅灰色
      [188, 189, 34, 180], // 黄绿色
      [219, 219, 141, 180], // 浅黄绿色
      [23, 190, 207, 180], // 青色
      [158, 218, 229, 180], // 浅青色
      [64, 64, 64, 180], // 深灰色 - 专门用于"未知"类型
    ];

    // 获取该点的群组值
    const groupIndex = dataObj.color_values
      ? dataObj.color_values[pointIndex]
      : 0;

    // 处理特殊情况：确保索引在有效范围内
    const safeGroupIndex = Math.max(0, groupIndex % groupColors.length);

    // 获取该群组的基础颜色
    const baseColor = groupColors[safeGroupIndex];

    // 应用高亮逻辑
    if (highlightedGroup === null) {
      // 没有高亮任何群组，显示所有点的正常颜色
      return baseColor;
    } else if (highlightedGroup === groupIndex) {
      // 当前点属于高亮群组，使用更鲜明的颜色
      return [baseColor[0], baseColor[1], baseColor[2], 255];
    } else {
      // 当前点不属于高亮群组，显示为半透明灰色
      return defaultColor;
    }
  };

  // 获取图例颜色的函数（基于群组值而不是索引）
  const getLegendColor = (groupValue) => {
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
      [64, 64, 64], // 深灰色 - 专门用于"未知"类型，与散点图保持一致
    ];
    const safeIndex = Math.max(0, groupValue % groupColors.length);
    return groupColors[safeIndex];
  };

  // 获取唯一的分类数据，避免重复显示
  const uniqueCategories = useMemo(() => {
    if (!data || !data.categories) return [];

    // 创建唯一分类的映射，保持原始索引
    const seen = new Set();
    const unique = [];

    data.categories.forEach((category, index) => {
      const categoryKey = `${category}_${index}`;
      if (!seen.has(categoryKey)) {
        seen.add(categoryKey);
        unique.push({ category, index });
      }
    });

    return unique;
  }, [data?.categories]);

  // 获取分组名称的函数 - 直接使用数据中的真实分类名称
  const getGroupName = (category, index) => {
    // 优先使用数据中的真实分类名称
    if (
      category &&
      typeof category === "string" &&
      category.trim() !== "" &&
      category !== "undefined"
    ) {
      return category;
    }

    // 如果没有分类名称，返回群组编号
    return `群组 ${index}`;
  };

  // 准备数据点
  const points = useMemo(() => {
    if (!data || !data.x || !data.y) return [];

    return data.x.map((x, index) => ({
      position: [x, data.y[index]],
      color: getPointColor(data, index, colorBy),
      cellId: data.cell_ids ? data.cell_ids[index] : `Cell_${index}`,
      colorValue: data.color_values ? data.color_values[index] : 0,
      // 添加更多有用的信息
      name: data.cell_ids ? data.cell_ids[index] : `Cell_${index}`,
      category:
        data.categories && data.color_values
          ? data.categories[data.color_values[index]]
          : `Group ${data.color_values ? data.color_values[index] : 0}`,
      x: x,
      y: data.y[index],
      index: index,
    }));
  }, [data, colorBy, highlightedGroup]);

  // 计算视图边界
  const bounds = useMemo(() => {
    if (!data || !data.x || !data.y) {
      return { minX: -10, maxX: 10, minY: -10, maxY: 10 };
    }

    const minX = Math.min(...data.x);
    const maxX = Math.max(...data.x);
    const minY = Math.min(...data.y);
    const maxY = Math.max(...data.y);

    // 添加一些边距
    const marginX = (maxX - minX) * 0.1;
    const marginY = (maxY - minY) * 0.1;

    return {
      minX: minX - marginX,
      maxX: maxX + marginX,
      minY: minY - marginY,
      maxY: maxY + marginY,
    };
  }, [data]);

  // 创建散点图层
  const layers = [
    new ScatterplotLayer({
      id: "scatterplot-layer",
      data: points,
      pickable: true,
      opacity: 0.7,
      stroked: false,
      filled: true,
      radiusScale: 1,
      radiusMinPixels: 2,
      radiusMaxPixels: 6,
      getPosition: (d) => d.position,
      getFillColor: (d) => d.color,
      onHover: onHover
        ? ({ object, x, y }) => {
            if (object) {
              // 传递完整的对象信息，而不仅仅是部分字段
              onHover({
                object: object,
                x,
                y,
              });
            } else {
              onHover(null);
            }
          }
        : undefined,
      onClick: onClick
        ? ({ object, x, y }) => {
            if (object) {
              // 传递完整的对象信息，而不仅仅是部分字段
              onClick({
                object: object,
                x,
                y,
              });
            } else {
              onClick(null);
            }
          }
        : undefined,
    }),
  ];

  // 初始视图状态
  const initialViewState = {
    target: [
      (bounds.minX + bounds.maxX) / 2,
      (bounds.minY + bounds.maxY) / 2,
      0,
    ],
    zoom: 0,
  };

  return (
    <div
      style={{
        position: "relative",
        width: typeof width === 'string' && width.includes('%') ? width : width,
        height: typeof height === 'string' && height.includes('%') ? height : height,
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        backgroundColor: "#fafafa",
      }}
    >
      <DeckGL
        width="100%"
        height="100%"
        initialViewState={initialViewState}
        controller={true}
        layers={layers}
        views={new OrthographicView({ id: "ortho" })}
        getCursor={({ isDragging, isHovering }) =>
          isDragging ? "grabbing" : isHovering ? "pointer" : "grab"
        }
      />

      {/* 颜色图例 */}
      {showLegend && data && data.categories && uniqueCategories.length > 0 && (
        <div
          key={`legend-${uniqueCategories.length}-${
            data.color_name || "default"
          }`}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: "rgba(255, 255, 255, 0.95)",
            padding: "12px",
            borderRadius: "8px",
            fontSize: "12px",
            maxWidth: "250px",
            maxHeight: "400px",
            overflowY: "auto",
            boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
            border: "1px solid #e0e0e0",
            zIndex: 1000,
          }}
        >
          <h4
            style={{
              margin: "0 0 10px 0",
              fontSize: "14px",
              fontWeight: "600",
              color: "#333",
              borderBottom: "1px solid #eee",
              paddingBottom: "6px",
            }}
          >
            {data.color_name || "细胞类型"}
          </h4>
          <div style={{ maxHeight: "320px", overflowY: "auto" }}>
            {uniqueCategories.map(({ category, index }) => {
              // 使用原始 index 作为群组值
              const color = getLegendColor(index);
              const groupName = getGroupName(category, index);
              return (
                <div
                  key={`legend-item-${index}-${groupName}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "4px",
                    cursor: "pointer",
                    opacity:
                      highlightedGroup === null || highlightedGroup === index
                        ? 1
                        : 0.5,
                    padding: "3px 2px",
                    borderRadius: "4px",
                    transition: "background-color 0.2s ease",
                    minHeight: "20px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  onClick={() =>
                    onLegendClick &&
                    onLegendClick(highlightedGroup === index ? null : index)
                  }
                >
                  <div
                    style={{
                      width: "14px",
                      height: "14px",
                      backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})`,
                      marginRight: "8px",
                      borderRadius: "3px",
                      flexShrink: 0,
                      border: "1px solid rgba(0,0,0,0.1)",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "11px",
                      lineHeight: "1.3",
                      wordBreak: "break-word",
                      color: "#444",
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {groupName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeckGLScatterPlot;
