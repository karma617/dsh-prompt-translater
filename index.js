import z from '@deepseek-ai/schemastery';
import { createPromptTranslator } from './translation.js';
import { DEFAULT_SYSTEM_PROMPT } from './default-system-prompt.js';

export const name = 'prompt-translater';
export const inject = ['llm', 'settings', 'webServer'];
export const TRANSLATOR_SETTINGS_NAMESPACE = 'prompt-translater';
export const TRANSLATOR_SETTINGS_ENDPOINT = '/plugins/dsh-prompt-translater/settings';

export const Config = z.object({
  enabled: z.boolean().default(false),
  apiUrl: z.string().default(''),
  apiKey: z.string().default(''),
  modelId: z.string().default(''),
  provider: z.string().default(''),
  model: z.string().default(''),
  timeoutMs: z.number().step(1).min(1).max(300000).default(60000),
  maxOutputTokens: z.number().step(1).min(1).max(65536).default(8192),
  temperature: z.number().min(0).max(2).step(0.1).default(0.3),
  systemPrompt: z.string().role('textarea').default(DEFAULT_SYSTEM_PROMPT),
});

function sendJson(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
  });
  res.end(body);
}

async function readJson(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (Buffer.byteLength(body) > 128 * 1024) throw new Error('request body exceeds 128 KiB');
  }
  return JSON.parse(body);
}

function sameOrigin(req) {
  const origin = req.headers.origin;
  return origin === undefined || origin === 'http://' + req.headers.host || origin === 'https://' + req.headers.host;
}

export function apply(ctx, config) {
  // If settings service exists, support dynamic runtime settings
  let currentConfig = { ...config };

  if (ctx.settings) {
    ctx.effect(() => ctx.settings.configure({ auto: false }, ctx.fiber));
  }

  // Register settings HTTP API if webServer is present
  if (ctx.webServer) {
    ctx.effect(() => ctx.webServer.register({
      kind: 'exact',
      path: TRANSLATOR_SETTINGS_ENDPOINT,
      async handler(req, res) {
        try {
          if (!sameOrigin(req)) return sendJson(res, 403, { error: 'cross-origin request rejected' });
          if (req.method === 'GET' || req.method === 'HEAD') {
            return sendJson(res, 200, req.method === 'HEAD' ? {} : { config: currentConfig });
          }
          if (req.method !== 'PUT') return sendJson(res, 405, { error: 'method not allowed' });
          if (!String(req.headers['content-type'] ?? '').toLowerCase().startsWith('application/json')) {
            return sendJson(res, 415, { error: 'content-type must be application/json' });
          }
          const body = await readJson(req);
          if (body === null || typeof body !== 'object' || typeof body.config !== 'object') {
            return sendJson(res, 400, { error: 'request must contain config object' });
          }
          const incoming = body.config;
          currentConfig = {
            ...currentConfig,
            enabled: Boolean(incoming.enabled),
            apiUrl: typeof incoming.apiUrl === 'string' ? incoming.apiUrl.trim() : currentConfig.apiUrl,
            apiKey: typeof incoming.apiKey === 'string' ? incoming.apiKey.trim() : currentConfig.apiKey,
            modelId: typeof incoming.modelId === 'string' ? incoming.modelId.trim() : currentConfig.modelId,
            timeoutMs: Number.isSafeInteger(incoming.timeoutMs) ? incoming.timeoutMs : currentConfig.timeoutMs,
            maxOutputTokens: Number.isSafeInteger(incoming.maxOutputTokens) ? incoming.maxOutputTokens : currentConfig.maxOutputTokens,
            temperature: typeof incoming.temperature === 'number' ? incoming.temperature : currentConfig.temperature,
            systemPrompt: typeof incoming.systemPrompt === 'string' ? incoming.systemPrompt : currentConfig.systemPrompt,
          };
          if (ctx.settings) {
            await ctx.settings.replace(TRANSLATOR_SETTINGS_NAMESPACE, currentConfig);
          }
          return sendJson(res, 200, { config: currentConfig });
        } catch (error) {
          return sendJson(res, 400, { error: error instanceof Error ? error.message : String(error) });
        }
      },
    }));
  }

  const controller = new AbortController();
  const translator = createPromptTranslator(ctx.llm, () => currentConfig, controller.signal);
  ctx.effect(() => () => controller.abort(new Error('Prompt translator unloaded.')));

  ctx.on('agent/pre-step', async (payload, next) => {
    const decision = await next();
    if (decision.kind !== 'enter' || !currentConfig.enabled) return decision;
    const proposed = new Set(payload.messages.map(message => message.id));
    const messages = [];
    for (const message of decision.messages) {
      messages.push(proposed.has(message.id)
        ? await translator.translate(payload.agent, message, payload.signal)
        : message);
    }
    return { ...decision, messages };
  });
}
