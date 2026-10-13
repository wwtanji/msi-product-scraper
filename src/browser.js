import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';
import {
  BROWSER_LOCALE,
  MAX_NAVIGATION_ATTEMPTS,
  NAVIGATION_TIMEOUT_MS,
  RETRY_BASE_DELAY_MS,
} from './config.js';

const FULL_CHROMIUM_CHANNEL = 'chromium';
const HEADLESS_USER_AGENT_TOKEN = 'HeadlessChrome';
const REGULAR_USER_AGENT_TOKEN = 'Chrome';
const RETRYABLE_STATUSES = new Set([403, 408, 429]);
const SERVER_ERROR_STATUS_FLOOR = 500;

export function launchBrowser() {
  return chromium.launch({ channel: FULL_CHROMIUM_CHANNEL, headless: true });
}

export async function openRegularBrowserPage(browser) {
  const userAgent = await readRegularUserAgent(browser);
  const context = await browser.newContext({ userAgent, locale: BROWSER_LOCALE });
  return context.newPage();
}

export async function navigateWithRetry(page, url) {
  for (let attempt = 1; ; attempt += 1) {
    const failure = await tryNavigate(page, url);
    if (!failure) {
      return;
    }
    if (!failure.retryable || attempt >= MAX_NAVIGATION_ATTEMPTS) {
      throw new Error(`Failed to load ${url} after ${attempt} attempt(s): ${failure.reason}`);
    }
    await delay(RETRY_BASE_DELAY_MS * attempt);
  }
}

async function tryNavigate(page, url) {
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT_MS });
    if (!response || response.ok()) {
      return null;
    }
    const status = response.status();
    return { reason: `HTTP ${status}`, retryable: isRetryableStatus(status) };
  } catch (error) {
    return { reason: error.message, retryable: true };
  }
}

function isRetryableStatus(status) {
  return RETRYABLE_STATUSES.has(status) || status >= SERVER_ERROR_STATUS_FLOOR;
}

async function readRegularUserAgent(browser) {
  const probePage = await browser.newPage();
  try {
    const defaultUserAgent = await probePage.evaluate(() => navigator.userAgent);
    return defaultUserAgent.replace(HEADLESS_USER_AGENT_TOKEN, REGULAR_USER_AGENT_TOKEN);
  } finally {
    await probePage.close();
  }
}
