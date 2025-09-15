// components/layout/LayoutController.js
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";

// 动态导入两个主界面
const BioChat = dynamic(() => import("./BioChat"), {
  ssr: false,
  loading: () => <div style={{ padding: "20px", textAlign: "center" }}>🧬 加载BioChat界面...</div>,
});

const UpToDown = dynamic(() => import("./UpToDown"), {
  ssr: false,
  loading: () => <div style={{ padding: "20px", textAlign: "center" }}>📊 加载单细胞分析界面...</div>,
});

export default function LayoutController() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState("chat");

  // 根据URL路径或查询参数确定当前页面
  useEffect(() => {
    const { page } = router.query;
    if (page === "analysis") {
      setCurrentPage("analysis");
    } else {
      setCurrentPage("chat");
    }
  }, [router.query]);

  const handleNavigation = (page) => {
    setCurrentPage(page);
    if (page === "analysis") {
      router.push("/?page=analysis", undefined, { shallow: true });
    } else {
      router.push("/", undefined, { shallow: true });
    }
  };

  // 导航栏样式常量
  const styles = {
    header: {
      padding: "12px 0",
      backgroundColor: "#fff",
      borderBottom: "2px solid #e1e5e9",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    },
    headerContent: {
      maxWidth: "1600px",
      margin: "0 auto",
      padding: "0 20px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    titleSection: {
      margin: 0,
    },
    mainTitle: {
      margin: 0,
      color: "#2d3748",
      fontSize: "24px",
    },
    subtitle: {
      margin: "4px 0 0 0",
      color: "#718096",
      fontSize: "14px",
    },
    nav: {
      display: "flex",
      gap: "8px",
    },
    button: (isActive, isAnalysis) => ({
      padding: "10px 20px",
      backgroundColor: isActive 
        ? (isAnalysis ? "#059669" : "#2563eb") 
        : "#f8fafc",
      color: isActive ? "white" : "#475569",
      border: `2px solid ${isActive 
        ? (isAnalysis ? "#059669" : "#2563eb") 
        : "#e2e8f0"}`,
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      transition: "all 0.2s ease",
      outline: "none",
    }),
    container: {
      height: "100vh",
      backgroundColor: "#f5f7fa",
      display: "flex",
      flexDirection: "column",
    },
    main: {
      flex: 1,
      padding: "12px 20px 8px 20px",
      overflow: "visible",
      position: "relative",
      height: "calc(100vh - 100px)", // 减去导航栏高度
    },
  };

  return (
    <div style={styles.container}>
      {/* 统一的导航栏 */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.titleSection}>
            <h1 style={styles.mainTitle}>🧬 生物信息分析平台</h1>
            <p style={styles.subtitle}>单细胞转录组数据分析</p>
          </div>

          <nav style={styles.nav}>
            <button
              onClick={() => handleNavigation("chat")}
              style={styles.button(currentPage === "chat", false)}
            >
              💬 BioChat
            </button>
            <button
              onClick={() => handleNavigation("analysis")}
              style={styles.button(currentPage === "analysis", true)}
            >
              📊 单细胞转录组分析
            </button>
          </nav>
        </div>
      </header>

      {/* 主内容区域 */}
      <main style={styles.main}>
        {currentPage === "chat" ? (
          <BioChat />
        ) : (
          <UpToDown />
        )}
      </main>
    </div>
  );
}