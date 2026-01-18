# GPX Library - User Guide

## Overview

GPX Library is a web-based application for managing, organizing, and previewing GPX (GPS Exchange Format) files for motorcycle route planning. All data is stored locally in your browser using IndexedDB.

## Table of Contents

1. [Getting Started](#getting-started)
2. [File Organization](#file-organization)
3. [File Operations](#file-operations)
4. [Navigation](#navigation)
5. [Copy and Paste](#copy-and-paste)
6. [Drag and Drop](#drag-and-drop)
7. [Map Preview](#map-preview)
8. [Keyboard Shortcuts](#keyboard-shortcuts)
9. [Database Management](#database-management)
10. [Troubleshooting](#troubleshooting)

## Getting Started

### First Time Setup

1. Open `index.html` in a modern web browser (Chrome, Firefox, Edge, or Safari)
2. The application will initialize a local database automatically
3. You're ready to start uploading GPX files!

### Uploading GPX Files

1. Click the orange **+** (plus) button in the bottom-right corner
2. Select one or more GPX files from your computer
3. Files will be parsed and added to your library
4. You'll see a success notification for each uploaded file

## File Organization

### Folder Structure

- Organize your GPX files using **folders**
- Create nested folder structures for better organization
- Example structure:
  ```
  Root
  ├── Europe
  │   ├── Alps
  │   ├── Black Forest
  │   └── Dolomites
  ├── Local Routes
  └── Planned Trips
  ```

### Creating Folders

1. Click the **New Folder** button in the left sidebar
2. Enter a folder name in the dialog
3. Click **OK** to create

### Folder Navigation

- Click on a folder to open it
- Use the breadcrumb navigation at the top to navigate up the hierarchy
- Click **Home** in the breadcrumb to return to the root level

## File Operations

### Renaming

**Folders and Files:**
1. Select the item (single-click on card)
2. Click the rename button (pencil icon) in the toolbar, or press `F2`
3. Enter the new name
4. Click **OK**

**Routes, Tracks, and Waypoints:**
- Same process, but changes are in-memory only
- Remember to save changes using the **Save** button when it appears

### Deleting

1. Select one or more items
2. Click the delete button (trash icon) in the toolbar, or press `Delete`
3. Confirm the deletion in the dialog

**Note:** Deleting a folder will also delete all its contents recursively.

### Downloading

**Single File:**
- Select a GPX file and click the download button
- File will be downloaded to your computer

**Multiple Files:**
- Select multiple items
- Click download to create a ZIP file containing all selected items

**Folders:**
- Download a folder to get a ZIP with all GPX files in that folder

## Navigation

### Selection

**Single Select:**
- Click anywhere on a card (except the selection circle)
- The previously selected item will be deselected

**Multi-Select:**
- Click the circular button on the left side of each card
- Or hold `Ctrl` and click on cards
- Selection circles will show a checkmark when selected

**Auto-Select:**
- The first item is automatically selected when you navigate to a folder

### Breadcrumb Navigation

The breadcrumb trail at the top shows your current location:

```
Home / Europe / Alps / favorite-route.gpx
```

- Click any level to navigate to that location
- **Home** always returns to the root folder
- Current location is shown in gray (not clickable)

### Backspace Navigation

- Press `Backspace` to go up one level
- Works like clicking the parent in the breadcrumb

## Copy and Paste

### Copy/Paste Files and Folders

**Copying:**
1. Select one or more folders or GPX files
2. Press `Ctrl+C` or click the Copy button
3. You'll see a success notification

**Pasting:**
1. Navigate to the destination folder
2. Press `Ctrl+V` or click the Paste button
3. Items will be copied (not moved) to the current location

**Recursive Copy:**
- When copying a folder, all subfolders and files are copied
- Folder structure is preserved

### Copy/Paste GPX Content

**Within GPX Files:**
1. Open a GPX file (double-click)
2. Select routes, tracks, or waypoints
3. Press `Ctrl+C` to copy
4. Open another GPX file or stay in the current one
5. Press `Ctrl+V` to paste

**Creating New GPX from Clipboard:**
1. Copy routes/tracks/waypoints from a GPX file
2. Navigate to a folder (not inside a GPX)
3. Press `Ctrl+V`
4. Enter a name for the new GPX file
5. New file will be created with the pasted content

## Drag and Drop

### Moving Files and Folders

1. Click and hold on a file or folder card
2. Drag it over a destination folder
3. The folder will highlight when it can accept the drop
4. Release to move the items

**Multiple Items:**
- Select multiple items first
- Drag any of the selected items
- All selected items will be moved together

**Restrictions:**
- Cannot drop a folder into itself
- Cannot drop a folder into one of its subfolders (circular reference protection)
- Only folders can be drop targets

### Visual Feedback

- **Dragging:** Selected items get a semi-transparent appearance
- **Valid Drop Target:** Folder highlights with an orange border
- **Invalid Drop:** No highlighting

## Map Preview

### Viewing Routes

When you select a GPX file, route, track, or waypoint, the map preview shows:

- **Routes:** Full route with waypoints marked
- **Tracks:** GPS track visualization
- **Waypoints:** Single point on the map
- **Metadata:** Distance, duration, waypoint count

### Routing Strategies

For routes, you can change the routing strategy:

1. Select a route
2. Choose from the **Routing** dropdown:
   - 🏍️ Road (Fast) - default
   - 🛣️ Road - Avoid Motorway
   - 🌄 Curvy (Scenic)
   - 🏔️ Prefer Unpaved
3. Click **Update Track** to recalculate
4. Click **Save Changes** when the button appears

**Note:** The public OSRM router uses the same routing for all strategies. Use a custom OSRM server for strategy-specific routing.

### Map Controls

- **Zoom:** Mouse wheel or +/- buttons
- **Pan:** Click and drag
- **Fullscreen:** Click the fullscreen button (top-right of preview)

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `↑` `↓` | Navigate list |
| `Enter` | Open folder/file |
| `Backspace` | Go up one level |
| `Ctrl+C` | Copy |
| `Ctrl+V` | Paste |
| `F2` | Rename |
| `Delete` | Delete |
| `Ctrl+Click` | Multi-select |

To see this list in the app, click **Options** → **Keyboard Shortcuts**.

## Database Management

### Export Database

Save your entire library to a file:

1. Click **Options** → **Export Database**
2. Choose a location to save the `.db` file
3. Keep this file as a backup

### Import Database

Restore from a backup:

1. Click **Options** → **Import Database**
2. Select a previously exported `.db` file
3. Your library will be replaced with the imported data

**Warning:** Import will replace all current data. Export first if you want to keep your current library.

### Delete Database (Dev)

Completely reset the application:

1. Click **Options** → **Delete Database (Dev)**
2. Confirm the action
3. All data will be permanently deleted
4. A fresh database will be created

**This action cannot be undone!**

## Troubleshooting

### Files Won't Upload

- **Check file format:** Must be `.gpx` files
- **Check file size:** Very large files may take longer
- **Check browser console:** Press F12 and look for error messages
- **Try one file:** Upload files one at a time to isolate issues

### Database Errors

If you see errors about missing columns:

1. Open `tests/run-migrations.html` in your browser
2. Click **Run Migrations**
3. This will add any missing database columns
4. Refresh the main application

### Performance Issues

- **Too many files:** Consider organizing into folders
- **Clear browser cache:** Close and reopen the browser
- **Check available space:** IndexedDB has storage limits

### Lost Data

- **Export regularly:** Make backup exports of your database
- **Check browser:** Data is tied to the specific browser
- **Check domain:** Must use the same URL (localhost, file://, etc.)

## Tips and Best Practices

1. **Organize with folders:** Create a clear folder structure before importing many files
2. **Use descriptive names:** Name folders and files clearly
3. **Export regularly:** Back up your database periodically
4. **Test routing:** Try different routing strategies to find the best routes
5. **Multi-select efficiently:** Use Ctrl+Click for non-contiguous selection
6. **Use breadcrumbs:** Quick navigation is easier with breadcrumbs than clicking back repeatedly

## Support

For issues, bugs, or feature requests:
- Check the troubleshooting section above
- Review the Developer Documentation for technical details
- Check browser console for error messages
