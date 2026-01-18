# GPX Library - User Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Uploading Routes](#uploading-routes)
4. [Organizing Routes](#organizing-routes)
5. [Viewing Routes](#viewing-routes)
6. [Filtering Routes](#filtering-routes)
7. [Managing Your Library](#managing-your-library)
8. [Backup and Restore](#backup-and-restore)
9. [Tips and Best Practices](#tips-and-best-practices)
10. [Troubleshooting](#troubleshooting)

## Introduction

GPX Library is a web-based route management tool designed specifically for motorcycle riders. It helps you organize, preview, and manage your GPX route files directly in your web browser - no server or installation required.

### Key Features

- Store up to 2,500 GPX files (each up to 20MB)
- Organize routes in folders
- Preview routes on OpenStreetMap
- View trip length, waypoint count, and estimated riding time
- Filter routes by name, length, waypoints, and time
- Export and import your entire route library

### What is GPX?

GPX (GPS Exchange Format) is a standard file format for GPS data. It contains waypoints, routes, and tracks that define motorcycle tours and navigation paths.

## Getting Started

### Opening the Application

1. Open `index.html` in your web browser
2. The application will load and initialize the database
3. You'll see an empty library ready for your routes

### Interface Overview

The application has two main panels:

**Left Panel - Route Library**
- Action buttons (Upload, Download, New Folder)
- Database export/import buttons
- Current folder path
- Filter controls
- File and folder list

**Right Panel - Map Preview**
- Route name and metadata
- Interactive map showing selected route

## Uploading Routes

### Supported Formats

- GPX 1.0 files
- GPX 1.1 files (automatically converted to GPX 1.0)
- Maximum file size: 20MB per file
- Maximum total files: 2,500

### How to Upload

1. Navigate to the folder where you want to upload files
2. Click the **Upload** button
3. Select one or more GPX files from your computer
   - Hold Ctrl (Windows/Linux) or Cmd (Mac) to select multiple files
4. Wait for the upload to complete
5. Your routes will appear in the file list

### What Happens During Upload

The application will:
- Parse your GPX files
- Convert GPX 1.1 files to GPX 1.0 format
- Extract routes, tracks, and waypoints
- Calculate trip length and estimated riding time
- Store everything in the local database

## Organizing Routes

### Creating Folders

1. Click the **New Folder** button
2. Enter a folder name
3. Press Enter or click OK
4. The new folder appears in the current location

### Navigating Folders

- **Double-click a folder** to open it
- **Click the path** at the top (e.g., `/`) to return to the root level
- Folders can be nested within other folders

### Folder Structure

```
/ (root)
├── Alps 2024/
│   ├── Day 1 - Munich to Innsbruck.gpx
│   └── Day 2 - Innsbruck to Bolzano.gpx
├── Black Forest/
│   └── Scenic Route.gpx
└── Weekend Trips/
    └── Rhine Valley.gpx
```

## Viewing Routes

### Viewing a GPX File

1. **Single-click** a GPX file in the list
2. The map will show all routes, tracks, and waypoints
3. Metadata appears above the map

### Viewing Inside a GPX File

1. **Double-click** a GPX file
2. The list will show the contents:
   - **Routes** section
   - **Tracks** section
   - **Waypoints** section
3. Click any item to preview it on the map

### Map Features

- **Different Colors**: Each route/track appears in a different color
- **Semi-Transparent Lines**: 30% opacity lets you see overlapping paths
- **Waypoint Markers**: Red markers with labels show waypoint locations
- **Auto-Zoom**: Map automatically adjusts to show the entire route
- **Interactive**: Click and drag to pan, scroll to zoom

### Understanding Metadata

When you select a GPX file, you'll see:

- **Length**: Total distance in kilometers
- **Waypoints**: Number of waypoints
- **Riding Time**: Estimated time at average motorcycle speed (50 km/h)

## Filtering Routes

Use the filter controls to find specific routes:

### Filter by Name

- Type text in the "Filter by name" field
- Search is case-insensitive
- Shows routes containing the search text

### Filter by Length

- Enter minimum and/or maximum distance (km)
- Example: Min 100, Max 300 shows routes between 100-300 km

### Filter by Waypoints

- Enter minimum and/or maximum waypoint count
- Example: Min 5 shows routes with 5 or more waypoints

### Filter by Riding Time

- Enter minimum and/or maximum time (hours)
- Example: Max 3 shows routes taking 3 hours or less

### Combining Filters

All active filters work together. For example:
- Name contains "Alps"
- Length: 150-250 km
- Riding time: 3-5 hours

This shows only Alpine routes between 150-250 km taking 3-5 hours.

## Managing Your Library

### Selecting Items

- **Single-click** an item to select it
- **Ctrl+Click** (Cmd+Click on Mac) to select multiple items
- Selected items are highlighted in blue

### Multi-Selection

You can select:
- Multiple folders
- Multiple GPX files
- Multiple routes/tracks/waypoints (when inside a GPX file)

## Backup and Restore

### Why Backup?

Your route library is stored in your browser's local storage. It will be deleted if you:
- Clear your browser cache
- Uninstall the browser
- Use a different computer

**Important**: Export your database regularly to prevent data loss!

### Exporting Your Library

1. Click the **Export DB** button
2. A file named `route_library.db` will download
3. Save this file in a safe location (cloud storage, external drive, etc.)

### Importing Your Library

1. Click the **Import DB** button
2. Select a previously exported `route_library.db` file
3. Confirm the import
4. Your entire library will be restored

### Transfer Between Devices

Use export/import to move your library:
1. Export from your desktop computer
2. Transfer the .db file (email, USB, cloud)
3. Import on your laptop or different browser

## Tips and Best Practices

### Organization

- **Use folders by region**: Alps, Pyrenees, Dolomites
- **Use folders by year**: Tours 2024, Tours 2025
- **Use folders by trip**: Scotland Tour 2024, Norway Adventure
- **Descriptive names**: "Day 1 - Munich to Innsbruck" instead of "route1.gpx"

### File Management

- Upload related routes to the same folder
- Create a folder structure before uploading
- Use filters to find routes quickly

### Backups

- Export your database weekly if actively adding routes
- Export before clearing browser cache
- Keep multiple backup copies
- Store backups in cloud storage (Google Drive, Dropbox)

### Performance

- The application can handle 2,500 files efficiently
- Larger files (10-20MB) take longer to process
- Close other browser tabs if upload is slow

## Troubleshooting

### Upload Issues

**Problem**: File won't upload
- Check file is .gpx format
- Verify file size is under 20MB
- Ensure file is valid GPX format
- Check browser console for errors

**Problem**: Upload is very slow
- Large files take longer to process
- Close other applications
- Try uploading fewer files at once

### Display Issues

**Problem**: Map doesn't show route
- Try single-clicking the file again
- Check if the GPX file contains valid coordinates
- Refresh the browser page

**Problem**: Routes look wrong
- The application converts GPX 1.1 to GPX 1.0
- Some route details may be simplified
- Waypoints are preserved

### Database Issues

**Problem**: Data disappeared
- Browser cache was likely cleared
- Import your last database backup
- Prevention: Export database regularly

**Problem**: Can't import database
- Ensure file is the exported `route_library.db`
- Check file isn't corrupted
- Try exporting and re-importing

### Browser Issues

**Problem**: Application won't load
- Clear browser cache and reload
- Try a different browser
- Check browser version (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Check JavaScript is enabled

### Storage Limits

**Problem**: Can't upload more files
- Browser storage limits vary (50MB-several GB)
- Export and delete old routes
- Consider organizing files more efficiently

## Getting Help

If you encounter issues not covered here:

1. Check the browser console for error messages (F12 key)
2. Export your database before troubleshooting
3. Try refreshing the page
4. Try a different browser
5. Report issues on GitHub

## Privacy and Data

- All data is stored locally in your browser
- No data is sent to any server
- Your routes remain completely private
- No account or login required
- No tracking or analytics
