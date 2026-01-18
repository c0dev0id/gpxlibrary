/**
 * Unit Tests for Routing Module
 */

const RoutingTests = (function() {
    'use strict';

    const tests = [];
    let passed = 0;
    let failed = 0;

    /**
     * Test helper function
     */
    function test(name, fn) {
        tests.push({ name, fn });
    }

    /**
     * Assertion helpers
     */
    function assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }

    function assertEquals(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Expected ${expected}, got ${actual}`);
        }
    }

    function assertGreaterThan(actual, expected, message) {
        if (actual <= expected) {
            throw new Error(message || `Expected ${actual} to be greater than ${expected}`);
        }
    }

    function assertLessThan(actual, expected, message) {
        if (actual >= expected) {
            throw new Error(message || `Expected ${actual} to be less than ${expected}`);
        }
    }

    function assertInRange(actual, min, max, message) {
        if (actual < min || actual > max) {
            throw new Error(message || `Expected ${actual} to be between ${min} and ${max}`);
        }
    }

    // Test: Calculate straight distance - same point
    test('Calculate straight distance - same point', function() {
        const distance = Routing.calculateStraightDistance(47.0, 8.0, 47.0, 8.0);
        assertEquals(distance, 0, 'Distance between same point should be 0');
    });

    // Test: Calculate straight distance - known distance
    test('Calculate straight distance - known distance', function() {
        // Distance from Frankfurt to Munich (approx 304 km = 304000 m)
        const distance = Routing.calculateStraightDistance(50.1109, 8.6821, 48.1351, 11.5820);
        assertInRange(distance, 300000, 310000, 'Distance Frankfurt-Munich should be ~304 km');
    });

    // Test: Calculate straight distance - 1 degree at equator
    test('Calculate straight distance - 1 degree at equator', function() {
        const distance = Routing.calculateStraightDistance(0, 0, 0, 1);
        assertInRange(distance, 110000, 112000, 'One degree at equator should be ~111 km');
    });

    // Test: Calculate straight distance - negative coordinates
    test('Calculate straight distance - negative coordinates', function() {
        const distance = Routing.calculateStraightDistance(-33.8688, 151.2093, -37.8136, 144.9631);
        assertGreaterThan(distance, 0, 'Should calculate distance with negative coordinates');
        assertInRange(distance, 700000, 800000, 'Distance Sydney-Melbourne should be reasonable');
    });

    // Test: Calculate fallback distance - multiple waypoints
    test('Calculate fallback distance - multiple waypoints', function() {
        const waypoints = [
            { lat: 47.0, lon: 8.0 },
            { lat: 47.1, lon: 8.1 },
            { lat: 47.2, lon: 8.2 }
        ];

        const distance = Routing.calculateFallbackDistance(waypoints);
        assertGreaterThan(distance, 0, 'Distance should be greater than 0');
        assertLessThan(distance, 50000, 'Distance should be reasonable (< 50km)');
    });

    // Test: Calculate fallback distance - single waypoint
    test('Calculate fallback distance - single waypoint', function() {
        const waypoints = [
            { lat: 47.0, lon: 8.0 }
        ];

        const distance = Routing.calculateFallbackDistance(waypoints);
        assertEquals(distance, 0, 'Single waypoint should have 0 distance');
    });

    // Test: Calculate fallback distance - two waypoints
    test('Calculate fallback distance - two waypoints', function() {
        const waypoints = [
            { lat: 47.0, lon: 8.0 },
            { lat: 47.1, lon: 8.1 }
        ];

        const distance = Routing.calculateFallbackDistance(waypoints);
        assertGreaterThan(distance, 0, 'Two waypoints should have distance > 0');
        assertInRange(distance, 10000, 20000, 'Distance should be ~15 km');
    });

    // Test: Estimate riding time - ROAD strategy
    test('Estimate riding time - ROAD strategy', function() {
        const distance = 80000; // 80 km in meters
        const time = Routing.estimateRidingTime(distance, Routing.STRATEGIES.ROAD);

        // At 80 km/h, 80 km should take 1 hour = 3600 seconds
        assertEquals(time, 3600, 'Should take 1 hour at 80 km/h');
    });

    // Test: Estimate riding time - ROAD_NO_MOTORWAY strategy
    test('Estimate riding time - ROAD_NO_MOTORWAY strategy', function() {
        const distance = 70000; // 70 km in meters
        const time = Routing.estimateRidingTime(distance, Routing.STRATEGIES.ROAD_NO_MOTORWAY);

        // At 70 km/h, 70 km should take 1 hour = 3600 seconds
        assertEquals(time, 3600, 'Should take 1 hour at 70 km/h');
    });

    // Test: Estimate riding time - CURVY strategy
    test('Estimate riding time - CURVY strategy', function() {
        const distance = 60000; // 60 km in meters
        const time = Routing.estimateRidingTime(distance, Routing.STRATEGIES.CURVY);

        // At 60 km/h, 60 km should take 1 hour = 3600 seconds
        assertEquals(time, 3600, 'Should take 1 hour at 60 km/h');
    });

    // Test: Estimate riding time - PREFER_UNPAVED strategy
    test('Estimate riding time - PREFER_UNPAVED strategy', function() {
        const distance = 50000; // 50 km in meters
        const time = Routing.estimateRidingTime(distance, Routing.STRATEGIES.PREFER_UNPAVED);

        // At 50 km/h, 50 km should take 1 hour = 3600 seconds
        assertEquals(time, 3600, 'Should take 1 hour at 50 km/h');
    });

    // Test: Estimate riding time - different distances
    test('Estimate riding time - 160 km at ROAD speed', function() {
        const distance = 160000; // 160 km in meters
        const time = Routing.estimateRidingTime(distance, Routing.STRATEGIES.ROAD);

        // At 80 km/h, 160 km should take 2 hours = 7200 seconds
        assertEquals(time, 7200, 'Should take 2 hours');
    });

    // Test: Strategy getter and setter
    test('Get and set routing strategy', function() {
        const originalStrategy = Routing.getStrategy();

        Routing.setStrategy(Routing.STRATEGIES.CURVY);
        assertEquals(Routing.getStrategy(), Routing.STRATEGIES.CURVY, 'Strategy should be CURVY');

        Routing.setStrategy(Routing.STRATEGIES.ROAD);
        assertEquals(Routing.getStrategy(), Routing.STRATEGIES.ROAD, 'Strategy should be ROAD');

        // Restore original
        Routing.setStrategy(originalStrategy);
    });

    // Test: Set invalid strategy
    test('Set invalid strategy should not change current strategy', function() {
        const originalStrategy = Routing.getStrategy();

        Routing.setStrategy('invalid-strategy');
        assertEquals(Routing.getStrategy(), originalStrategy, 'Strategy should remain unchanged');
    });

    // Test: Get available strategies
    test('Get available strategies', function() {
        const strategies = Routing.getAvailableStrategies();

        assert(strategies[Routing.STRATEGIES.ROAD], 'Should have ROAD strategy');
        assert(strategies[Routing.STRATEGIES.ROAD_NO_MOTORWAY], 'Should have ROAD_NO_MOTORWAY strategy');
        assert(strategies[Routing.STRATEGIES.CURVY], 'Should have CURVY strategy');
        assert(strategies[Routing.STRATEGIES.PREFER_UNPAVED], 'Should have PREFER_UNPAVED strategy');

        assert(strategies[Routing.STRATEGIES.ROAD].name, 'ROAD strategy should have name');
        assert(strategies[Routing.STRATEGIES.ROAD].description, 'ROAD strategy should have description');
    });

    // Test: STRATEGIES constants
    test('STRATEGIES constants are defined', function() {
        assertEquals(Routing.STRATEGIES.ROAD, 'road', 'ROAD constant should be "road"');
        assertEquals(Routing.STRATEGIES.ROAD_NO_MOTORWAY, 'road-no-motorway', 'ROAD_NO_MOTORWAY constant');
        assertEquals(Routing.STRATEGIES.CURVY, 'curvy', 'CURVY constant should be "curvy"');
        assertEquals(Routing.STRATEGIES.PREFER_UNPAVED, 'prefer-unpaved', 'PREFER_UNPAVED constant');
    });

    // Note: calculateRoute() requires network access to OSRM API
    // We'll skip testing it in unit tests and rely on integration tests instead
    test('calculateRoute validation - insufficient waypoints', async function() {
        try {
            await Routing.calculateRoute([]);
            throw new Error('Should have thrown error');
        } catch (error) {
            assert(error.message.includes('At least 2 waypoints'), 'Should require at least 2 waypoints');
        }
    });

    test('calculateRoute validation - single waypoint', async function() {
        try {
            await Routing.calculateRoute([{ lat: 47.0, lon: 8.0 }]);
            throw new Error('Should have thrown error');
        } catch (error) {
            assert(error.message.includes('At least 2 waypoints'), 'Should require at least 2 waypoints');
        }
    });

    /**
     * Run all tests
     */
    function runTests() {
        passed = 0;
        failed = 0;

        console.log('Running Routing Module Tests...\n');

        for (const {name, fn} of tests) {
            try {
                fn();
                passed++;
                console.log(`✓ ${name}`);
            } catch (error) {
                failed++;
                console.error(`✗ ${name}`);
                console.error(`  ${error.message}`);
            }
        }

        console.log(`\n${passed} passed, ${failed} failed, ${tests.length} total`);
        return { passed, failed, total: tests.length };
    }

    return {
        runTests
    };
})();
