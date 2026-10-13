import test from 'node:test';
import assert from 'node:assert/strict';
import { apply, Config } from '../index.js';
const config = { enabled: true, provider: 'test', model: 'test', timeoutMs: 1000, maxOutputTokens: 100 };
const prompt = id => ({ id, role: 'user', source: { kind: 'user', rpcId: id }, content: [{ type: 'text', text: '你好' }] });
function host() {
  const handlers = new Map(); const calls = []; const cleanups = [];
  const ctx = {
    llm: { async *stream(request) { calls.push(request); yield { type: 'block-end', index: 0, block: { type: 'text', text: 'Hello' } }; yield { type: 'finish', reason: { kind: 'stop' } }; } },
    on(name, handler) { handlers.set(name, handler); },
    effect(callback) { cleanups.push(callback()); },
  };
  apply(ctx, config);
  return { handler: handlers.get('agent/pre-step'), calls, cleanups };
}
const signal = () => new AbortController().signal;

test('waterfall preserves rejection and does not translate rejected input', async () => {
  const { handler, calls } = host(); const decision = { kind: 'reject' };
  assert.equal(await handler({ agent: {}, messages: [prompt('1')], signal: signal() }, async () => decision), decision);
  assert.equal(calls.length, 0);
});

test('later-step steer translates only proposed identities, preserves runtime context and decision fields', async () => {
  const { handler, calls } = host(); const input = prompt('1'); const injected = prompt('2');
  const context = { ...prompt('3'), source: { kind: 'runtime-context' } };
  const result = await handler({ agent: {}, messages: [input], step: 8, signal: signal() }, async () => ({ kind: 'enter', messages: [input, injected, context], startsRequestSeries: true }));
  assert.equal(result.startsRequestSeries, true);
  assert.equal(result.messages[0].content[0].text, 'Hello');
  assert.equal(result.messages[1], injected);
  assert.equal(result.messages[2], context);
  assert.equal(calls.length, 1);
});

test('plugin disposal cancels calls, no plaintext fallback', async () => {
  const { handler, calls, cleanups } = host(); cleanups.forEach(cleanup => cleanup());
  const input = prompt('1');
  await assert.rejects(handler({ agent: {}, messages: [input], signal: signal() }, async () => ({ kind: 'enter', messages: [input] })));
  assert.equal(calls.length, 0);
});

test('Standard Schema validates defaults and invalid bounds', async () => {
  const standard = Config['~standard'];
  assert.equal(typeof standard.validate, 'function');
  const defaults = await standard.validate({});
  assert.equal(defaults.issues, undefined);
  assert.equal(defaults.value.enabled, false);
  assert.equal(defaults.value.timeoutMs, 60000);
  assert.equal(typeof defaults.value.systemPrompt, 'string');
  assert.ok(defaults.value.systemPrompt.includes('Expert AI Instruction Translator'));
  for (const bad of [{ timeoutMs: 0 }, { maxOutputTokens: 1.5 }, { enabled: 'yes' }, { systemPrompt: 123 }]) {
    assert.ok((await standard.validate(bad)).issues.length > 0);
  }
});
