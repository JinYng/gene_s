
你好 Claude Code，

我们现在正式确定“AI模型选择”组件的重构方案。请按照这份详细的开发蓝图进行实现，我们的目标是打造一个体验类似 Google AI Studio 的、将**选择与配置**清晰分离的专业级组件。

#### 1. 核心数据结构定义

首先，请在项目配置中（例如 `config/models.js`）定义我们的模型列表。每个模型对象应遵循以下结构：

```javascript
export const models = [
  {
    id: 'ollama-gemma',
    name: 'Ollama 本地模型',
    provider: 'Ollama',
    modelId: 'gemma3:4b',
    description: '本地部署的AI模型 - 快速、私密、免费',
    type: 'local',
    requires_api_key: false,
  },
  {
    id: 'zhipu-glm4.5v',
    name: '智谱AI',
    provider: '智谱',
    modelId: 'glm-4.5v',
    description: '功能强大的在线AI模型',
    type: 'api',
    requires_api_key: true,
  },
  // ...未来可以添加更多模型
];
```

#### 2. 组件架构设计

请将功能拆分为两个独立的 React 组件：

* **`AIModelManager.js`** (父组件): 作为主入口，负责显示当前模型、控制弹窗、管理所有状态和业务逻辑。
* **`ModelSettingsModal.js`** (子组件): 纯粹的 UI 组件，负责渲染弹窗内容，接收 props 并向上冒泡用户事件。

---

#### 3. 详细实现计划

##### **阶段 A: `AIModelManager.js` (父/逻辑组件)**

**UI:**

* 在默认视图下，只渲染一个**单行、可点击的按钮**。
* 按钮内容应包含：
  * 一个通用的图标（例如“芯片”或“大脑”图标）。
  * 当前选中模型的 `provider` 和 `modelId` (例如: `Ollama / gemma3:4b`)。
  * 右侧一个小的 `▼` 图标。

**State 管理 (使用 `useState`):**

* `isModalOpen` (boolean): 控制配置弹窗的显示与隐藏。
* `availableModels` (Array): 从配置文件加载的模型列表。
* `selectedModelId` (string): 当前激活的模型 `id`。
* `apiKeys` (Object): 一个 `{ [modelId]: 'apiKey' }` 格式的对象，用于存储所有 API 密钥。**应在 `useEffect` 中从 `localStorage` 初始化**。
* `modelStatuses` (Object): 一个 `{ [modelId]: 'status' }` 格式的对象，存储每个模型的状态。可能的状态值包括: `'available'`, `'unavailable'`, `'checking'`, `'unconfigured'`。

**核心逻辑/函数:**

1. `handleOpenModal()`: 设置 `isModalOpen` 为 `true`。
2. `handleCloseModal()`: 设置 `isModalOpen` 为 `false`。
3. `handleModelSelection(modelId)`: 更新 `selectedModelId` 状态。
4. `handleSaveAndVerifyApiKey(modelId, apiKey)`:
   * 首先，将 `modelStatuses` 中对应模型的状态设为 `'checking'`。
   * 将新的 API Key 更新到 `apiKeys` state 中，并同步写入 `localStorage`。
   * 调用后端 API (`/api/check-model-availability`) 进行验证。
   * 根据 API 返回结果，更新 `modelStatuses` 为 `'available'` 或 `'unavailable'`。
5. 一个 `useEffect` 钩子，在组件首次加载时，遍历 `availableModels`，为所有需要密钥的模型调用验证 API，以初始化 `modelStatuses`。

##### **阶段 B: `ModelSettingsModal.js` (子/UI组件)**

**UI:**

* **弹窗结构**: 包含清晰的页眉（标题：“模型设置”）、内容区域和页脚（“完成”按钮）。
* **模型列表**:
  * 使用**单选按钮组 (Radio Group)** 渲染 `models` 列表。
  * 每个选项应显示模型的 `name` 和 `description`。
  * 每个选项的左侧应有一个**彩色的状态指示灯 (Status Dot)**，颜色根据传入的 `statuses` prop 变化（绿/红/灰）。
* **API Key 配置区**:
  * 这是一个**条件渲染**区域。当用户选中的模型的 `requires_api_key` 为 `true` 时，此区域才通过**平滑动画**（如 slide down）出现。
  * 包含一个标签和一个密码输入框 (`<input type="password">`)，用于输入 API Key。
  * 包含一个“**验证并保存**”按钮。当对应模型状态为 `'checking'` 时，此按钮应显示一个加载中的微调器 (spinner)。

**Props 定义 (它应接收的属性):**

* `isOpen` (boolean)
* `onClose` (function)
* `models` (Array)
* `statuses` (Object)
* `apiKeys` (Object)
* `selectedModelId` (string)
* `onSelectModel` (function)
* `onSaveApiKey` (function)

#### 4. 后端 API 端点规范

请创建一个新的 API 路由来支持密钥验证。

* **路由**: `POST /api/check-model-availability`
* **请求体 (JSON)**:
  ```json
  {
    "modelId": "zhipu-glm4.5v",
    "apiKey": "users-secret-api-key"
  }
  ```
* **成功响应 (200 OK)**:
  ```json
  { "success": true, "status": "available" }
  ```
* **失败响应 (400/401/500)**:
  ```json
  { "success": false, "status": "unavailable", "message": "API密钥无效或网络错误" }
  ```

---

#### 5. 用户体验流程总结

最终的用户流程应该是：

1. 用户看到主界面上一个简洁的按钮，显示当前模型。
2. 用户点击按钮，一个专业的设置弹窗出现。
3. 用户可以在弹窗中看到所有模型的列表及其可用状态。
4. 当用户选择一个需要 API Key 的模型时，输入框会自动出现。
5. 用户输入密钥并保存，系统会立即验证并反馈结果（状态灯变色）。
6. 用户选择一个可用的模型后，点击“完成”关闭弹窗。
7. 主界面上的按钮文本更新，显示新选择的模型。

这份详细的计划应该为构建一个健壮且用户友好的模型管理组件提供了一个清晰的蓝图。
