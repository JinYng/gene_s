
# TODO: 将 Python 后端升级为 LangChain Agent 架构

**目标：** 将我们当前基于规则和子进程调用的 Python 分析服务，重构为一个由 LangChain Agent 驱动的、能够理解用户意图并智能调用工具的现代化智能系统。

---

### 📋 任务分解 (按顺序执行)

#### ✅ **阶段一：创建并封装 LangChain 工具**

- [ ] **创建新文件**: 在 `chat_scripts/` 目录下创建一个新文件 `tools.py`。
- [ ] **导入依赖**: 导入 `langchain.tools.tool` 装饰器和 `OptimizedSingleCellProcessor` 类。
- [ ] **封装 `umap_analysis` 工具**:
  - 创建一个名为 `umap_analysis` 的 Python 函数。
  - 使用 `@tool` 装饰器进行标记。
  - 为函数添加详细的文档字符串 (docstring)，清晰地描述其功能、参数（`file_path`, `color_by`）和用途。这是 Agent 理解工具的关键。
  - 函数内部应直接调用 `OptimizedSingleCellProcessor` 实例的 `process_h5ad` 方法，**而不是**通过 `subprocess`。
- [ ] **封装 `summarize_h5ad_data` 工具** (可选，但推荐):
  - 创建另一个名为 `summarize_h5ad_data` 的工具。
  - 同样添加 `@tool` 装饰器和详细的文档字符串，描述其用于获取文件摘要的功能。
  - 函数内部调用处理器的一个新方法，例如 `get_summary()` (如果该方法不存在，请先在 `single_cell_processor.py` 中实现它)。
- [ ] **导出工具列表**: 在 `tools.py` 文件末尾，创建一个名为 `available_tools` 的列表，并将所有创建的工具函数放入其中。

---

#### ✅ **阶段二：构建 LangChain Agent 和 Executor**

- [ ] **重构 `chat_scripts/agent_executor.py`**: 打开并清空此文件，我们将用全新的 Agent 逻辑替换它。
- [ ] **导入依赖**: 导入 `ChatOllama`, `AgentExecutor`, `create_tool_calling_agent`, `ChatPromptTemplate` 以及我们刚刚创建的 `available_tools` 列表。
- [ ] **初始化 LLM**: 创建一个 `ChatOllama` 的实例。
- [ ] **创建提示模板 (Prompt Template)**:
  - 构建一个 `ChatPromptTemplate`。
  - 包含一个 `system` 消息，设定 Agent 的角色（例如，“你是一个强大的单细胞数据分析助手”）。
  - 包含一个 `user` 消息，其内容为 `{input}`。
  - 包含一个必须的 `placeholder`，其内容为 `{agent_scratchpad}`。
- [ ] **创建 Agent**: 调用 `create_tool_calling_agent()`，将 LLM、工具列表和提示模板绑定在一起。
- [ ] **创建 Agent Executor**: 调用 `AgentExecutor()`，将创建的 `agent` 和 `tools` 传入，并设置 `verbose=True` 以便调试。
- [ ] **创建主调用函数**:
  - 创建一个名为 `run_analysis(query: str, file_path: str)` 的函数。
  - 在此函数内部，将用户的 `query` 和 `file_path` 组合成一个更丰富的、上下文完整的提示，并将其作为 `input` 调用 `agent_executor.invoke()`。
  - 返回 Executor 的最终输出 (`result.get("output")`)。
- [ ] **保留命令行接口**: 确保 `if __name__ == "__main__":` 逻辑被保留并更新，以便我们仍然可以从命令行独立测试此脚本。

---

#### ✅ **阶段三：简化上层服务**

- [ ] **重构 FastAPI 服务器 (`chat_scripts/main.py`)**:
  - 移除所有 `subprocess` 相关的代码。
  - 直接从 `.agent_executor` 导入 `run_analysis` 函数。
  - 在 `/analyze` 端点的实现中，直接调用 `run_analysis()`，并将请求中的 `query` 和 `file_path` 作为参数传入。
  - 调整响应格式，以正确地处理 `run_analysis()` 返回的数据。
- [ ] **重构 Next.js API 路由 (`pages/api/chat-ollama.js`)**:
  - 找到 `if (useWorkflow)` 的逻辑块。
  - **移除**所有基于关键词（如 `message.includes("分析")`）的判断逻辑。
  - 现在，只要 `useWorkflow` 为 `true`，就应该无条件地将用户的 `message` 和 `mainFilePath` **原封不动地**转发给 Python Agent 服务器。决策的工作将完全交给 Agent。

---

#### ✅ **阶段四：测试与验证**

- [ ] **单元测试**: 运行 `agent_executor.py` 脚本，测试不同的自然语言指令（例如 "给我画个umap图", "这个文件里有多少细胞？"），确保它能正确地调用相应的工具。
- [ ] **集成测试**: 从前端 UI 发起一个完整的带文件分析请求，追踪日志，确保请求能够正确地通过 Next.js -> FastAPI -> Agent -> Tool，并返回预期的可视化数据。
- [ ] **代码审查**: 确认所有旧的、不再需要的代码（如 `subprocess` 调用、Next.js 中的关键词匹配逻辑）已被完全移除。
