// components/layout/BioChat.js - 简化版，移除重复头部
import dynamic from "next/dynamic";

// 动态导入聊天分析器以避免SSR问题
const ChatAnalyzer = dynamic(() => import("../chat/ChatAnalyzer"), {
  ssr: false,
  loading: () => (
    <div style={{ padding: "20px", textAlign: "center" }}>
      🔄 加载聊天分析器中...
    </div>
  ),
});

export default function BioChat() {
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
      overflow: "hidden",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <ChatAnalyzer />
      </div>
    </div>
  );
}