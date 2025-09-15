// components/layout/UpToDown.js - 简化版，移除重复头部
import dynamic from "next/dynamic";

// 动态导入单细胞分析器以避免SSR问题
const SingleCellAnalyzer = dynamic(() => import("../analysis/SingleCellAnalyzer"), {
  ssr: false,
  loading: () => <div style={{ padding: "20px", textAlign: "center" }}>🔄 加载单细胞分析器中...</div>,
});

export default function UpToDown() {
  const styles = {
    container: {
      height: "100%",
      width: "100%",
      backgroundColor: "#fff",
      borderRadius: "8px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      overflow: "hidden",
    },
    content: {
      height: "100%", // 使用全高，由LayoutController统一管理头部
      overflow: "auto", // 添加滚动条
      overflowX: "hidden", // 防止水平滚动
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <SingleCellAnalyzer />
      </div>
    </div>
  );
}