// pages/_app.js

import "../styles/globals.css"; // 导入你的全局样式

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;
