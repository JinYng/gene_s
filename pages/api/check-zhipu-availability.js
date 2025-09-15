export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const apiKey = process.env.ZHIPU_LLM_API_KEY || process.env.ZHIPU_API_KEY;

    if (!apiKey) {
      return res
        .status(200)
        .json({ available: false, reason: "API密钥未配置" });
    }

    // 测试智谱AI API连接
    const testResponse = await fetch(
      "https://open.bigmodel.cn/api/paas/v4/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "glm-4",
          messages: [
            {
              role: "user",
              content: "test",
            },
          ],
          max_tokens: 1,
        }),
      }
    );

    const data = await testResponse.json();

    // 如果返回401或403，说明API密钥无效
    if (testResponse.status === 401 || testResponse.status === 403) {
      return res.status(200).json({
        available: false,
        reason: "API密钥无效或已过期",
      });
    }

    // 如果返回200或其他非认证错误，说明服务可用
    if (testResponse.status === 200 || data.error?.code !== "invalid_api_key") {
      return res.status(200).json({ available: true });
    }

    return res.status(200).json({
      available: false,
      reason: "服务暂时不可用",
    });
  } catch (error) {
    console.error("智谱AI可用性检查失败:", error);
    return res.status(200).json({
      available: false,
      reason: "网络连接错误或服务不可用",
    });
  }
}
