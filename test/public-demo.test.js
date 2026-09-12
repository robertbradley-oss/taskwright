import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {buildPublicDemo} from '../scripts/build-public-demo.mjs';

test('public build contains only static assets and exact sealed evidence', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'taskwright-static-'));
  try {
    await buildPublicDemo(pathToFileURL(dir + '/'));
    assert.deepEqual((await readdir(dir)).sort(), ['LICENSE','favicon.svg','fonts','index.html','lab.css','public-demo.css','report.json','seal.json','workflow.css'].sort());
    for (const name of ['report.json','seal.json']) assert.deepEqual(await readFile(join(dir,name)), await readFile(new URL('../evidence/continuation/'+name,import.meta.url)));
    const html = await readFile(join(dir,'index.html'),'utf8');
    assert.doesNotMatch(html, /<script|\/api\/|localhost|127\.0\.0\.1/);
    assert.match(html, /9\/12 full-contract passes/);
    assert.match(html, /handoff-893fc772-4000-4212-84f4-990703a98e4d/);
    assert.doesNotMatch(await readFile(join(dir,'lab.css'),'utf8'), /url\('\//);
    await writeFile(join(dir,'server.mjs'),'unexpected');
    await assert.rejects(buildPublicDemo(pathToFileURL(dir + '/')), /Unexpected file/);
  } finally { await rm(dir, {recursive:true,force:true}); }
});
