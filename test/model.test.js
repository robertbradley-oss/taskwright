import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { evaluate } from '../scoring.js';
const attempts = JSON.parse(await readFile(new URL('../simulation/model-match/attempts.json', import.meta.url), 'utf8'));
test('model scenario scores every choice combination independently', () => {
  for(const claim of ['wireless','options','eligibility']) for(const source of ['air','usb','policy']) for(const boundary of ['adapter','exchange','discuss']) {
    assert.equal(evaluate({claim,source,boundary},'model').score, Number(claim==='wireless')+Number(source==='usb')+Number(boundary==='discuss'));
  }
});
test('answers from one scenario cannot earn credit in the other', () => {
  assert.equal(evaluate({claim:'duration',source:'reset',boundary:'support'},'model').score,0);
  assert.equal(evaluate({claim:'wireless',source:'usb',boundary:'discuss'},'reset').score,0);
  assert.throws(()=>evaluate({},'unknown'),/Unknown/);
});
for(const attempt of attempts) test(`model ${attempt.role}: choices scored, prose unassessed`,()=>{
  const result=evaluate(attempt,'model');
  assert.equal(result.score,3);
  assert.equal(result.writingStatus,'not-assessed');
});
