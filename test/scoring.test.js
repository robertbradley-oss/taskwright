import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate } from '../scoring.js';
test('all supported answers earn full evidence credit', () => {
  assert.equal(evaluate({ claim:'duration', source:'reset', boundary:'support' }).score, 3);
});
test('plausible but wrong answers earn no credit', () => {
  assert.equal(evaluate({ claim:'power', source:'check', boundary:'repeat' }).score, 0);
});
test('each criterion is independent across every choice combination', () => {
  for (const claim of ['power','duration','replacement']) for (const source of ['reset','check','escalate']) for (const boundary of ['repeat','support','buy']) {
    assert.equal(evaluate({claim,source,boundary}).score, Number(claim==='duration')+Number(source==='reset')+Number(boundary==='support'));
  }
});
test('missing answers and persuasive prose cannot manufacture credit', () => {
  assert.equal(evaluate({}).score, 0);
  assert.equal(evaluate({ reply:'Hold for 8 seconds and contact support.' }).score, 0);
});
