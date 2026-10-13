import { fileURLToPath } from 'node:url';

export const TARGET_URL =
  'https://us-store.msi.com/Motherboards/Intel-Platform-Motherboard/INTEL-Z890/MAG-Z890-TOMAHAWK-WIFI';

export const OUTPUT_FILE = fileURLToPath(new URL('../output/product.json', import.meta.url));

export const BROWSER_LOCALE = 'en-US';
export const NAVIGATION_TIMEOUT_MS = 60_000;
export const CONTENT_TIMEOUT_MS = 30_000;
export const OPTIONAL_CONTENT_TIMEOUT_MS = 10_000;
export const MAX_NAVIGATION_ATTEMPTS = 3;
export const RETRY_BASE_DELAY_MS = 2_000;
