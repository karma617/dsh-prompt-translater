window.__ModuleLoader__.load({
	id: "dsh-prompt-translater",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region \0rolldown/runtime.js
		var __create = Object.create;
		var __defProp = Object.defineProperty;
		var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
		var __getOwnPropNames = Object.getOwnPropertyNames;
		var __getProtoOf = Object.getPrototypeOf;
		var __hasOwnProp = Object.prototype.hasOwnProperty;
		var __copyProps = (to, from, except, desc) => {
			if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
				key = keys[i];
				if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
			return to;
		};
		var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
			value: mod,
			enumerable: true
		}) : target, mod));
		//#endregion
		let react = require("react");
		react = __toESM(react, 1);
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region default-system-prompt.js
		const DEFAULT_SYSTEM_PROMPT = `You are an Expert AI Instruction Translator specialized in converting user instructions into high-precision English prompts for Large Language Models (LLMs).

Your sole responsibility is to transform the user's original instruction from Chinese into a clear, accurate, and model-optimized English instruction.

You are NOT an assistant.
You are NOT a problem solver.
You must NOT execute, answer, analyze, or improve the user's request.
You only perform instruction translation and normalization.

Your output will be directly sent to another AI model as the user's original instruction.
Therefore, preserving the original intent and constraints is your highest priority.

==================================================
Core Translation Principles
==================================================

1. Preserve Intent With Absolute Fidelity

- Maintain 100% of the user's original meaning.
- Never change the user's goal, expected result, constraints, priorities, or requirements.
- Never reinterpret what the user wants.
- Never make assumptions about the user's intention.
- If the original instruction is ambiguous, preserve the ambiguity instead of resolving it yourself.

==================================================
2. No Addition, No Removal, No Modification
==================================================

You MUST NOT:

- Add new requirements.
- Add best practices.
- Add suggestions.
- Add explanations.
- Add technical improvements.
- Add missing details.
- Add examples that were not requested.
- Remove information from the original instruction.
- Simplify away important constraints.

Your job is transformation, not enhancement.

==================================================
3. Optimize For LLM Understanding
==================================================

You may restructure the instruction to improve clarity for an LLM.

Allowed transformations:

- Convert implicit Chinese expressions into explicit English instructions when the meaning is obvious.
- Convert paragraphs into structured requirements.
- Improve sentence clarity.
- Separate goals, requirements, constraints, and expected outputs.

Example:

Original:
"优化一下这个接口，不能影响以前功能"

Acceptable:
"Optimize this API while maintaining backward compatibility with existing functionality."

Not acceptable:
"Redesign the API using REST best practices."

Because the second version adds new requirements.

==================================================
4. Technical Content Preservation Rules
==================================================

For technical instructions:

- Keep all technical terms accurate.
- Preserve programming terminology.
- Preserve framework names.
- Preserve library names.
- Preserve API names.
- Preserve model names.
- Preserve file paths.
- Preserve environment variables.
- Preserve commands.
- Preserve error messages.
- Preserve code identifiers exactly.

Never translate:

- Variable names.
- Function names.
- Class names.
- Package names.
- Repository names.
- URLs.
- File paths.
- CLI commands.
- Configuration keys.

Examples:

Keep unchanged:

Gemini-3.8-flash-medium
SUB2API
DSh
OpenAI API
daily-cloudcode-pa.googleapis.com
package.json
docker-compose.yml

==================================================
5. Coding Agent Compatibility
==================================================

When translating instructions for coding agents:

Preserve:

- Requested file changes.
- Scope limitations.
- Architecture constraints.
- Testing requirements.
- Deployment requirements.
- Compatibility requirements.
- Security requirements.

Do not convert a simple coding request into a larger engineering task.

Example:

Original:
"修复这个bug，不要修改其他文件"

Correct:
"Fix this bug. Do not modify any other files."

Incorrect:
"Refactor the related codebase and improve maintainability."

==================================================
6. Creative / Design Instruction Preservation
==================================================

For image, UI, design, and creative requests:

Preserve:

- Visual style.
- Composition.
- Layout.
- Color requirements.
- Mood.
- Atmosphere.
- Character positioning.
- Size relationships.
- User preferences.

Do not make the design more impressive, artistic, or detailed unless explicitly requested.

Example:

Original:
"做一个末日废土风，但是不要太压抑"

Correct:
"Create a post-apocalyptic wasteland style design, but avoid making it overly depressing."

Incorrect:
"Create an extremely detailed cinematic dark fantasy wasteland environment."

==================================================
7. Preserve User Priority
==================================================

If the user provides multiple requirements:

- Maintain the original priority order.
- Do not reorder requirements in a way that changes importance.
- Keep words such as:
  - must
  - only
  - never
  - avoid
  - required
  - optional

accurately represented.

==================================================
8. Handle Mixed Language Input
==================================================

If the user message already contains English:

- Keep existing English content unchanged when appropriate.
- Only translate Chinese parts.
- Do not translate technical English terms into Chinese.

==================================================
9. Handle Code Blocks And Structured Data
==================================================

For:

- Code blocks
- JSON
- YAML
- XML
- SQL
- Shell commands
- Configuration files

Rules:

- Do not translate the content.
- Preserve formatting exactly.
- Translate only surrounding explanations.

==================================================
10. Output Format Requirements
==================================================

Your output MUST contain ONLY the final English instruction.

Do NOT include:

- Translation notes.
- Explanations.
- Comments.
- Analysis.
- Markdown wrappers.
- "Here is the translation:"
- "Translated prompt:"
- Quotation marks around the result.

The output should be immediately usable as an LLM user message.

==================================================
Quality Check Before Output
==================================================

Before returning the result, silently verify:

[ ] Did I preserve the original intent?
[ ] Did I keep every requirement?
[ ] Did I avoid adding anything?
[ ] Did I preserve technical terms?
[ ] Did I preserve constraints and priorities?
[ ] Is the output a clean English instruction?

If any answer is NO, correct the translation before outputting.

==================================================
Final Rule
==================================================

You are a precision instruction translator, not an assistant.

Faithful translation is always more important than improvement.
Accuracy is always more important than elegance.
Preserving the user's intent is always the highest priority.`;
		//#endregion
		//#region client/ConfigForm.tsx
		const SETTINGS_ENDPOINT = "/plugins/dsh-prompt-translater/settings";
		function TranslatorConfigCard(props) {
			if (props?.view === "summary") return "使用配置的模型与 API 接口将新提交的对话指令翻译为英文。";
			const [config, setConfig] = (0, react.useState)({
				enabled: false,
				apiUrl: "",
				apiKey: "",
				modelId: "",
				timeoutMs: 6e4,
				maxOutputTokens: 8192,
				temperature: .3,
				systemPrompt: DEFAULT_SYSTEM_PROMPT
			});
			const [loading, setLoading] = (0, react.useState)(true);
			const [saving, setSaving] = (0, react.useState)(false);
			const [statusMsg, setStatusMsg] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				let canceled = false;
				async function load() {
					try {
						const res = await fetch(SETTINGS_ENDPOINT);
						if (res.ok) {
							const data = await res.json();
							if (!canceled && data?.config) setConfig((prev) => ({
								...prev,
								...data.config,
								systemPrompt: data.config.systemPrompt || DEFAULT_SYSTEM_PROMPT
							}));
						}
					} catch (err) {
						console.warn("Failed to load prompt translator config", err);
					} finally {
						if (!canceled) setLoading(false);
					}
				}
				load();
				return () => {
					canceled = true;
				};
			}, []);
			async function handleSave() {
				setSaving(true);
				setStatusMsg(null);
				try {
					const res = await fetch(SETTINGS_ENDPOINT, {
						method: "PUT",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({ config })
					});
					if (res.ok) setStatusMsg({
						type: "success",
						text: "配置已成功保存！"
					});
					else {
						const err = await res.json().catch(() => ({}));
						setStatusMsg({
							type: "error",
							text: err.error || "保存失败"
						});
					}
				} catch (err) {
					setStatusMsg({
						type: "error",
						text: err.message || "网络请求错误"
					});
				} finally {
					setSaving(false);
				}
			}
			function handleResetPrompt() {
				setConfig((prev) => ({
					...prev,
					systemPrompt: DEFAULT_SYSTEM_PROMPT
				}));
			}
			if (loading) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style: { padding: 16 },
				children: "正在加载配置…"
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "trans_card",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "trans_switch_row",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: {
								fontWeight: 600,
								fontSize: 14
							},
							children: "启用指令翻译"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "trans_hint",
							children: "开启后，提交的新对话指令若包含中文将被自动翻译为高质量英文指令"
						})] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
							style: {
								display: "inline-flex",
								alignItems: "center",
								cursor: "pointer"
							},
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: config.enabled,
								onChange: (e) => setConfig((prev) => ({
									...prev,
									enabled: e.target.checked
								})),
								style: {
									width: 18,
									height: 18,
									cursor: "pointer"
								}
							})
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "trans_grid",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "trans_field",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
										className: "trans_label",
										children: "API URL (接口地址) *"
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "text",
										className: "trans_input",
										placeholder: "例如: https://api.openai.com/v1",
										value: config.apiUrl,
										onChange: (e) => setConfig((prev) => ({
											...prev,
											apiUrl: e.target.value
										}))
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "trans_hint",
										children: "OpenAI 兼容格式端点，会自动请求 /chat/completions"
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "trans_field",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
										className: "trans_label",
										children: "API Key (密钥) *"
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "password",
										className: "trans_input",
										placeholder: "sk-...",
										value: config.apiKey,
										onChange: (e) => setConfig((prev) => ({
											...prev,
											apiKey: e.target.value
										}))
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "trans_hint",
										children: "服务调用鉴权 Token（保存在配置中）"
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "trans_field",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
										className: "trans_label",
										children: "Model ID (模型名称) *"
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "text",
										className: "trans_input",
										placeholder: "例如: gpt-4o-mini 或 deepseek-chat",
										value: config.modelId,
										onChange: (e) => setConfig((prev) => ({
											...prev,
											modelId: e.target.value
										}))
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "trans_hint",
										children: "用于执行翻译请求的模型 ID"
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "trans_field",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
										className: "trans_label",
										children: "超时时间 (毫秒)"
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "number",
										className: "trans_input",
										min: 1e3,
										max: 3e5,
										step: 1e3,
										value: config.timeoutMs,
										onChange: (e) => setConfig((prev) => ({
											...prev,
											timeoutMs: parseInt(e.target.value, 10) || 6e4
										}))
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "trans_hint",
										children: "单次翻译超时限制，默认 60000ms"
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "trans_field",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
										className: "trans_label",
										children: "最大输出 Token"
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "number",
										className: "trans_input",
										min: 1,
										max: 65536,
										value: config.maxOutputTokens,
										onChange: (e) => setConfig((prev) => ({
											...prev,
											maxOutputTokens: parseInt(e.target.value, 10) || 8192
										}))
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "trans_hint",
										children: "模型生成的最大 token 数，默认 8192"
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "trans_field",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										className: "trans_label",
										children: [
											"Temperature (温度: ",
											config.temperature,
											")"
										]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "range",
										min: 0,
										max: 1,
										step: .05,
										value: config.temperature,
										onChange: (e) => setConfig((prev) => ({
											...prev,
											temperature: parseFloat(e.target.value)
										}))
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "trans_hint",
										children: "翻译通常建议较低温度 (0.1 ~ 0.3) 以保证准确性"
									})
								]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "trans_field",
						style: { marginTop: 12 },
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "trans_label",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "系统提示词 (System Prompt)" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "trans_btn",
									style: {
										padding: "2px 8px",
										fontSize: 12
									},
									onClick: handleResetPrompt,
									children: "恢复默认提示词"
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
								className: "trans_textarea",
								value: config.systemPrompt,
								onChange: (e) => setConfig((prev) => ({
									...prev,
									systemPrompt: e.target.value
								}))
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "trans_hint",
								children: "指导模型如何进行高质量专业指令翻译与规范化"
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "trans_actions",
						children: [statusMsg && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: `trans_msg trans_msg_${statusMsg.type}`,
							children: statusMsg.text
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "trans_btn trans_btn_primary",
							disabled: saving,
							onClick: handleSave,
							children: saving ? "保存中…" : "保存配置"
						})]
					})
				]
			});
		}
		//#endregion
		//#region client/index.ts
		const BUNDLE_NAME = "dsh-prompt-translater";
		const ROW_ID = "prompt-translater";
		const inject = ["slots", "locale"];
		function apply(ctx) {
			if (typeof document !== "undefined") {
				const styleId = "dsh-prompt-translater-styles";
				if (!document.getElementById(styleId)) {
					const style = document.createElement("style");
					style.id = styleId;
					style.textContent = `
.trans_card {
  padding: 16px;
  background: var(--dsw-alias-bg-secondary, rgba(255, 255, 255, 0.04));
  border: 1px solid var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.1));
  border-radius: 8px;
  margin-bottom: 20px;
}
.trans_grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}
.trans_field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.trans_label {
  font-size: 13px;
  font-weight: 500;
  color: var(--dsw-alias-label-primary, inherit);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.trans_hint {
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary, #888);
}
.trans_input, .trans_textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  font-size: 13px;
  background: var(--dsw-alias-bg-tertiary, rgba(0, 0, 0, 0.2));
  border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.15));
  border-radius: 6px;
  color: inherit;
  outline: none;
  font-family: inherit;
}
.trans_textarea {
  min-height: 140px;
  resize: vertical;
  line-height: 1.4;
  font-family: monospace;
}
.trans_input:focus, .trans_textarea:focus {
  border-color: var(--dsw-alias-accent, #3b82f6);
}
.trans_switch_row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 14px;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.08));
}
.trans_actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  margin-top: 18px;
}
.trans_btn {
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.2));
  background: var(--dsw-alias-bg-elevated, rgba(255, 255, 255, 0.1));
  color: inherit;
}
.trans_btn_primary {
  background: var(--dsw-alias-accent, #2563eb);
  border-color: var(--dsw-alias-accent, #2563eb);
  color: #fff;
}
.trans_btn_primary:hover {
  filter: brightness(1.1);
}
.trans_btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.trans_msg {
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 4px;
}
.trans_msg_success {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}
.trans_msg_error {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}
      `;
					document.head.appendChild(style);
				}
			}
			ctx.slots.inject("settings.section", () => {
				return ctx.slots.register({
					name: "settings.section",
					id: "prompt-translater",
					order: 25,
					label: () => "指令翻译"
				}, TranslatorConfigCard);
			});
			ctx.slots.inject("plugins.item", () => {
				return ctx.slots.register({
					name: "plugins.item",
					id: "prompt-translater",
					order: 15,
					label: () => "英文指令翻译"
				}, TranslatorConfigCard);
			});
			const rowKey1 = `${BUNDLE_NAME}#${ROW_ID}`;
			const rowKey2 = `@local/dsh-prompt-translater#${ROW_ID}`;
			ctx.slots.inject("plugins.row.config", () => {
				ctx.slots.register({
					name: "plugins.row.config",
					key: rowKey1,
					order: 10
				}, TranslatorConfigCard);
				return ctx.slots.register({
					name: "plugins.row.config",
					key: rowKey2,
					order: 10
				}, TranslatorConfigCard);
			});
			ctx.slots.inject("plugins.bundle.config", () => {
				ctx.slots.register({
					name: "plugins.bundle.config",
					key: BUNDLE_NAME,
					order: 10
				}, TranslatorConfigCard);
				return ctx.slots.register({
					name: "plugins.bundle.config",
					key: "@local/dsh-prompt-translater",
					order: 10
				}, TranslatorConfigCard);
			});
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map