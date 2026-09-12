import {test as base, expect} from '@playwright/test';
import {spawn} from 'node:child_process';
import {mkdtemp, readdir, rmdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {availableLoopbackPort} from '../support/port.js';

const root = fileURLToPath(new URL('../../', import.meta.url));

export const test = base.extend({
  appURL: [async ({}, use) => {
    const dir = await mkdtemp(path.join(tmpdir(), 'taskwright-browser-'));
    const port = await availableLoopbackPort();
    const env = {PATH: '', PORT: String(port), TASKWRIGHT_RUN_DIR: dir};
    for (const key of ['SystemRoot', 'WINDIR', 'TEMP', 'TMP']) {
      if (process.env[key]) env[key] = process.env[key];
    }
    const child = spawn(process.execPath, ['server.mjs'], {
      cwd: root, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
    });
    const closed = new Promise(resolve => child.once('close', resolve));
    let output = '';
    try {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(Error('Browser test server startup timed out: ' + output)), 15_000);
        const finish = error => { clearTimeout(timer); error ? reject(error) : resolve(); };
        child.once('error', finish);
        child.once('exit', code => finish(Error(`Browser test server exited (${code}): ${output}`)));
        child.stderr.on('data', data => { output = (output + data).slice(-16_384); });
        child.stdout.on('data', data => {
          output = (output + data).slice(-16_384);
          if (output.includes(`http://127.0.0.1:${port}`)) finish();
        });
      });
      await use(`http://127.0.0.1:${port}`);
    } finally {
      child.kill();
      await closed;
      const entries = await readdir(dir);
      expect(entries.filter(name => name !== 'configurations'), 'Browser tests must not create agent runs').toEqual([]);
      if (entries.includes('configurations')) {
        expect(await readdir(path.join(dir, 'configurations'))).toEqual([]);
        await rmdir(path.join(dir, 'configurations'));
      }
      await rmdir(dir);
    }
  }, {scope: 'worker'}],
  baseURL: async ({appURL}, use) => { await use(appURL); },
  audit: [async ({page, context, appURL, request}, use) => {
    const failures = [];
    await context.route('**/*', async route => {
      const req = route.request();
      if (new URL(req.url()).origin !== appURL || req.method() !== 'GET') {
        failures.push(`Unexpected request: ${req.method()} ${req.url()}`);
        await route.abort();
      } else await route.continue();
    });
    page.on('pageerror', error => failures.push(error.message));
    page.on('console', message => { if (message.type() === 'error') failures.push(message.text()); });
    expect((await (await request.get(appURL + '/api/config')).json()).codexAvailable).toBe(false);
    await use();
    expect(failures, 'No browser errors, uploads, or external requests').toEqual([]);
    expect(await (await request.get(appURL + '/api/runs')).json()).toEqual([]);
  }, {auto: true}],
});
export {expect};
