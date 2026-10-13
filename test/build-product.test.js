import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildProduct } from '../src/build-product.js';

const SCRAPED_AT = new Date('2026-01-01T00:00:00.000Z');

function createSnapshot(overrides = {}) {
  return {
    url: 'https://store.test/product',
    documentTitle: '',
    title: null,
    summary: null,
    featureBullets: [],
    productId: null,
    breadcrumbs: [],
    regularPrice: null,
    currentPrice: null,
    priceBlockText: null,
    purchaseActionsText: null,
    mainImage: null,
    galleryImages: [],
    ratingSummary: null,
    specs: [],
    ...overrides,
  };
}

test('normalizes an empty page to nulls and empty lists', () => {
  assert.deepEqual(buildProduct(createSnapshot(), SCRAPED_AT), {
    url: 'https://store.test/product',
    item_id: null,
    title: null,
    brand: null,
    product_category: null,
    category_tree: [],
    description: null,
    price: null,
    sale_price: null,
    availability: null,
    image_url: null,
    additional_image_urls: [],
    specs: [],
    star_rating: null,
    review_count: null,
    gtin: null,
    mpn: null,
    scraped_at: '2026-01-01T00:00:00.000Z',
  });
});

test('uses the current price as the regular price when nothing is discounted', () => {
  const product = buildProduct(createSnapshot({ currentPrice: '$259.99' }), SCRAPED_AT);
  assert.equal(product.price, 259.99);
  assert.equal(product.sale_price, null);
});

test('splits regular and sale price when the current price is lower', () => {
  const product = buildProduct(createSnapshot({ regularPrice: '$229.99', currentPrice: '$179.00' }), SCRAPED_AT);
  assert.equal(product.price, 229.99);
  assert.equal(product.sale_price, 179);
});

test('derives the brand from the document title prefix', () => {
  const snapshot = createSnapshot({
    documentTitle: 'MSI MAG Z890 TOMAHAWK WIFI ATX Motherboard - MSI-US Official Store',
    title: 'MAG Z890 TOMAHAWK WIFI',
  });
  assert.equal(buildProduct(snapshot, SCRAPED_AT).brand, 'MSI');
});

test('falls back to feature bullets when there is no summary', () => {
  const snapshot = createSnapshot({ featureBullets: ['  Wi-Fi 7 ', '', 'PCIe 5.0'] });
  assert.equal(buildProduct(snapshot, SCRAPED_AT).description, 'Wi-Fi 7\nPCIe 5.0');
});

test('skips the home crumb and nameless crumbs in the category tree', () => {
  const snapshot = createSnapshot({
    breadcrumbs: [
      { name: 'Home', href: 'https://store.test/' },
      { name: ' ', href: '/ghost' },
      { name: 'Motherboards', href: '/Motherboards' },
      { name: 'Intel Z890', href: null },
    ],
  });
  const product = buildProduct(snapshot, SCRAPED_AT);
  assert.deepEqual(product.category_tree, [
    { name: 'Motherboards', url: 'https://store.test/Motherboards' },
    { name: 'Intel Z890', url: null },
  ]);
  assert.equal(product.product_category, 'Motherboards > Intel Z890');
});
