import React from 'react';
import { TranslatorConfigCard } from './ConfigForm.tsx';

const NS = 'plugins.bundle.config';
const BUNDLE_KEY = '@local/dsh-prompt-translater';

interface ClientContext {
  slots: {
    inject(name: string, factory: () => unknown): unknown;
    register(options: {
      name: string;
      key: string;
      order?: number;
    }, component: React.ComponentType<any>): unknown;
  };
}

export const inject = ['slots'];

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

  // Register into plugins.bundle.config with entryKey = BUNDLE_KEY
  ctx.slots.inject('plugins.bundle.config', () => {
    return ctx.slots.register({
      name: 'plugins.bundle.config',
      key: BUNDLE_KEY,
      order: 10,
    }, TranslatorConfigCard);
  });
}
