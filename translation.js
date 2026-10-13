import { DEFAULT_SYSTEM_PROMPT } from './default-system-prompt.js';

const ASCII = /^[\x00-\x7F]*$/u;

export function isComposerMessage(message) {
  return message.role === 'user' && message.source?.kind === 'user'
    && typeof message.source.rpcId === 'string' && message.source.rpcId.trim().length > 0;
}

function failure(code, message) {
  return Object.assign(new Error(`Prompt translation blocked: ${message}`), { code });
}

function resolveConfig(config) {
  return typeof config === 'function' ? config() : config;
}

async function translateViaOpenAIHttp(text, cfg, signal) {
  signal.throwIfAborted();
  let endpoint = cfg.apiUrl.trim().replace(/\/+$/u, '');
  if (!endpoint.endsWith('/chat/completions')) {
    endpoint += '/chat/completions';
  }

  const systemPrompt = typeof cfg.systemPrompt === 'string' && cfg.systemPrompt.trim().length > 0
    ? cfg.systemPrompt
    : DEFAULT_SYSTEM_PROMPT;

  const body = JSON.stringify({
    model: cfg.modelId.trim(),
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text },
    ],
    temperature: typeof cfg.temperature === 'number' ? cfg.temperature : 0.3,
    max_tokens: cfg.maxOutputTokens || 8192,
  });

  const headers = {
    'content-type': 'application/json',
  };
  if (cfg.apiKey && cfg.apiKey.trim()) {
    headers['authorization'] = `Bearer ${cfg.apiKey.trim()}`;
  }

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body,
      signal,
    });
  } catch (error) {
    if (signal.aborted) throw error;
    throw failure('TRANSLATION_NETWORK', `failed to contact OpenAI API: ${error.message}`);
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw failure('TRANSLATION_HTTP', `API returned HTTP ${response.status}: ${errorText.slice(0, 200)}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  const result = choice?.message?.content ?? '';
  if (!result.trim()) throw failure('TRANSLATION_EMPTY', 'model returned empty text.');
  if (!ASCII.test(result)) throw failure('TRANSLATION_NON_ASCII', 'model returned non-ASCII characters.');
  return result;
}

async function translateViaDshLlm(llm, text, cfg, signal) {
  signal.throwIfAborted();
  const completed = new Map();
  const deltas = new Map();
  let finish;
  const systemPrompt = typeof cfg.systemPrompt === 'string' && cfg.systemPrompt.trim().length > 0
    ? cfg.systemPrompt
    : DEFAULT_SYSTEM_PROMPT;
  const request = {
    provider: cfg.provider,
    model: cfg.model,
    system: systemPrompt,
    messages: [{ role: 'user', content: [{ type: 'text', text }] }],
    tools: [],
    maxTokens: cfg.maxOutputTokens,
    signal,
  };
  for await (const chunk of llm.stream(request)) {
    signal.throwIfAborted();
    if (finish) throw failure('TRANSLATION_PROTOCOL', 'data after terminal finish.');
    if (chunk.type === 'text-delta') {
      deltas.set(chunk.index, (deltas.get(chunk.index) ?? '') + chunk.text);
    } else if (chunk.type === 'tool-call-delta'
      || (chunk.type === 'block-start' && chunk.blockType === 'tool-call')) {
      throw failure('TRANSLATION_TOOL_CALL', 'translation model attempted a tool call.');
    } else if (chunk.type === 'block-end') {
      if (chunk.block.type === 'text') completed.set(chunk.index, chunk.block.text);
      else if (chunk.block.type !== 'reasoning') throw failure('TRANSLATION_CONTENT', 'unexpected output block.');
    } else if (chunk.type === 'finish') {
      finish = chunk.reason;
    }
  }
  signal.throwIfAborted();
  if (finish?.kind !== 'stop') {
    throw failure('TRANSLATION_INCOMPLETE', `model did not finish normally (${finish?.kind ?? 'missing finish'}).`);
  }
  const indexes = [...new Set([...completed.keys(), ...deltas.keys()])].sort((a, b) => a - b);
  const result = indexes.map(index => completed.get(index) ?? deltas.get(index)).join('');
  if (!result.trim()) throw failure('TRANSLATION_EMPTY', 'model returned empty text.');
  if (!ASCII.test(result)) throw failure('TRANSLATION_NON_ASCII', 'model returned non-ASCII characters.');
  return result;
}

async function translateText(llm, text, cfg, signal) {
  if (cfg.apiUrl && cfg.apiUrl.trim() && cfg.modelId && cfg.modelId.trim()) {
    return translateViaOpenAIHttp(text, cfg, signal);
  }
  return translateViaDshLlm(llm, text, cfg, signal);
}

export function createPromptTranslator(llm, configOrAccessor, disposalSignal) {
  const getCfg = () => resolveConfig(configOrAccessor);
  const initial = getCfg();
  if (initial.enabled) {
    const hasHttp = initial.apiUrl?.trim() && initial.modelId?.trim();
    const hasDsh = initial.provider?.trim() && initial.model?.trim();
    if (!hasHttp && !hasDsh) {
      throw failure('TRANSLATION_CONFIG', 'configure either (apiUrl and modelId) or (provider and model) before enabling.');
    }
  }

  const agents = new WeakMap();
  return {
    async translate(agent, message, callerSignal) {
      const cfg = getCfg();
      if (!cfg.enabled || !isComposerMessage(message)) return message;
      callerSignal.throwIfAborted();
      const textBlocks = message.content.filter(block => block.type === 'text');
      if (!textBlocks.some(block => !ASCII.test(block.text))) return message;
      if (textBlocks.length !== 1) {
        throw failure('TRANSLATION_CONTENT', 'expected one composer text block; multiple text blocks are not reordered.');
      }
      let cache = agents.get(agent);
      if (!cache) agents.set(agent, cache = new Map());
      let pending = cache.get(message.id);
      if (!pending) {
        pending = (async () => {
          const timeout = cfg.timeoutMs || 60000;
          const signal = AbortSignal.any([callerSignal, disposalSignal, AbortSignal.timeout(timeout)]);
          const translated = await translateText(llm, textBlocks[0].text, cfg, signal);
          const content = message.content.map(block => block.type === 'text'
            ? { ...block, text: translated } : block);
          return { ...message, content };
        })();
        cache.set(message.id, pending);
      }
      const result = await pending;
      callerSignal.throwIfAborted();
      return result;
    },
  };
}
