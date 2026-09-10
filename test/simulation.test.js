import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { evaluate } from '../scoring.js';

const attempts = JSON.parse(await readFile(new URL('../simulation/attempts.json', import.meta.url), 'utf8'));
for (const attempt of attempts) {
  test(`recorded ${attempt.role} simulation: full choice credit never verifies writing`, () => {
    const result = evaluate(attempt);
    assert.equal(result.score, 3);
    assert.equal(result.writingStatus, 'not-assessed');
  });
}
