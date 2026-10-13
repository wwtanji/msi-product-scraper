import {
  CATEGORY_PATH_SEPARATOR,
  EMPTY_VALUE_PLACEHOLDERS,
  GTIN_SPEC_NAMES,
  MPN_SPEC_NAMES,
} from './constants.js';
import {
  cleanMultilineText,
  cleanText,
  detectAvailability,
  joinLines,
  parsePrice,
  parseRatingSummary,
  resolveUrl,
  uniqueValues,
} from './normalize.js';

const SITE_ROOT_PATH = '/';

export function buildProduct(snapshot, scrapedAt) {
  const title = cleanText(snapshot.title);
  const categoryTree = buildCategoryTree(snapshot.breadcrumbs, snapshot.url);
  const { price, salePrice } = resolvePrices(snapshot.regularPrice, snapshot.currentPrice);
  const imageUrl = resolveUrl(snapshot.mainImage, snapshot.url);
  const specs = buildSpecs(snapshot.specs);
  const { starRating, reviewCount } = parseRatingSummary(snapshot.ratingSummary);

  return {
    url: snapshot.url,
    item_id: cleanText(snapshot.productId),
    title,
    brand: extractBrand(snapshot.documentTitle, title),
    product_category: categoryTree.length ? categoryTree.map(({ name }) => name).join(CATEGORY_PATH_SEPARATOR) : null,
    category_tree: categoryTree,
    description: cleanMultilineText(snapshot.summary) ?? joinLines(snapshot.featureBullets),
    price,
    sale_price: salePrice,
    availability: detectAvailability(snapshot.priceBlockText, snapshot.purchaseActionsText),
    image_url: imageUrl,
    additional_image_urls: buildAdditionalImageUrls(snapshot.galleryImages, imageUrl, snapshot.url),
    specs,
    star_rating: starRating,
    review_count: reviewCount,
    gtin: findSpecValue(specs, GTIN_SPEC_NAMES),
    mpn: findSpecValue(specs, MPN_SPEC_NAMES),
    scraped_at: scrapedAt.toISOString(),
  };
}

function buildCategoryTree(breadcrumbs, pageUrl) {
  return breadcrumbs
    .map(({ name, href }) => ({ name: cleanText(name), url: resolveUrl(href, pageUrl) }))
    .filter(({ name, url }) => name && !isSiteRoot(url));
}

function isSiteRoot(url) {
  return url !== null && new URL(url).pathname === SITE_ROOT_PATH;
}

function resolvePrices(regularPriceText, currentPriceText) {
  const regularPrice = parsePrice(regularPriceText);
  const currentPrice = parsePrice(currentPriceText);
  const isDiscounted = regularPrice !== null && currentPrice !== null && currentPrice < regularPrice;
  return isDiscounted
    ? { price: regularPrice, salePrice: currentPrice }
    : { price: currentPrice ?? regularPrice, salePrice: null };
}

function extractBrand(documentTitle, productTitle) {
  const titlePosition = productTitle ? documentTitle.indexOf(productTitle) : -1;
  return titlePosition > 0 ? cleanText(documentTitle.slice(0, titlePosition)) : null;
}

function buildAdditionalImageUrls(galleryImages, mainImageUrl, pageUrl) {
  const imageUrls = galleryImages.map((image) => resolveUrl(image, pageUrl)).filter(Boolean);
  return uniqueValues(imageUrls).filter((imageUrl) => imageUrl !== mainImageUrl);
}

function buildSpecs(specSnapshots) {
  return specSnapshots
    .map(({ name, value }) => ({ name: cleanText(name), value: normalizeSpecValue(value) }))
    .filter(({ name }) => name);
}

function normalizeSpecValue(value) {
  const cleaned = cleanMultilineText(value);
  return cleaned && EMPTY_VALUE_PLACEHOLDERS.has(cleaned.toLowerCase()) ? null : cleaned;
}

function findSpecValue(specs, acceptedNames) {
  return specs.find(({ name }) => acceptedNames.has(name.toLowerCase()))?.value ?? null;
}
