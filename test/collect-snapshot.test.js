import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { launchBrowser } from '../src/browser.js';
import { buildProduct } from '../src/build-product.js';
import { collectPageSnapshot } from '../src/collect-snapshot.js';

const FIXTURE_URL = 'https://store.test/Motherboards/Intel/MAG-TEST-BOARD-WIFI';
const FIXTURE_HTML = await readFile(new URL('./fixtures/product-page.html', import.meta.url), 'utf8');
const SCRAPED_AT = new Date('2026-01-01T00:00:00.000Z');

let browser;

before(async () => {
  browser = await launchBrowser();
});

after(async () => {
  await browser?.close();
});

async function openFixturePage() {
  const page = await browser.newPage();
  await page.route('**/*', (route) =>
    route.request().url() === FIXTURE_URL
      ? route.fulfill({ contentType: 'text/html', body: FIXTURE_HTML })
      : route.abort(),
  );
  await page.goto(FIXTURE_URL);
  return page;
}

test('extracts a normalized product from the store page markup', async () => {
  const page = await openFixturePage();
  const product = buildProduct(await collectPageSnapshot(page), SCRAPED_AT);

  assert.deepEqual(product, {
    url: FIXTURE_URL,
    item_id: '4242',
    title: 'MAG TEST BOARD WIFI',
    brand: 'MSI',
    product_category: 'Motherboards > INTEL PLATFORM',
    category_tree: [
      { name: 'Motherboards', url: 'https://store.test/Motherboards' },
      { name: 'INTEL PLATFORM', url: 'https://store.test/Motherboards/Intel' },
    ],
    description: 'A test board for offline extraction.',
    price: 1249.99,
    sale_price: 1199,
    availability: 'in_stock',
    image_url: 'https://store.test/images/board-1-1024.png',
    additional_image_urls: ['https://store.test/images/board-2-1024.png', 'https://store.test/images/board-3-1024.png'],
    specs: [
      { name: 'Manufacturer Number', value: 'MAG TEST BOARD WIFI' },
      { name: 'CPU', value: 'Socket X\nUp to 125W' },
      { name: 'MULTI-GPU', value: null },
      { name: 'UPC', value: '824142000000' },
    ],
    star_rating: 4.5,
    review_count: 12,
    gtin: '824142000000',
    mpn: 'MAG TEST BOARD WIFI',
    scraped_at: '2026-01-01T00:00:00.000Z',
  });
});
