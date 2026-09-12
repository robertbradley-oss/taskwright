import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const root=new URL('../',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('checks/preserved-files.json',root),'utf8'));
assert.equal(manifest.version,1);
assert.ok(manifest.files.length>0,'Empty preservation manifest');
assert.equal(new Set(manifest.files.map(f=>f.path)).size,manifest.files.length,'Duplicate paths');
for(const file of manifest.files) {
  assert.match(file.path,/^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*$/);
  assert.ok(!file.path.split('/').includes('..'),'Path escapes repository');
  const actual=createHash('sha256').update(await readFile(new URL(file.path,root))).digest('hex');
  assert.equal(actual,file.sha256,'Protected file changed: '+file.path);
}
console.log(`${manifest.files.length} committed protected files match the recorded preservation baseline.`);
