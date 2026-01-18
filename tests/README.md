# GPX Library - Test Suite

This directory contains automated and manual tests for the GPX Library application.

## Test Files

### Automated Tests

1. **test-modal-dialogs.html**
   - Tests modal dialog system (confirm, prompt, show)
   - Tests toast notification system
   - Fully automated
   - **Run:** Open in browser and click "Run Tests"

2. **test-copy-paste.html**
   - Tests all copy/paste scenarios
   - Tests drag-and-drop functionality
   - Tests recursive folder operations
   - **Run:** Open in browser and click "Run Tests"

3. **test-breadcrumb-navigation.html**
   - Tests breadcrumb navigation
   - Tests folder navigation
   - Tests Home button functionality
   - **Run:** Open in browser and click "Run Tests"

### Manual Tests

4. **test-file-operations.html**
   - Manual testing interface for file operations
   - Tests create folder, rename, delete
   - Tests modal prompts and confirms
   - Tests toast notifications
   - **Run:** Open in browser and click buttons to test each operation

### Utility Tools

5. **run-migrations.html**
   - Database migration tool
   - Adds missing columns to existing databases
   - Safe to run multiple times
   - **Use:** When upgrading from older database versions

6. **cleanup-test-data.html**
   - Removes test data from production database
   - Deletes known test folder names
   - **Use:** After accidental test pollution of production database

## Running Tests

### Quick Start

1. Open a test file in your browser:
   ```
   file:///path/to/gpxlibrary/tests/test-modal-dialogs.html
   ```

2. Wait for initialization (status will show "Ready to Run")

3. Click "Run Tests" button

4. Review results in console output

### Test Databases

All tests use separate databases to avoid polluting production data:

- `gpx_library_test_modal_dialogs` - Modal/toast tests
- `gpx_library_test_file_ops` - File operation tests
- `gpx_library_test_copy_paste` - Copy/paste tests
- `gpx_library_test_breadcrumb_navigation` - Breadcrumb tests

These databases are isolated and can be safely deleted.

### Interpreting Results

**Success:**
- Green status badge: "All Tests Passed!"
- All test output shows ✓ checkmarks
- Passed count matches total count

**Failure:**
- Red status badge with failure count
- Failed tests show ✗ marks with error messages
- Review console output for details

## Test Coverage

### What's Tested

- ✅ Modal dialogs (confirm, prompt, show)
- ✅ Toast notifications (all types, auto-dismiss, manual close)
- ✅ File operations (create, rename, delete folders)
- ✅ Copy/paste (files, folders, GPX content)
- ✅ Drag and drop (move items between folders)
- ✅ Breadcrumb navigation
- ✅ Circular reference prevention

### What's Not Tested

- Map preview functionality
- GPX file upload (file input simulation is complex)
- Database export/import
- Performance with large datasets

## Writing New Tests

### Template Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Your Test Name</title>
    <link rel="stylesheet" href="../css/style.css">
</head>
<body>
    <h1>Your Test Name</h1>
    <div id="console"></div>

    <!-- Load dependencies -->
    <script src="../js/toast.js"></script>
    <script src="../js/modal.js"></script>
    <!-- etc. -->

    <script>
        async function initialize() {
            await Database.init('gpx_library_test_your_test');
            // Initialize other modules
        }

        async function testYourFeature() {
            // Test implementation
            assert(condition, 'Test message');
        }

        async function runTests() {
            await testYourFeature();
            // More tests
        }

        window.addEventListener('load', initialize);
    </script>
</body>
</html>
```

### Test Utilities

```javascript
// Assertions
function assert(condition, message) {
    if (!condition) throw new Error(message);
}

function assertEquals(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message} (expected: ${expected}, got: ${actual})`);
    }
}

function assertNotNull(value, message) {
    if (value === null || value === undefined) {
        throw new Error(message);
    }
}

// Waiting
function waitForUpdate() {
    return new Promise(resolve => setTimeout(resolve, 100));
}
```

## Troubleshooting Tests

### Test Won't Initialize

**Symptoms:** Status shows "Initialization Failed"

**Solutions:**
- Check browser console for errors
- Verify all script files are loaded
- Check that SQL.js CDN is accessible
- Try clearing browser cache

### Tests Fail Intermittently

**Symptoms:** Tests pass sometimes, fail other times

**Solutions:**
- Increase wait times (`waitForUpdate` duration)
- Check for timing issues with async operations
- Verify DOM elements exist before interaction
- Check for race conditions

### Database Errors

**Symptoms:** Tests fail with database-related errors

**Solutions:**
- Clear IndexedDB for test databases
- Run database migration tool
- Check database schema matches code
- Verify test database name is correct

### Modal/Toast Not Working

**Symptoms:** Modal doesn't appear, toast doesn't show

**Solutions:**
- Verify Toast.init() and Modal.init() are called
- Check CSS file is loaded
- Verify DOM elements exist (#toastContainer, #modalContainer)
- Check browser console for JavaScript errors

## Cleaning Up Test Data

### Clear Test Databases

```javascript
// In browser console
const request = indexedDB.deleteDatabase('gpx_library_test_modal_dialogs');
// Repeat for each test database
```

### Clear All IndexedDB Data

**Chrome:**
1. F12 → Application → Storage → IndexedDB
2. Right-click database → Delete

**Firefox:**
1. F12 → Storage → IndexedDB
2. Right-click database → Delete

## Continuous Integration

To automate tests in CI/CD:

```bash
# Example using Puppeteer
npm install puppeteer

# test-runner.js
const puppeteer = require('puppeteer');

async function runTest(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

    // Wait for tests to complete
    await page.waitForSelector('.status.success, .status.failure');

    // Get results
    const results = await page.evaluate(() => {
        return {
            total: document.getElementById('totalTests').textContent,
            passed: document.getElementById('passedTests').textContent,
            failed: document.getElementById('failedTests').textContent
        };
    });

    await browser.close();
    return results;
}
```

## Best Practices

1. **Always use test databases** - Never use production database for tests
2. **Clean up after tests** - Delete created test data
3. **Make tests independent** - Each test should work standalone
4. **Use descriptive names** - Test names should explain what they test
5. **Test edge cases** - Don't just test happy paths
6. **Keep tests fast** - Minimize wait times
7. **Document expected behavior** - Explain why tests exist

## Support

For test failures or questions:
- Check test console output for detailed error messages
- Review QA_TEST_SUMMARY.md for known issues
- Check browser compatibility
- Verify all dependencies are loaded
