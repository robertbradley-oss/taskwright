import {readFile, writeFile} from 'node:fs/promises';
import {test, expect} from './fixtures.js';

const demo = await readFile(new URL('../../examples/external-agent/demo-report.json', import.meta.url), 'utf8');

async function skipWithoutNavigating(page) {
  const url = page.url();
  await page.getByRole('link', {name: 'Skip to content', exact: true}).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(url);
  await expect(page.locator('main')).toBeFocused();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
}

test('saved comparison and external example keep navigation and keyboard focus', async ({page}) => {
  await page.goto('/');
  await page.getByRole('link', {name: 'Start here: a good reply that failed →'}).click();
  await expect(page.getByRole('heading', {name: 'A good reply. A failed requirement.'})).toBeVisible();
  await page.getByRole('link', {name: 'Explore the saved comparison →'}).click();
  await expect(page.getByRole('heading', {name: 'Start with an explicit brief.'})).toBeVisible();
  await page.getByRole('link', {name: '03 Evidence'}).click();
  await expect(page.getByRole('heading', {name: 'Connect the reply to its evidence.'})).toBeVisible();
  await skipWithoutNavigating(page);
  await expect(page).toHaveURL(/#evidence$/);
  await page.getByRole('link', {name: 'External agents', exact: true}).click();
  await expect(page.locator('#comparison-content')).toBeHidden();
  await page.getByRole('button', {name: 'Open offline example'}).click();
  await expect(page.locator('#external-source')).toHaveText('Included offline demo · 3 runs');
  await page.getByRole('button', {name: '3. Action blocked'}).press('Enter');
  await expect(page.locator('#external-result-title')).toHaveText('Action blocked');
  await expect(page.locator('#external-result-title')).toBeFocused();
  await skipWithoutNavigating(page);
  await expect(page).toHaveURL(/#external$/);
  await expect(page.locator('#external')).toBeVisible();
  await expect(page.getByRole('button', {name: '3. Action blocked'})).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.evaluate(() => {
    const header = document.querySelector('header');
    const heading = document.querySelector('.external-header').getBoundingClientRect();
    const navigation = header.getBoundingClientRect();
    return getComputedStyle(header).position !== 'sticky' ||
      heading.left >= navigation.right || heading.top >= navigation.bottom;
  })).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('link', {name: 'Saved comparison', exact: true}).click();
  await expect(page.locator('#external')).toBeHidden();
  await expect(page.getByRole('heading', {name: 'Start with an explicit brief.'})).toBeVisible();
  await page.goBack();
  await expect(page.locator('#external')).toBeVisible();
  await expect(page.getByRole('button', {name: '3. Action blocked'})).toHaveAttribute('aria-pressed', 'true');
});

test('local report remains local, renders literal text, and exports unchanged', async ({page}, testInfo) => {
  const report = JSON.parse(demo);
  const reply = 'Local-only reply <img src="https://example.invalid/tracker" onerror="alert(1)">';
  report.rows[0].run.final.reply = reply;
  const raw = JSON.stringify(report, null, 4) + '\n';
  const file = testInfo.outputPath('local report.json');
  await writeFile(file, raw);
  await page.goto('/#external');
  const requests = [];
  page.on('request', req => requests.push(req.url()));
  await page.getByLabel('Local report file · up to 2 MB').setInputFiles(file);
  await expect(page.locator('#external-source')).toHaveText('Imported: local report.json · 3 runs');
  await expect(page.locator('#external-origin')).toContainText('Contents are not independently verified');
  await expect(page.locator('#external-result blockquote')).toHaveText(reply);
  await expect(page.locator('#external-result img')).toHaveCount(0);
  await expect(page.locator('#external-result')).toContainText('Reply meaning needs a separate review');
  await page.getByRole('button', {name: 'View JSON', exact: true}).click();
  await expect(page.getByLabel('Original report JSON')).toHaveValue(raw);
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', {name: 'Download report', exact: true}).click();
  const download = await downloadEvent;
  expect(await readFile(await download.path(), 'utf8')).toBe(raw);
  expect(requests, 'Import and export must not make network requests').toEqual([]);
  await skipWithoutNavigating(page);
  await expect(page.locator('#external-source')).toHaveText('Imported: local report.json · 3 runs');
  await page.getByRole('link', {name: 'Saved comparison', exact: true}).click();
  await page.getByRole('link', {name: 'External agents', exact: true}).click();
  await expect(page.locator('#external-result blockquote')).toHaveText(reply);
  await page.reload();
  await expect(page.locator('#external-results')).toBeHidden();
  await expect(page.getByRole('button', {name: 'Open offline example'})).toBeVisible();
});

test('invalid local replacement clears old results and the example restores the view', async ({page}, testInfo) => {
  const file = testInfo.outputPath('invalid report.json');
  await writeFile(file, JSON.stringify({...JSON.parse(demo), rows: []}));
  await page.goto('/#external');
  await page.getByRole('button', {name: 'Open offline example'}).click();
  await expect(page.locator('#external-results')).toBeVisible();
  await page.getByText('Open another report', {exact: true}).click();
  await page.getByLabel('Local report file · up to 2 MB').setInputFiles(file);
  await expect(page.locator('#external-status')).toContainText('between 1 and 16 runs');
  await expect(page.locator('#external-results')).toBeHidden();
  await expect(page.locator('#external-json')).toHaveValue('');
  await page.getByRole('button', {name: 'Open offline example'}).click();
  await expect(page.locator('#external-results')).toBeVisible();
  await expect(page.locator('#external-result-title')).toHaveText('Reply produced');
});
