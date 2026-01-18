/**
 * Unit Tests for GPX Normalizer
 */

const GPXNormalizerTests = (function() {
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
     * Assertion helper
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
    
    function assertNotNull(value, message) {
        if (value === null || value === undefined) {
            throw new Error(message || 'Value should not be null');
        }
    }
    
    // Test: Calculate distance between two points
    test('calculateDistance - same point', function() {
        const distance = GPXNormalizer.calculateDistance(50.0, 10.0, 50.0, 10.0);
        assertEquals(distance, 0, 'Distance between same point should be 0');
    });
    
    test('calculateDistance - positive case', function() {
        // Distance from Frankfurt to Munich (approx 304 km)
        const distance = GPXNormalizer.calculateDistance(50.1109, 8.6821, 48.1351, 11.5820);
        assert(distance > 300 && distance < 310, 'Distance Frankfurt-Munich should be ~304 km');
    });
    
    test('calculateDistance - boundary check - equator', function() {
        const distance = GPXNormalizer.calculateDistance(0, 0, 0, 1);
        assert(distance > 110 && distance < 112, 'One degree at equator should be ~111 km');
    });
    
    test('calculateDistance - negative coordinates', function() {
        const distance = GPXNormalizer.calculateDistance(-10.0, -20.0, -10.0, -21.0);
        assert(distance > 0, 'Distance with negative coordinates should work');
    });
    
    // Test: Calculate length from GPX data
    test('calculateLength - empty GPX', function() {
        const gpxData = {
            version: '1.0',
            metadata: {},
            waypoints: [],
            routes: [],
            tracks: []
        };
        const length = GPXNormalizer.calculateLength(gpxData);
        assertEquals(length, 0, 'Empty GPX should have 0 length');
    });
    
    test('calculateLength - single track with two points', function() {
        const gpxData = {
            version: '1.0',
            metadata: {},
            waypoints: [],
            routes: [],
            tracks: [{
                name: 'Test Track',
                segments: [{
                    points: [
                        { lat: 50.0, lon: 10.0 },
                        { lat: 50.0, lon: 11.0 }
                    ]
                }]
            }]
        };
        const length = GPXNormalizer.calculateLength(gpxData);
        assert(length > 70 && length < 80, 'One degree longitude at 50°N should be ~70-75 km');
    });
    
    test('calculateLength - multiple segments', function() {
        const gpxData = {
            version: '1.0',
            metadata: {},
            waypoints: [],
            routes: [],
            tracks: [{
                name: 'Test Track',
                segments: [
                    {
                        points: [
                            { lat: 50.0, lon: 10.0 },
                            { lat: 50.0, lon: 11.0 }
                        ]
                    },
                    {
                        points: [
                            { lat: 51.0, lon: 10.0 },
                            { lat: 51.0, lon: 11.0 }
                        ]
                    }
                ]
            }]
        };
        const length = GPXNormalizer.calculateLength(gpxData);
        assert(length > 140, 'Two segments should have combined length');
    });
    
    test('calculateLength - route points', function() {
        const gpxData = {
            version: '1.0',
            metadata: {},
            waypoints: [],
            routes: [{
                name: 'Test Route',
                points: [
                    { lat: 50.0, lon: 10.0 },
                    { lat: 50.0, lon: 11.0 }
                ]
            }],
            tracks: []
        };
        const length = GPXNormalizer.calculateLength(gpxData);
        assert(length > 70 && length < 80, 'Route should calculate length from points');
    });
    
    // Test: Calculate riding time
    test('calculateRidingTime - zero length', function() {
        const gpxData = {
            version: '1.0',
            metadata: {},
            waypoints: [],
            routes: [],
            tracks: []
        };
        const time = GPXNormalizer.calculateRidingTime(gpxData);
        assertEquals(time, 0, 'Zero length should give zero time');
    });
    
    test('calculateRidingTime - 100km route', function() {
        const gpxData = {
            version: '1.0',
            metadata: {},
            waypoints: [],
            routes: [{
                points: [
                    { lat: 50.0, lon: 10.0 },
                    { lat: 50.0, lon: 11.4 } // ~100km
                ]
            }],
            tracks: []
        };
        const time = GPXNormalizer.calculateRidingTime(gpxData);
        assert(time > 1.8 && time < 2.2, '100km should take ~2 hours at 50km/h average');
    });
    
    // Test: Count waypoints
    test('countWaypoints - no waypoints', function() {
        const gpxData = {
            version: '1.0',
            metadata: {},
            waypoints: [],
            routes: [],
            tracks: []
        };
        const count = GPXNormalizer.countWaypoints(gpxData);
        assertEquals(count, 0, 'No waypoints should return 0');
    });
    
    test('countWaypoints - positive case', function() {
        const gpxData = {
            version: '1.0',
            metadata: {},
            waypoints: [
                { lat: 50.0, lon: 10.0, name: 'WP1' },
                { lat: 50.1, lon: 10.1, name: 'WP2' },
                { lat: 50.2, lon: 10.2, name: 'WP3' }
            ],
            routes: [],
            tracks: []
        };
        const count = GPXNormalizer.countWaypoints(gpxData);
        assertEquals(count, 3, 'Should count all waypoints');
    });
    
    test('countWaypoints - edge case - single waypoint', function() {
        const gpxData = {
            version: '1.0',
            metadata: {},
            waypoints: [
                { lat: 50.0, lon: 10.0, name: 'WP1' }
            ],
            routes: [],
            tracks: []
        };
        const count = GPXNormalizer.countWaypoints(gpxData);
        assertEquals(count, 1, 'Single waypoint should return 1');
    });
    
    /**
     * Run all tests
     */
    function runTests() {
        console.log('Running GPX Normalizer Tests...');
        console.log('='.repeat(50));
        
        passed = 0;
        failed = 0;
        
        tests.forEach(test => {
            try {
                test.fn();
                passed++;
                console.log(`✓ ${test.name}`);
            } catch (error) {
                failed++;
                console.error(`✗ ${test.name}: ${error.message}`);
            }
        });
        
        console.log('='.repeat(50));
        console.log(`Tests: ${tests.length}, Passed: ${passed}, Failed: ${failed}`);
        
        return { total: tests.length, passed, failed };
    }
    
    return {
        runTests
    };
})();

// Auto-run tests if in test mode
if (typeof window !== 'undefined' && window.location.search.includes('test=true')) {
    window.addEventListener('load', function() {
        setTimeout(GPXNormalizerTests.runTests, 1000);
    });
}
