

### **给 Claude Code 的指令**

**项目:** Chinese Intelligent Single-Cell Transcriptome Analysis Platform
**任务:** 重构AI模型管理功能，修复状态同步Bug，并实现全新的高级交互界面。

#### **一、 核心目标与问题**

1. **修复核心Bug：** 当前，`AIModelManager` 组件更新模型配置后，其父组件 `ChatAnalyzer` 未能及时获取完整的配置信息（特别是 `customConfig`）。导致用户发送聊天时，后端收到的仍然是旧的或不完整的模型数据，造成调用失败。
2. **实现高级UI/UX：** 废弃现有的、打断工作流的 `ModelSettingsModal`（模态框），重构为Google AI Studio风格的、非侵入式的 **Popover（浮层设置面板）**，提供更流畅、更专业的交互体验。

#### **二、 整体架构调整**

我们将调整组件间的职责和数据流，以确保状态的“单一数据源”和正确传递。

* **`ChatAnalyzer.js` (大脑):** 将成为模型配置的**唯一权威来源 (Single Source of Truth)**。它将持有并管理 `currentAIService` 和 `customConfig` 两个核心状态。
* **`AIModelManager.js` (控制面板):** 将被重构为一个**纯展示和交互组件**。它接收来自 `ChatAnalyzer` 的配置作为props，并通过一个统一的回调函数 `onConfigChange` 将用户的任何更改（无论是切换模型还是保存自定义配置）通知给 `ChatAnalyzer`。
* **数据流:** `ChatAnalyzer` -> `AIModelManager` (Props) -> 用户交互 -> `AIModelManager` -> `onConfigChange` 回调 -> `ChatAnalyzer` 更新状态 -> 请求后端。

---

### **三、 详细执行步骤**

请严格按照以下步骤，对指定文件进行修改。

#### **第一步：重构 `ChatAnalyzer.js` - 建立数据权威**

**文件路径:** `components/chat/ChatAnalyzer.js`

**目标:** 使其成为模型配置的唯一管理者，并改造其API调用逻辑。

1. **添加新状态:** 在 `ChatAnalyzer` 组件的顶部，除了现有的 `currentAIService` 状态外，再添加一个 `customConfig` 状态。

   ```javascript
   // ...
   const [currentAIService, setCurrentAIService] = useState(null);
   const [customConfig, setCustomConfig] = useState({
     name: '自定义AI', // 默认值
     baseUrl: '',
     apiKey: '',
     model: ''
   });
   // ...
   ```
2. **创建统一的回调函数:** 创建一个名为 `handleModelConfigChange` 的新函数。这个函数将作为 **唯一** 的回调传递给 `AIModelManager`，负责处理所有来自子组件的模型变更请求。

   ```javascript
   const handleModelConfigChange = useCallback((newModel, newCustomConfig = null) => {
     // 1. 更新当前AI服务
     setCurrentAIService(newModel);

     // 2. 如果有新的自定义配置，则更新它
     if (newCustomConfig) {
       setCustomConfig(newCustomConfig);
     }

     // 3. (可选但推荐) 在聊天窗口显示一条系统消息
     const modelDisplayName = newModel.id === 'custom-api' 
       ? newCustomConfig?.name || newModel.name 
       : newModel.name;
     const systemMessage = {
       id: `sys_${Date.now()}`,
       type: 'system',
       content: `🤖 已切换到 ${modelDisplayName}`,
       timestamp: new Date(),
     };
     setMessages(prev => [...prev, systemMessage]);

   }, []); // 使用useCallback优化性能
   ```
3. **修改API请求逻辑:** 在 `handleSendMessage` 或其调用的 `chatService` 函数中，修改构建API请求体的方式。现在必须打包一个完整的 `modelPayload` 对象。

   ```javascript
   // 在 handleSendMessage 或 chatService.js 中

   // ...
   const formData = new FormData();
   formData.append('message', messageText);
   formData.append('sessionId', sessionId);

   // -- 关键修改 --
   const modelPayload = {
       id: currentAIService.id,
       provider: currentAIService.provider,
       // 如果是自定义模型，则附加完整的config对象
       config: currentAIService.id === 'custom-api' ? customConfig : null
   };

   formData.append('modelPayload', JSON.stringify(modelPayload));
   // -- 结束修改 --

   const response = await fetch('/api/chat-ollama', {
       method: 'POST',
       body: formData,
   });
   // ...
   ```
4. **更新 `AIModelManager` 的 Props:** 修改传递给 `<AIModelManager />` 的 props。

   ```jsx
   <AIModelManager
     // 移除 onModelChange
     // 传递当前激活的模型对象
     activeModel={currentAIService}
     // 传递当前的自定义配置
     activeCustomConfig={customConfig}
     // 传递统一的更新回调
     onConfigChange={handleModelConfigChange}
   />
   ```

#### **第二步：重构 `AIModelManager.js` - 实现全新UI和交互**

**文件路径:** `components/chat/AIModelManager.js`

**目标:** 废弃模态框，实现轻量级的浮层面板，并严格遵守新的数据流。

1. **吸收并删除 `ModelSettingsModal.js`:** 将 `ModelSettingsModal` 的所有相关UI和逻辑（如状态管理、输入框、验证按钮等）移入 `AIModelManager`。完成后，**删除 `components/chat/ModelSettingsModal.js` 文件**。
2. **修改Props:** 更新组件的Props以接收来自 `ChatAnalyzer` 的数据。

   ```javascript
   const AIModelManager = ({ activeModel, activeCustomConfig, onConfigChange }) => {
     // ...
   };
   ```
3. **添加/修改本地状态:**

   ```javascript
   const [isPopoverOpen, setIsPopoverOpen] = useState(false);
   const [selectedModelIdInPopover, setSelectedModelIdInPopover] = useState(activeModel.id);
   const [localCustomConfig, setLocalCustomConfig] = useState(activeCustomConfig);
   const [verificationStatus, setVerificationStatus] = useState('idle'); // 'idle', 'verifying', 'success', 'error'
   const [verificationMessage, setVerificationMessage] = useState('');
   ```

   * **重要:** `localCustomConfig` 用于在用户保存前临时存放输入框的内容。
4. **实现新的JSX结构 (伪代码):**

   ```jsx
   <div className="ai-model-manager-container">
     {/* 1. 主显示按钮 */}
     <button onClick={() => setIsPopoverOpen(!isPopoverOpen)}>
       {/* 根据 activeModel 和 activeCustomConfig 显示状态和名称 */}
     </button>

     {/* 2. 浮层设置面板 (Popover) */}
     {isPopoverOpen && (
       <div className="settings-popover">
         {/* 区域一：模型快速切换 */}
         <div className="model-list">
           <div onClick={() => handleQuickSwitch('ollama-model-id')}>Ollama 本地模型</div>
           <div onClick={() => setSelectedModelIdInPopover('custom-api')}>自定义云端模型</div>
         </div>

         {/* 分割线 */}
         <hr />

         {/* 区域二：自定义模型配置 (仅当选中时显示) */}
         {selectedModelIdInPopover === 'custom-api' && (
           <div className="config-form">
             {/* 四个输入框，其 value 和 onChange 绑定到 localCustomConfig */}
             <input value={localCustomConfig.name} onChange={...} />
             {/* ... 其他三个输入框 ... */}

             {/* 验证与应用按钮 */}
             <button onClick={handleVerifyAndApply} disabled={verificationStatus === 'verifying'}>
               {/* 根据 verificationStatus 显示 '验证并应用', '正在验证...', '应用成功 ✓' 等 */}
             </button>

             {/* 错误信息 */}
             {verificationStatus === 'error' && <p>{verificationMessage}</p>}
           </div>
         )}
       </div>
     )}
   </div>
   ```
5. **实现核心交互逻辑:**

   * `handleQuickSwitch(modelId)`: 当用户点击Ollama等非配置模型时调用。

     * 调用 `onConfigChange(getModelById(modelId))` 通知父组件。
     * 调用 `setIsPopoverOpen(false)` **立即关闭面板**。
   * `handleVerifyAndApply()`: 当用户点击“验证并应用”时调用。

     * 设置 `setVerificationStatus('verifying')`。
     * 调用 `/api/check-model-availability`，但**必须**将 `localCustomConfig` 作为参数发送。
     * **如果成功:**
       1. 设置 `setVerificationStatus('success')`。
       2. 调用 `onConfigChange(getModelById('custom-api'), localCustomConfig)`，**将最终确认的配置上报给父组件 `ChatAnalyzer`**。
       3. 使用 `setTimeout`，在1.5秒后调用 `setIsPopoverOpen(false)`，自动关闭面板。
     * **如果失败:**
       1. 设置 `setVerificationStatus('error')`。
       2. 将错误信息存入 `setVerificationMessage`。
       3. **面板保持打开**，让用户修改。

#### **第三步：适配后端 API `chat-ollama.js`**

**文件路径:** `pages/api/chat-ollama.js`

1. **修改请求解析:** 从 `form.parse` 的结果中获取 `modelPayload` 字符串并解析它。

   ```javascript
   const modelPayloadString = fields.modelPayload?.[0];
   if (!modelPayloadString) { /* ... 错误处理 ... */ }
   const modelPayload = JSON.parse(modelPayloadString);
   ```
2. **传递给模型工厂:** 将整个 `modelPayload` 对象直接传递给 `createChatModel`。

   ```javascript
   const chatModel = createChatModel(modelPayload);
   ```

#### **第四步：简化模型工厂 `llmFactory.js`**

**文件路径:** `lib/llmFactory.js`

1. **修改函数签名:** `createChatModel` 函数现在只接收一个 `modelPayload` 参数。

   ```javascript
   export function createChatModel(modelPayload) {
     // ...
   }
   ```
2. **更新内部逻辑:** 根据 `modelPayload.provider` 来判断，并直接从 `modelPayload.config` 中获取自定义模型的详细配置。

   ```javascript
   if (modelPayload.provider === 'Custom') {
     const { baseUrl, apiKey, model } = modelPayload.config;
     return new ChatOpenAI({
       apiKey: apiKey,
       modelName: model,
       configuration: { baseURL: baseUrl }
     });
   }
   // ... 其他 provider 的逻辑
   ```

---

请根据以上指令，开始执行代码重构。这将一劳永逸地解决数据同步问题，并为你的应用带来世界一流的交互体验。
