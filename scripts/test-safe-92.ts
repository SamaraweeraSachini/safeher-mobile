import assert from 'node:assert/strict';

import { identifyRouteChoices } from '../src/services/route-comparison-service';

const routes = identifyRouteChoices([
  { id: 'A', durationMinutes: 10, safetyScore: 60 },
  { id: 'B', durationMinutes: 20, safetyScore: 95 },
  { id: 'C', durationMinutes: 12, safetyScore: 82 },
  { id: 'D', durationMinutes: 25, safetyScore: 40 },
]);

const byId = (id: string) => routes.find((route) => route.id === id);

assert.equal(byId('A')?.label, 'Fastest');
assert.equal(byId('B')?.label, 'Safest');
assert.equal(byId('C')?.label, 'Balanced');
assert.equal(byId('D')?.label, 'Alternative 1');
assert.equal(
  new Set(routes.map((route) => route.label)).size,
  routes.length
);

// One route can genuinely win all three roles.
const dominant = identifyRouteChoices([
  { id: 'X', durationMinutes: 10, safetyScore: 95 },
  { id: 'Y', durationMinutes: 15, safetyScore: 70 },
]);

assert.equal(
  dominant[0].label,
  'Fastest & Safest & Balanced'
);
assert.equal(dominant[1].label, 'Alternative 1');

// With equal travel time, prefer the safer route consistently.
const tied = identifyRouteChoices([
  { id: 'less-safe', durationMinutes: 10, safetyScore: 50 },
  { id: 'safer', durationMinutes: 10, safetyScore: 80 },
]);

assert.ok(tied[1].roles.includes('Fastest'));
assert.ok(tied[1].roles.includes('Safest'));

assert.deepEqual(identifyRouteChoices([]), []);

assert.throws(() =>
  identifyRouteChoices([
    { id: 'invalid', durationMinutes: 0, safetyScore: 80 },
  ])
);

console.log('SAFE-92: all route comparison checks passed.');