/**
 * Unit Tests for GPX Parser Module
 */

const GPXParserTests = (function() {
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

    function assertNotNull(value, message) {
        if (value === null || value === undefined) {
            throw new Error(message || 'Value should not be null');
        }
    }

    function assertArrayLength(array, expectedLength, message) {
        if (!Array.isArray(array)) {
            throw new Error('Expected an array');
        }
        if (array.length !== expectedLength) {
            throw new Error(message || `Expected array length ${expectedLength}, got ${array.length}`);
        }
    }

    function assertThrows(fn, message) {
        let thrown = false;
        try {
            fn();
        } catch (e) {
            thrown = true;
        }
        if (!thrown) {
            throw new Error(message || 'Expected function to throw an error');
        }
    }

    // Test: Parse minimal valid GPX 1.0
    test('Parse minimal valid GPX 1.0', function() {
        const gpx = `<?xml version="1.0"?>
            <gpx version="1.0">
                <wpt lat="47.5" lon="8.5">
                    <name>Test Point</name>
                </wpt>
            </gpx>`;

        const result = GPXParser.parse(gpx);

        assertEquals(result.version, '1.0', 'Version should be 1.0');
        assertArrayLength(result.waypoints, 1, 'Should have 1 waypoint');
        assertEquals(result.waypoints[0].lat, 47.5, 'Waypoint lat should be 47.5');
        assertEquals(result.waypoints[0].lon, 8.5, 'Waypoint lon should be 8.5');
        assertEquals(result.waypoints[0].name, 'Test Point', 'Waypoint name should match');
    });

    // Test: Parse GPX 1.1 with metadata
    test('Parse GPX 1.1 with metadata', function() {
        const gpx = `<?xml version="1.0"?>
            <gpx version="1.1">
                <metadata>
                    <name>Test Route</name>
                    <desc>A test route description</desc>
                    <author>
                        <name>Test Author</name>
                    </author>
                    <time>2024-01-01T12:00:00Z</time>
                </metadata>
                <wpt lat="47.5" lon="8.5">
                    <name>Test</name>
                </wpt>
            </gpx>`;

        const result = GPXParser.parse(gpx);

        assertEquals(result.version, '1.1', 'Version should be 1.1');
        assertEquals(result.metadata.name, 'Test Route', 'Metadata name should match');
        assertEquals(result.metadata.desc, 'A test route description', 'Metadata desc should match');
        assertEquals(result.metadata.author, 'Test Author', 'Metadata author should match');
        assertEquals(result.metadata.time, '2024-01-01T12:00:00Z', 'Metadata time should match');
    });

    // Test: Parse route with multiple points
    test('Parse route with multiple points', function() {
        const gpx = `<?xml version="1.0"?>
            <gpx version="1.0">
                <rte>
                    <name>Test Route</name>
                    <desc>Route description</desc>
                    <rtept lat="47.0" lon="8.0">
                        <name>Point 1</name>
                        <ele>500</ele>
                    </rtept>
                    <rtept lat="47.1" lon="8.1">
                        <name>Point 2</name>
                        <ele>600</ele>
                    </rtept>
                    <rtept lat="47.2" lon="8.2">
                        <name>Point 3</name>
                        <ele>700</ele>
                    </rtept>
                </rte>
            </gpx>`;

        const result = GPXParser.parse(gpx);

        assertArrayLength(result.routes, 1, 'Should have 1 route');
        assertEquals(result.routes[0].name, 'Test Route', 'Route name should match');
        assertEquals(result.routes[0].desc, 'Route description', 'Route desc should match');
        assertArrayLength(result.routes[0].points, 3, 'Route should have 3 points');

        assertEquals(result.routes[0].points[0].lat, 47.0, 'First point lat');
        assertEquals(result.routes[0].points[0].lon, 8.0, 'First point lon');
        assertEquals(result.routes[0].points[0].ele, 500, 'First point elevation');

        assertEquals(result.routes[0].points[2].lat, 47.2, 'Last point lat');
        assertEquals(result.routes[0].points[2].lon, 8.2, 'Last point lon');
    });

    // Test: Parse track with segments
    test('Parse track with segments', function() {
        const gpx = `<?xml version="1.0"?>
            <gpx version="1.0">
                <trk>
                    <name>Test Track</name>
                    <trkseg>
                        <trkpt lat="47.0" lon="8.0">
                            <ele>500</ele>
                            <time>2024-01-01T10:00:00Z</time>
                        </trkpt>
                        <trkpt lat="47.1" lon="8.1">
                            <ele>600</ele>
                            <time>2024-01-01T10:10:00Z</time>
                        </trkpt>
                    </trkseg>
                    <trkseg>
                        <trkpt lat="47.2" lon="8.2">
                            <ele>700</ele>
                            <time>2024-01-01T11:00:00Z</time>
                        </trkpt>
                        <trkpt lat="47.3" lon="8.3">
                            <ele>800</ele>
                            <time>2024-01-01T11:10:00Z</time>
                        </trkpt>
                    </trkseg>
                </trk>
            </gpx>`;

        const result = GPXParser.parse(gpx);

        assertArrayLength(result.tracks, 1, 'Should have 1 track');
        assertEquals(result.tracks[0].name, 'Test Track', 'Track name should match');
        assertArrayLength(result.tracks[0].segments, 2, 'Track should have 2 segments');

        assertArrayLength(result.tracks[0].segments[0].points, 2, 'First segment should have 2 points');
        assertArrayLength(result.tracks[0].segments[1].points, 2, 'Second segment should have 2 points');

        assertEquals(result.tracks[0].segments[0].points[0].lat, 47.0, 'First point lat');
        assertEquals(result.tracks[0].segments[0].points[0].ele, 500, 'First point elevation');
        assertEquals(result.tracks[0].segments[0].points[0].time, '2024-01-01T10:00:00Z', 'First point time');
    });

    // Test: Parse multiple waypoints
    test('Parse multiple waypoints', function() {
        const gpx = `<?xml version="1.0"?>
            <gpx version="1.0">
                <wpt lat="47.0" lon="8.0">
                    <name>Waypoint 1</name>
                    <desc>First waypoint</desc>
                    <sym>Flag, Blue</sym>
                    <type>Start</type>
                </wpt>
                <wpt lat="47.5" lon="8.5">
                    <name>Waypoint 2</name>
                    <desc>Second waypoint</desc>
                    <sym>Flag, Red</sym>
                    <type>End</type>
                </wpt>
            </gpx>`;

        const result = GPXParser.parse(gpx);

        assertArrayLength(result.waypoints, 2, 'Should have 2 waypoints');

        assertEquals(result.waypoints[0].name, 'Waypoint 1', 'First waypoint name');
        assertEquals(result.waypoints[0].desc, 'First waypoint', 'First waypoint desc');
        assertEquals(result.waypoints[0].sym, 'Flag, Blue', 'First waypoint symbol');
        assertEquals(result.waypoints[0].type, 'Start', 'First waypoint type');

        assertEquals(result.waypoints[1].name, 'Waypoint 2', 'Second waypoint name');
        assertEquals(result.waypoints[1].lat, 47.5, 'Second waypoint lat');
        assertEquals(result.waypoints[1].lon, 8.5, 'Second waypoint lon');
    });

    // Test: Parse mixed content (waypoints, routes, tracks)
    test('Parse mixed content', function() {
        const gpx = `<?xml version="1.0"?>
            <gpx version="1.0">
                <wpt lat="47.0" lon="8.0">
                    <name>Start</name>
                </wpt>
                <rte>
                    <name>Route 1</name>
                    <rtept lat="47.1" lon="8.1"><name>R1</name></rtept>
                    <rtept lat="47.2" lon="8.2"><name>R2</name></rtept>
                </rte>
                <trk>
                    <name>Track 1</name>
                    <trkseg>
                        <trkpt lat="47.3" lon="8.3"><ele>100</ele></trkpt>
                        <trkpt lat="47.4" lon="8.4"><ele>200</ele></trkpt>
                    </trkseg>
                </trk>
                <wpt lat="48.0" lon="9.0">
                    <name>End</name>
                </wpt>
            </gpx>`;

        const result = GPXParser.parse(gpx);

        assertArrayLength(result.waypoints, 2, 'Should have 2 waypoints');
        assertArrayLength(result.routes, 1, 'Should have 1 route');
        assertArrayLength(result.tracks, 1, 'Should have 1 track');
    });

    // Test: Invalid XML
    test('Invalid XML throws error', function() {
        const gpx = `<?xml version="1.0"?>
            <gpx version="1.0">
                <wpt lat="47.0" lon="8.0">
                    <name>Test</name>
                <!-- Missing closing tags`;

        assertThrows(() => GPXParser.parse(gpx), 'Should throw error for invalid XML');
    });

    // Test: Missing GPX root element
    test('Missing GPX root element throws error', function() {
        const xml = `<?xml version="1.0"?>
            <root>
                <wpt lat="47.0" lon="8.0">
                    <name>Test</name>
                </wpt>
            </root>`;

        assertThrows(() => GPXParser.parse(xml), 'Should throw error for missing <gpx> element');
    });

    // Test: Validate valid GPX
    test('Validate valid GPX data', function() {
        const gpxData = {
            version: '1.0',
            metadata: {},
            waypoints: [],
            routes: [{
                name: 'Test Route',
                points: [
                    { lat: 47.0, lon: 8.0 },
                    { lat: 47.1, lon: 8.1 }
                ]
            }],
            tracks: []
        };

        const validation = GPXParser.validate(gpxData);
        assert(validation.valid, 'GPX should be valid');
        assertArrayLength(validation.errors, 0, 'Should have no errors');
    });

    // Test: Validate route with insufficient points
    test('Validate route with insufficient points', function() {
        const gpxData = {
            version: '1.0',
            metadata: {},
            waypoints: [],
            routes: [{
                name: 'Test Route',
                points: [
                    { lat: 47.0, lon: 8.0 }
                ]
            }],
            tracks: []
        };

        const validation = GPXParser.validate(gpxData);
        assert(!validation.valid, 'GPX should be invalid');
        assert(validation.errors.length > 0, 'Should have errors');
        assert(validation.errors[0].includes('at least 2 points'), 'Error should mention point requirement');
    });

    // Test: Validate track with empty segment
    test('Validate track with insufficient points', function() {
        const gpxData = {
            version: '1.0',
            metadata: {},
            waypoints: [],
            routes: [],
            tracks: [{
                name: 'Test Track',
                segments: [{
                    points: [
                        { lat: 47.0, lon: 8.0 }
                    ]
                }]
            }]
        };

        const validation = GPXParser.validate(gpxData);
        assert(!validation.valid, 'GPX should be invalid');
        assert(validation.errors.length > 0, 'Should have errors');
    });

    // Test: Validate empty GPX
    test('Validate empty GPX', function() {
        const gpxData = {
            version: '1.0',
            metadata: {},
            waypoints: [],
            routes: [],
            tracks: []
        };

        const validation = GPXParser.validate(gpxData);
        assert(!validation.valid, 'Empty GPX should be invalid');
        assert(validation.errors[0].includes('at least one waypoint, route, or track'), 'Error should mention empty content');
    });

    // Test: Parse GPX with null/missing optional fields
    test('Parse GPX with missing optional fields', function() {
        const gpx = `<?xml version="1.0"?>
            <gpx version="1.0">
                <wpt lat="47.0" lon="8.0">
                </wpt>
            </gpx>`;

        const result = GPXParser.parse(gpx);

        assertArrayLength(result.waypoints, 1, 'Should have 1 waypoint');
        assertEquals(result.waypoints[0].name, null, 'Name should be null');
        assertEquals(result.waypoints[0].desc, null, 'Desc should be null');
    });

    // Test: Parse negative coordinates
    test('Parse negative coordinates', function() {
        const gpx = `<?xml version="1.0"?>
            <gpx version="1.0">
                <wpt lat="-33.8688" lon="-151.2093">
                    <name>Sydney</name>
                </wpt>
            </gpx>`;

        const result = GPXParser.parse(gpx);

        assertEquals(result.waypoints[0].lat, -33.8688, 'Should parse negative latitude');
        assertEquals(result.waypoints[0].lon, -151.2093, 'Should parse negative longitude');
    });

    // Test: Parse route without name
    test('Parse route without name', function() {
        const gpx = `<?xml version="1.0"?>
            <gpx version="1.0">
                <rte>
                    <rtept lat="47.0" lon="8.0"></rtept>
                    <rtept lat="47.1" lon="8.1"></rtept>
                </rte>
            </gpx>`;

        const result = GPXParser.parse(gpx);

        assertArrayLength(result.routes, 1, 'Should have 1 route');
        assertEquals(result.routes[0].name, null, 'Route name should be null');
        assertArrayLength(result.routes[0].points, 2, 'Should have 2 points');
    });

    // Test: Parse multiple routes
    test('Parse multiple routes', function() {
        const gpx = `<?xml version="1.0"?>
            <gpx version="1.0">
                <rte>
                    <name>Route 1</name>
                    <rtept lat="47.0" lon="8.0"></rtept>
                    <rtept lat="47.1" lon="8.1"></rtept>
                </rte>
                <rte>
                    <name>Route 2</name>
                    <rtept lat="48.0" lon="9.0"></rtept>
                    <rtept lat="48.1" lon="9.1"></rtept>
                </rte>
            </gpx>`;

        const result = GPXParser.parse(gpx);

        assertArrayLength(result.routes, 2, 'Should have 2 routes');
        assertEquals(result.routes[0].name, 'Route 1', 'First route name');
        assertEquals(result.routes[1].name, 'Route 2', 'Second route name');
    });

    // Test: Parse multiple tracks
    test('Parse multiple tracks', function() {
        const gpx = `<?xml version="1.0"?>
            <gpx version="1.0">
                <trk>
                    <name>Track 1</name>
                    <trkseg>
                        <trkpt lat="47.0" lon="8.0"></trkpt>
                        <trkpt lat="47.1" lon="8.1"></trkpt>
                    </trkseg>
                </trk>
                <trk>
                    <name>Track 2</name>
                    <trkseg>
                        <trkpt lat="48.0" lon="9.0"></trkpt>
                        <trkpt lat="48.1" lon="9.1"></trkpt>
                    </trkseg>
                </trk>
            </gpx>`;

        const result = GPXParser.parse(gpx);

        assertArrayLength(result.tracks, 2, 'Should have 2 tracks');
        assertEquals(result.tracks[0].name, 'Track 1', 'First track name');
        assertEquals(result.tracks[1].name, 'Track 2', 'Second track name');
    });

    /**
     * Run all tests
     */
    function runTests() {
        passed = 0;
        failed = 0;

        console.log('Running GPX Parser Module Tests...\n');

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
