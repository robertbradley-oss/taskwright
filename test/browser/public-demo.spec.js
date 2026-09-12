import {test, expect} from '@playwright/test';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {buildPublicDemo} from '../../scripts/build-public-demo.mjs';

test('static visitor journey works under a hosting subpath without APIs or scripts', async ({page}, testInfo) => {
  const destination = await buildPublicDemo();
  const allowed = new Set(['index.html','lab.css','workflow.css','public-demo.css','favicon.svg','fonts/InterVariable.woff2','report.json','seal.json']);
  const server = createServer(async (req,res) => {
    const path = new URL(req.url,'http://localhost').pathname;
    const name = path.startsWith('/taskwright/') ? path.slice('/taskwright/'.length) || 'index.html' : '';
    if(req.method !== 'GET' || !allowed.has(name)) {res.writeHead(404);res.end();return;}
    res.setHeader('Content-Type',name.endsWith('.css')?'text/css':name.endsWith('.html')?'text/html':name.endsWith('.json')?'application/json':name.endsWith('.svg')?'image/svg+xml':'font/woff2');
    res.end(await readFile(new URL(name,destination)));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url = `http://127.0.0.1:${server.address().port}/taskwright/`;
  const errors = [], requests = [];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  page.on('request',req=>requests.push(req));
  try {
    await page.goto(url);
    await expect(page.getByRole('heading',{name:'A good reply. A failed requirement.'})).toBeVisible();
    await page.screenshot({path:testInfo.outputPath('demo-entry.png'),fullPage:true});
    await page.getByRole('link',{name:'Inspect the example ↓'}).press('Enter');
    await expect(page).toHaveURL(/#story$/);
    await expect(page.locator('.reply').first()).toContainText('I opened the simulated support handoff');
    await page.getByRole('link',{name:'Check what it actually did ↓'}).click();
    await page.getByText('Event 6 · Recorded the simulated handoff · succeeded',{exact:true}).click();
    await expect(page.locator('#actions')).toContainText('"simulated": true');
    await page.getByRole('link',{name:'Reveal the failed requirement ↓'}).click();
    await expect(page.locator('.citation-list')).toContainText('Handoff receipt · invalid in this field');
    await page.locator('#failure').scrollIntoViewIfNeeded();
    await page.screenshot({path:testInfo.outputPath('demo-failure.png')});
    await page.getByText("Inspect this attempt's full evidence",{exact:true}).click();
    await expect(page.locator('#evidence')).toContainText('Valid, retrieved evidence');
    await page.getByText('All 12 original outcomes',{exact:true}).click();
    await expect(page.locator('tbody tr')).toHaveCount(12);
    await expect(page.locator('tbody td:nth-child(4)').filter({hasText:/^fail$/})).toHaveCount(3);
    const downloadEvent = page.waitForEvent('download');
    await page.getByRole('link',{name:'Download the complete saved report'}).click();
    const download = await downloadEvent;
    expect(await readFile(await download.path())).toEqual(await readFile(new URL('../../evidence/continuation/report.json',import.meta.url)));
    await page.reload();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(requests.every(req=>req.method()==='GET' && req.url().startsWith(url) && !req.url().includes('/api/'))).toBe(true);
    expect(requests.some(req=>req.resourceType()==='script')).toBe(false);
    expect(errors).toEqual([]);
  } finally { await new Promise(resolve=>server.close(resolve)); }
});
