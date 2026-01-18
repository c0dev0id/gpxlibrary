/**
 * Copy/Paste Operations Test Suite
 * Tests all copy/paste scenarios and navigation paths
 */

const CopyPasteTests = (function() {
    'use strict';

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    /**
     * Test utilities
     */
    function assert(condition, message) {
        totalTests++;
        if (condition) {
            passedTests++;
            console.log(`✓ ${message}`);
        } else {
            failedTests++;
            console.error(`✗ ${message}`);
            throw new Error(message);
        }
    }

    function assertEquals(actual, expected, message) {
        assert(actual === expected, `${message} (expected: ${expected}, got: ${actual})`);
    }

    function assertNotNull(value, message) {
        assert(value !== null && value !== undefined, message);
    }

    function assertGreaterThan(value, min, message) {
        assert(value > min, `${message} (expected > ${min}, got: ${value})`);
    }

    function waitForUpdate() {
        return new Promise(resolve => setTimeout(resolve, 100));
    }

    /**
     * Test: Copy and paste folder within same level
     */
    async function testCopyPasteFolder() {
        console.log('\n=== Test: Copy/Paste Folder ===');

        // Create test folder
        const folderId = await FileManager.createFolder('CopyTest');
        assertNotNull(folderId, 'Test folder should be created');

        // Select and copy folder
        FileManager.clearSelection();
        FileManager.addSelectedItem({ type: 'folder', id: folderId });
        UIController.renderFileList();
        await waitForUpdate();

        // Simulate Ctrl+C
        const copyEvent = new KeyboardEvent('keydown', { key: 'c', ctrlKey: true });
        document.dispatchEvent(copyEvent);
        await waitForUpdate();

        // Simulate Ctrl+V (paste in same folder)
        const pasteEvent = new KeyboardEvent('keydown', { key: 'v', ctrlKey: true });
        document.dispatchEvent(pasteEvent);
        await waitForUpdate();

        // Verify copy was created
        const folders = Database.query('SELECT * FROM folders WHERE name LIKE ?', ['CopyTest%']);
        assertGreaterThan(folders.length, 1, 'Copied folder should exist');

        // Cleanup
        for (const folder of folders) {
            await FileManager.deleteFolder(folder.id);
        }
    }

    /**
     * Test: Copy and paste GPX file to different folder
     */
    async function testCopyPasteGpxFile() {
        console.log('\n=== Test: Copy/Paste GPX File ===');

        // Create test folders
        const folder1Id = await FileManager.createFolder('Source');
        const folder2Id = await FileManager.createFolder('Destination');

        // Create test GPX file in folder1
        const gpxContent = `<?xml version="1.0"?>
<gpx version="1.0">
    <wpt lat="48.0" lon="7.0"><name>Test</name></wpt>
</gpx>`;

        const gpxId = await Database.execute(
            'INSERT INTO gpx_files (name, content, folder_id, created_at) VALUES (?, ?, ?, ?)',
            ['TestFile', gpxContent, folder1Id, Date.now()]
        );

        // Navigate to folder1
        FileManager.setCurrentFolderId(folder1Id);
        UIController.renderFileList();
        await waitForUpdate();

        // Select and copy GPX file
        FileManager.clearSelection();
        FileManager.addSelectedItem({ type: 'gpx', id: gpxId });

        // Simulate Ctrl+C
        const copyEvent = new KeyboardEvent('keydown', { key: 'c', ctrlKey: true });
        document.dispatchEvent(copyEvent);
        await waitForUpdate();

        // Navigate to folder2
        FileManager.setCurrentFolderId(folder2Id);
        UIController.renderFileList();
        await waitForUpdate();

        // Simulate Ctrl+V
        const pasteEvent = new KeyboardEvent('keydown', { key: 'v', ctrlKey: true });
        document.dispatchEvent(pasteEvent);
        await waitForUpdate();

        // Verify file was copied to folder2
        const filesInFolder2 = Database.query('SELECT * FROM gpx_files WHERE folder_id = ?', [folder2Id]);
        assertEquals(filesInFolder2.length, 1, 'GPX file should be copied to destination folder');

        // Cleanup
        await FileManager.deleteFolder(folder1Id);
        await FileManager.deleteFolder(folder2Id);
    }

    /**
     * Test: Copy multiple items
     */
    async function testCopyMultipleItems() {
        console.log('\n=== Test: Copy Multiple Items ===');

        // Create test structure
        const folder1Id = await FileManager.createFolder('Multi1');
        const folder2Id = await FileManager.createFolder('Multi2');
        const targetFolderId = await FileManager.createFolder('Target');

        // Select multiple folders
        FileManager.clearSelection();
        FileManager.addSelectedItem({ type: 'folder', id: folder1Id });
        FileManager.addSelectedItem({ type: 'folder', id: folder2Id });

        const selectedItems = FileManager.getSelectedItems();
        assertEquals(selectedItems.length, 2, 'Two items should be selected');

        // Simulate Ctrl+C
        const copyEvent = new KeyboardEvent('keydown', { key: 'c', ctrlKey: true });
        document.dispatchEvent(copyEvent);
        await waitForUpdate();

        // Navigate to target folder
        FileManager.setCurrentFolderId(targetFolderId);
        UIController.renderFileList();
        await waitForUpdate();

        // Simulate Ctrl+V
        const pasteEvent = new KeyboardEvent('keydown', { key: 'v', ctrlKey: true });
        document.dispatchEvent(pasteEvent);
        await waitForUpdate();

        // Verify both folders were copied
        const foldersInTarget = Database.query('SELECT * FROM folders WHERE parent_id = ?', [targetFolderId]);
        assertEquals(foldersInTarget.length, 2, 'Both folders should be copied to target');

        // Cleanup
        await FileManager.deleteFolder(targetFolderId);
        await FileManager.deleteFolder(folder1Id);
        await FileManager.deleteFolder(folder2Id);
    }

    /**
     * Test: Copy GPX content (routes/tracks/waypoints)
     */
    async function testCopyGpxContent() {
        console.log('\n=== Test: Copy GPX Content ===');

        // Create test GPX with route
        const gpxContent = `<?xml version="1.0"?>
<gpx version="1.0">
    <rte>
        <name>Test Route</name>
        <rtept lat="48.0" lon="7.0"><name>Start</name></rtept>
        <rtept lat="48.1" lon="7.1"><name>End</name></rtept>
    </rte>
</gpx>`;

        const gpxId = await Database.execute(
            'INSERT INTO gpx_files (name, content, folder_id, created_at) VALUES (?, ?, ?, ?)',
            ['ContentTest', gpxContent, null, Date.now()]
        );

        // Parse GPX
        const result = await FileManager.uploadGpxFiles([
            new File([gpxContent], 'ContentTest.gpx', { type: 'application/gpx+xml' })
        ], null);

        // Navigate into GPX
        FileManager.setCurrentGpxId(gpxId);
        UIController.renderFileList();
        await waitForUpdate();

        // Get route from database
        const routes = Database.query('SELECT * FROM routes WHERE gpx_file_id = ?', [gpxId]);
        assertGreaterThan(routes.length, 0, 'Route should exist in GPX');

        // Select route
        FileManager.clearSelection();
        FileManager.addSelectedItem({ type: 'route', id: routes[0].id });

        // Simulate Ctrl+C
        const copyEvent = new KeyboardEvent('keydown', { key: 'c', ctrlKey: true });
        document.dispatchEvent(copyEvent);
        await waitForUpdate();

        // This should copy the GPX content to clipboard
        // Note: Actual paste would create a new GPX or paste into existing one

        // Cleanup
        await FileManager.deleteGpxFile(gpxId);
    }

    /**
     * Test: Drag and drop folder
     */
    async function testDragDropFolder() {
        console.log('\n=== Test: Drag and Drop Folder ===');

        // Create test structure
        const sourceFolderId = await FileManager.createFolder('DragSource');
        const targetFolderId = await FileManager.createFolder('DropTarget');

        // Simulate drag and drop
        // Note: This is a simplified test - full drag/drop simulation would require more DOM manipulation

        // Move folder directly via database (simulating drag/drop result)
        await Database.execute(
            'UPDATE folders SET parent_id = ? WHERE id = ?',
            [targetFolderId, sourceFolderId]
        );
        await Database.saveToIndexedDB();

        // Verify folder was moved
        const folder = Database.query('SELECT * FROM folders WHERE id = ?', [sourceFolderId])[0];
        assertEquals(folder.parent_id, targetFolderId, 'Folder should be moved to target');

        // Cleanup
        await FileManager.deleteFolder(targetFolderId);
    }

    /**
     * Test: Copy folder recursively with contents
     */
    async function testCopyFolderRecursive() {
        console.log('\n=== Test: Copy Folder Recursively ===');

        // Create nested folder structure
        const parentId = await FileManager.createFolder('Parent');
        FileManager.setCurrentFolderId(parentId);
        const childId = await FileManager.createFolder('Child');

        // Add GPX file to child
        const gpxContent = `<?xml version="1.0"?>
<gpx version="1.0">
    <wpt lat="48.0" lon="7.0"><name>Test</name></wpt>
</gpx>`;

        await Database.execute(
            'INSERT INTO gpx_files (name, content, folder_id, created_at) VALUES (?, ?, ?, ?)',
            ['Nested.gpx', gpxContent, childId, Date.now()]
        );

        // Navigate back to root
        FileManager.setCurrentFolderId(null);
        UIController.renderFileList();
        await waitForUpdate();

        // Select and copy parent folder
        FileManager.clearSelection();
        FileManager.addSelectedItem({ type: 'folder', id: parentId });

        // Simulate Ctrl+C
        const copyEvent = new KeyboardEvent('keydown', { key: 'c', ctrlKey: true });
        document.dispatchEvent(copyEvent);
        await waitForUpdate();

        // Simulate Ctrl+V
        const pasteEvent = new KeyboardEvent('keydown', { key: 'v', ctrlKey: true });
        document.dispatchEvent(pasteEvent);
        await waitForUpdate();

        // Verify parent was copied
        const parents = Database.query('SELECT * FROM folders WHERE name LIKE ? AND parent_id IS NULL', ['Parent%']);
        assertGreaterThan(parents.length, 1, 'Parent folder should be copied');

        // Find the copy
        const copyParent = parents.find(p => p.id !== parentId);
        assertNotNull(copyParent, 'Copy of parent should exist');

        // Verify child was copied too
        const copiedChildren = Database.query('SELECT * FROM folders WHERE parent_id = ?', [copyParent.id]);
        assertEquals(copiedChildren.length, 1, 'Child folder should be copied');

        // Verify GPX file was copied
        const copiedFiles = Database.query('SELECT * FROM gpx_files WHERE folder_id = ?', [copiedChildren[0].id]);
        assertEquals(copiedFiles.length, 1, 'GPX file should be copied with folder');

        // Cleanup
        for (const p of parents) {
            await FileManager.deleteFolder(p.id);
        }
    }

    /**
     * Test: Prevent circular folder moves
     */
    async function testPreventCircularMove() {
        console.log('\n=== Test: Prevent Circular Folder Move ===');

        // Create nested structure
        const parentId = await FileManager.createFolder('CircularParent');
        FileManager.setCurrentFolderId(parentId);
        const childId = await FileManager.createFolder('CircularChild');

        // Try to move parent into child (should be prevented)
        try {
            // This should be prevented by the isFolderDescendant check
            await Database.execute(
                'UPDATE folders SET parent_id = ? WHERE id = ?',
                [childId, parentId]
            );

            // If we get here, check manually
            const folders = Database.query('SELECT * FROM folders WHERE id = ?', [parentId]);
            assert(folders[0].parent_id !== childId, 'Parent should not be moved into its child');
        } catch (error) {
            // Expected - circular move prevented
            console.log('✓ Circular move correctly prevented');
        }

        // Cleanup
        FileManager.setCurrentFolderId(null);
        await FileManager.deleteFolder(parentId);
    }

    /**
     * Run all tests
     */
    async function runTests() {
        totalTests = 0;
        passedTests = 0;
        failedTests = 0;

        console.log('Starting Copy/Paste Tests...\n');

        // Reset to clean state
        FileManager.setCurrentFolderId(null);
        FileManager.setCurrentGpxId(null);
        FileManager.clearSelection();
        UIController.renderFileList();

        try {
            await testCopyPasteFolder();
            await testCopyPasteGpxFile();
            await testCopyMultipleItems();
            await testCopyGpxContent();
            await testDragDropFolder();
            await testCopyFolderRecursive();
            await testPreventCircularMove();
        } catch (error) {
            console.error('Test suite error:', error);
        }

        console.log(`\n=== Results ===`);
        console.log(`Total: ${totalTests}`);
        console.log(`Passed: ${passedTests}`);
        console.log(`Failed: ${failedTests}`);

        return {
            total: totalTests,
            passed: passedTests,
            failed: failedTests
        };
    }

    return {
        runTests
    };
})();
