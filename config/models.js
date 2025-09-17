// config/models.js
// AI模型配置 - 类似Google AI Studio的模型管理

export const models = [
  {
    id: 'ollama-gemma',
    name: 'Ollama 本地模型',
    provider: 'Ollama',
    modelId: 'gemma3:4b',
    description: '本地部署的AI模型 - 快速、私密、免费',
    type: 'local',
    requires_api_key: false,
    icon: '🖥️',
    endpoint: 'http://localhost:11434',
    // LangChain 集成配置
    is_openai_compatible: false, // Ollama 使用自己的 API 格式
    base_url: null, // 将使用 config/index.js 中的 ollamaConfig
  },
  {
    id: 'zhipu-glm4.5v',
    name: '智谱AI',
    provider: '智谱',
    modelId: 'glm-4.5v',
    description: '功能强大的在线AI模型 - 支持视觉理解',
    type: 'api',
    requires_api_key: true,
    icon: '🌟',
    endpoint: 'https://open.bigmodel.cn/api/paas/v4',
    // LangChain 集成配置
    is_openai_compatible: true, // 智谱AI v4 提供了 OpenAI 兼容端点
    base_url: 'https://open.bigmodel.cn/api/paas/v4/',
  },
  {
    id: 'openai-gpt4',
    name: 'OpenAI GPT-4',
    provider: 'OpenAI',
    modelId: 'gpt-4',
    description: '业界领先的大语言模型 - 强大的推理能力',
    type: 'api',
    requires_api_key: true,
    icon: '🚀',
    endpoint: 'https://api.openai.com/v1',
    // LangChain 集成配置
    is_openai_compatible: true, // 原生 OpenAI 格式
    base_url: 'https://api.openai.com/v1',
    disabled: true, // 暂未实现
  },
  {
    id: 'modelscope-qwen-turbo',
    name: '通义千问 Turbo',
    provider: 'ModelScope',
    modelId: 'qwen-turbo',
    description: '阿里云通义千问模型 - 快速响应',
    type: 'api',
    requires_api_key: true,
    icon: '⚡',
    endpoint: 'https://dashscope.aliyuncs.com/api/v1',
    // LangChain 集成配置
    is_openai_compatible: false, // DashScope API 格式不兼容，需要自定义
    base_url: 'https://dashscope.aliyuncs.com/api/v1',
    disabled: true, // 需要配置才能启用
  },
  // 未来可以轻松添加更多模型
  // {
  //   id: 'claude-3',
  //   name: 'Claude 3',
  //   provider: 'Anthropic',
  //   modelId: 'claude-3-opus-20240229',
  //   description: '优秀的对话AI - 安全可靠',
  //   type: 'api',
  //   requires_api_key: true,
  //   icon: '🎭',
  //   endpoint: 'https://api.anthropic.com',
  //   is_openai_compatible: false, // Anthropic 有自己的 API 格式
  //   base_url: 'https://api.anthropic.com',
  //   disabled: true,
  // }
];

// 默认模型ID
export const DEFAULT_MODEL_ID = 'ollama-gemma';

// 模型状态常量
export const MODEL_STATUS = {
  AVAILABLE: 'available',      // 可用
  UNAVAILABLE: 'unavailable',  // 不可用
  CHECKING: 'checking',        // 检查中
  UNCONFIGURED: 'unconfigured', // 未配置
};

// 根据ID获取模型
export const getModelById = (id) => {
  return models.find(model => model.id === id) || models.find(model => model.id === DEFAULT_MODEL_ID);
};

// 获取可用的模型列表（过滤掉被禁用的）
export const getAvailableModels = () => {
  return models.filter(model => !model.disabled);
};

// 获取需要API密钥的模型
export const getApiKeyRequiredModels = () => {
  return models.filter(model => model.requires_api_key && !model.disabled);
};

// 本地存储键名
export const STORAGE_KEYS = {
  SELECTED_MODEL: 'gene_s_selected_model',
  API_KEYS: 'gene_s_api_keys',
  MODEL_STATUSES: 'gene_s_model_statuses',
};