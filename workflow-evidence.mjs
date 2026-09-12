import {readFile} from 'node:fs/promises';
import {hash} from './engine/scenario.js';

// Read committed examples directly: no restore, execution, or regrading.
const examples = {comparison:'brief-contract', continuation:'continuation'};
export async function savedWorkflowEvidence(name) {
  const folder = examples[name];
  if (!folder) throw Error('Unknown saved example');
  const root = new URL(`./evidence/${folder}/`, import.meta.url);
  const [report, seal] = await Promise.all(['report','seal'].map(async file =>
    JSON.parse(await readFile(new URL(`${file}.json`, root), 'utf8'))));
  if (hash(report) !== seal.reportHash || report.plan.hash !== seal.planHash)
    throw Error('Saved evidence does not match its seal. No result is presented.');
  return {source:`evidence/${folder}/report.json`, seal, report};
}
