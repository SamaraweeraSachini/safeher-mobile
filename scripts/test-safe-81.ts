import assert from 'node:assert/strict';

import {
  getRoute,
} from '../src/services/routing-service';

async function runTest() {
  const origin = {
    latitude: 6.9271,
    longitude: 79.8612,
  };

  const destination = {
    latitude: 6.9147,
    longitude: 79.8777,
  };

  console.log(
    'SAFE-81: requesting test walking route...'
  );

  const route = await getRoute(
    origin,
    destination,
    'walk'
  );

  assert.ok(
    route.coordinates.length >= 2,
    'Route should contain coordinates.'
  );

  assert.ok(
    route.distanceMeters > 0,
    'Route distance should be greater than zero.'
  );

  assert.ok(
    route.durationSeconds > 0,
    'Route duration should be greater than zero.'
  );

  console.log('SAFE-81: routing request successful.');
  console.log(
    `Distance: ${Math.round(route.distanceMeters)} metres`
  );
  console.log(
    `Duration: ${Math.round(
      route.durationSeconds / 60
    )} minutes`
  );
  console.log(
    `Route coordinates: ${route.coordinates.length}`
  );

  console.log(
    'SAFE-81: all routing checks passed.'
  );
}

runTest().catch((error) => {
  console.error(
    'SAFE-81 routing test failed:',
    error
  );

  process.exit(1);
});