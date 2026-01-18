# GPX Library - User Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Uploading Routes](#uploading-routes)
4. [Organizing Routes](#organizing-routes)
5. [Viewing and Navigating](#viewing-and-navigating)
6. [Working with Routes, Tracks, and Waypoints](#working-with-routes-tracks-and-waypoints)
7. [Downloading and Exporting](#downloading-and-exporting)
8. [Keyboard Shortcuts](#keyboard-shortcuts)
9. [Filtering Routes](#filtering-routes)
10. [Managing Your Library](#managing-your-library)
11. [Backup and Restore](#backup-and-restore)
12. [Tips and Best Practices](#tips-and-best-practices)
13. [Troubleshooting](#troubleshooting)

## Introduction

GPX Library is a web-based route management tool designed specifically for motorcycle riders. It helps you organize, preview, and manage your GPX route files directly in your web browser - no server or installation required.

### Key Features

- Store up to 2,500 GPX files (each up to 20MB)
- Organize routes in folders
- Preview routes on OpenStreetMap with road routing
- View trip length, waypoint count, and estimated riding time
- Navigate inside GPX files to view individual routes, tracks, and waypoints
- Copy and paste routes between GPX files
- Download individual routes, tracks, or entire folders
- Keyboard navigation for efficient workflow
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
- File actions (Rename, Delete)
- Database export/import buttons
- Current folder path (clickable for navigation)
- Filter controls
- File and folder list

**Right Panel - Map Preview**
- Route name and metadata
- Routing strategy selector (for routes)
- Interactive map showing selected route
- Save button (appears when changes are made)

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
- Generate tracks from routes for GPS compatibility
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
- **Double-click ".."** to go up one level
- **Click the path** at the top (e.g., `/Alps/Day 1`) to jump to any parent folder
- Folders can be nested within other folders

### Folder Structure Example

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

## Viewing and Navigating

### Viewing a GPX File

1. **Single-click** a GPX file in the list
2. The map will show all routes, tracks, and waypoints
3. Metadata appears above the map
4. Different routes/tracks appear in different colors

### Navigating Inside a GPX File

1. **Double-click** a GPX file to open its contents
2. The list will show:
   - **Routes** section (if any)
   - **Tracks** section (if any)
   - **Waypoints** section (if any)
3. **Single-click** any item to preview it on the map
4. **Double-click ".."** to go back to the folder view
5. The filter is hidden when viewing GPX contents (not needed)

### Map Features

- **Different Colors**: Each route/track appears in a different color (consistent across all views)
- **Road Routing**: Routes automatically calculate road paths between waypoints
- **Semi-Transparent Lines**: 30% opacity lets you see overlapping paths
- **Waypoint Markers**: Red markers with labels show waypoint locations
- **Auto-Zoom**: Map automatically adjusts to show the entire route
- **Interactive**: Click and drag to pan, scroll to zoom

### Routing Strategies

When viewing a route, you can select a routing strategy:

- **Road (Fast)**: Fastest route using any suitable road
- **Road - Avoid Motorway**: Avoids motorways/highways
- **Curvy (Scenic)**: Prefer winding scenic roads
- **Prefer Unpaved**: Include unpaved/gravel roads

**Note**: The public OSRM routing service uses the same profile for all strategies. For full functionality, you would need a self-hosted routing service.

### Update Track Button

After changing the routing strategy, you can click **Update Track** to regenerate the track with the new calculated route. This updates the auto-generated track that many GPS devices use.

## Working with Routes, Tracks, and Waypoints

### Renaming Items

1. **Single-click** to select a route, track, or waypoint
2. Click the **Rename** button
3. Enter the new name
4. Press OK

You can rename:
- Folders
- GPX files
- Individual routes
- Individual tracks
- Individual waypoints

### Deleting Items

1. **Single-click** to select one or more items
2. Click the **Delete** button
3. Confirm the deletion

You can delete:
- Folders (including all contents)
- GPX files
- Individual routes
- Individual tracks
- Individual waypoints

**Warning**: Deleting a folder or GPX file will delete all contents. This cannot be undone!

### Copy and Paste

You can copy routes, tracks, and waypoints between GPX files:

**To Copy:**
1. Open a GPX file (double-click it)
2. Select one or more routes/tracks/waypoints
3. Press **Ctrl+C** (or Cmd+C on Mac)
4. A message confirms the items were copied

**To Paste into existing GPX:**
1. Open the target GPX file (double-click it)
2. Press **Ctrl+V** (or Cmd+V on Mac)
3. The items are added to the GPX file
4. The list refreshes automatically
5. The first pasted item is selected and displayed

**To Paste as new GPX:**
1. Navigate to the folder where you want the new GPX
2. Press **Ctrl+V** (or Cmd+V on Mac)
3. Enter a name for the new GPX file
4. The new GPX is created with the pasted items
5. The file opens automatically showing the pasted content

## Downloading and Exporting

### Download Single GPX File

1. **Single-click** a GPX file
2. Click the **Download** button
3. The file downloads with its original name

### Download Folder as ZIP

1. **Single-click** a folder
2. Click the **Download** button
3. A ZIP file containing all GPX files in that folder will download

### Download Individual Routes/Tracks/Waypoints

1. Open a GPX file (double-click it)
2. **Single-click** a route, track, or waypoint
3. Click the **Download** button
4. A GPX file containing only that item will download
5. The downloaded file uses the item's name

### Download Multiple Items

1. Select multiple items using Ctrl+Click
2. Click the **Download** button
3. A ZIP file containing all selected items will download

Mixed selections (GPX files + folders + routes) are intelligently packaged:
- GPX files are included directly
- Folders are flattened (all GPX files extracted)
- Routes/tracks/waypoints are extracted as individual GPX files

## Keyboard Shortcuts

### Navigation

- **Arrow Up/Down**: Move selection up or down in the list
- **Enter**: Open selected folder or GPX file (same as double-click)
- **Backspace**: Go up one level (when at folder level)

### Editing

- **Ctrl+C** (Cmd+C): Copy selected routes/tracks/waypoints
- **Ctrl+V** (Cmd+V): Paste copied items
- **Delete**: Delete selected items (after confirmation)
- **F2**: Rename selected item

### Selection

- **Click**: Select single item
- **Ctrl+Click**: Add/remove item from selection
- **Shift+Click**: Select range (not yet implemented)

## Filtering Routes

Use the filter controls to find specific routes (only available at folder level):

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

### Multi-Selection

You can select multiple items:

- **Ctrl+Click** to add items to selection
- **Click** on already selected item to deselect
- Selected items are highlighted in blue

You can select:
- Multiple folders
- Multiple GPX files
- Multiple routes/tracks/waypoints (when inside a GPX file)
- Mixed selections (folders + GPX files)

### Understanding Metadata

When you select a GPX file, you'll see:

- **Length**: Total distance in kilometers
- **Waypoints**: Number of waypoints
- **Riding Time**: Estimated time at average motorcycle speed (50 km/h)

When you select a route or track:

- **Length**: Distance of that specific route/track
- **Riding Time**: Estimated time for that route/track

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

**Warning**: Importing will replace your current library. Export first if you want to keep current data!

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
- Use copy/paste to build custom tours from existing routes

### Keyboard Efficiency

- Use Arrow keys to quickly browse routes
- Use Enter to open files/folders
- Use Ctrl+C/V to quickly duplicate and modify routes
- Learn the keyboard shortcuts for faster workflow

### Backups

- Export your database weekly if actively adding routes
- Export before clearing browser cache
- Keep multiple backup copies
- Store backups in cloud storage (Google Drive, Dropbox)

### Performance

- The application can handle 2,500 files efficiently
- Larger files (10-20MB) take longer to process
- Close other browser tabs if upload is slow
- Use folders to organize - don't put all files in root

## Troubleshooting

### Upload Issues

**Problem**: File won't upload
- Check file is .gpx format
- Verify file size is under 20MB
- Ensure file is valid GPX format
- Check browser console for errors (F12)

**Problem**: Upload is very slow
- Large files take longer to process
- Close other applications
- Try uploading fewer files at once

### Display Issues

**Problem**: Map doesn't show route
- Try single-clicking the file again
- Check if the GPX file contains valid coordinates
- Refresh the browser page
- Check browser console for errors

**Problem**: Routes show as straight lines
- The routing service may be unavailable
- Try refreshing the page
- Check your internet connection (routing requires network access)

**Problem**: Routes look wrong
- The application converts GPX 1.1 to GPX 1.0
- Some route details may be simplified
- Waypoints are preserved

### Copy/Paste Issues

**Problem**: Paste doesn't work
- Make sure you copied routes/tracks/waypoints (not folders or GPX files)
- Copied items must be from inside a GPX file
- Try copying again

**Problem**: Pasted items don't appear
- The list should refresh automatically
- Try clicking somewhere else and back
- Refresh the browser page if needed

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

**Problem**: Keyboard shortcuts don't work
- Make sure you're not typing in an input field
- Click somewhere in the file list first
- Try refreshing the page

### Storage Limits

**Problem**: Can't upload more files
- Browser storage limits vary (50MB-several GB)
- Export and delete old routes
- Consider organizing files more efficiently
- Use folders to group related routes

## Getting Help

If you encounter issues not covered here:

1. Check the browser console for error messages (F12 key)
2. Export your database before troubleshooting
3. Try refreshing the page
4. Try a different browser
5. Report issues on GitHub

## Privacy and Data

- All data is stored locally in your browser
- No data is sent to any server (except routing requests to OSRM)
- Your routes remain completely private
- No account or login required
- No tracking or analytics
