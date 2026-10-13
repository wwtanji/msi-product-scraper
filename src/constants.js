export const GALLERY_IMAGE_ATTRIBUTE = 'popup_img';

export const SELECTORS = Object.freeze({
  title: '.product-detail h2.title',
  summary: '.product-detail h2.title + div',
  featureBullets: '#description-list li',
  productId: '.product-detail input[name="product_id"]',
  breadcrumbItems: 'nav ol.breadcrumb > li.breadcrumb-item',
  currentBreadcrumbItem: '[aria-current="page"]',
  regularPrice: '#prices-old',
  currentPrice: '#prices-new',
  priceBlock: '#prices-wrapper',
  purchaseActions: '#product_qty',
  mainImage: '#imagePopup',
  galleryImages: `#carouselImages .swiper-slide:not(.swiper-slide-duplicate) img[${GALLERY_IMAGE_ATTRIBUTE}]`,
  loadedReviews: '#review > *',
  ratingSummary: '#average-rating-info',
  specRowHeaders: 'table th[scope="row"]',
});

export const AVAILABILITY = Object.freeze({
  IN_STOCK: 'in_stock',
  OUT_OF_STOCK: 'out_of_stock',
  PRE_ORDER: 'pre_order',
});

export const AVAILABILITY_PATTERNS = Object.freeze([
  { availability: AVAILABILITY.PRE_ORDER, pattern: /\bpre-?order\b|\bcoming soon\b/i },
  { availability: AVAILABILITY.OUT_OF_STOCK, pattern: /\bout of stock\b|\bsold out\b|\bnotify me\b/i },
  { availability: AVAILABILITY.IN_STOCK, pattern: /\bin stock\b|\badd to cart\b|\bbuy now\b/i },
]);

export const MPN_SPEC_NAMES = new Set(['manufacturer number', 'manufacturer part number', 'mpn', 'part number']);
export const GTIN_SPEC_NAMES = new Set(['gtin', 'upc', 'ean', 'upc/ean']);
export const EMPTY_VALUE_PLACEHOLDERS = new Set(['-', '–', '—', 'n/a']);

export const CATEGORY_PATH_SEPARATOR = ' > ';
export const MULTILINE_SEPARATOR = '\n';
