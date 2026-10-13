import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, relative } from 'node:path';
import { launchBrowser, navigateWithRetry, openRegularBrowserPage } from './browser.js';
import { buildProduct } from './build-product.js';
import { collectPageSnapshot } from './collect-snapshot.js';
import { OUTPUT_FILE, TARGET_URL } from './config.js';

const KEY_FIELDS = ['title', 'brand', 'price', 'availability', 'image_url'];

async function scrapeProduct(url) {
  const browser = await launchBrowser();
  try {
    const page = await openRegularBrowserPage(browser);
    await navigateWithRetry(page, url);
    const snapshot = await collectPageSnapshot(page);
    return buildProduct(snapshot, new Date());
  } finally {
    await browser.close();
  }
}

async function saveJson(filePath, data) {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function reportMissingKeyFields(product) {
  const missingFields = KEY_FIELDS.filter((field) => product[field] === null);
  if (missingFields.length) {
    console.warn(`Warning: missing key fields: ${missingFields.join(', ')}`);
  }
}

async function main() {
  const targetUrl = process.argv[2] ?? TARGET_URL;
  console.log(`Scraping ${targetUrl}`);
  const product = await scrapeProduct(targetUrl);
  reportMissingKeyFields(product);
  await saveJson(OUTPUT_FILE, product);
  console.log(`Saved "${product.title}" (${product.specs.length} specs) to ${relative(process.cwd(), OUTPUT_FILE)}`);
}

main().catch((error) => {
  console.error(`Scrape failed: ${error.message}`);
  process.exitCode = 1;
});
