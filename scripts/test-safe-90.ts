import assert from 'node:assert/strict';
import { Timestamp } from 'firebase/firestore';

import { calculateRouteSafetyScore } from '../src/services/safety-score-service';
import type { Incident } from '../src/types/incident';

const now = new Date('2026-09-26T00:00:00Z');

const route = [
  { latitude: 6.9271, longitude: 79.8612 },
  { latitude: 6.9371, longitude: 79.8612 },
];

function incident(
  id: string,
  type: Incident['type'],
  latitude: number,
  longitude: number,
  ageDays: number
): Incident {
  return {
    id,
    type,
    description: 'Test incident',
    coordinates: { latitude, longitude },
    anonymous: true,
    status: 'active',
    creatorUid: 'test-user',
    createdAt: Timestamp.fromDate(
      new Date(now.getTime() - ageDays * 24 * 60 * 60 * 1000)
    ),
  };
}

// No incidents: route starts at 100.
assert.equal(calculateRouteSafetyScore(route, [], now).score, 100);

// A nearby recent assault deducts its centrally defined 20 points.
const nearbyAssault = incident(
  'assault-1',
  'assault',
  6.9321,
  79.8612,
  1
);
assert.equal(
  calculateRouteSafetyScore(route, [nearbyAssault], now).score,
  80
);

// An incident farther than 250 metres has no effect.
const distantAssault = incident(
  'assault-2',
  'assault',
  6.9321,
  79.8712,
  1
);
assert.equal(
  calculateRouteSafetyScore(route, [distantAssault], now).score,
  100
);

// A 10-day-old assault has half the penalty: 10 points.
const olderAssault = incident(
  'assault-3',
  'assault',
  6.9321,
  79.8612,
  10
);
assert.equal(
  calculateRouteSafetyScore(route, [olderAssault], now).score,
  90
);

// A report older than 30 days has no effect.
const expiredAssault = incident(
  'assault-4',
  'assault',
  6.9321,
  79.8612,
  31
);
assert.equal(
  calculateRouteSafetyScore(route, [expiredAssault], now).score,
  100
);

// Passing the same incident twice still counts it once.
const duplicateResult = calculateRouteSafetyScore(
  route,
  [nearbyAssault, nearbyAssault],
  now
);
assert.equal(duplicateResult.score, 80);
assert.equal(duplicateResult.nearbyIncidentCount, 1);

// Enough nearby incidents cannot push the score below zero.
const manyIncidents = Array.from({ length: 10 }, (_, index) =>
  incident(
    `many-${index}`,
    'assault',
    6.9321,
    79.8612,
    1
  )
);
assert.equal(
  calculateRouteSafetyScore(route, manyIncidents, now).score,
  0
);

console.log('SAFE-90: all scoring checks passed.');