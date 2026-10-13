import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { AVAILABILITY } from '../src/constants.js';
import {
  cleanMultilineText,
  cleanText,
  detectAvailability,
  parsePrice,
  parseRatingSummary,
  resolveUrl,
  uniqueValues,
} from '../src/normalize.js';

describe('cleanText', () => {
  test('collapses whitespace including non-breaking spaces', () => {
    assert.equal(cleanText('  INTEL  PLATFORM \n'), 'INTEL PLATFORM');
  });

  test('returns null for blank or non-string values', () => {
    assert.equal(cleanText('   '), null);
    assert.equal(cleanText(null), null);
    assert.equal(cleanText(42), null);
  });
});

describe('cleanMultilineText', () => {
  test('keeps meaningful lines and drops blank ones', () => {
    assert.equal(cleanMultilineText('Socket X\n  \n  Up to   125W \r\n'), 'Socket X\nUp to 125W');
  });

  test('returns null when nothing remains', () => {
    assert.equal(cleanMultilineText('\n \n'), null);
  });
});

describe('parsePrice', () => {
  const cases = [
    ['$299.99', 299.99],
    ['$1,249.00', 1249],
    [' USD 15 ', 15],
    ['Free', null],
    ['', null],
    [null, null],
  ];

  for (const [input, expected] of cases) {
    test(`${JSON.stringify(input)} -> ${expected}`, () => {
      assert.equal(parsePrice(input), expected);
    });
  }
});

describe('parseRatingSummary', () => {
  test('reads average rating and review count', () => {
    assert.deepEqual(parseRatingSummary(' 4.7 (1,203)'), { starRating: 4.7, reviewCount: 1203 });
  });

  test('reports no rating when there are no reviews', () => {
    assert.deepEqual(parseRatingSummary('0.0 (0)'), { starRating: null, reviewCount: 0 });
  });

  test('returns nulls when the summary is missing', () => {
    assert.deepEqual(parseRatingSummary(null), { starRating: null, reviewCount: null });
  });
});

describe('detectAvailability', () => {
  test('maps stock labels case-insensitively', () => {
    assert.equal(detectAvailability('In Stock'), AVAILABILITY.IN_STOCK);
    assert.equal(detectAvailability('OUT OF STOCK'), AVAILABILITY.OUT_OF_STOCK);
    assert.equal(detectAvailability('Pre-Order now'), AVAILABILITY.PRE_ORDER);
  });

  test('prefers the first text that yields a status', () => {
    assert.equal(detectAvailability('Limited Time Offer', 'NOTIFY ME'), AVAILABILITY.OUT_OF_STOCK);
    assert.equal(detectAvailability('In Stock', 'NOTIFY ME'), AVAILABILITY.IN_STOCK);
  });

  test('returns null when no status is recognizable', () => {
    assert.equal(detectAvailability(null, 'Compare'), null);
  });
});

describe('resolveUrl', () => {
  test('resolves relative paths against the page URL', () => {
    assert.equal(resolveUrl(' /images/a.png ', 'https://store.test/p/1'), 'https://store.test/images/a.png');
  });

  test('returns null for empty or unparsable values', () => {
    assert.equal(resolveUrl('', 'https://store.test/'), null);
    assert.equal(resolveUrl('http://', 'https://store.test/'), null);
  });
});

test('uniqueValues keeps first occurrences in order', () => {
  assert.deepEqual(uniqueValues(['b', 'a', 'b', 'c', 'a']), ['b', 'a', 'c']);
});
