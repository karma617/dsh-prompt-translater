import React, { useEffect, useState } from 'react';
import { DEFAULT_SYSTEM_PROMPT } from '../default-system-prompt.js';

interface ConfigData {
  enabled: boolean;
  apiUrl: string;
  apiKey: string;
  modelId: string;
  timeoutMs: number;
  maxOutputTokens: number;
  temperature: number;
  systemPrompt: string;
}

const SETTINGS_ENDPOINT = '/plugins/dsh-prompt-translater/settings';

export function TranslatorConfigCard(props: { view?: string }) {
  if (props?.view === 'summary') {
    return '使用配置的模型与 API 接口将新提交的对话指令翻译为英文。';
  }

  const [config, setConfig] = useState<ConfigData>({
    enabled: false,
    apiUrl: '',
    apiKey: '',
    modelId: '',
    timeoutMs: 60000,
    maxOutputTokens: 8192,
    temperature: 0.3,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let canceled = false;
    async function load() {
      try {
        const res = await fetch(SETTINGS_ENDPOINT);
        if (res.ok) {
          const data = await res.json();
          if (!canceled && data?.config) {
            setConfig(prev => ({
              ...prev,
              ...data.config,
              systemPrompt: data.config.systemPrompt || DEFAULT_SYSTEM_PROMPT,
            }));
          }
        }
      } catch (err) {
        console.warn('Failed to load prompt translator config', err);
      } finally {
        if (!canceled) setLoading(false);
      }
    }
    load();
    return () => { canceled = true; };
  }, []);

  async function handleSave() {
    setSaving(true);
    setStatusMsg(null);
    try {
      const res = await fetch(SETTINGS_ENDPOINT, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      if (res.ok) {
        setStatusMsg({ type: 'success', text: '配置已成功保存！' });
      } else {
        const err = await res.json().catch(() => ({}));
        setStatusMsg({ type: 'error', text: err.error || '保存失败' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || '网络请求错误' });
    } finally {
      setSaving(false);
    }
  }

  function handleResetPrompt() {
    setConfig(prev => ({ ...prev, systemPrompt: DEFAULT_SYSTEM_PROMPT }));
  }

  if (loading) {
    return <div style={{ padding: 16 }}>正在加载配置…</div>;
  }

  return (
    <div className="trans_card">
      <div className="trans_switch_row">
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>启用指令翻译</div>
          <div className="trans_hint">开启后，提交的新对话指令若包含中文将被自动翻译为高质量英文指令</div>
        </div>
        <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={e => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
            style={{ width: 18, height: 18, cursor: 'pointer' }}
          />
        </label>
      </div>

      <div className="trans_grid">
        <div className="trans_field">
          <label className="trans_label">
            API URL (接口地址) *
          </label>
          <input
            type="text"
            className="trans_input"
            placeholder="例如: https://api.openai.com/v1"
            value={config.apiUrl}
            onChange={e => setConfig(prev => ({ ...prev, apiUrl: e.target.value }))}
          />
          <span className="trans_hint">OpenAI 兼容格式端点，会自动请求 /chat/completions</span>
        </div>

        <div className="trans_field">
          <label className="trans_label">
            API Key (密钥) *
          </label>
          <input
            type="password"
            className="trans_input"
            placeholder="sk-..."
            value={config.apiKey}
            onChange={e => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
          />
          <span className="trans_hint">服务调用鉴权 Token（保存在配置中）</span>
        </div>

        <div className="trans_field">
          <label className="trans_label">
            Model ID (模型名称) *
          </label>
          <input
            type="text"
            className="trans_input"
            placeholder="例如: gpt-4o-mini 或 deepseek-chat"
            value={config.modelId}
            onChange={e => setConfig(prev => ({ ...prev, modelId: e.target.value }))}
          />
          <span className="trans_hint">用于执行翻译请求的模型 ID</span>
        </div>

        <div className="trans_field">
          <label className="trans_label">
            超时时间 (毫秒)
          </label>
          <input
            type="number"
            className="trans_input"
            min={1000}
            max={300000}
            step={1000}
            value={config.timeoutMs}
            onChange={e => setConfig(prev => ({ ...prev, timeoutMs: parseInt(e.target.value, 10) || 60000 }))}
          />
          <span className="trans_hint">单次翻译超时限制，默认 60000ms</span>
        </div>

        <div className="trans_field">
          <label className="trans_label">
            最大输出 Token
          </label>
          <input
            type="number"
            className="trans_input"
            min={1}
            max={65536}
            value={config.maxOutputTokens}
            onChange={e => setConfig(prev => ({ ...prev, maxOutputTokens: parseInt(e.target.value, 10) || 8192 }))}
          />
          <span className="trans_hint">模型生成的最大 token 数，默认 8192</span>
        </div>

        <div className="trans_field">
          <label className="trans_label">
            Temperature (温度: {config.temperature})
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={config.temperature}
            onChange={e => setConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
          />
          <span className="trans_hint">翻译通常建议较低温度 (0.1 ~ 0.3) 以保证准确性</span>
        </div>
      </div>

      <div className="trans_field" style={{ marginTop: 12 }}>
        <div className="trans_label">
          <span>系统提示词 (System Prompt)</span>
          <button
            type="button"
            className="trans_btn"
            style={{ padding: '2px 8px', fontSize: 12 }}
            onClick={handleResetPrompt}
          >
            恢复默认提示词
          </button>
        </div>
        <textarea
          className="trans_textarea"
          value={config.systemPrompt}
          onChange={e => setConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
        />
        <span className="trans_hint">指导模型如何进行高质量专业指令翻译与规范化</span>
      </div>

      <div className="trans_actions">
        {statusMsg && (
          <div className={`trans_msg trans_msg_${statusMsg.type}`}>
            {statusMsg.text}
          </div>
        )}
        <button
          type="button"
          className="trans_btn trans_btn_primary"
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? '保存中…' : '保存配置'}
        </button>
      </div>
    </div>
  );
}
