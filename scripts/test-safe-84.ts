import assert from 'node:assert/strict';

import {
  getRoutes,
  RoutingServiceError,
} from '../src/services/routing-service';

async function testSuccessfulRouteRetrieval() {
  const origin = {
    latitude: 6.9271,
    longitude: 79.8612,
  };

  const destination = {
    latitude: 6.9147,
    longitude: 79.8777,
  };

  console.log(
    'Testing route retrieval between Colombo locations...'
  );

  const routes = await getRoutes(
    origin,
    destination,
    'walk'
  );

  assert.ok(
    routes.length >= 1,
    'At least one route should be returned.'
  );

  for (const route of routes) {
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
  }

  console.log(
    `Returned route options: ${routes.length}`
  );

  console.log(
    `First route distance: ${Math.round(
      routes[0].distanceMeters
    )} metres`
  );

  console.log(
    `First route duration: ${Math.round(
      routes[0].durationSeconds / 60
    )} minutes`
  );

  console.log(
    `First route coordinates: ${routes[0].coordinates.length}`
  );
}

async function testInvalidOrigin() {
  try {
    await getRoutes(
      {
        latitude: 100,
        longitude: 79.8612,
      },
      {
        latitude: 6.9147,
        longitude: 79.8777,
      }
    );

    assert.fail(
      'Invalid origin should have been rejected.'
    );
  } catch (error) {
    assert.ok(
      error instanceof RoutingServiceError
    );

    assert.equal(
      error.code,
      'invalid-origin'
    );
  }
}

async function testInvalidDestination() {
  try {
    await getRoutes(
      {
        latitude: 6.9271,
        longitude: 79.8612,
      },
      {
        latitude: 6.9147,
        longitude: 200,
      }
    );

    assert.fail(
      'Invalid destination should have been rejected.'
    );
  } catch (error) {
    assert.ok(
      error instanceof RoutingServiceError
    );

    assert.equal(
      error.code,
      'invalid-destination'
    );
  }
}

async function runTests() {
  await testSuccessfulRouteRetrieval();
  await testInvalidOrigin();
  await testInvalidDestination();

  console.log(
    'Route retrieval service: all checks passed.'
  );
}

runTests().catch((error) => {
  console.error(
    'Route retrieval service test failed:',
    error
  );

  process.exit(1);
});