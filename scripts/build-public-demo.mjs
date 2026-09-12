import {mkdir, readFile, writeFile, copyFile, readdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {savedWorkflowEvidence} from '../workflow-evidence.mjs';
import {renderPublicDemo} from '../public-demo.mjs';

// Explicit asset allowlist: no server, API, runtime records, or executable JS.
export async function buildPublicDemo(destination = new URL('../output/public-demo/', import.meta.url)) {
  const evidence = await savedWorkflowEvidence('continuation');
  const assets = ['workflow.css','public-demo.css','favicon.svg','fonts/InterVariable.woff2','fonts/Inter-LICENSE.txt','LICENSE'];
  const allowed = new Set([...assets,'fonts','lab.css','index.html','report.json','seal.json']);
  try {
    for (const file of await readdir(destination, {recursive:true})) {
      if (!allowed.has(file.replaceAll('\\','/'))) throw Error('Unexpected file in static destination: '+file+'. Choose a clean directory before hosting.');
    }
  } catch (error) { if(error.code !== 'ENOENT') throw error; }
  await mkdir(new URL('fonts/', destination), {recursive:true});
  for (const file of assets) {
    await copyFile(new URL('../'+file, import.meta.url), new URL(file, destination));
  }
  const css = await readFile(new URL('../lab.css', import.meta.url), 'utf8');
  await writeFile(new URL('lab.css', destination), css.replace("url('/fonts/", "url('fonts/"));
  await writeFile(new URL('index.html', destination), renderPublicDemo(evidence, {staticSite:true}));
  // Export original bytes, not a reserialized or regraded report.
  for (const file of ['report.json','seal.json']) await copyFile(new URL('../evidence/continuation/'+file, import.meta.url), new URL(file, destination));
  return destination;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log('Static demo prepared at', (await buildPublicDemo()).pathname);
}
