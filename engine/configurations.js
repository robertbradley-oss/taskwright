import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { instructions, hash } from './scenario.js';

// Both arms share these controls. A model alias is pinned, not a provider snapshot.
export const model = 'gpt-6-astra';
export const protocolVersion = 'json-actions-2';
const base = { model, reasoningEffort: 'low', adapter: 'codex', protocolVersion };
function freeze(value) { return { ...value, hash: hash(value) }; }
export const baseline = freeze({ id: 'support-baseline', version: 1, name: 'Support baseline', instructions, ...base });
export const candidate = freeze({
  id: 'support-candidate', version: 1, name: 'Evidence-first candidate', ...base,
  instructions: instructions + ' Work in this order: identify the product the customer actually owns; read its applicable instructions and the relevant policy; distinguish supported options from the customer\'s desired capability. Complete any required simulated action before claiming it is done. Before finalizing, check that the reply and structured fields agree with each other and with the retrieved evidence. State unresolved eligibility or availability plainly.'
});
export const configKey = config => `${config.id}@${config.version}`;
export function verifyConfiguration(config) {
  const { hash: digest, ...value } = config;
  if (digest !== hash(value)) throw new Error('Configuration hash mismatch');
  return config;
}
export async function listConfigurations(dir) {
  const folder = `${dir}/configurations`;
  await mkdir(folder, { recursive: true });
  const saved = [];
  for (const file of (await readdir(folder)).filter(f => /^support-candidate-\d+\.json$/.test(f))) {
    saved.push(verifyConfiguration(JSON.parse(await readFile(`${folder}/${file}`, 'utf8'))));
  }
  return [structuredClone(baseline), structuredClone(candidate), ...saved.sort((a,b) => a.version-b.version)];
}
export async function getConfiguration(dir, key) {
  const config = (await listConfigurations(dir)).find(c => configKey(c) === key);
  if (!config) throw new Error('Unknown configuration');
  return config;
}
export async function saveCandidate(dir, { name, instructions: prompt, parent }) {
  if (typeof name !== 'string' || !name.trim() || name.length > 80 || typeof prompt !== 'string' || !prompt.trim() || prompt.length > 2400) throw new Error('Invalid candidate');
  const ancestor = await getConfiguration(dir, parent);
  // Exclusive creation makes concurrent saves append versions without overwriting.
  for (;;) {
    const configs = await listConfigurations(dir);
    const version = Math.max(...configs.filter(c => c.id === candidate.id).map(c => c.version)) + 1;
    const config = freeze({ id: candidate.id, version, name: name.trim(), instructions: prompt.trim(), ...base, parentHash: ancestor.hash, createdAt: new Date().toISOString() });
    try { await writeFile(`${dir}/configurations/support-candidate-${version}.json`, JSON.stringify(config,null,2), { flag: 'wx' }); return config; }
    catch (error) { if (error.code !== 'EEXIST') throw error; }
  }
}
