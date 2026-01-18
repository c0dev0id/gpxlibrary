/**
 * Unit Tests for Breadcrumb Navigation
 */

const BreadcrumbNavigationTests = (function() {
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

    /**
     * Helper to wait for DOM updates
     */
    function waitForUpdate() {
        return new Promise(resolve => setTimeout(resolve, 50));
    }

    /**
     * Helper to simulate breadcrumb click
     */
    function clickBreadcrumb(linkClass) {
        const $link = $(`.breadcrumb ${linkClass}`);
        if ($link.length === 0) {
            throw new Error(`Breadcrumb link ${linkClass} not found`);
        }
        $link.click();
    }

    /**
     * Helper to get breadcrumb text
     */
    function getBreadcrumbItems() {
        return $('#breadcrumbNav li').map(function() {
            return $(this).text().trim();
        }).get();
    }

    // Test: Complete breadcrumb navigation flow
    test('Complete breadcrumb navigation: foo -> bar -> foo -> Home', async function() {
        // Start at root
        FileManager.setCurrentFolderId(null);
        FileManager.setCurrentGpxId(null);
        FileManager.clearSelection();

        // Step 1: Create folder "foo"
        const fooId = await FileManager.createFolder('foo');
        assertNotNull(fooId, 'Folder "foo" should be created');

        // Step 2: Navigate into folder "foo"
        FileManager.setCurrentFolderId(fooId);
        UIController.renderFileList();
        await waitForUpdate();

        // Verify we're in folder "foo"
        assertEquals(FileManager.getCurrentFolderId(), fooId, 'Current folder should be "foo"');
        const breadcrumbsAfterFoo = getBreadcrumbItems();
        assert(breadcrumbsAfterFoo.includes('foo'), 'Breadcrumb should show "foo"');

        // Step 3: Create folder "bar" inside "foo"
        const barId = await FileManager.createFolder('bar', fooId);
        assertNotNull(barId, 'Folder "bar" should be created inside "foo"');

        // Step 4: Navigate into folder "bar"
        FileManager.setCurrentFolderId(barId);
        UIController.renderFileList();
        await waitForUpdate();

        // Verify we're in folder "bar"
        assertEquals(FileManager.getCurrentFolderId(), barId, 'Current folder should be "bar"');
        const breadcrumbsAfterBar = getBreadcrumbItems();
        assert(breadcrumbsAfterBar.includes('foo'), 'Breadcrumb should show "foo"');
        assert(breadcrumbsAfterBar.includes('bar'), 'Breadcrumb should show "bar"');

        // Step 5: Click on breadcrumb "foo"
        const $fooLink = $('#breadcrumbNav a').filter(function() {
            return $(this).text().trim() === 'foo';
        });
        assert($fooLink.length > 0, 'Breadcrumb link for "foo" should exist');
        $fooLink.click();
        await waitForUpdate();

        // Expected outcome: list shows content of folder "foo"
        assertEquals(FileManager.getCurrentFolderId(), fooId, 'Current folder should be "foo" after clicking breadcrumb');
        const contentsOfFoo = FileManager.getFolderContents(fooId);
        assertArrayLength(contentsOfFoo.folders, 1, 'Folder "foo" should contain 1 subfolder (bar)');
        assertEquals(contentsOfFoo.folders[0].name, 'bar', 'Subfolder should be "bar"');

        // Step 6: Click on breadcrumb "Home"
        const $homeLink = $('#breadcrumbNav a.breadcrumb-home');
        assert($homeLink.length > 0, 'Breadcrumb link for "Home" should exist');
        $homeLink.click();
        await waitForUpdate();

        // Expected outcome: list shows the root level
        assertEquals(FileManager.getCurrentFolderId(), null, 'Current folder should be null (root) after clicking Home');
        const rootContents = FileManager.getFolderContents(null);
        const fooFolder = rootContents.folders.find(f => f.id === fooId);
        assertNotNull(fooFolder, 'Folder "foo" should be visible at root level');
        assertEquals(fooFolder.name, 'foo', 'Folder name should be "foo"');

        // Cleanup
        await Database.execute('DELETE FROM folders WHERE id IN (?, ?)', [fooId, barId]);
    });

    // Test: Breadcrumb displays correct path
    test('Breadcrumb displays correct hierarchy', async function() {
        // Create nested structure: level1 -> level2 -> level3
        const level1Id = await FileManager.createFolder('level1');
        const level2Id = await FileManager.createFolder('level2', level1Id);
        const level3Id = await FileManager.createFolder('level3', level2Id);

        // Navigate to level3
        FileManager.setCurrentFolderId(level3Id);
        UIController.renderFileList();
        await waitForUpdate();

        // Check breadcrumb hierarchy
        const breadcrumbs = getBreadcrumbItems();
        assert(breadcrumbs.includes('Home'), 'Breadcrumb should include Home');
        assert(breadcrumbs.includes('level1'), 'Breadcrumb should include level1');
        assert(breadcrumbs.includes('level2'), 'Breadcrumb should include level2');
        assert(breadcrumbs.includes('level3'), 'Breadcrumb should include level3');

        // Verify order (Home should come first)
        const homeIndex = breadcrumbs.indexOf('Home');
        const level1Index = breadcrumbs.indexOf('level1');
        const level2Index = breadcrumbs.indexOf('level2');
        const level3Index = breadcrumbs.indexOf('level3');

        assert(homeIndex < level1Index, 'Home should come before level1');
        assert(level1Index < level2Index, 'level1 should come before level2');
        assert(level2Index < level3Index, 'level2 should come before level3');

        // Cleanup
        await Database.execute('DELETE FROM folders WHERE id IN (?, ?, ?)', [level1Id, level2Id, level3Id]);
    });

    // Test: Click intermediate breadcrumb level
    test('Navigate to intermediate breadcrumb level', async function() {
        // Create nested structure
        const level1Id = await FileManager.createFolder('level1');
        const level2Id = await FileManager.createFolder('level2', level1Id);
        const level3Id = await FileManager.createFolder('level3', level2Id);

        // Navigate to level3
        FileManager.setCurrentFolderId(level3Id);
        UIController.renderFileList();
        await waitForUpdate();

        // Click on level1 breadcrumb
        const $level1Link = $('#breadcrumbNav a').filter(function() {
            return $(this).text().trim() === 'level1';
        });
        assert($level1Link.length > 0, 'Breadcrumb link for "level1" should exist');
        $level1Link.click();
        await waitForUpdate();

        // Should navigate to level1
        assertEquals(FileManager.getCurrentFolderId(), level1Id, 'Current folder should be level1');

        // Verify contents show level2
        const contents = FileManager.getFolderContents(level1Id);
        assertArrayLength(contents.folders, 1, 'level1 should contain 1 subfolder');
        assertEquals(contents.folders[0].name, 'level2', 'Subfolder should be level2');

        // Cleanup
        await Database.execute('DELETE FROM folders WHERE id IN (?, ?, ?)', [level1Id, level2Id, level3Id]);
    });

    // Test: Home breadcrumb always navigates to root
    test('Home breadcrumb always navigates to root', async function() {
        // Create deep nesting
        const aId = await FileManager.createFolder('a');
        const bId = await FileManager.createFolder('b', aId);
        const cId = await FileManager.createFolder('c', bId);
        const dId = await FileManager.createFolder('d', cId);

        // Navigate to deepest level
        FileManager.setCurrentFolderId(dId);
        UIController.renderFileList();
        await waitForUpdate();

        assertEquals(FileManager.getCurrentFolderId(), dId, 'Should be at folder d');

        // Click Home
        const $homeLink = $('#breadcrumbNav a.breadcrumb-home');
        assert($homeLink.length > 0, 'Home breadcrumb should exist');
        $homeLink.click();
        await waitForUpdate();

        // Should be at root
        assertEquals(FileManager.getCurrentFolderId(), null, 'Should be at root after clicking Home');

        // Cleanup
        await Database.execute('DELETE FROM folders WHERE id IN (?, ?, ?, ?)', [aId, bId, cId, dId]);
    });

    // Test: Breadcrumb updates when viewing GPX file
    test('Breadcrumb updates when viewing GPX file', async function() {
        // Create folder with GPX file
        const folderId = await FileManager.createFolder('gpx-folder');
        const gpxId = await Database.execute(
            `INSERT INTO gpx_files (name, folder_id, content, length_km, waypoint_count, riding_time_hours, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['test-route.gpx', folderId, '<gpx></gpx>', 100, 5, 2, Date.now()]
        );

        // Navigate to folder
        FileManager.setCurrentFolderId(folderId);
        UIController.renderFileList();
        await waitForUpdate();

        // Navigate into GPX file
        FileManager.setCurrentGpxId(gpxId);
        UIController.renderFileList();
        await waitForUpdate();

        // Breadcrumb should show: Home > gpx-folder > test-route.gpx
        const breadcrumbs = getBreadcrumbItems();
        assert(breadcrumbs.includes('Home'), 'Should include Home');
        assert(breadcrumbs.includes('gpx-folder'), 'Should include folder name');
        assert(breadcrumbs.includes('test-route.gpx'), 'Should include GPX file name');

        // Click on folder breadcrumb
        const $folderLink = $('#breadcrumbNav a').filter(function() {
            return $(this).text().trim() === 'gpx-folder';
        });
        assert($folderLink.length > 0, 'Folder breadcrumb should exist');
        $folderLink.click();
        await waitForUpdate();

        // Should exit GPX view and show folder contents
        assertEquals(FileManager.getCurrentGpxId(), null, 'Should not be viewing GPX file');
        assertEquals(FileManager.getCurrentFolderId(), folderId, 'Should be viewing folder');

        // Cleanup
        await Database.execute('DELETE FROM gpx_files WHERE id = ?', [gpxId]);
        await Database.execute('DELETE FROM folders WHERE id = ?', [folderId]);
    });

    // Test: Active breadcrumb item styling
    test('Active breadcrumb item has correct styling', async function() {
        const folderId = await FileManager.createFolder('active-test');

        // Navigate to folder
        FileManager.setCurrentFolderId(folderId);
        UIController.renderFileList();
        await waitForUpdate();

        // The active item should have 'active' class and no link
        const $activeCrumb = $('#breadcrumbNav li.active');
        assert($activeCrumb.length > 0, 'Should have an active breadcrumb item');
        assertEquals($activeCrumb.text().trim(), 'active-test', 'Active item should be current folder');

        // Active item should not have a link
        const $activeLink = $activeCrumb.find('a');
        assertEquals($activeLink.length, 0, 'Active breadcrumb should not have a link');

        // Cleanup
        await Database.execute('DELETE FROM folders WHERE id = ?', [folderId]);
    });

    /**
     * Run all tests
     */
    async function runTests() {
        passed = 0;
        failed = 0;

        console.log('Running Breadcrumb Navigation Tests...\n');

        for (const {name, fn} of tests) {
            try {
                await fn();
                passed++;
                console.log(`✓ ${name}`);
            } catch (error) {
                failed++;
                console.error(`✗ ${name}`);
                console.error(`  ${error.message}`);
                if (error.stack) {
                    console.error(`  ${error.stack}`);
                }
            }
        }

        console.log(`\n${passed} passed, ${failed} failed, ${tests.length} total`);
        return { passed, failed, total: tests.length };
    }

    return {
        runTests
    };
})();
