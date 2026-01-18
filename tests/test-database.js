/**
 * Unit Tests for Database Module
 */

const DatabaseTests = (function() {
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

    function assertGreaterThan(actual, expected, message) {
        if (actual <= expected) {
            throw new Error(message || `Expected ${actual} to be greater than ${expected}`);
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

    // Test: Database initialization
    test('Database initialization', async function() {
        assertNotNull(Database, 'Database module should be loaded');
    });

    // Test: Execute INSERT and get last insert ID
    test('Execute INSERT and getLastInsertId', async function() {
        const timestamp = Date.now();
        const folderId = await Database.execute(
            'INSERT INTO folders (name, parent_id, created_at) VALUES (?, ?, ?)',
            ['Test Folder', null, timestamp]
        );

        assertGreaterThan(folderId, 0, 'Insert should return valid ID');

        // Verify the folder was inserted
        const result = Database.query('SELECT * FROM folders WHERE id = ?', [folderId]);
        assertEquals(result.length, 1, 'Should find one folder');
        assertEquals(result[0].name, 'Test Folder', 'Folder name should match');

        // Cleanup
        await Database.execute('DELETE FROM folders WHERE id = ?', [folderId]);
    });

    // Test: Query with parameters
    test('Query with parameters', async function() {
        const timestamp = Date.now();
        const folderId = await Database.execute(
            'INSERT INTO folders (name, parent_id, created_at) VALUES (?, ?, ?)',
            ['Query Test Folder', null, timestamp]
        );

        const result = Database.query('SELECT * FROM folders WHERE name = ?', ['Query Test Folder']);
        assertEquals(result.length, 1, 'Should find one folder');
        assertEquals(result[0].id, folderId, 'ID should match');

        // Cleanup
        await Database.execute('DELETE FROM folders WHERE id = ?', [folderId]);
    });

    // Test: Query with NULL parameter
    test('Query with NULL parameter', async function() {
        const timestamp = Date.now();
        const folderId = await Database.execute(
            'INSERT INTO folders (name, parent_id, created_at) VALUES (?, ?, ?)',
            ['Root Folder', null, timestamp]
        );

        const result = Database.query('SELECT * FROM folders WHERE parent_id IS ?', [null]);
        assertGreaterThan(result.length, 0, 'Should find at least one root folder');

        // Cleanup
        await Database.execute('DELETE FROM folders WHERE id = ?', [folderId]);
    });

    // Test: UPDATE operation
    test('UPDATE operation', async function() {
        const timestamp = Date.now();
        const folderId = await Database.execute(
            'INSERT INTO folders (name, parent_id, created_at) VALUES (?, ?, ?)',
            ['Old Name', null, timestamp]
        );

        await Database.execute('UPDATE folders SET name = ? WHERE id = ?', ['New Name', folderId]);

        const result = Database.query('SELECT * FROM folders WHERE id = ?', [folderId]);
        assertEquals(result[0].name, 'New Name', 'Folder name should be updated');

        // Cleanup
        await Database.execute('DELETE FROM folders WHERE id = ?', [folderId]);
    });

    // Test: DELETE operation
    test('DELETE operation', async function() {
        const timestamp = Date.now();
        const folderId = await Database.execute(
            'INSERT INTO folders (name, parent_id, created_at) VALUES (?, ?, ?)',
            ['To Delete', null, timestamp]
        );

        await Database.execute('DELETE FROM folders WHERE id = ?', [folderId]);

        const result = Database.query('SELECT * FROM folders WHERE id = ?', [folderId]);
        assertEquals(result.length, 0, 'Folder should be deleted');
    });

    // Test: Foreign key cascade delete
    test('Foreign key cascade delete', async function() {
        const timestamp = Date.now();

        // Create folder
        const folderId = await Database.execute(
            'INSERT INTO folders (name, parent_id, created_at) VALUES (?, ?, ?)',
            ['Test Folder', null, timestamp]
        );

        // Create GPX file in folder
        const gpxId = await Database.execute(
            `INSERT INTO gpx_files (name, folder_id, content, length_km, waypoint_count, riding_time_hours, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['Test GPX', folderId, '<gpx></gpx>', 100, 5, 2, timestamp]
        );

        // Create route in GPX file
        await Database.execute(
            'INSERT INTO routes (gpx_file_id, index_in_gpx, name, length_km, riding_time_hours) VALUES (?, ?, ?, ?, ?)',
            [gpxId, 0, 'Test Route', 50, 1]
        );

        // Delete GPX file - should cascade delete routes
        await Database.execute('DELETE FROM gpx_files WHERE id = ?', [gpxId]);

        const routes = Database.query('SELECT * FROM routes WHERE gpx_file_id = ?', [gpxId]);
        assertEquals(routes.length, 0, 'Routes should be cascade deleted');

        // Cleanup
        await Database.execute('DELETE FROM folders WHERE id = ?', [folderId]);
    });

    // Test: Multiple inserts and batch query
    test('Multiple inserts and batch query', async function() {
        const timestamp = Date.now();

        const id1 = await Database.execute(
            'INSERT INTO folders (name, parent_id, created_at) VALUES (?, ?, ?)',
            ['Folder 1', null, timestamp]
        );
        const id2 = await Database.execute(
            'INSERT INTO folders (name, parent_id, created_at) VALUES (?, ?, ?)',
            ['Folder 2', null, timestamp]
        );
        const id3 = await Database.execute(
            'INSERT INTO folders (name, parent_id, created_at) VALUES (?, ?, ?)',
            ['Folder 3', null, timestamp]
        );

        const result = Database.query(
            'SELECT * FROM folders WHERE id IN (?, ?, ?) ORDER BY id',
            [id1, id2, id3]
        );
        assertEquals(result.length, 3, 'Should find all three folders');
        assertEquals(result[0].name, 'Folder 1', 'First folder name should match');
        assertEquals(result[2].name, 'Folder 3', 'Third folder name should match');

        // Cleanup
        await Database.execute('DELETE FROM folders WHERE id IN (?, ?, ?)', [id1, id2, id3]);
    });

    // Test: Query ordering
    test('Query with ORDER BY', async function() {
        const timestamp = Date.now();

        const id1 = await Database.execute(
            'INSERT INTO folders (name, parent_id, created_at) VALUES (?, ?, ?)',
            ['Z Folder', null, timestamp]
        );
        const id2 = await Database.execute(
            'INSERT INTO folders (name, parent_id, created_at) VALUES (?, ?, ?)',
            ['A Folder', null, timestamp]
        );
        const id3 = await Database.execute(
            'INSERT INTO folders (name, parent_id, created_at) VALUES (?, ?, ?)',
            ['M Folder', null, timestamp]
        );

        const result = Database.query(
            'SELECT * FROM folders WHERE id IN (?, ?, ?) ORDER BY name',
            [id1, id2, id3]
        );

        assertEquals(result[0].name, 'A Folder', 'First should be A Folder');
        assertEquals(result[1].name, 'M Folder', 'Second should be M Folder');
        assertEquals(result[2].name, 'Z Folder', 'Third should be Z Folder');

        // Cleanup
        await Database.execute('DELETE FROM folders WHERE id IN (?, ?, ?)', [id1, id2, id3]);
    });

    // Test: Check if migrations add index_in_gpx columns
    test('Migration: index_in_gpx columns exist', function() {
        const routesColumns = Database.query("PRAGMA table_info(routes)");
        const hasRoutesIndex = routesColumns.some(col => col.name === 'index_in_gpx');
        assert(hasRoutesIndex, 'routes table should have index_in_gpx column');

        const tracksColumns = Database.query("PRAGMA table_info(tracks)");
        const hasTracksIndex = tracksColumns.some(col => col.name === 'index_in_gpx');
        assert(hasTracksIndex, 'tracks table should have index_in_gpx column');

        const waypointsColumns = Database.query("PRAGMA table_info(waypoints)");
        const hasWaypointsIndex = waypointsColumns.some(col => col.name === 'index_in_gpx');
        assert(hasWaypointsIndex, 'waypoints table should have index_in_gpx column');
    });

    // Test: Check if routing_strategy column exists
    test('Migration: routing_strategy column exists', function() {
        const routesColumns = Database.query("PRAGMA table_info(routes)");
        const hasRoutingStrategy = routesColumns.some(col => col.name === 'routing_strategy');
        assert(hasRoutingStrategy, 'routes table should have routing_strategy column');
    });

    /**
     * Run all tests
     */
    async function runTests() {
        passed = 0;
        failed = 0;

        console.log('Running Database Module Tests...\n');

        for (const {name, fn} of tests) {
            try {
                await fn();
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
