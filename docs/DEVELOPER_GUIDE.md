# GPX Library - Developer Guide

## Architecture Overview

GPX Library is a client-side web application built with vanilla JavaScript, jQuery, and SQL.js. It provides a complete GPX file management system with local storage using IndexedDB.

### Technology Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Database:** SQL.js (SQLite compiled to WebAssembly)
- **Storage:** IndexedDB for persistence
- **Map:** Leaflet.js with Leaflet Routing Machine
- **Routing:** OSRM (Open Source Routing Machine)
- **Libraries:** jQuery 3.7, Bootstrap 5.3, JSZip

### Application Structure

```
gpxlibrary/
├── index.html                 # Main application entry point
├── css/
│   └── style.css             # All application styles
├── js/
│   ├── app.js                # Application initialization
│   ├── database.js           # SQL.js database management
│   ├── file-manager.js       # File/folder CRUD operations
│   ├── gpx-parser.js         # GPX XML parsing
│   ├── gpx-normalizer.js     # GPX format normalization
│   ├── map-preview.js        # Leaflet map integration
│   ├── routing.js            # OSRM routing integration
│   ├── ui-controller.js      # Main UI logic and event handling
│   ├── toast.js              # Toast notification system
│   └── modal.js              # Modal dialog system
├── tests/
│   ├── test-modal-dialogs.html          # Modal/toast tests
│   ├── test-file-operations.html        # File operation tests
│   ├── test-copy-paste.html             # Copy/paste tests
│   ├── test-copy-paste.js               # Copy/paste test suite
│   ├── test-breadcrumb-navigation.html  # Breadcrumb tests
│   ├── test-breadcrumb-navigation.js    # Breadcrumb test suite
│   ├── run-migrations.html              # Database migration tool
│   └── cleanup-test-data.html           # Test data cleanup tool
└── docs/
    ├── USER_GUIDE.md         # End-user documentation
    └── DEVELOPER_GUIDE.md    # This file
```

## Module Documentation

### 1. app.js

**Purpose:** Application initialization and setup.

**Key Functions:**
```javascript
async function init()
```
- Initializes Toast and Modal systems
- Initializes Database
- Initializes MapPreview
- Initializes UIController
- Handles initialization errors

**Initialization Order:**
1. Toast.init()
2. Modal.init()
3. Database.init()
4. MapPreview.init()
5. UIController.init()
6. UIController.renderFileList()

### 2. database.js

**Purpose:** SQLite database management using SQL.js and IndexedDB persistence.

**Database Schema:**

```sql
CREATE TABLE folders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    parent_id INTEGER,
    created_at INTEGER,
    FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
);

CREATE TABLE gpx_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    folder_id INTEGER,
    created_at INTEGER,
    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
);

CREATE TABLE routes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gpx_file_id INTEGER NOT NULL,
    index_in_gpx INTEGER NOT NULL,
    name TEXT,
    routing_strategy TEXT DEFAULT 'road',
    FOREIGN KEY (gpx_file_id) REFERENCES gpx_files(id) ON DELETE CASCADE
);

CREATE TABLE tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gpx_file_id INTEGER NOT NULL,
    index_in_gpx INTEGER NOT NULL,
    name TEXT,
    FOREIGN KEY (gpx_file_id) REFERENCES gpx_files(id) ON DELETE CASCADE
);

CREATE TABLE waypoints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gpx_file_id INTEGER NOT NULL,
    index_in_gpx INTEGER NOT NULL,
    name TEXT,
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    FOREIGN KEY (gpx_file_id) REFERENCES gpx_files(id) ON DELETE CASCADE
);
```

**Key Functions:**

```javascript
async function init(dbName = 'gpx_library')
async function loadFromIndexedDB(dbName)
async function saveToIndexedDB()
function query(sql, params = [])
async function execute(sql, params = [])
function getLastInsertId()
function exportDatabase()
async function importDatabase(data)
```

**IndexedDB Storage:**
- Database name: Configurable (default: 'gpx_library')
- Object store: 'database'
- Key: 'sqliteDb'
- Value: Uint8Array of SQLite database

### 3. file-manager.js

**Purpose:** High-level file and folder operations.

**Key Functions:**

```javascript
// Folder operations
async function createFolder(name, parentId = null)
async function renameFolder(id, newName)
async function deleteFolder(id)
function getFolderPath(folderId)

// GPX file operations
async function uploadGpxFiles(files, folderId = null)
function getGpxFile(id)
async function renameGpxFile(id, newName)
async function deleteGpxFile(id)

// Route/Track/Waypoint operations
async function renameRoute(id, newName)
async function renameTrack(id, newName)
async function renameWaypoint(id, newName)

// Selection management
function getSelectedItems()
function setSelectedItems(items)
function addSelectedItem(item)
function removeSelectedItem(item)
function clearSelection()

// Navigation state
function getCurrentFolderId()
function setCurrentFolderId(id)
function getCurrentGpxId()
function setCurrentGpxId(id)
```

**Selection Item Format:**
```javascript
{
    type: 'folder' | 'gpx' | 'route' | 'track' | 'waypoint',
    id: number
}
```

### 4. gpx-parser.js

**Purpose:** Parse GPX XML into JavaScript objects.

**Key Functions:**

```javascript
function parseGPX(xmlString)
```

**Returns:**
```javascript
{
    metadata: {
        name: string,
        desc: string,
        author: string,
        ...
    },
    routes: [{
        name: string,
        waypoints: [{ lat, lon, name, ... }]
    }],
    tracks: [{
        name: string,
        segments: [[{ lat, lon, time, ... }]]
    }],
    waypoints: [{
        lat: number,
        lon: number,
        name: string,
        ...
    }]
}
```

### 5. gpx-normalizer.js

**Purpose:** Normalize between GPX 1.0 and 1.1 formats.

**Key Functions:**

```javascript
function normalizeToGPX10(gpxObject)
function normalizeToGPX11(gpxObject)
function serialize ToGPXString(gpxObject, version = '1.0')
```

### 6. ui-controller.js

**Purpose:** Main UI logic, event handling, and rendering.

**Key Responsibilities:**
- Render file list
- Handle user interactions
- Manage selection state
- Coordinate copy/paste operations
- Handle drag-and-drop
- Update breadcrumb navigation
- Show/hide action toolbar

**Key Functions:**

```javascript
function init()
function renderFileList()
function updateBreadcrumb()
function updateActionToolbar()

// Event handlers
function handleItemClick(type, id, $item)
function handleItemDoubleClick(type, id)
function handleSelectionCircleClick(type, id, $item)
function handleCopyClick()
function handlePasteClick()
function handleRenameClick()
function handleDeleteClick()
function handleNewFolderClick()

// Drag and drop
function handleDragStart(e, type, id, $item)
function handleDragEnd(e)
function handleDragOver(e, $item)
function handleDragEnter(e, $item)
function handleDragLeave(e, $item)
function handleDrop(e, targetFolderId, $item)
```

### 7. modal.js

**Purpose:** Promise-based modal dialog system.

**API:**

```javascript
function init()
Promise<boolean> function confirm(message, title = 'Confirm')
Promise<string|null> function prompt(message, defaultValue = '', title = 'Input')
Promise<void> function show(title, content)
```

**Usage:**
```javascript
// Confirm
const confirmed = await Modal.confirm('Delete this file?', 'Confirm Delete');
if (confirmed) {
    // Delete file
}

// Prompt
const name = await Modal.prompt('Enter name:', 'Default', 'New Folder');
if (name) {
    // Create folder with name
}

// Info
await Modal.show('Help', '<p>Help content here</p>');
```

### 8. toast.js

**Purpose:** Non-blocking toast notifications.

**API:**

```javascript
function init()
function show(message, type = 'info', duration = 4000)
function success(message, duration = 4000)
function error(message, duration = 6000)
function warning(message, duration = 5000)
function info(message, duration = 4000)
function clearAll()
```

**Usage:**
```javascript
Toast.success('File uploaded successfully!');
Toast.error('Failed to delete folder', 8000);
Toast.warning('File already exists');
Toast.info('Processing...');
```

### 9. map-preview.js

**Purpose:** Leaflet map integration and GPX visualization.

**Key Functions:**

```javascript
function init()
function displayGpx(gpxId)
function displayRoute(gpxId, routeId)
function displayTrack(gpxId, trackId)
function displayWaypoint(gpxId, waypointId)
function showEmptyState()
```

**Map Layers:**
- OpenStreetMap tiles
- Route polylines (blue)
- Track polylines (red)
- Waypoint markers
- Fit bounds to content

### 10. routing.js

**Purpose:** OSRM routing integration.

**Key Functions:**

```javascript
async function calculateRoute(waypoints, strategy = 'road')
```

**Returns:**
```javascript
{
    coordinates: [[lon, lat], ...],
    distance: number (meters),
    duration: number (seconds),
    waypoints: [...]
}
```

## Testing

### Test Suites

1. **test-modal-dialogs.html**
   - Modal.confirm() functionality
   - Modal.prompt() functionality
   - Modal.show() functionality
   - Toast notifications
   - Auto-dismiss and manual close

2. **test-file-operations.html**
   - Manual testing interface
   - Create folder
   - Rename folder
   - Delete folder
   - Toast notifications

3. **test-copy-paste.html**
   - Copy/paste folders
   - Copy/paste GPX files
   - Copy multiple items
   - Copy GPX content
   - Drag and drop
   - Recursive folder copy
   - Circular reference prevention

4. **test-breadcrumb-navigation.html**
   - Folder creation and navigation
   - Breadcrumb click navigation
   - Home button functionality

### Running Tests

1. **Open test file in browser**
   ```
   file:///path/to/gpxlibrary/tests/test-modal-dialogs.html
   ```

2. **Click "Run Tests"**

3. **Review results in console output**

### Test Database

Tests use separate databases to avoid polluting production data:
- `gpx_library_test_modal_dialogs`
- `gpx_library_test_file_ops`
- `gpx_library_test_copy_paste`
- `gpx_library_test_breadcrumb_navigation`

### Database Migrations

**run-migrations.html:**
- Adds missing columns to existing databases
- Safe to run multiple times
- Use when upgrading from older versions

**Migration Process:**
1. Check for missing columns using PRAGMA table_info
2. Add columns with ALTER TABLE if missing
3. Save updated database to IndexedDB

## Development Workflow

### Adding a New Feature

1. **Design the feature**
   - Identify affected modules
   - Plan database schema changes if needed
   - Design UI changes

2. **Implement database changes**
   - Update `database.js` schema
   - Add migration in `run-migrations.html`
   - Test migration on sample database

3. **Implement business logic**
   - Add functions to appropriate modules
   - Follow existing patterns (async/await, Promises)
   - Handle errors with try/catch

4. **Implement UI**
   - Add UI elements to `index.html`
   - Add styles to `css/style.css`
   - Add event handlers in `ui-controller.js`
   - Use Toast for notifications
   - Use Modal for dialogs

5. **Write tests**
   - Create test file in `tests/`
   - Cover happy path and error cases
   - Test edge cases

6. **Document**
   - Update USER_GUIDE.md
   - Update this file (DEVELOPER_GUIDE.md)
   - Add inline code comments

### Code Style

**JavaScript:**
- Use async/await for asynchronous operations
- Use Promises for modal dialogs
- Use IIFE modules for encapsulation
- Use const/let, avoid var
- Clear variable names
- Handle errors gracefully

**Example:**
```javascript
async function createFolder(name, parentId = null) {
    try {
        const timestamp = Date.now();
        const folderId = await Database.execute(
            'INSERT INTO folders (name, parent_id, created_at) VALUES (?, ?, ?)',
            [name, parentId, timestamp]
        );
        Toast.success(`Created folder: ${name}`);
        return folderId;
    } catch (error) {
        Toast.error(`Failed to create folder: ${error.message}`);
        throw error;
    }
}
```

**CSS:**
- Use BEM-like naming for components
- Group related styles
- Use CSS variables for theme colors
- Comment major sections

**HTML:**
- Semantic HTML5 elements
- Bootstrap classes for layout
- Custom classes for specific components
- Accessible ARIA labels

### Debugging

**Browser Console:**
```javascript
// Enable verbose logging
localStorage.setItem('debug', 'true');

// Check database state
Database.query('SELECT * FROM folders');
Database.query('SELECT * FROM gpx_files');

// Check selection state
FileManager.getSelectedItems();

// Check navigation state
FileManager.getCurrentFolderId();
FileManager.getCurrentGpxId();
```

**Database Inspector:**
Use `run-migrations.html` with modified code to query and inspect database state.

## Common Patterns

### Adding a New Modal Dialog

```javascript
// In ui-controller.js or relevant module
async function handleSomeAction() {
    const result = await Modal.prompt('Enter value:', '', 'Dialog Title');
    if (!result) {
        return; // User cancelled
    }

    try {
        // Perform action with result
        await SomeModule.doSomething(result);
        Toast.success('Action completed!');
    } catch (error) {
        Toast.error('Action failed: ' + error.message);
    }
}
```

### Adding a New Database Table

```javascript
// In database.js createSchema()
db.run(`
    CREATE TABLE new_table (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at INTEGER,
        FOREIGN KEY (parent_id) REFERENCES other_table(id) ON DELETE CASCADE
    )
`);
```

**Don't forget:**
- Add migration in `run-migrations.html`
- Update exportDatabase/importDatabase if needed
- Add query functions in database.js or relevant module

### Adding Keyboard Shortcuts

```javascript
// In ui-controller.js init()
$(document).on('keydown', function(e) {
    // New shortcut
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSave();
    }
});
```

Update keyboard shortcuts modal in `index.html`.

## Performance Considerations

### Database

- Use transactions for bulk operations
- Index frequently queried columns
- Limit query result sets
- Cache folder paths

### UI

- Virtual scrolling for large file lists (TODO)
- Debounce search inputs
- Lazy load map markers
- Batch DOM updates

### File Operations

- Stream large GPX files (TODO)
- Progress indicators for uploads
- Background processing for imports

## Security Considerations

1. **XSS Prevention**
   - HTML escape all user input
   - Use textContent instead of innerHTML where possible
   - Toast and Modal modules escape HTML by default

2. **SQL Injection**
   - Always use parameterized queries
   - Never string concatenate SQL
   - Database.query() and execute() use parameters

3. **Local Storage**
   - Data is local to browser
   - IndexedDB follows same-origin policy
   - Export contains full database (be careful sharing)

## Browser Compatibility

**Tested Browsers:**
- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

**Required Features:**
- ES6+ (async/await, Promises, arrow functions)
- IndexedDB
- WebAssembly (for SQL.js)
- FileReader API
- Blob/URL APIs

**Fallbacks:**
- None currently implemented
- Display error message if features unavailable

## Deployment

### Static Hosting

Application is fully client-side:

1. Upload all files to web server
2. Ensure MIME types are correct:
   - `.wasm` → `application/wasm`
   - `.js` → `application/javascript`
   - `.css` → `text/css`

3. Enable HTTPS for production

### Local Usage

1. Open `index.html` directly in browser
2. File:// protocol works fine
3. Data is specific to the file:// origin

## Future Enhancements

Potential improvements:

- [ ] Cloud sync (Google Drive, Dropbox)
- [ ] GPX editing (add/remove/move waypoints)
- [ ] Batch operations (rename, tag)
- [ ] Search functionality
- [ ] Statistics and analytics
- [ ] Route comparison
- [ ] GPX validation and repair
- [ ] Export to other formats
- [ ] Offline map tiles
- [ ] Custom OSRM server configuration

## Contributing

When contributing:

1. Follow existing code style
2. Write tests for new features
3. Update documentation
4. Test in multiple browsers
5. Check console for errors
6. Use separate test database

## License

See LICENSE file in repository root.
