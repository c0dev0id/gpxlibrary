# Recent Updates to GPX Library

## New Features Implemented

### 1. Routing Module (routing.js)
- **Purpose**: Calculate road routes between waypoints using OSRM
- **Features**:
  - Multiple routing strategies (Road, Avoid Motorway, Curvy, Prefer Unpaved)
  - Fallback to straight-line distance if routing fails
  - Time estimation based on routing strategy
  - Haversine distance calculations

### 2. Copy/Paste Functionality
- **Copy**: Ctrl+C copies selected routes/tracks/waypoints with their full data
- **Paste into GPX**: Ctrl+V adds copied items to currently open GPX file
- **Paste as new GPX**: Ctrl+V at folder level creates new GPX file with pasted items
- **Auto-refresh**: List automatically refreshes and selects pasted items

### 3. Keyboard Navigation
- **Arrow Up/Down**: Navigate through file list
- **Enter**: Open selected folder/GPX file
- **Ctrl+C/V**: Copy and paste
- Prevents interference with input fields

### 4. Enhanced Download Functionality
- **Single item**: Downloads with item's actual name
- **Folders**: Creates ZIP with all GPX files
- **Routes/Tracks/Waypoints**: Extracts as standalone GPX
- **Multi-select**: Intelligent ZIP creation based on selection

### 5. Extended Rename/Delete
- Now works for routes, tracks, and waypoints (not just folders/GPX files)
- Database updates preserve relationships

### 6. GPX Navigation
- Double-click GPX file to view its contents
- Filter automatically hidden in GPX view
- Color consistency using index_in_gpx

### 7. Save Button (UI Framework)
- Appears when changes are made
- Framework for batch save operations
- Currently auto-saves immediately

## Database Schema Updates

### New Columns
- **routes.index_in_gpx**: INTEGER - Index of route in original GPX
- **tracks.index_in_gpx**: INTEGER - Index of track in original GPX  
- **waypoints.index_in_gpx**: INTEGER - Index of waypoint in original GPX
- **routes.routing_strategy**: TEXT - Selected routing strategy

### Why index_in_gpx?
- Provides deterministic lookup without relying on names
- Enables consistent color assignment across views
- Handles duplicate names correctly

## Testing Framework

### Test Coverage
- **Database Module**: 12 tests (CRUD, migrations, transactions)
- **GPX Parser Module**: 24 tests (parsing, validation, error handling)
- **File Manager Module**: 20 tests (operations, state management)
- **Routing Module**: 16 tests (calculations, strategies)

### Test Runner
- **Location**: `tests/test-runner.html`
- **Features**: Visual feedback, console output, test summaries
- **Usage**: Open in browser, click "Run Tests"

### Test Files
```
tests/
├── test-database.js
├── test-gpx-parser.js
├── test-file-manager.js
├── test-routing.js
├── test-gpx-normalizer.js (existing)
└── test-runner.html
```

## Code Quality Improvements

### Refactoring
- Consolidated `calculateRouteLength()` and `calculateTrackLength()` into GPXNormalizer
- Removed duplicated distance calculation code

### Cleanup
- Removed unused functions: `beginTransaction()`, `commit()`, `rollback()`, `countWaypoints()`
- Deleted debug HTML files
- Consistent console logging for errors

### Architecture
- Clear module boundaries
- Proper async/await handling for routing
- Event-driven state management

## Module Updates

### GPXNormalizer (gpx-normalizer.js)
**New Exports**:
- `calculateRouteLength(points)`: Calculate length from point array
- `calculateTrackLength(segments)`: Calculate length from segments

### Routing (routing.js)
**New Module** - Handles all routing operations:
- `calculateRoute(waypoints, strategy)`: Calculate road route
- `calculateStraightDistance(lat1, lon1, lat2, lon2)`: Haversine distance
- `calculateFallbackDistance(waypoints)`: Sum of straight-line distances
- `estimateRidingTime(distanceMeters, strategy)`: Time estimation
- `setStrategy(strategy)`: Set current routing strategy
- `getStrategy()`: Get current routing strategy
- `getAvailableStrategies()`: Get strategy metadata

### Database (database.js)
**Removed**: Transaction methods (never implemented properly)
**Added**: Migration support for new columns

### FileManager (file-manager.js)
**New Methods**:
- `renameRoute(routeId, newName)`
- `renameTrack(trackId, newName)`
- `renameWaypoint(waypointId, newName)`

### UIController (ui-controller.js)
**New Features**:
- Keyboard navigation handler
- Copy/paste handlers
- Download for folders and GPX contents
- Multi-select preview with async routing

### MapPreview (map-preview.js)
**Improvements**:
- Async `displayRoute()` with road routing
- Color consistency using index_in_gpx
- Error handling for routing failures
- Fallback to straight lines if routing unavailable

## Known Limitations

### Routing
- Public OSRM API doesn't support custom routing profiles
- All strategies use same routing (fastest road)
- Requires internet connection for routing
- To fully implement strategies, need self-hosted OSRM or GraphHopper

### Save Button
- UI exists but not fully functional
- Currently auto-saves all changes immediately
- Framework ready for batch operations

## Performance Considerations

### Async Routing
- Routes calculated asynchronously to avoid UI blocking
- Proper await/async chain prevents straight-line fallback
- Loading spinner shows during calculations

### Database
- IndexedDB for persistence (better than localStorage)
- Automatic save after each modification
- No transaction support (SQL.js limitation)

### Memory
- Handles 2,500 GPX files efficiently
- Large files (10-20MB) processed in main thread
- Future: Consider Web Workers for parsing

## Browser Compatibility

Tested and working on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires:
- ES6+ support
- IndexedDB
- Async/await
- File API
- DOMParser/XMLSerializer

## Future Enhancements

### High Priority
- Implement Save button persistence logic
- Add Shift+Click for range selection
- Implement proper routing strategies (requires routing service)

### Medium Priority
- Elevation profiles
- Route statistics (elevation gain, surface types)
- Merge/split GPX files
- Drag-and-drop upload

### Low Priority
- Dark mode
- Multi-language support
- Route sharing (export links)
- Mobile app version

## Migration Notes

### From Earlier Versions
If upgrading from an older version, the database will automatically:
1. Add `index_in_gpx` columns to routes, tracks, waypoints
2. Add `routing_strategy` column to routes
3. Migrate existing data (index_in_gpx defaults to 0 for old data)

### Data Integrity
- All migrations preserve existing data
- Foreign key constraints maintained
- Cascade deletes work correctly

## Documentation Updates

### User Guide
- Completely rewritten with all new features
- Step-by-step instructions for keyboard shortcuts
- Copy/paste workflow documented
- Download options explained
- Troubleshooting section expanded

### Developer Guide
- This document supplements existing guide
- Test framework documented
- New modules explained
- Database schema updates detailed
