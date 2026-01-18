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
        // Implementation will be added in Phase 5
        alert('Download functionality coming soon!');
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
