/**
 * UI Controller Module
 * Handles UI updates and user interactions
 */

const UIController = (function() {
    'use strict';
    
    let filters = {
        name: '',
        lengthMin: null,
        lengthMax: null,
        waypointsMin: null,
        waypointsMax: null,
        timeMin: null,
        timeMax: null
    };
    
    /**
     * Initialize UI event handlers
     */
    function init() {
        // Upload button
        $('#uploadBtn').on('click', handleUploadClick);
        $('#gpxFileInput').on('change', handleFileSelect);
        
        // Download button
        $('#downloadBtn').on('click', handleDownloadClick);
        
        // New folder button
        $('#newFolderBtn').on('click', handleNewFolderClick);
        
        // Database export/import
        $('#exportDbBtn').on('click', handleExportDbClick);
        $('#importDbBtn').on('click', handleImportDbClick);
        $('#dbFileInput').on('change', handleDbFileSelect);

        // Developer tools
        $('#deleteDbBtn').on('click', handleDeleteDbClick);

        // File actions
        $('#renameBtn').on('click', handleRenameClick);
        $('#deleteBtn').on('click', handleDeleteClick);

        // Filter inputs
        $('#filterName').on('input', handleFilterChange);
        $('#filterLengthMin, #filterLengthMax').on('input', handleFilterChange);
        $('#filterWaypointsMin, #filterWaypointsMax').on('input', handleFilterChange);
        $('#filterTimeMin, #filterTimeMax').on('input', handleFilterChange);

        // Path navigation
        $('#currentPath').on('click', handlePathClick);
    }
    
    /**
     * Render file list
     */
    function renderFileList() {
        const currentFolderId = FileManager.getCurrentFolderId();
        const currentGpxId = FileManager.getCurrentGpxId();
        const $fileList = $('#fileList');
        $fileList.empty();
        
        // Update current path
        const path = currentGpxId 
            ? FileManager.getFolderPath(currentFolderId) + '/' + FileManager.getGpxFile(currentGpxId).name
            : FileManager.getFolderPath(currentFolderId);
        $('#currentPath').text(path);
        
        if (currentGpxId) {
            // Show GPX contents
            renderGpxContents(currentGpxId, $fileList);
        } else {
            // Show folder contents
            renderFolderContents(currentFolderId, $fileList);
        }
    }
    
    /**
     * Render folder contents
     */
    function renderFolderContents(folderId, $container) {
        const contents = FileManager.getFolderContents(folderId);
        
        // Add ".." navigation if not at root
        if (folderId !== null) {
            const $parentItem = createParentNavigationItem();
            $container.append($parentItem);
        }
        
        // Apply filters
        const filteredFolders = contents.folders;
        const filteredFiles = applyFilters(contents.gpxFiles);
        
        // Render folders
        filteredFolders.forEach(folder => {
            const $item = createFileItem('folder', folder.id, folder.name, '📁');
            $container.append($item);
        });
        
        // Render GPX files
        filteredFiles.forEach(file => {
            const metadata = `${file.length_km.toFixed(1)}km • ${file.waypoint_count} WP • ${file.riding_time_hours.toFixed(1)}h`;
            const $item = createFileItem('gpx', file.id, file.name, '🗺️', metadata);
            $container.append($item);
        });
        
        // Show empty state if needed
        if (filteredFolders.length === 0 && filteredFiles.length === 0) {
            $container.append('<div class="empty-state">No files or folders</div>');
        }
    }
    
    /**
     * Render GPX contents
     */
    function renderGpxContents(gpxId, $container) {
        const contents = FileManager.getGpxContents(gpxId);

        // Add ".." navigation to go back to folder view
        const $parentItem = createParentNavigationItem();
        $container.append($parentItem);

        // Routes section
        if (contents.routes.length > 0) {
            $container.append('<div class="gpx-section-header">Routes</div>');
            contents.routes.forEach(route => {
                const metadata = `${route.length_km.toFixed(1)}km • ${route.riding_time_hours.toFixed(1)}h`;
                const $item = createFileItem('route', route.id, route.name, '➡️', metadata);
                $container.append($item);
            });
        }

        // Tracks section
        if (contents.tracks.length > 0) {
            $container.append('<div class="gpx-section-header">Tracks</div>');
            contents.tracks.forEach(track => {
                const metadata = `${track.length_km.toFixed(1)}km • ${track.riding_time_hours.toFixed(1)}h`;
                const $item = createFileItem('track', track.id, track.name, '🛣️', metadata);
                $container.append($item);
            });
        }

        // Waypoints section
        if (contents.waypoints.length > 0) {
            $container.append('<div class="gpx-section-header">Waypoints</div>');
            contents.waypoints.forEach(waypoint => {
                const metadata = `${waypoint.lat.toFixed(4)}, ${waypoint.lon.toFixed(4)}`;
                const $item = createFileItem('waypoint', waypoint.id, waypoint.name, '📍', metadata);
                $container.append($item);
            });
        }
    }
    
    /**
     * Create parent navigation item ".."
     */
    function createParentNavigationItem() {
        const $item = $('<div>')
            .addClass('file-item')
            .addClass('parent-nav')
            .data('type', 'parent')
            .data('id', -1);
        
        $item.append('<span class="icon">📁</span>');
        $item.append('<span class="name">..</span>');
        
        // Double click to navigate up
        $item.on('dblclick', function(e) {
            navigateToParent();
        });
        
        return $item;
    }
    
    /**
     * Navigate to parent folder or folder view
     */
    function navigateToParent() {
        const currentGpxId = FileManager.getCurrentGpxId();
        const currentFolderId = FileManager.getCurrentFolderId();
        
        if (currentGpxId !== null) {
            // We're inside a GPX file, go back to folder view
            FileManager.setCurrentGpxId(null);
            FileManager.clearSelection();
            renderFileList();
            MapPreview.showEmptyState();
            updatePreviewTitle('Select a GPX file to preview');
        } else if (currentFolderId !== null) {
            // We're in a subfolder, go to parent folder
            const parentResult = Database.query(
                'SELECT parent_id FROM folders WHERE id = ?',
                [currentFolderId]
            );
            const parentId = parentResult.length > 0 ? parentResult[0].parent_id : null;
            FileManager.setCurrentFolderId(parentId);
            FileManager.clearSelection();
            renderFileList();
            MapPreview.showEmptyState();
            updatePreviewTitle('Select a GPX file to preview');
        }
    }
    
    /**
     * Create file item element
     */
    function createFileItem(type, id, name, icon, metadata = '') {
        const $item = $('<div>')
            .addClass('file-item')
            .addClass(type)
            .data('type', type)
            .data('id', id);
        
        $item.append(`<span class="icon">${icon}</span>`);
        $item.append(`<span class="name">${name || 'Unnamed'}</span>`);
        if (metadata) {
            $item.append(`<span class="metadata">${metadata}</span>`);
        }
        
        // Single click - select
        $item.on('click', function(e) {
            handleItemClick(e, type, id, $item);
        });
        
        // Double click - navigate or preview
        $item.on('dblclick', function(e) {
            handleItemDoubleClick(type, id);
        });
        
        return $item;
    }
    
    /**
     * Handle item click (selection)
     */
    function handleItemClick(e, type, id, $item) {
        const selectedItems = FileManager.getSelectedItems();
        const isSelected = selectedItems.some(i => i.type === type && i.id === id);

        if (e.ctrlKey || e.metaKey) {
            // Multi-select
            if (isSelected) {
                FileManager.removeSelectedItem({ type, id });
                $item.removeClass('selected');
            } else {
                FileManager.addSelectedItem({ type, id });
                $item.addClass('selected');
            }
            // Update preview for all selected items
            updateMultiSelectPreview();
        } else {
            // Single select
            FileManager.clearSelection();
            $('.file-item').removeClass('selected');
            FileManager.addSelectedItem({ type, id });
            $item.addClass('selected');

            // Update preview
            updatePreview(type, id);
        }
    }

    /**
     * Update preview for multiple selected items
     */
    function updateMultiSelectPreview() {
        const selectedItems = FileManager.getSelectedItems();
        const currentGpxId = FileManager.getCurrentGpxId();

        if (selectedItems.length === 0) {
            MapPreview.showEmptyState();
            updatePreviewTitle('No selection');
            return;
        }

        if (selectedItems.length === 1) {
            updatePreview(selectedItems[0].type, selectedItems[0].id);
            return;
        }

        // Multiple items selected - display all on map
        MapPreview.clearMap();

        let totalLength = 0;
        let itemNames = [];

        selectedItems.forEach(item => {
            if (item.type === 'route') {
                const route = Database.query('SELECT * FROM routes WHERE id = ?', [item.id])[0];
                MapPreview.displayRoute(currentGpxId, item.id, true); // true = don't clear map
                totalLength += route.length_km;
                itemNames.push(route.name);
            } else if (item.type === 'track') {
                const track = Database.query('SELECT * FROM tracks WHERE id = ?', [item.id])[0];
                MapPreview.displayTrack(currentGpxId, item.id, true); // true = don't clear map
                totalLength += track.length_km;
                itemNames.push(track.name);
            } else if (item.type === 'waypoint') {
                MapPreview.displayWaypoint(currentGpxId, item.id, true); // true = don't clear map
                itemNames.push(Database.query('SELECT name FROM waypoints WHERE id = ?', [item.id])[0].name);
            }
        });

        MapPreview.fitBounds();

        const metadata = `${selectedItems.length} items selected${totalLength > 0 ? ` • Total length: ${totalLength.toFixed(1)} km` : ''}`;
        updatePreviewTitle(itemNames.join(', '), metadata);
    }
    
    /**
     * Handle item double click (navigation)
     */
    function handleItemDoubleClick(type, id) {
        if (type === 'folder') {
            // Navigate into folder
            FileManager.setCurrentFolderId(id);
            FileManager.setCurrentGpxId(null);
            FileManager.clearSelection();
            renderFileList();
            MapPreview.showEmptyState();
            updatePreviewTitle('Select a GPX file to preview');
        } else if (type === 'gpx') {
            // Navigate into GPX file
            FileManager.setCurrentGpxId(id);
            FileManager.clearSelection();
            renderFileList();
            MapPreview.displayGpx(id);
            updatePreviewFromGpxId(id);
        } else if (type === 'waypoint') {
            // Copy waypoint coordinates to clipboard
            const waypoint = Database.query('SELECT lat, lon, name FROM waypoints WHERE id = ?', [id])[0];
            if (waypoint) {
                const coords = `${waypoint.lat.toFixed(6)}, ${waypoint.lon.toFixed(6)}`;
                navigator.clipboard.writeText(coords)
                    .then(() => {
                        // Show temporary notification
                        const name = waypoint.name || 'Waypoint';
                        updatePreviewTitle(`Copied to clipboard: ${name}`, coords);
                    })
                    .catch(err => {
                        alert('Failed to copy coordinates to clipboard');
                    });
            }
        }
    }
    
    /**
     * Update preview based on selection
     */
    function updatePreview(type, id) {
        const currentGpxId = FileManager.getCurrentGpxId();
        
        if (type === 'gpx') {
            MapPreview.displayGpx(id);
            updatePreviewFromGpxId(id);
        } else if (type === 'route') {
            MapPreview.displayRoute(currentGpxId, id);
            updatePreviewFromRoute(currentGpxId, id);
        } else if (type === 'track') {
            MapPreview.displayTrack(currentGpxId, id);
            updatePreviewFromTrack(currentGpxId, id);
        } else if (type === 'waypoint') {
            MapPreview.displayWaypoint(currentGpxId, id);
            updatePreviewFromWaypoint(currentGpxId, id);
        } else if (type === 'folder') {
            MapPreview.showEmptyState();
            updatePreviewTitle('Folder: ' + Database.query('SELECT name FROM folders WHERE id = ?', [id])[0].name);
        }
    }
    
    /**
     * Update preview title and metadata
     */
    function updatePreviewTitle(title, metadata = '') {
        $('#previewTitle').text(title);
        $('#previewMetadata').html(metadata);
    }
    
    function updatePreviewFromGpxId(gpxId) {
        const file = FileManager.getGpxFile(gpxId);
        const metadata = `Length: ${file.length_km.toFixed(1)} km • Waypoints: ${file.waypoint_count} • Riding time: ${file.riding_time_hours.toFixed(1)} hours`;
        updatePreviewTitle(file.name, metadata);
    }
    
    function updatePreviewFromRoute(gpxId, routeId) {
        const route = Database.query('SELECT * FROM routes WHERE id = ?', [routeId])[0];
        const metadata = `Length: ${route.length_km.toFixed(1)} km • Riding time: ${route.riding_time_hours.toFixed(1)} hours`;
        updatePreviewTitle('Route: ' + route.name, metadata);
    }
    
    function updatePreviewFromTrack(gpxId, trackId) {
        const track = Database.query('SELECT * FROM tracks WHERE id = ?', [trackId])[0];
        const metadata = `Length: ${track.length_km.toFixed(1)} km • Riding time: ${track.riding_time_hours.toFixed(1)} hours`;
        updatePreviewTitle('Track: ' + track.name, metadata);
    }
    
    function updatePreviewFromWaypoint(gpxId, waypointId) {
        const waypoint = Database.query('SELECT * FROM waypoints WHERE id = ?', [waypointId])[0];
        const metadata = `Coordinates: ${waypoint.lat.toFixed(6)}, ${waypoint.lon.toFixed(6)}`;
        updatePreviewTitle('Waypoint: ' + waypoint.name, metadata);
    }
    
    /**
     * Apply filters to GPX files
     */
    function applyFilters(files) {
        return files.filter(file => {
            // Name filter
            if (filters.name && !file.name.toLowerCase().includes(filters.name.toLowerCase())) {
                return false;
            }
            
            // Length filter
            if (filters.lengthMin !== null && file.length_km < filters.lengthMin) {
                return false;
            }
            if (filters.lengthMax !== null && file.length_km > filters.lengthMax) {
                return false;
            }
            
            // Waypoints filter
            if (filters.waypointsMin !== null && file.waypoint_count < filters.waypointsMin) {
                return false;
            }
            if (filters.waypointsMax !== null && file.waypoint_count > filters.waypointsMax) {
                return false;
            }
            
            // Time filter
            if (filters.timeMin !== null && file.riding_time_hours < filters.timeMin) {
                return false;
            }
            if (filters.timeMax !== null && file.riding_time_hours > filters.timeMax) {
                return false;
            }
            
            return true;
        });
    }
    
    /**
     * Event Handlers
     */
    
    function handleUploadClick() {
        $('#gpxFileInput').click();
    }
    
    async function handleFileSelect(e) {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        showLoadingSpinner();
        
        try {
            const results = await FileManager.uploadGpxFiles(files, FileManager.getCurrentFolderId());
            
            // Show results
            if (results.errors.length > 0) {
                let errorMsg = 'Some files could not be uploaded:\n';
                results.errors.forEach(err => {
                    errorMsg += `\n${err.file}: ${err.error}`;
                });
                alert(errorMsg);
            }
            
            if (results.success.length > 0) {
                renderFileList();
            }
        } catch (error) {
            alert('Upload failed: ' + error.message);
        } finally {
            hideLoadingSpinner();
            // Reset file input
            $('#gpxFileInput').val('');
        }
    }
    
    function handleDownloadClick() {
        const selectedItems = FileManager.getSelectedItems();

        if (selectedItems.length === 0) {
            alert('Please select one or more GPX files to download');
            return;
        }

        // Filter only GPX files
        const gpxFiles = selectedItems.filter(item => item.type === 'gpx');

        if (gpxFiles.length === 0) {
            alert('Please select GPX files to download (folders cannot be downloaded yet)');
            return;
        }

        if (gpxFiles.length === 1) {
            // Single file download
            downloadSingleGpx(gpxFiles[0].id);
        } else {
            // Multiple files - download as ZIP
            downloadMultipleGpx(gpxFiles);
        }
    }

    function downloadSingleGpx(gpxId) {
        const gpxFile = FileManager.getGpxFile(gpxId);
        if (!gpxFile) {
            alert('GPX file not found');
            return;
        }

        // Create download link
        const blob = new Blob([gpxFile.content], { type: 'application/gpx+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = gpxFile.name + '.gpx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function downloadMultipleGpx(gpxFiles) {
        const zip = new JSZip();

        gpxFiles.forEach(item => {
            const gpxFile = FileManager.getGpxFile(item.id);
            if (gpxFile) {
                zip.file(gpxFile.name + '.gpx', gpxFile.content);
            }
        });

        zip.generateAsync({ type: 'blob' })
            .then(content => {
                const url = URL.createObjectURL(content);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'gpx-files.zip';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            })
            .catch(error => {
                alert('Failed to create ZIP file: ' + error.message);
            });
    }

    function handleRenameClick() {
        const selectedItems = FileManager.getSelectedItems();

        if (selectedItems.length === 0) {
            alert('Please select an item to rename');
            return;
        }

        if (selectedItems.length > 1) {
            alert('Please select only one item to rename');
            return;
        }

        const item = selectedItems[0];
        let currentName = '';

        if (item.type === 'folder') {
            const folder = Database.query('SELECT name FROM folders WHERE id = ?', [item.id]);
            currentName = folder[0]?.name || '';
        } else if (item.type === 'gpx') {
            const gpxFile = FileManager.getGpxFile(item.id);
            currentName = gpxFile?.name || '';
        } else {
            alert('Cannot rename this type of item');
            return;
        }

        const newName = prompt('Enter new name:', currentName);
        if (!newName || newName === currentName) return;

        if (item.type === 'folder') {
            FileManager.renameFolder(item.id, newName)
                .then(() => {
                    renderFileList();
                })
                .catch(error => {
                    alert('Failed to rename folder: ' + error.message);
                });
        } else if (item.type === 'gpx') {
            FileManager.renameGpxFile(item.id, newName)
                .then(() => {
                    renderFileList();
                })
                .catch(error => {
                    alert('Failed to rename file: ' + error.message);
                });
        }
    }

    function handleDeleteClick() {
        const selectedItems = FileManager.getSelectedItems();

        if (selectedItems.length === 0) {
            alert('Please select one or more items to delete');
            return;
        }

        const confirmMsg = selectedItems.length === 1
            ? 'Are you sure you want to delete this item?'
            : `Are you sure you want to delete ${selectedItems.length} items?`;

        if (!confirm(confirmMsg)) return;

        Promise.all(selectedItems.map(item => {
            if (item.type === 'folder') {
                return FileManager.deleteFolder(item.id);
            } else if (item.type === 'gpx') {
                return FileManager.deleteGpxFile(item.id);
            }
        }))
        .then(() => {
            FileManager.clearSelection();
            renderFileList();
        })
        .catch(error => {
            alert('Failed to delete items: ' + error.message);
        });
    }
    
    function handleNewFolderClick() {
        const name = prompt('Enter folder name:');
        if (!name) return;
        
        FileManager.createFolder(name, FileManager.getCurrentFolderId())
            .then(() => {
                renderFileList();
            })
            .catch(error => {
                alert('Failed to create folder: ' + error.message);
            });
    }
    
    function handleExportDbClick() {
        try {
            const data = Database.exportDatabase();
            const blob = new Blob([data], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'route_library.db';
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            alert('Export failed: ' + error.message);
        }
    }
    
    function handleImportDbClick() {
        $('#dbFileInput').click();
    }
    
    async function handleDbFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        showLoadingSpinner();
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            const data = new Uint8Array(arrayBuffer);
            await Database.importDatabase(data);
            
            // Reset state
            FileManager.setCurrentFolderId(null);
            FileManager.setCurrentGpxId(null);
            FileManager.clearSelection();
            
            renderFileList();
            MapPreview.showEmptyState();
            updatePreviewTitle('Select a GPX file to preview');
            
            alert('Database imported successfully!');
        } catch (error) {
            alert('Import failed: ' + error.message);
        } finally {
            hideLoadingSpinner();
            $('#dbFileInput').val('');
        }
    }

    async function handleDeleteDbClick() {
        if (!confirm('Delete all data and reinitialize database? This cannot be undone!')) {
            return;
        }

        showLoadingSpinner();

        try {
            await Database.deleteAndReinitialize();

            // Reset state
            FileManager.setCurrentFolderId(null);
            FileManager.setCurrentGpxId(null);
            FileManager.clearSelection();

            renderFileList();
            MapPreview.showEmptyState();
            updatePreviewTitle('Select a GPX file to preview');

            alert('Database deleted and reinitialized successfully!');
        } catch (error) {
            alert('Delete failed: ' + error.message);
        } finally {
            hideLoadingSpinner();
        }
    }

    function handleFilterChange() {
        filters.name = $('#filterName').val();
        filters.lengthMin = parseFloat($('#filterLengthMin').val()) || null;
        filters.lengthMax = parseFloat($('#filterLengthMax').val()) || null;
        filters.waypointsMin = parseInt($('#filterWaypointsMin').val()) || null;
        filters.waypointsMax = parseInt($('#filterWaypointsMax').val()) || null;
        filters.timeMin = parseFloat($('#filterTimeMin').val()) || null;
        filters.timeMax = parseFloat($('#filterTimeMax').val()) || null;
        
        renderFileList();
    }
    
    function handlePathClick() {
        // Navigate back to root
        FileManager.setCurrentFolderId(null);
        FileManager.setCurrentGpxId(null);
        FileManager.clearSelection();
        renderFileList();
        MapPreview.showEmptyState();
        updatePreviewTitle('Select a GPX file to preview');
    }
    
    /**
     * Loading spinner
     */
    function showLoadingSpinner() {
        const spinner = $('<div class="spinner-overlay"><div class="spinner-border text-primary" role="status"></div></div>');
        $('body').append(spinner);
    }
    
    function hideLoadingSpinner() {
        $('.spinner-overlay').remove();
    }
    
    // Public API
    return {
        init,
        renderFileList,
        showLoadingSpinner,
        hideLoadingSpinner
    };
})();
