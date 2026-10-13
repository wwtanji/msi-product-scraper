import { errors } from 'playwright';
import { CONTENT_TIMEOUT_MS, OPTIONAL_CONTENT_TIMEOUT_MS } from './config.js';
import { GALLERY_IMAGE_ATTRIBUTE, SELECTORS } from './constants.js';

export async function collectPageSnapshot(page) {
  await waitForProductTitle(page);
  await waitForOptionalElement(page, SELECTORS.loadedReviews, OPTIONAL_CONTENT_TIMEOUT_MS);
  const snapshot = await page.evaluate(readPageSnapshot, {
    selectors: SELECTORS,
    galleryImageAttribute: GALLERY_IMAGE_ATTRIBUTE,
  });
  return { url: page.url(), ...snapshot };
}

function waitForElement(page, selector, timeout) {
  return page.locator(selector).first().waitFor({ state: 'attached', timeout });
}

async function waitForProductTitle(page) {
  try {
    await waitForElement(page, SELECTORS.title, CONTENT_TIMEOUT_MS);
  } catch (error) {
    throw new Error(
      `Product title "${SELECTORS.title}" not found on ${page.url()}: not a product page, layout changed, or access blocked`,
      { cause: error },
    );
  }
}

async function waitForOptionalElement(page, selector, timeout) {
  try {
    await waitForElement(page, selector, timeout);
  } catch (error) {
    if (!(error instanceof errors.TimeoutError)) {
      throw error;
    }
  }
}

function readPageSnapshot({ selectors, galleryImageAttribute }) {
  const find = (selector) => document.querySelector(selector);
  const findAll = (selector) => [...document.querySelectorAll(selector)];
  const textOf = (selector) => find(selector)?.textContent ?? null;
  const renderedTextOf = (selector) => find(selector)?.innerText ?? null;
  const attributeOf = (selector, attribute) => find(selector)?.getAttribute(attribute) ?? null;

  return {
    documentTitle: document.title,
    title: textOf(selectors.title),
    summary: renderedTextOf(selectors.summary),
    featureBullets: findAll(selectors.featureBullets).map((bullet) => bullet.innerText),
    productId: attributeOf(selectors.productId, 'value'),
    breadcrumbs: findAll(selectors.breadcrumbItems)
      .filter((item) => !item.matches(selectors.currentBreadcrumbItem))
      .map((item) => ({
        name: item.textContent,
        href: item.querySelector('a')?.getAttribute('href') ?? null,
      })),
    regularPrice: textOf(selectors.regularPrice),
    currentPrice: textOf(selectors.currentPrice),
    priceBlockText: renderedTextOf(selectors.priceBlock),
    purchaseActionsText: renderedTextOf(selectors.purchaseActions),
    mainImage: attributeOf(selectors.mainImage, 'src'),
    galleryImages: findAll(selectors.galleryImages).map((image) => image.getAttribute(galleryImageAttribute)),
    ratingSummary: textOf(selectors.ratingSummary),
    specs: findAll(selectors.specRowHeaders).map((header) => ({
      name: header.textContent,
      value: header.nextElementSibling?.innerText ?? null,
    })),
  };
}
