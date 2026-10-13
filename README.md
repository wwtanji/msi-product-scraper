# MSI Product Scraper

A Playwright (JavaScript) scraper that pulls normalized product data from a live
[MSI US Store product page](https://us-store.msi.com/Motherboards/Intel-Platform-Motherboard/INTEL-Z890/MAG-Z890-TOMAHAWK-WIFI)
and writes it to `output/product.json`.

## Quick start

Requires Node.js 20+.

```bash
npm install
npx playwright install chromium
npm run scrape
```

`output/product.json` is created or overwritten on each run. To scrape another product page from the same store, pass its URL: `npm run scrape -- <url>`.

| Script          | Purpose                                              |
| --------------- | ---------------------------------------------------- |
| `npm run scrape` | Scrape the target page into `output/product.json`   |
| `npm test`      | Unit tests, plus an offline extraction test against a fixture page |
| `npm run lint`  | ESLint                                               |

## How it works

```
src/
  scrape.js            entry point: runs the pipeline, saves JSON, sets exit code
  browser.js           browser launch, user agent, navigation with retry
  collect-snapshot.js  waits for content, reads raw strings from the DOM in one pass
  build-product.js     maps the raw snapshot to the output schema (pure)
  normalize.js         text, price, rating, URL and availability helpers (pure)
  constants.js         selectors and domain values
  config.js            target URL, output path, timeouts
```

The pipeline has two layers:

1. **Collect.** One `page.evaluate` call reads raw strings from the page. It does no parsing.
2. **Build.** Pure functions turn that snapshot into the schema: they trim text, parse numbers, resolve URLs and fill in nulls.

Because all normalization lives in plain functions, it can be unit-tested without a browser. The selectors themselves are tested offline against `test/fixtures/product-page.html`, which `page.route` serves under a fake URL.

## Page analysis

| Finding | Decision |
| --- | --- |
| The store sits behind Akamai. It returns **403** to Playwright's default headless shell and to any request whose user agent contains `HeadlessChrome`. | Launch full Chromium in new headless mode (`channel: 'chromium'`) with the browser's own user agent minus the `Headless` marker. It stays headless and needs no stealth plugins. |
| The page has no JSON-LD, microdata or OpenGraph product data. | Read the rendered DOM. |
| `<meta name="description">` describes a **different product** (MSI Z890 GAMING PLUS WIFI). | Don't use it. The description comes from the summary paragraph under the title, falling back to the feature bullets. |
| A GA4 `view_item` event in `dataLayer` holds the id, name, categories and price. | Not used: the DOM has the same values and also shows sale prices and stock. |
| Main product data is server-rendered. The ratings widget is loaded later by XHR (`route=product/product/review`) into `#review`. | Wait for the title (required). Then wait up to 10 s for `#review` content (optional: a timeout is fine, other errors are not). |
| The gallery is a looping Swiper, which adds cloned `.swiper-slide-duplicate` slides. | Skip the clones so images keep page order, then remove any remaining duplicates. Full-size URLs come from the `popup_img` attribute. |

## Field mapping

| Field | Source |
| --- | --- |
| `url` | Final URL after navigation |
| `item_id` | Store product id from `.product-detail input[name="product_id"]` |
| `title` | `.product-detail h2.title` |
| `brand` | `<title>` text before the product title (`"MSI MAG Z890 …"` → `MSI`) |
| `category_tree` / `product_category` | `nav ol.breadcrumb` items, without `Home` and without the current page; joined with ` > ` |
| `description` | Summary block after the title, falling back to `#description-list` bullets |
| `price` / `sale_price` | `#prices-old` and `#prices-new`. When a lower current price sits next to an old price, they map to `price` and `sale_price`; otherwise the current price is `price` and `sale_price` is `null`. |
| `availability` | Stock label in `#prices-wrapper` (`In Stock`, `Out of stock`, …), falling back to the purchase button (`Add to cart` / `Notify me`) |
| `image_url` / `additional_image_urls` | `#imagePopup` and the gallery's `popup_img` URLs (deduplicated, main image excluded) |
| `specs` | Spec table rows: `th[scope="row"]` paired with the next `td` |
| `star_rating` / `review_count` | `#average-rating-info` (`"4.7 (3)"`) |
| `mpn` / `gtin` | Spec rows named `Manufacturer Number`, `UPC`, `EAN`, `GTIN`, … (this page shows no GTIN, so it is `null`) |
| `scraped_at` | Run time in ISO 8601 |

## Normalization rules

- Text has whitespace collapsed (including `&nbsp;`) and is trimmed. Empty text becomes `null`.
- Prices become numbers: `"$1,249.99"` → `1249.99`.
- Multi-line spec values keep their line structure, joined with `\n` and with blank lines removed. Placeholder values (`-`, `N/A`) become `null`.
- Relative URLs are resolved against the page URL. Values that aren't valid URLs become `null`.
- A rating with zero reviews (`"0.0 (0)"`) gives `star_rating: null` and `review_count: 0`, because no reviews means no average rating.
- List fields are always arrays, never `null`.

## Error handling

- Navigation is retried up to 3 times with linear backoff, but only on transient failures: network errors, `403`/`408`/`429` (bot filter, timeouts, rate limits) and `5xx`. Other errors such as `404` fail immediately.
- If the title never appears, the run fails with a clear message instead of writing an empty product.
- A run that succeeds but is missing key fields (`title`, `brand`, `price`, `availability`, `image_url`) prints a warning.
- On failure the process exits with code `1`, and the previous `output/product.json` is left untouched.
