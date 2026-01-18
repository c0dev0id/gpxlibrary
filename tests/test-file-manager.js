/**
 * Unit Tests for File Manager Module
 */

const FileManagerTests = (function() {
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

    function assertGreaterThan(actual, expected, message) {
        if (actual <= expected) {
            throw new Error(message || `Expected ${actual} to be greater than ${expected}`);
        }
    }

    // Test: Create folder at root level
    test('Create folder at root level', async function() {
        const folderId = await FileManager.createFolder('Test Folder Root');

        assertGreaterThan(folderId, 0, 'Should return valid folder ID');

        const contents = FileManager.getFolderContents(null);
        const folder = contents.folders.find(f => f.id === folderId);

        assertNotNull(folder, 'Folder should exist in root');
        assertEquals(folder.name, 'Test Folder Root', 'Folder name should match');

        // Cleanup
        await Database.execute('DELETE FROM folders WHERE id = ?', [folderId]);
    });

    // Test: Create nested folder
    test('Create nested folder', async function() {
        const parentId = await FileManager.createFolder('Parent Folder');
        const childId = await FileManager.createFolder('Child Folder', parentId);

        assertGreaterThan(childId, 0, 'Child folder ID should be valid');

        const contents = FileManager.getFolderContents(parentId);
        const childFolder = contents.folders.find(f => f.id === childId);

        assertNotNull(childFolder, 'Child folder should exist');
        assertEquals(childFolder.name, 'Child Folder', 'Child folder name should match');
        assertEquals(childFolder.parent_id, parentId, 'Parent ID should match');

        // Cleanup
        await Database.execute('DELETE FROM folders WHERE id IN (?, ?)', [parentId, childId]);
    });

    // Test: Get folder contents
    test('Get folder contents (folders and GPX files)', async function() {
        const folderId = await FileManager.createFolder('Test Folder');

        // Create subfolder
        const subFolderId = await FileManager.createFolder('Sub Folder', folderId);

        // Create GPX file
        const gpxId = await Database.execute(
            `INSERT INTO gpx_files (name, folder_id, content, length_km, waypoint_count, riding_time_hours, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['Test GPX', folderId, '<gpx></gpx>', 100, 5, 2, Date.now()]
        );

        const contents = FileManager.getFolderContents(folderId);

        assertArrayLength(contents.folders, 1, 'Should have 1 subfolder');
        assertArrayLength(contents.gpxFiles, 1, 'Should have 1 GPX file');
        assertEquals(contents.folders[0].name, 'Sub Folder', 'Subfolder name should match');
        assertEquals(contents.gpxFiles[0].name, 'Test GPX', 'GPX file name should match');

        // Cleanup
        await Database.execute('DELETE FROM gpx_files WHERE id = ?', [gpxId]);
        await Database.execute('DELETE FROM folders WHERE id IN (?, ?)', [folderId, subFolderId]);
    });

    // Test: Get GPX file by ID
    test('Get GPX file by ID', async function() {
        const gpxId = await Database.execute(
            `INSERT INTO gpx_files (name, folder_id, content, length_km, waypoint_count, riding_time_hours, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['Test Route', null, '<gpx></gpx>', 150, 10, 3, Date.now()]
        );

        const gpxFile = FileManager.getGpxFile(gpxId);

        assertNotNull(gpxFile, 'GPX file should be found');
        assertEquals(gpxFile.id, gpxId, 'GPX ID should match');
        assertEquals(gpxFile.name, 'Test Route', 'GPX name should match');
        assertEquals(gpxFile.length_km, 150, 'Length should match');
        assertEquals(gpxFile.waypoint_count, 10, 'Waypoint count should match');

        // Cleanup
        await Database.execute('DELETE FROM gpx_files WHERE id = ?', [gpxId]);
    });

    // Test: Get GPX file that doesn't exist
    test('Get non-existent GPX file returns null', function() {
        const gpxFile = FileManager.getGpxFile(99999);
        assertEquals(gpxFile, null, 'Should return null for non-existent file');
    });

    // Test: Get GPX contents
    test('Get GPX contents (routes, tracks, waypoints)', async function() {
        // Create GPX file
        const gpxId = await Database.execute(
            `INSERT INTO gpx_files (name, folder_id, content, length_km, waypoint_count, riding_time_hours, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['Test GPX', null, '<gpx></gpx>', 100, 5, 2, Date.now()]
        );

        // Add routes
        await Database.execute(
            'INSERT INTO routes (gpx_file_id, index_in_gpx, name, length_km, riding_time_hours) VALUES (?, ?, ?, ?, ?)',
            [gpxId, 0, 'Route 1', 50, 1]
        );
        await Database.execute(
            'INSERT INTO routes (gpx_file_id, index_in_gpx, name, length_km, riding_time_hours) VALUES (?, ?, ?, ?, ?)',
            [gpxId, 1, 'Route 2', 60, 1.2]
        );

        // Add tracks
        await Database.execute(
            'INSERT INTO tracks (gpx_file_id, index_in_gpx, name, length_km, riding_time_hours) VALUES (?, ?, ?, ?, ?)',
            [gpxId, 0, 'Track 1', 70, 1.4]
        );

        // Add waypoints
        await Database.execute(
            'INSERT INTO waypoints (gpx_file_id, index_in_gpx, name, lat, lon) VALUES (?, ?, ?, ?, ?)',
            [gpxId, 0, 'Waypoint 1', 47.5, 8.5]
        );

        const contents = FileManager.getGpxContents(gpxId);

        assertArrayLength(contents.routes, 2, 'Should have 2 routes');
        assertArrayLength(contents.tracks, 1, 'Should have 1 track');
        assertArrayLength(contents.waypoints, 1, 'Should have 1 waypoint');

        assertEquals(contents.routes[0].name, 'Route 1', 'First route name');
        assertEquals(contents.routes[1].name, 'Route 2', 'Second route name');
        assertEquals(contents.tracks[0].name, 'Track 1', 'Track name');
        assertEquals(contents.waypoints[0].name, 'Waypoint 1', 'Waypoint name');

        // Cleanup
        await Database.execute('DELETE FROM gpx_files WHERE id = ?', [gpxId]);
    });

    // Test: Rename folder
    test('Rename folder', async function() {
        const folderId = await FileManager.createFolder('Old Name');

        await FileManager.renameFolder(folderId, 'New Name');

        const result = Database.query('SELECT * FROM folders WHERE id = ?', [folderId]);
        assertEquals(result[0].name, 'New Name', 'Folder should be renamed');

        // Cleanup
        await Database.execute('DELETE FROM folders WHERE id = ?', [folderId]);
    });

    // Test: Rename GPX file
    test('Rename GPX file', async function() {
        const gpxId = await Database.execute(
            `INSERT INTO gpx_files (name, folder_id, content, length_km, waypoint_count, riding_time_hours, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['Old GPX Name', null, '<gpx></gpx>', 100, 5, 2, Date.now()]
        );

        await FileManager.renameGpxFile(gpxId, 'New GPX Name');

        const result = Database.query('SELECT * FROM gpx_files WHERE id = ?', [gpxId]);
        assertEquals(result[0].name, 'New GPX Name', 'GPX file should be renamed');

        // Cleanup
        await Database.execute('DELETE FROM gpx_files WHERE id = ?', [gpxId]);
    });

    // Test: Rename route
    test('Rename route', async function() {
        const gpxId = await Database.execute(
            `INSERT INTO gpx_files (name, folder_id, content, length_km, waypoint_count, riding_time_hours, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['Test GPX', null, '<gpx></gpx>', 100, 5, 2, Date.now()]
        );

        const routeId = await Database.execute(
            'INSERT INTO routes (gpx_file_id, index_in_gpx, name, length_km, riding_time_hours) VALUES (?, ?, ?, ?, ?)',
            [gpxId, 0, 'Old Route Name', 50, 1]
        );

        await FileManager.renameRoute(routeId, 'New Route Name');

        const result = Database.query('SELECT * FROM routes WHERE id = ?', [routeId]);
        assertEquals(result[0].name, 'New Route Name', 'Route should be renamed');

        // Cleanup
        await Database.execute('DELETE FROM gpx_files WHERE id = ?', [gpxId]);
    });

    // Test: Rename track
    test('Rename track', async function() {
        const gpxId = await Database.execute(
            `INSERT INTO gpx_files (name, folder_id, content, length_km, waypoint_count, riding_time_hours, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['Test GPX', null, '<gpx></gpx>', 100, 5, 2, Date.now()]
        );

        const trackId = await Database.execute(
            'INSERT INTO tracks (gpx_file_id, index_in_gpx, name, length_km, riding_time_hours) VALUES (?, ?, ?, ?, ?)',
            [gpxId, 0, 'Old Track Name', 70, 1.4]
        );

        await FileManager.renameTrack(trackId, 'New Track Name');

        const result = Database.query('SELECT * FROM tracks WHERE id = ?', [trackId]);
        assertEquals(result[0].name, 'New Track Name', 'Track should be renamed');

        // Cleanup
        await Database.execute('DELETE FROM gpx_files WHERE id = ?', [gpxId]);
    });

    // Test: Rename waypoint
    test('Rename waypoint', async function() {
        const gpxId = await Database.execute(
            `INSERT INTO gpx_files (name, folder_id, content, length_km, waypoint_count, riding_time_hours, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['Test GPX', null, '<gpx></gpx>', 100, 5, 2, Date.now()]
        );

        const waypointId = await Database.execute(
            'INSERT INTO waypoints (gpx_file_id, index_in_gpx, name, lat, lon) VALUES (?, ?, ?, ?, ?)',
            [gpxId, 0, 'Old Waypoint Name', 47.5, 8.5]
        );

        await FileManager.renameWaypoint(waypointId, 'New Waypoint Name');

        const result = Database.query('SELECT * FROM waypoints WHERE id = ?', [waypointId]);
        assertEquals(result[0].name, 'New Waypoint Name', 'Waypoint should be renamed');

        // Cleanup
        await Database.execute('DELETE FROM gpx_files WHERE id = ?', [gpxId]);
    });

    // Test: Delete folder
    test('Delete folder', async function() {
        const folderId = await FileManager.createFolder('To Delete');

        await FileManager.deleteFolder(folderId);

        const result = Database.query('SELECT * FROM folders WHERE id = ?', [folderId]);
        assertArrayLength(result, 0, 'Folder should be deleted');
    });

    // Test: Delete GPX file
    test('Delete GPX file', async function() {
        const gpxId = await Database.execute(
            `INSERT INTO gpx_files (name, folder_id, content, length_km, waypoint_count, riding_time_hours, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['To Delete', null, '<gpx></gpx>', 100, 5, 2, Date.now()]
        );

        await FileManager.deleteGpxFile(gpxId);

        const result = Database.query('SELECT * FROM gpx_files WHERE id = ?', [gpxId]);
        assertArrayLength(result, 0, 'GPX file should be deleted');
    });

    // Test: Get folder path - root
    test('Get folder path - root', function() {
        const path = FileManager.getFolderPath(null);
        assertEquals(path, '/', 'Root path should be /');
    });

    // Test: Get folder path - nested
    test('Get folder path - nested folders', async function() {
        const folderId1 = await FileManager.createFolder('Level1');
        const folderId2 = await FileManager.createFolder('Level2', folderId1);
        const folderId3 = await FileManager.createFolder('Level3', folderId2);

        const path = FileManager.getFolderPath(folderId3);
        assertEquals(path, '/Level1/Level2/Level3', 'Path should show full hierarchy');

        // Cleanup
        await Database.execute('DELETE FROM folders WHERE id IN (?, ?, ?)', [folderId1, folderId2, folderId3]);
    });

    // Test: Current folder ID state management
    test('Current folder ID state management', function() {
        const originalId = FileManager.getCurrentFolderId();

        FileManager.setCurrentFolderId(5);
        assertEquals(FileManager.getCurrentFolderId(), 5, 'Current folder ID should be 5');

        FileManager.setCurrentFolderId(null);
        assertEquals(FileManager.getCurrentFolderId(), null, 'Current folder ID should be null');

        // Restore
        FileManager.setCurrentFolderId(originalId);
    });

    // Test: Current GPX ID state management
    test('Current GPX ID state management', function() {
        const originalId = FileManager.getCurrentGpxId();

        FileManager.setCurrentGpxId(10);
        assertEquals(FileManager.getCurrentGpxId(), 10, 'Current GPX ID should be 10');

        FileManager.setCurrentGpxId(null);
        assertEquals(FileManager.getCurrentGpxId(), null, 'Current GPX ID should be null');

        // Restore
        FileManager.setCurrentGpxId(originalId);
    });

    // Test: Selection state management
    test('Selection state management', function() {
        // Clear selection
        FileManager.clearSelection();
        assertArrayLength(FileManager.getSelectedItems(), 0, 'Selection should be empty');

        // Add items
        FileManager.addSelectedItem({ type: 'gpx', id: 1 });
        assertArrayLength(FileManager.getSelectedItems(), 1, 'Should have 1 selected item');

        FileManager.addSelectedItem({ type: 'route', id: 2 });
        assertArrayLength(FileManager.getSelectedItems(), 2, 'Should have 2 selected items');

        // Remove item
        FileManager.removeSelectedItem({ type: 'gpx', id: 1 });
        assertArrayLength(FileManager.getSelectedItems(), 1, 'Should have 1 selected item after removal');

        // Clear all
        FileManager.clearSelection();
        assertArrayLength(FileManager.getSelectedItems(), 0, 'Selection should be empty after clear');
    });

    // Test: Toggle selection
    test('Toggle selection', function() {
        FileManager.clearSelection();

        const item = { type: 'gpx', id: 1 };

        // Toggle on
        FileManager.toggleSelectedItem(item);
        assertArrayLength(FileManager.getSelectedItems(), 1, 'Should have 1 selected item');

        // Toggle off
        FileManager.toggleSelectedItem(item);
        assertArrayLength(FileManager.getSelectedItems(), 0, 'Should have 0 selected items');

        // Toggle on again
        FileManager.toggleSelectedItem(item);
        assertArrayLength(FileManager.getSelectedItems(), 1, 'Should have 1 selected item again');

        // Cleanup
        FileManager.clearSelection();
    });

    /**
     * Run all tests
     */
    async function runTests() {
        passed = 0;
        failed = 0;

        console.log('Running File Manager Module Tests...\n');

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
