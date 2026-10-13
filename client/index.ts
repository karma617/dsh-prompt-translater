import React from 'react';
import { TranslatorConfigCard } from './ConfigForm.tsx';

const NS = 'settings.promptTranslater';
const BUNDLE_NAME = 'dsh-prompt-translater';
const ROW_ID = 'prompt-translater';

interface ClientContext {
  effect?(callback: () => unknown, label?: string): unknown;
  locale?: {
    register?(namespace: string, locales: Record<string, Record<string, string>>): unknown;
    bind?(namespace: string): (key: string) => string;
  };
  slots: {
    inject(name: string, factory: () => unknown): unknown;
    register(options: {
      name: string;
      id?: string;
      key?: string;
      order?: number;
      label?: () => string;
    }, component: React.ComponentType<any>): unknown;
  };
}

export const inject = ['slots', 'locale'];

export function apply(ctx: ClientContext) {
  // Inject style tag into document if not present
  if (typeof document !== 'undefined') {
    const styleId = 'dsh-prompt-translater-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
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

  // 1. settings.section: 注册到设置侧边栏菜单（如“通用”、“模型”、“Agent编排”等下方）
  ctx.slots.inject('settings.section', () => {
    return ctx.slots.register({
      name: 'settings.section',
      id: 'prompt-translater',
      order: 25,
      label: () => '指令翻译',
    }, TranslatorConfigCard);
  });

  // 2. plugins.item: 在插件页以卡片形式展示，点击可打开独立页面
  ctx.slots.inject('plugins.item', () => {
    return ctx.slots.register({
      name: 'plugins.item',
      id: 'prompt-translater',
      order: 15,
      label: () => '英文指令翻译',
    }, TranslatorConfigCard);
  });

  // 3. plugins.row.config: 为包含的组件行注册配置
  const rowKey1 = `${BUNDLE_NAME}#${ROW_ID}`;
  const rowKey2 = `@local/dsh-prompt-translater#${ROW_ID}`;
  ctx.slots.inject('plugins.row.config', () => {
    ctx.slots.register({
      name: 'plugins.row.config',
      key: rowKey1,
      order: 10,
    }, TranslatorConfigCard);
    return ctx.slots.register({
      name: 'plugins.row.config',
      key: rowKey2,
      order: 10,
    }, TranslatorConfigCard);
  });

  // 4. plugins.bundle.config: 在插件详情页展示配置
  ctx.slots.inject('plugins.bundle.config', () => {
    ctx.slots.register({
      name: 'plugins.bundle.config',
      key: BUNDLE_NAME,
      order: 10,
    }, TranslatorConfigCard);
    return ctx.slots.register({
      name: 'plugins.bundle.config',
      key: '@local/dsh-prompt-translater',
      order: 10,
    }, TranslatorConfigCard);
  });
}
