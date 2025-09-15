// pages/index.js - 重构后的主页面
import dynamic from "next/dynamic";

// 使用新的总控组件
const LayoutController = dynamic(() => import("../components/layout/LayoutController"), {
  ssr: false,
  loading: () => (
    <div style={{ 
      height: "100vh", 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center",
      backgroundColor: "#f5f7fa",
      fontSize: "18px",
      color: "#4a5568"
    }}>
      🧬 正在加载生物信息分析平台...
    </div>
  ),
});

export default function HomePage() {
  return <LayoutController />;
}
