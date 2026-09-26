import assert from 'node:assert/strict';

import {
  identifyRouteChoices,
} from '../src/services/route-comparison-service';

import type {
  RouteOption,
} from '../src/types/route';

function createRoute(
  id: string,
  durationSeconds: number,
  safetyScore: number
): RouteOption {
  return {
    id,
    type: 'balanced',
    coordinates: [
      {
        latitude: 6.9271,
        longitude: 79.8612,
      },
      {
        latitude: 6.9281,
        longitude: 79.8622,
      },
    ],
    distanceMeters: 1000,
    durationSeconds,
    safetyScore,
    nearbyIncidentCount: 0,
  };
}

const routes = identifyRouteChoices([
  createRoute('A', 600, 60),
  createRoute('B', 1200, 95),
  createRoute('C', 720, 82),
  createRoute('D', 1500, 40),
]);

const byId = (id: string) =>
  routes.find((route) => route.id === id);

assert.equal(
  byId('A')?.label,
  'Fastest'
);

assert.equal(
  byId('B')?.label,
  'Safest'
);

assert.equal(
  byId('C')?.label,
  'Balanced'
);

assert.equal(
  byId('D')?.label,
  'Alternative 1'
);

assert.equal(
  new Set(
    routes.map((route) => route.label)
  ).size,
  routes.length
);

// One route can genuinely win all three roles.
const dominant = identifyRouteChoices([
  createRoute('X', 600, 95),
  createRoute('Y', 900, 70),
]);

assert.equal(
  dominant[0].label,
  'Fastest & Safest & Balanced'
);

assert.equal(
  dominant[1].label,
  'Alternative 1'
);

// Equal travel time should prefer the safer route.
const tied = identifyRouteChoices([
  createRoute('less-safe', 600, 50),
  createRoute('safer', 600, 80),
]);

assert.ok(
  tied[1].roles.includes('Fastest')
);

assert.ok(
  tied[1].roles.includes('Safest')
);

assert.deepEqual(
  identifyRouteChoices([]),
  []
);

assert.throws(() =>
  identifyRouteChoices([
    createRoute('invalid', 0, 80),
  ])
);

console.log(
  'SAFE-92: all route comparison checks passed.'
);