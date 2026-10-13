import { AVAILABILITY_PATTERNS, MULTILINE_SEPARATOR } from './constants.js';

const WHITESPACE_RUN = /\s+/g;
const LINE_BREAK = /\r?\n/;
const PRICE_AMOUNT = /\d[\d,]*(?:\.\d+)?/;
const RATING_VALUE = /\d+(?:\.\d+)?/;
const PARENTHESIZED_COUNT = /\((\d[\d,]*)\)/;

export function cleanText(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const cleaned = value.replace(WHITESPACE_RUN, ' ').trim();
  return cleaned || null;
}

export function cleanMultilineText(value) {
  if (typeof value !== 'string') {
    return null;
  }
  return joinLines(value.split(LINE_BREAK));
}

export function joinLines(lines) {
  const cleanedLines = lines.map(cleanText).filter(Boolean);
  return cleanedLines.length ? cleanedLines.join(MULTILINE_SEPARATOR) : null;
}

export function parsePrice(value) {
  const amount = cleanText(value)?.match(PRICE_AMOUNT)?.[0];
  return amount ? toFiniteNumber(amount) : null;
}

export function parseRatingSummary(value) {
  const text = cleanText(value);
  const rating = text?.match(RATING_VALUE)?.[0];
  const count = text?.match(PARENTHESIZED_COUNT)?.[1];
  const reviewCount = count ? toFiniteNumber(count) : null;
  const hasReviews = reviewCount !== 0;
  return {
    starRating: rating && hasReviews ? toFiniteNumber(rating) : null,
    reviewCount,
  };
}

export function resolveUrl(value, baseUrl) {
  const text = cleanText(value);
  if (!text) {
    return null;
  }
  try {
    return new URL(text, baseUrl).href;
  } catch {
    return null;
  }
}

export function detectAvailability(...texts) {
  for (const text of texts.map(cleanText).filter(Boolean)) {
    const match = AVAILABILITY_PATTERNS.find(({ pattern }) => pattern.test(text));
    if (match) {
      return match.availability;
    }
  }
  return null;
}

export function uniqueValues(values) {
  return [...new Set(values)];
}

function toFiniteNumber(numericText) {
  const number = Number(numericText.replaceAll(',', ''));
  return Number.isFinite(number) ? number : null;
}
