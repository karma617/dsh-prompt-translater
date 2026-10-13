import test from 'node:test';
import assert from 'node:assert/strict';
import { createPromptTranslator, isComposerMessage } from '../translation.js';
const config = { enabled: true, provider: 'translation-route', model: 'translator', timeoutMs: 1000, maxOutputTokens: 100 };
const signal = () => new AbortController().signal;
const message = (text = '实现功能。', source = { kind: 'user', rpcId: 'rpc-1' }) => ({ id: 'm1', role: 'user', source, content: [{ type: 'text', text }] });
function fixture(chunks) {
  const calls = [];
  const llm = { async *stream(options) { calls.push(options); yield* chunks; } };
  const translator = createPromptTranslator(llm, config, signal());
  return { calls, translator };
}
const output = text => [{ type: 'text-delta', index: 0, text }, { type: 'block-end', index: 0, block: { type: 'text', text } }, { type: 'finish', reason: { kind: 'stop' } }];

test('one call, ASCII English, immutable source, isolated request, concurrent deduplication', async () => {
  const { calls, translator } = fixture(output('Implement the feature.'));
  const original = message();
  Object.freeze(original.content[0]); Object.freeze(original.content); Object.freeze(original);
  const agent = {};
  const [first, second] = await Promise.all([translator.translate(agent, original, signal()), translator.translate(agent, original, signal())]);
  assert.equal(calls.length, 1);
  assert.equal(first, second);
  assert.equal(first.id, original.id);
  assert.equal(first.source, original.source);
  assert.equal(first.content[0].text, 'Implement the feature.');
  assert.equal(original.content[0].text, '实现功能。');
  assert.equal(calls[0].messages.length, 1);
  assert.equal(calls[0].messages[0].content[0].text, '实现功能。');
  assert.deepEqual(calls[0].tools, []);
  assert.equal(calls[0].sessionId, undefined);
  assert.equal(calls[0].provider, config.provider);
  await translator.translate(agent, original, signal());
  assert.equal(calls.length, 1);
});

test('all non-composer producers and non-user roles bypass even with Chinese', async () => {
  const { calls, translator } = fixture(output('English'));
  for (const kind of ['goal', 'schedule', 'agent-message', 'subagent-settled', 'runtime-context', 'tool', 'model', 'system-prompt', 'unknown']) {
    const original = message('中文', { kind, rpcId: 'rpc' });
    assert.equal(await translator.translate({}, original, signal()), original);
  }
  for (const source of [{ kind: 'user' }, { kind: 'user', rpcId: '' }, { kind: 'user', rpcId: 1 }]) {
    assert.equal(isComposerMessage(message('中文', source)), false);
  }
  assert.equal(isComposerMessage({ ...message(), role: 'assistant' }), false);
  assert.equal(calls.length, 0);
});

test('ASCII input, attachment-only and disabled plugin do not call model', async () => {
  const { calls, translator } = fixture(output('English'));
  const english = message('Use ./src/index.js!');
  assert.equal(await translator.translate({}, english, signal()), english);
  const attachment = { ...message(), content: [{ type: 'file', attachment: { name: '中文.txt' } }] };
  assert.equal(await translator.translate({}, attachment, signal()), attachment);
  const disabled = createPromptTranslator({ stream() { throw new Error('must not call'); } }, { ...config, enabled: false }, signal());
  const original = message();
  assert.equal(await disabled.translate({}, original, signal()), original);
  assert.equal(calls.length, 0);
});

test('preserves attachments and text positions; refuses multi-text RPC input without reordering', async () => {
  const { calls, translator } = fixture(output('First.'));
  const file = { type: 'file', attachment: { name: 'data.txt' } };
  const original = { ...message(), content: [file, { type: 'text', text: '第一' }] };
  const result = await translator.translate({}, original, signal());
  assert.deepEqual(result.content, [file, { type: 'text', text: 'First.' }]);
  assert.equal(result.content[0], file);
  assert.equal(calls.length, 1);
  const multi = { ...message(), content: [{ type: 'text', text: '第一' }, file, { type: 'text', text: '第二' }] };
  await assert.rejects(translator.translate({}, multi, signal()), { code: 'TRANSLATION_CONTENT' });
  assert.equal(calls.length, 1);
});

for (const [label, chunks] of [
  ['Chinese', output('实现')], ['fullwidth punctuation', output('Hello！')], ['Unicode quote', output('“Hello”')],
  ['empty', output(' ')], ['missing finish', output('English').slice(0, 2)],
  ...['error', 'aborted', 'max-tokens', 'tool-calls'].map(kind => [kind, [{ type: 'text-delta', index: 0, text: 'Partial' }, { type: 'finish', reason: { kind } }]]),
  ['tool delta', [{ type: 'tool-call-delta', index: 0 }]],
]) {
  test(`blocks ${label}; never falls back or retries`, async () => {
    const { calls, translator } = fixture(chunks);
    const agent = {}; const original = message();
    await assert.rejects(translator.translate(agent, original, signal()));
    await assert.rejects(translator.translate(agent, original, signal()));
    assert.equal(calls.length, 1);
    assert.equal(original.content[0].text, '实现功能。');
  });
}

test('cancellation before dispatch prevents a call', async () => {
  const { calls, translator } = fixture(output('English'));
  const controller = new AbortController(); controller.abort();
  await assert.rejects(translator.translate({}, message(), controller.signal));
  assert.equal(calls.length, 0);
});

test('running cancellation and timeout abort signal-aware adapters without fallback', async () => {
  for (const mode of ['caller', 'timeout']) {
    let started;
    const ready = new Promise(resolve => { started = resolve; });
    const llm = { async *stream(request) {
      started();
      await new Promise((resolve, reject) => {
        request.signal.addEventListener('abort', () => reject(request.signal.reason), { once: true });
      });
    } };
    const controller = new AbortController();
    const translator = createPromptTranslator(llm, { ...config, timeoutMs: mode === 'timeout' ? 20 : 1000 }, signal());
    const pending = translator.translate({}, message(), controller.signal);
    await ready;
    // Keep the test process alive while AbortSignal.timeout uses an unref'ed timer.
    const keepAlive = setTimeout(() => {}, 1000);
    if (mode === 'caller') controller.abort();
    try { await assert.rejects(pending); } finally { clearTimeout(keepAlive); }
  }
});

test('reasoning is excluded and completed text blocks assemble by index', async () => {
  const { translator } = fixture([
    { type: 'block-end', index: 0, block: { type: 'reasoning', text: '中文推理' } },
    { type: 'block-end', index: 2, block: { type: 'text', text: 'world.' } },
    { type: 'block-end', index: 1, block: { type: 'text', text: 'Hello ' } },
    { type: 'finish', reason: { kind: 'stop' } },
  ]);
  assert.equal((await translator.translate({}, message(), signal())).content[0].text, 'Hello world.');
});

test('post-finish data and unsupported output blocks are blocked', async () => {
  for (const chunks of [
    [...output('Hello'), { type: 'text-delta', index: 0, text: 'extra' }],
    [{ type: 'block-start', index: 0, blockType: 'tool-call' }],
    [{ type: 'block-end', index: 0, block: { type: 'image' } }],
  ]) {
    const { translator } = fixture(chunks);
    await assert.rejects(translator.translate({}, message(), signal()));
  }
});

test('missing configured route refuses activation only when enabled', () => {
  assert.throws(() => createPromptTranslator({}, { ...config, provider: '' }, signal()));
  assert.doesNotThrow(() => createPromptTranslator({}, { ...config, enabled: false, provider: '' }, signal()));
});

test('uses configured systemPrompt or falls back to DEFAULT_SYSTEM_PROMPT', async () => {
  const customPrompt = 'Custom translation prompt instructions.';
  const customFixture = fixture(output('Custom translated text.'));
  const customTranslator = createPromptTranslator(customFixture.calls.length ? null : {
    async *stream(options) {
      customFixture.calls.push(options);
      yield* output('Custom translated text.');
    }
  }, { ...config, systemPrompt: customPrompt }, signal());

  await customTranslator.translate({}, message('自定义测试。'), signal());
  assert.equal(customFixture.calls.length, 1);
  assert.equal(customFixture.calls[0].system, customPrompt);

  const defaultFixture = fixture(output('Default translated text.'));
  await defaultFixture.translator.translate({}, message('默认测试。'), signal());
  assert.equal(defaultFixture.calls.length, 1);
  assert.ok(defaultFixture.calls[0].system.includes('Expert AI Instruction Translator'));
});
test('translates via custom OpenAI API endpoint when apiUrl and modelId are specified', async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = '';
  let requestHeaders = {};
  let requestBody = null;

  globalThis.fetch = async (url, options) => {
    requestedUrl = String(url);
    requestHeaders = options.headers;
    requestBody = JSON.parse(options.body);
    return {
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          { message: { content: 'Please optimize this SQL query.' } },
        ],
      }),
    };
  };

  try {
    const customConfig = {
      enabled: true,
      apiUrl: 'https://api.example.com/v1',
      apiKey: 'sk-test123456',
      modelId: 'gpt-4o-mini',
      timeoutMs: 5000,
      maxOutputTokens: 2048,
      temperature: 0.2,
      systemPrompt: 'Custom Translator Prompt',
    };
    const translator = createPromptTranslator({}, customConfig, signal());
    const original = message('请优化这个SQL查询语句');
    const result = await translator.translate({}, original, signal());

    assert.equal(requestedUrl, 'https://api.example.com/v1/chat/completions');
    assert.equal(requestHeaders['authorization'], 'Bearer sk-test123456');
    assert.equal(requestBody.model, 'gpt-4o-mini');
    assert.equal(requestBody.temperature, 0.2);
    assert.equal(requestBody.messages[0].content, 'Custom Translator Prompt');
    assert.equal(requestBody.messages[1].content, '请优化这个SQL查询语句');
    assert.equal(result.content[0].text, 'Please optimize this SQL query.');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
