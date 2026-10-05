import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { micrositePathFor, MICROSITES } from '../src/lib/microsites';
import { PUBLISHED_MICROSITES } from '../src/lib/published-microsites';

/** Skips a story test while the site shows one microsite at a time. */
function onlyPublished(slug: string): void {
  test.skip(!PUBLISHED_MICROSITES.includes(slug), `${slug} is not the published microsite`);
}

test.describe('home', () => {
  test('@critical renders the landing page with microsite cards', async ({ page }) => {
    // Relative URL (no leading slash) so it resolves against the baseURL path
    // (the site may be served under a base path).
    await page.goto('./');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // One card per published microsite, no more and no fewer.
    for (const microsite of MICROSITES) {
      const href = micrositePathFor(microsite);
      await expect(page.locator(`a[href="${href}"]`)).toHaveCount(1);
    }
  });

  test('@critical opens a microsite story from its card', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('link', { name: /more gauges than any other river in England/i }).click();
    await expect(page.getByRole('img', { name: /rivers by number of gauges/i })).toBeVisible();
    await expect(page.getByText('Sources and further reading')).toBeVisible();
  });

  test('@critical @a11y no a11y violations on the landing page', async ({ page }) => {
    await page.goto('./');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('@smoke shows a plausible live river level', async ({ page }) => {
    await page.goto('./environment/gauge-index');
    const latest = await page.getAttribute('[data-testid="gauge-live-level"]', 'data-value');
    expect(latest).not.toBeNull();
    const level = Number(latest);
    expect(Number.isFinite(level)).toBe(true);
    expect(level).toBeGreaterThan(-2);
    expect(level).toBeLessThan(3);
  });

  test('@smoke counts the gauges in the sample', async ({ page }) => {
    await page.goto('./environment/gauge-index');
    const count = await page.getAttribute('[data-testid="gauge-stations"]', 'data-value');
    expect(Number(count)).toBeGreaterThan(1000);
  });

  test('@smoke counts the datasets in the ONS catalogue', async ({ page }) => {
    onlyPublished('ons-dataset-catalogue');
    await page.goto('./open-data/ons-dataset-catalogue');
    const count = await page.getAttribute('[data-testid="ons-datasets"]', 'data-value');
    expect(Number(count)).toBeGreaterThan(200);
  });

  test('@smoke counts the docking stations in the cycle hire list', async ({ page }) => {
    onlyPublished('cycle-hire-docks');
    await page.goto('./transport/cycle-hire-docks');
    const stations = await page.getAttribute('[data-testid="cycle-hire-stations"]', 'data-value');
    expect(Number(stations)).toBeGreaterThan(500);
    const points = await page.getAttribute(
      '[data-testid="cycle-hire-docking-points"]',
      'data-value',
    );
    expect(Number(points)).toBeGreaterThan(10000);
  });

  test('@smoke draws the cycle hire dot plot', async ({ page }) => {
    onlyPublished('cycle-hire-docks');
    await page.goto('./transport/cycle-hire-docks');
    await expect(
      page.getByRole('img', { name: /docking stations by number of docking points/i }),
    ).toBeVisible();
    await expect(
      page.locator('summary', { hasText: 'View the dock sizes as a table' }),
    ).toBeVisible();
  });

  test('@smoke counts the datasets in the planning catalogue', async ({ page }) => {
    onlyPublished('planning-datasets');
    await page.goto('./open-data/planning-datasets');
    const datasets = await page.getAttribute('[data-testid="planning-datasets"]', 'data-value');
    expect(Number(datasets)).toBeGreaterThan(100);
    const records = await page.getAttribute('[data-testid="planning-records"]', 'data-value');
    expect(Number(records)).toBeGreaterThan(1000000);
  });

  test('@smoke counts the establishments on the food hygiene registers', async ({ page }) => {
    onlyPublished('food-hygiene-registers');
    await page.goto('./health/food-hygiene-registers');
    const count = await page.getAttribute(
      '[data-testid="food-hygiene-establishments"]',
      'data-value',
    );
    expect(Number(count)).toBeGreaterThan(100000);
  });

  test('@smoke reads the Bank Rate series and draws its step chart', async ({ page }) => {
    onlyPublished('bank-rate');
    await page.goto('./economy/bank-rate');
    const readings = await page.getAttribute('[data-testid="bank-rate-readings"]', 'data-value');
    expect(Number(readings)).toBeGreaterThan(10000);
    const hold = await page.getAttribute('[data-testid="bank-rate-longest-hold"]', 'data-value');
    expect(Number(hold)).toBeGreaterThan(2000);
    const latest = await page.getAttribute('[data-testid="bank-rate-latest"]', 'data-value');
    expect(Number(latest)).toBeGreaterThan(1);
    expect(Number(latest)).toBeLessThan(20);
    await expect(page.getByRole('img', { name: /Bank Rate by business day/ })).toBeVisible();
    await expect(
      page.locator('summary', { hasText: 'View the runs at each level as a table' }),
    ).toBeVisible();
  });

  test('@smoke counts the records on the ancient woodland layer', async ({ page }) => {
    onlyPublished('ancient-woodland');
    await page.goto('./biodiversity/ancient-woodland');
    const records = await page.getAttribute(
      '[data-testid="ancient-woodland-records"]',
      'data-value',
    );
    expect(Number(records)).toBeGreaterThan(40000);
    const hectares = await page.getAttribute(
      '[data-testid="ancient-woodland-hectares"]',
      'data-value',
    );
    expect(Number(hectares)).toBeGreaterThan(100000);
    await expect(
      page.locator('summary', { hasText: 'View the size bands as a table' }),
    ).toBeVisible();
  });

  test('@smoke counts the offences recorded around Leeds city centre', async ({ page }) => {
    onlyPublished('recorded-crime');
    await page.goto('./society/recorded-crime');
    const offences = await page.getAttribute(
      '[data-testid="recorded-crime-offences"]',
      'data-value',
    );
    expect(Number(offences)).toBeGreaterThan(5000);
    const leading = await page.getAttribute(
      '[data-testid="recorded-crime-leading-type"]',
      'data-value',
    );
    expect(Number(leading)).toBeGreaterThan(1000);
    await expect(
      page.getByRole('img', { name: /Recorded crime within a mile of Leeds city centre/ }),
    ).toBeVisible();
    await expect(
      page.locator('summary', { hasText: 'View the crime types as a table' }),
    ).toBeVisible();
  });

  test('@smoke reads the carbon intensity window and draws its heatmap', async ({ page }) => {
    onlyPublished('carbon-intensity');
    await page.goto('./energy/carbon-intensity');
    const average = await page.getAttribute(
      '[data-testid="carbon-intensity-average"]',
      'data-value',
    );
    expect(Number(average)).toBeGreaterThan(20);
    expect(Number(average)).toBeLessThan(400);
    const cleanest = await page.getAttribute(
      '[data-testid="carbon-intensity-cleanest"]',
      'data-value',
    );
    const dirtiest = await page.getAttribute(
      '[data-testid="carbon-intensity-dirtiest"]',
      'data-value',
    );
    expect(Number(cleanest)).toBeLessThan(Number(dirtiest));
    await expect(
      page.getByRole('img', { name: /Half-hourly carbon intensity for Great Britain/ }),
    ).toBeVisible();
    await expect(
      page.locator('summary', { hasText: 'View the half hours as a table' }),
    ).toBeVisible();
  });

  test('@smoke counts the seats held in the Commons', async ({ page }) => {
    onlyPublished('parliament-seats');
    await page.goto('./society/parliament-seats');
    const seats = await page.getAttribute('[data-testid="parliament-seats"]', 'data-value');
    expect(Number(seats)).toBeGreaterThan(600);
    const parties = await page.getAttribute('[data-testid="parliament-parties"]', 'data-value');
    expect(Number(parties)).toBeGreaterThan(5);
    await expect(page.getByRole('img', { name: /House of Commons seats by party/ })).toBeVisible();
    await expect(page.locator('summary', { hasText: 'View the seats as a table' })).toBeVisible();
  });
});
