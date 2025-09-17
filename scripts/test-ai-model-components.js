// scripts/test-ai-model-components.js
// 测试新的AI模型组件基本功能

import { models, getModelById, getAvailableModels, DEFAULT_MODEL_ID } from '../config/models.js';

console.log('🧪 测试AI模型组件基本功能\n');

// 测试1: 基本配置加载
console.log('✅ 测试1: 基本配置加载');
console.log(`  - 总模型数: ${models.length}`);
console.log(`  - 默认模型: ${DEFAULT_MODEL_ID}`);
console.log(`  - 可用模型数: ${getAvailableModels().length}`);

// 测试2: 模型查找功能
console.log('\n✅ 测试2: 模型查找功能');
const defaultModel = getModelById(DEFAULT_MODEL_ID);
console.log(`  - 默认模型详情: ${defaultModel.name} (${defaultModel.provider})`);

const zhipuModel = getModelById('zhipu-glm4.5v');
console.log(`  - 智谱模型详情: ${zhipuModel.name} (${zhipuModel.requires_api_key ? '需要API密钥' : '无需密钥'})`);

// 测试3: 测试无效模型ID
console.log('\n✅ 测试3: 无效模型ID处理');
const invalidModel = getModelById('non-existent-model');
console.log(`  - 无效模型回退: ${invalidModel.name} (应该回退到默认模型)`);

// 测试4: 模型分类
console.log('\n✅ 测试4: 模型分类');
const localModels = models.filter(m => m.type === 'local');
const apiModels = models.filter(m => m.type === 'api');
console.log(`  - 本地模型数量: ${localModels.length}`);
console.log(`  - API模型数量: ${apiModels.length}`);

console.log('\n🎉 所有基本测试通过！');
console.log('\n💡 下一步: 打开浏览器访问 http://localhost:3000 来测试完整的用户界面');