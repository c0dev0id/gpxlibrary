# GPX Library - Motorcycle Route Manager

A frontend-only web application for managing GPX files, designed specifically for motorcycle riders.

## Features

- **Upload GPX Files**: Support for GPX 1.0 and 1.1 formats (up to 20MB, max 2500 files)
- **Automatic Normalization**: Converts GPX 1.1 files to GPX 1.0
- **Folder Organization**: Create folders and organize your routes
- **Map Preview**: View routes, tracks, and waypoints on OpenStreetMap
- **Metadata Display**: Shows trip length, waypoint count, and riding time
- **Filter & Search**: Filter routes by name, length, waypoints, and riding time
- **Database Persistence**: All data stored in browser using IndexedDB
- **Export/Import**: Export and import your route library as SQLite database

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript
- **UI Framework**: Bootstrap 5.3
- **JavaScript Library**: jQuery 3.7
- **Map**: Leaflet 1.9.4 with OpenStreetMap
- **Database**: SQL.js 1.8.0 with IndexedDB persistence
- **Compression**: JSZip 3.10.1

## Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- No server required - runs entirely in the browser

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/gpxlibrary.git
cd gpxlibrary
```

2. Open `index.html` in your web browser

That's it! No build process or server setup required.

### Using a Local Server (Optional)

For development, you can use a simple HTTP server:

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js
npx http-server
```

Then navigate to `http://localhost:8000`

## Usage

### Uploading GPX Files

1. Click the **Upload** button
2. Select one or more GPX files (Ctrl/Cmd for multiple selection)
3. Files will be automatically normalized to GPX 1.0 and stored

### Organizing Routes

- **Create Folder**: Click "New Folder" and enter a name
- **Navigate**: Double-click folders to open them
- **Path**: Click the path at the top to return to root

### Viewing Routes

- **Single-click** a GPX file to preview it on the map
- **Double-click** a GPX file to view its contents (routes, tracks, waypoints)
- Routes and tracks are displayed in different colors with 30% opacity
- Waypoints show as red markers with labels

### Filtering

Use the filter fields to search by:
- **Name**: Text search (case-insensitive)
- **Length**: Min/max distance in kilometers
- **Waypoints**: Min/max number of waypoints
- **Riding Time**: Min/max hours

### Exporting/Importing Database

- **Export DB**: Downloads `route_library.db` file with all your data
- **Import DB**: Restore data from a previously exported database file
- Use this to backup your routes or transfer them between browsers/computers

## Project Status

### Completed (Phase 1-4)

- ✅ Core infrastructure
- ✅ SQLite database with IndexedDB persistence
- ✅ GPX 1.1 to 1.0 normalization
- ✅ File upload and storage
- ✅ Folder management
- ✅ Map preview with OpenStreetMap
- ✅ Basic filtering
- ✅ Database export/import

### In Progress

- 🚧 Download functionality (single/multi GPX, folders as ZIP)
- 🚧 Rename functionality for all items
- 🚧 Delete functionality
- 🚧 Multi-select improvements

### Planned

- ⏳ Routing strategies (Road, Curvy, Unpaved)
- ⏳ Advanced metadata calculations with routing
- ⏳ Unit tests
- ⏳ Documentation

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Data Storage

- All data is stored locally in your browser using IndexedDB
- No data is sent to any server
- Maximum storage depends on browser (typically 50MB - several GB)
- Clearing browser cache will delete all data (export database first!)

## License

MIT License - See LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues, questions, or suggestions, please open an issue on GitHub.
