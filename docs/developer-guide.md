# GPX Library - Developer Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Module Documentation](#module-documentation)
5. [Database Schema](#database-schema)
6. [Data Flow](#data-flow)
7. [Implementation Details](#implementation-details)
8. [Testing](#testing)
9. [Future Enhancements](#future-enhancements)

## Architecture Overview

GPX Library is a **frontend-only** single-page application (SPA) built with vanilla JavaScript. It uses a modular architecture with clear separation of concerns.

### Design Principles

1. **No Backend Required**: All processing happens in the browser
2. **Offline-First**: Works without internet after initial load
3. **Data Persistence**: IndexedDB for local storage
4. **Modularity**: Each module has a single responsibility
5. **Progressive Enhancement**: Core features work first, enhancements added later

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     User Interface                       │
│                    (index.html + CSS)                    │
└─────────────────────────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────┐
│                   UI Controller                          │
│              (ui-controller.js)                          │
│   • Event handling                                       │
│   • View rendering                                       │
│   • User feedback                                        │
└─────────────────────────────────────────────────────────┘
           │                    │                    │
           ↓                    ↓                    ↓
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  File Manager    │  │   Map Preview    │  │    Database      │
│ (file-manager.js)│  │(map-preview.js)  │  │  (database.js)   │
│                  │  │                  │  │                  │
│ • CRUD ops       │  │ • Leaflet map    │  │ • SQL.js         │
│ • Folder mgmt    │  │ • Layer mgmt     │  │ • IndexedDB      │
│ • Selection      │  │ • Rendering      │  │ • Persistence    │
└──────────────────┘  └──────────────────┘  └──────────────────┘
           │                                          ↑
           ↓                                          │
┌──────────────────┐  ┌──────────────────┐          │
│   GPX Parser     │  │  GPX Normalizer  │          │
│ (gpx-parser.js)  │  │(gpx-normalizer.js)│         │
│                  │  │                  │          │
│ • Parse GPX      │  │ • v1.1 → v1.0    │          │
│ • Validate       │  │ • Calculate meta │──────────┘
│ • Extract data   │  │ • Generate XML   │
└──────────────────┘  └──────────────────┘
```

## Technology Stack

### Core Technologies

- **HTML5**: Modern semantic markup
- **CSS3**: Flexbox/Grid layouts
- **JavaScript ES6**: Modules, async/await, arrow functions

### Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| Bootstrap | 5.3.0 | UI components and responsive layout |
| jQuery | 3.7.0 | DOM manipulation and event handling |
| Leaflet | 1.9.4 | Interactive maps |
| SQL.js | 1.8.0 | SQLite database in browser (WebAssembly) |
| JSZip | 3.10.1 | ZIP file creation for downloads |

### Browser APIs

- **IndexedDB**: Persistent storage for SQLite database
- **File API**: Reading uploaded GPX files
- **Blob API**: Creating downloadable files
- **DOMParser**: Parsing GPX XML
- **XMLSerializer**: Generating GPX XML

## Project Structure

```
gpxlibrary/
├── index.html              # Main HTML file
├── css/
│   └── style.css           # Application styles
├── js/
│   ├── app.js              # Application initialization
│   ├── database.js         # Database module
│   ├── file-manager.js     # File management module
│   ├── gpx-normalizer.js   # GPX normalization module
│   ├── gpx-parser.js       # GPX parsing module
│   ├── map-preview.js      # Map rendering module
│   └── ui-controller.js    # UI controller module
├── tests/
│   └── test-gpx-normalizer.js  # Unit tests
├── docs/
│   ├── user-guide.md       # End-user documentation
│   └── developer-guide.md  # This file
└── README.md               # Project overview
```

## Module Documentation

### app.js

**Purpose**: Application initialization and startup

**Responsibilities**:
- Initialize all modules in correct order
- Handle initialization errors
- Show/hide loading spinner

**Key Functions**:
- `init()`: Async function that initializes app

### database.js

**Purpose**: SQLite database operations and persistence

**Responsibilities**:
- Initialize SQL.js WebAssembly module
- Create database schema
- Execute queries
- Persist to IndexedDB
- Export/import database

**Key Functions**:
- `init()`: Initialize SQL.js and load/create database
- `query(sql, params)`: Execute SELECT queries
- `execute(sql, params)`: Execute INSERT/UPDATE/DELETE
- `saveToIndexedDB()`: Persist database to IndexedDB
- `loadFromIndexedDB()`: Load database from IndexedDB
- `exportDatabase()`: Export as Uint8Array
- `importDatabase(data)`: Import from Uint8Array

**Design Decisions**:
- Use IndexedDB for persistence (more reliable than localStorage)
- Auto-save after every modification
- Transaction support for batch operations

### gpx-parser.js

**Purpose**: Parse GPX XML files

**Responsibilities**:
- Parse GPX 1.0 and 1.1 formats
- Extract metadata, waypoints, routes, tracks
- Handle Garmin extensions
- Validate GPX structure

**Key Functions**:
- `parse(gpxContent)`: Parse GPX XML string
- `validate(gpxData)`: Validate parsed data
- `parseMetadata(xmlDoc)`: Extract metadata
- `parseWaypoints(xmlDoc)`: Extract waypoints
- `parseRoutes(xmlDoc)`: Extract routes
- `parseTracks(xmlDoc)`: Extract tracks

**Design Decisions**:
- Use native DOMParser (no external XML library)
- Support both GPX 1.0 and 1.1
- Preserve Garmin extensions during parsing (for normalization)

### gpx-normalizer.js

**Purpose**: Convert GPX 1.1 to GPX 1.0

**Responsibilities**:
- Normalize GPX structure
- Convert routes to tracks (when no tracks exist)
- Remove unsupported extensions
- Calculate metadata (length, time, waypoint count)

**Key Functions**:
- `normalize(gpxData)`: Convert to GPX 1.0 XML
- `calculateLength(gpxData)`: Calculate total distance
- `calculateRidingTime(gpxData)`: Estimate riding time
- `countWaypoints(gpxData)`: Count waypoints
- `calculateDistance(lat1, lon1, lat2, lon2)`: Haversine formula

**Design Decisions**:
- Always output GPX 1.0 format
- Routes without tracks → create track from route points
- Discard Garmin TrackPointExtension (heart rate, etc.)
- Extract waypoints from Garmin RouteExtension if no waypoints exist
- Use Haversine formula for distance calculations
- Estimate riding time at 50 km/h average (will be enhanced with routing)

### file-manager.js

**Purpose**: File and folder management

**Responsibilities**:
- CRUD operations for folders and GPX files
- Upload and process GPX files
- Manage selection state
- Calculate folder paths

**Key Functions**:
- `createFolder(name, parentId)`: Create new folder
- `getFolderContents(folderId)`: Get folders and files
- `uploadGpxFiles(files, folderId)`: Upload and process
- `renameFolder/GpxFile/Route/Track/Waypoint()`: Rename items
- `deleteFolder/GpxFile()`: Delete items
- `getFolderPath(folderId)`: Get full path string

**State Management**:
- `currentFolderId`: Currently viewed folder (null = root)
- `currentGpxId`: Currently viewed GPX file (null = folder view)
- `selectedItems`: Array of selected items

**Design Decisions**:
- Parse and normalize on upload (not on-demand)
- Store normalized GPX 1.0 content in database
- Calculate metadata once during upload
- Support multi-select with Ctrl/Cmd+Click

### map-preview.js

**Purpose**: Render GPX data on OpenStreetMap

**Responsibilities**:
- Initialize Leaflet map
- Display routes, tracks, waypoints
- Manage map layers
- Auto-zoom to fit content

**Key Functions**:
- `init()`: Initialize Leaflet map
- `displayGpx(gpxId)`: Display entire GPX file
- `displayRoute/Track/Waypoint(gpxId, itemId)`: Display specific item
- `clearLayers()`: Remove all map layers

**Design Decisions**:
- Use 10 distinct colors for routes/tracks (high contrast)
- 30% opacity for lines (see overlapping paths)
- Red circular markers for waypoints
- Permanent tooltips for waypoint names
- Auto-fit bounds with 50px padding

### ui-controller.js

**Purpose**: UI rendering and event handling

**Responsibilities**:
- Render file/folder lists
- Handle user interactions
- Apply filters
- Update preview panel
- Show loading states

**Key Functions**:
- `init()`: Set up event handlers
- `renderFileList()`: Render current view
- `createFileItem()`: Create list item element
- `handleItemClick/DoubleClick()`: Handle selection/navigation
- `applyFilters()`: Filter GPX files

**Event Handlers**:
- Upload button → trigger file input
- Download button → create ZIP/GPX downloads
- New Folder button → prompt and create
- Export/Import DB → database operations
- Filter inputs → apply filters and re-render
- Path click → navigate to root

**Design Decisions**:
- Separation between data (FileManager) and view (UIController)
- jQuery for DOM manipulation and events
- Bootstrap classes for styling
- Debounced filter updates (instant feedback)

## Database Schema

### Tables

#### folders

Stores folder hierarchy.

```sql
CREATE TABLE folders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    parent_id INTEGER,          -- NULL for root level
    created_at INTEGER NOT NULL,
    FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
);

CREATE INDEX idx_folders_parent ON folders(parent_id);
```

#### gpx_files

Stores GPX files and metadata.

```sql
CREATE TABLE gpx_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    folder_id INTEGER,              -- NULL for root level
    content TEXT NOT NULL,          -- Normalized GPX 1.0 XML
    length_km REAL DEFAULT 0,
    waypoint_count INTEGER DEFAULT 0,
    riding_time_hours REAL DEFAULT 0,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
);

CREATE INDEX idx_gpx_folder ON gpx_files(folder_id);
```

#### routes

Stores individual routes within GPX files.

```sql
CREATE TABLE routes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gpx_file_id INTEGER NOT NULL,
    name TEXT,
    length_km REAL DEFAULT 0,
    riding_time_hours REAL DEFAULT 0,
    FOREIGN KEY (gpx_file_id) REFERENCES gpx_files(id) ON DELETE CASCADE
);

CREATE INDEX idx_routes_gpx ON routes(gpx_file_id);
```

#### tracks

Stores individual tracks within GPX files.

```sql
CREATE TABLE tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gpx_file_id INTEGER NOT NULL,
    name TEXT,
    length_km REAL DEFAULT 0,
    riding_time_hours REAL DEFAULT 0,
    FOREIGN KEY (gpx_file_id) REFERENCES gpx_files(id) ON DELETE CASCADE
);

CREATE INDEX idx_tracks_gpx ON tracks(gpx_file_id);
```

#### waypoints

Stores individual waypoints within GPX files.

```sql
CREATE TABLE waypoints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gpx_file_id INTEGER NOT NULL,
    name TEXT,
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    FOREIGN KEY (gpx_file_id) REFERENCES gpx_files(id) ON DELETE CASCADE
);

CREATE INDEX idx_waypoints_gpx ON waypoints(gpx_file_id);
```

### Relationships

```
folders (parent_id) ─────► folders (id)
gpx_files (folder_id) ───► folders (id)
routes (gpx_file_id) ────► gpx_files (id)
tracks (gpx_file_id) ────► gpx_files (id)
waypoints (gpx_file_id) ─► gpx_files (id)
```

### Cascading Deletes

- Delete folder → Delete all subfolders and GPX files
- Delete GPX file → Delete all routes, tracks, waypoints

## Data Flow

### Upload Flow

```
User selects files
       ↓
FileManager.uploadGpxFiles()
       ↓
Read file as text (File API)
       ↓
GPXParser.parse()  [Parse XML]
       ↓
GPXParser.validate()  [Validate structure]
       ↓
GPXNormalizer.normalize()  [Convert to GPX 1.0]
       ↓
GPXNormalizer.calculateLength/Time/Waypoints()
       ↓
Database.execute()  [Store in SQLite]
       ↓
Database.saveToIndexedDB()  [Persist]
       ↓
UIController.renderFileList()  [Update UI]
```

### Display Flow

```
User clicks GPX file
       ↓
UIController.handleItemClick()
       ↓
FileManager.getGpxFile()
       ↓
GPXParser.parse()  [Parse stored XML]
       ↓
MapPreview.displayGpx()
       ↓
Create Leaflet layers
       ↓
Add to map + fit bounds
```

## Implementation Details

### GPX 1.1 to 1.0 Conversion

**Challenge**: GPX 1.1 routes are waypoint lists without detailed track data.

**Current Solution**: 
- If no tracks exist, create track from route points (straight lines)
- Store as GPX 1.0 track

**Future Enhancement**:
- Use routing engine to create realistic track following roads
- Apply routing strategies (Road, Curvy, Unpaved)

### Distance Calculation

Uses Haversine formula for great-circle distance between coordinates:

```javascript
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
```

**Accuracy**: ±0.5% for distances < 1000km

### Time Estimation

Currently uses simple average speed:

```javascript
ridingTime = distance / 50  // 50 km/h average
```

**Future Enhancement**:
- Road type-specific speeds
- Elevation gain/loss considerations
- Routing strategy adjustments

### Browser Storage

**IndexedDB Structure**:
```
Database: gpx_library_db
  Object Store: sqliteStore
    Key: "database"
    Value: Uint8Array (SQLite database file)
```

**Why IndexedDB?**
- Larger storage limits than localStorage (GB vs MB)
- Better performance for binary data
- Asynchronous operations (non-blocking)
- Transactional (reliable)

## Testing

### Current Test Coverage

- GPX Normalizer: Distance calculations, metadata extraction
- Test file: `tests/test-gpx-normalizer.js`

### Running Tests

Add `?test=true` to URL:
```
http://localhost:8000/index.html?test=true
```

Tests run automatically after page load and output to console.

### Test Structure

```javascript
test('test name', function() {
    // Arrange
    const input = ...;
    
    // Act
    const result = functionToTest(input);
    
    // Assert
    assertEquals(result, expected);
});
```

### Future Test Coverage

- [ ] GPX Parser: Parse validation, edge cases
- [ ] File Manager: CRUD operations
- [ ] Database: Query/execute operations
- [ ] UI Controller: Event handling (requires DOM mocking)

## Future Enhancements

### Phase 7: Routing Strategies (Planned)

**Goal**: Calculate realistic routes following roads

**Approach**:
1. Use Leaflet Routing Machine with custom profiles
2. Query Overpass API for road network data
3. Cache OSM data in IndexedDB
4. Implement local routing algorithms

**Routing Strategies**:
- Road (default): Any road, fastest route
- Road - Avoid Motorway: Exclude highways
- Curvy: Maximize curves, avoid cities
- Prefer Unpaved: Include unpaved roads

**Technical Challenges**:
- OSM data size (need bounding box queries)
- Routing algorithm complexity
- Caching strategy for offline use
- Performance for long routes

### Phase 8: Advanced Features (Future)

- [ ] Multi-language support
- [ ] Dark mode
- [ ] Elevation profiles
- [ ] Route statistics (elevation gain, surface types)
- [ ] Merge/split GPX files
- [ ] Drag-and-drop upload
- [ ] Keyboard shortcuts
- [ ] Undo/redo operations
- [ ] Route sharing (export links)
- [ ] Mobile app version

### Performance Optimizations

- Lazy loading for large file lists
- Virtual scrolling for 1000+ items
- Web Workers for GPX processing
- Service Worker for offline caching
- Indexed search for faster filtering

## Contributing

### Code Style

- Use ES6+ features
- 4-space indentation
- Semicolons required
- JSDoc comments for functions
- Descriptive variable names

### Pull Request Process

1. Create feature branch
2. Implement feature with tests
3. Update documentation
4. Submit PR with description
5. Address code review comments

### Development Setup

```bash
git clone https://github.com/yourusername/gpxlibrary.git
cd gpxlibrary
python -m http.server 8000
# Open http://localhost:8000
```

## License

MIT License - See LICENSE file
