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

        // Routing strategy
        $('#routingStrategy').on('change', handleRoutingStrategyChange);
        $('#updateTrackBtn').on('click', handleUpdateTrackClick);

        // Save changes
        $('#saveChangesBtn').on('click', handleSaveChangesClick);

        // Path navigation
        $('#currentPath').on('click', handlePathClick);

        // Keyboard navigation
        $(document).on('keydown', handleKeyboardNavigation);

        // Copy/Paste
        $(document).on('keydown', handleCopyPaste);
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
            $('#filterContainer').hide(); // Hide filter when in GPX view
            renderGpxContents(currentGpxId, $fileList);
        } else {
            // Show folder contents
            $('#filterContainer').show(); // Show filter when in folder view
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
            hideRoutingStrategyUI();
            return;
        }

        if (selectedItems.length === 1) {
            updatePreview(selectedItems[0].type, selectedItems[0].id);
            return;
        }

        // Multiple items selected - display all on map
        MapPreview.clearMap();
        hideRoutingStrategyUI(); // Hide routing UI for multiselect

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
            hideRoutingStrategyUI();
        } else if (type === 'route') {
            MapPreview.displayRoute(currentGpxId, id);
            updatePreviewFromRoute(currentGpxId, id);
            showRoutingStrategyUI(id);
        } else if (type === 'track') {
            MapPreview.displayTrack(currentGpxId, id);
            updatePreviewFromTrack(currentGpxId, id);
            hideRoutingStrategyUI();
        } else if (type === 'waypoint') {
            MapPreview.displayWaypoint(currentGpxId, id);
            updatePreviewFromWaypoint(currentGpxId, id);
            hideRoutingStrategyUI();
        } else if (type === 'folder') {
            MapPreview.showEmptyState();
            updatePreviewTitle('Folder: ' + Database.query('SELECT name FROM folders WHERE id = ?', [id])[0].name);
            hideRoutingStrategyUI();
        }
    }

    /**
     * Show routing strategy UI for selected route
     */
    function showRoutingStrategyUI(routeId) {
        // Load saved routing strategy from database
        const route = Database.query('SELECT routing_strategy FROM routes WHERE id = ?', [routeId])[0];
        const strategy = route?.routing_strategy || 'road';

        // Set the strategy in the dropdown
        $('#routingStrategy').val(strategy);
        Routing.setStrategy(strategy);

        // Store current route ID for later use
        $('#routingStrategyContainer').data('currentRouteId', routeId);

        // Show the container
        $('#routingStrategyContainer').show();

        // Hide Update Track button initially
        $('#updateTrackBtn').hide();
    }

    /**
     * Hide routing strategy UI
     */
    function hideRoutingStrategyUI() {
        $('#routingStrategyContainer').hide();
        $('#updateTrackBtn').hide();
        $('#routingStrategyContainer').data('currentRouteId', null);
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
            alert('Please select one or more items to download');
            return;
        }

        // Single item download
        if (selectedItems.length === 1) {
            const item = selectedItems[0];
            if (item.type === 'gpx') {
                downloadSingleGpx(item.id);
            } else if (item.type === 'folder') {
                downloadFolder(item.id);
            } else if (item.type === 'route' || item.type === 'track' || item.type === 'waypoint') {
                downloadGpxContent([item]);
            }
        } else {
            // Multiple items - create ZIP
            downloadMultipleItems(selectedItems);
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

    function downloadFolder(folderId) {
        const zip = new JSZip();
        const folderData = Database.query('SELECT name FROM folders WHERE id = ?', [folderId])[0];
        const folderName = folderData?.name || 'folder';

        // Get all GPX files in this folder
        const gpxFiles = Database.query('SELECT * FROM gpx_files WHERE folder_id = ?', [folderId]);

        if (gpxFiles.length === 0) {
            alert('Folder is empty');
            return;
        }

        gpxFiles.forEach(file => {
            zip.file(file.name + '.gpx', file.content);
        });

        zip.generateAsync({ type: 'blob' })
            .then(content => {
                const url = URL.createObjectURL(content);
                const a = document.createElement('a');
                a.href = url;
                a.download = folderName + '.zip';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            })
            .catch(error => {
                alert('Failed to create ZIP file: ' + error.message);
            });
    }

    function downloadGpxContent(items) {
        // Create new GPX file containing only the selected routes/tracks/waypoints
        const currentGpxId = FileManager.getCurrentGpxId();
        const gpxFile = FileManager.getGpxFile(currentGpxId);
        if (!gpxFile) return;

        const gpxData = GPXParser.parse(gpxFile.content);
        const newGpxData = {
            metadata: gpxData.metadata,
            routes: [],
            tracks: [],
            waypoints: []
        };

        items.forEach(item => {
            if (item.type === 'route') {
                const route = Database.query('SELECT * FROM routes WHERE id = ?', [item.id])[0];
                if (route && gpxData.routes[route.index_in_gpx]) {
                    newGpxData.routes.push(gpxData.routes[route.index_in_gpx]);
                }
            } else if (item.type === 'track') {
                const track = Database.query('SELECT * FROM tracks WHERE id = ?', [item.id])[0];
                if (track && gpxData.tracks[track.index_in_gpx]) {
                    newGpxData.tracks.push(gpxData.tracks[track.index_in_gpx]);
                }
            } else if (item.type === 'waypoint') {
                const waypoint = Database.query('SELECT * FROM waypoints WHERE id = ?', [item.id])[0];
                if (waypoint) {
                    newGpxData.waypoints.push({
                        lat: waypoint.lat,
                        lon: waypoint.lon,
                        name: waypoint.name,
                        ele: null,
                        desc: null,
                        time: null,
                        sym: null,
                        type: null
                    });
                }
            }
        });

        const gpxContent = GPXNormalizer.normalize(newGpxData);
        const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (items[0].type === 'route' ? 'route' : items[0].type === 'track' ? 'track' : 'waypoints') + '.gpx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function downloadMultipleItems(items) {
        const zip = new JSZip();

        const folders = items.filter(i => i.type === 'folder');
        const gpxFiles = items.filter(i => i.type === 'gpx');
        const gpxContent = items.filter(i => i.type === 'route' || i.type === 'track' || i.type === 'waypoint');

        // Add folders to ZIP
        folders.forEach(item => {
            const folderData = Database.query('SELECT name FROM folders WHERE id = ?', [item.id])[0];
            const folderName = folderData?.name || 'folder';
            const gpxFilesInFolder = Database.query('SELECT * FROM gpx_files WHERE folder_id = ?', [item.id]);

            gpxFilesInFolder.forEach(file => {
                zip.file(folderName + '/' + file.name + '.gpx', file.content);
            });
        });

        // Add GPX files to ZIP
        gpxFiles.forEach(item => {
            const gpxFile = FileManager.getGpxFile(item.id);
            if (gpxFile) {
                zip.file(gpxFile.name + '.gpx', gpxFile.content);
            }
        });

        // Add GPX content items (routes/tracks/waypoints) as a combined file
        if (gpxContent.length > 0) {
            const currentGpxId = FileManager.getCurrentGpxId();
            const gpxFile = FileManager.getGpxFile(currentGpxId);
            if (gpxFile) {
                const gpxData = GPXParser.parse(gpxFile.content);
                const newGpxData = {
                    metadata: gpxData.metadata,
                    routes: [],
                    tracks: [],
                    waypoints: []
                };

                gpxContent.forEach(item => {
                    if (item.type === 'route') {
                        const route = Database.query('SELECT * FROM routes WHERE id = ?', [item.id])[0];
                        if (route && gpxData.routes[route.index_in_gpx]) {
                            newGpxData.routes.push(gpxData.routes[route.index_in_gpx]);
                        }
                    } else if (item.type === 'track') {
                        const track = Database.query('SELECT * FROM tracks WHERE id = ?', [item.id])[0];
                        if (track && gpxData.tracks[track.index_in_gpx]) {
                            newGpxData.tracks.push(gpxData.tracks[track.index_in_gpx]);
                        }
                    } else if (item.type === 'waypoint') {
                        const waypoint = Database.query('SELECT * FROM waypoints WHERE id = ?', [item.id])[0];
                        if (waypoint) {
                            newGpxData.waypoints.push({
                                lat: waypoint.lat,
                                lon: waypoint.lon,
                                name: waypoint.name,
                                ele: null,
                                desc: null,
                                time: null,
                                sym: null,
                                type: null
                            });
                        }
                    }
                });

                const content = GPXNormalizer.normalize(newGpxData);
                zip.file('selected-items.gpx', content);
            }
        }

        zip.generateAsync({ type: 'blob' })
            .then(content => {
                const url = URL.createObjectURL(content);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'download.zip';
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
        } else if (item.type === 'route') {
            const route = Database.query('SELECT name FROM routes WHERE id = ?', [item.id]);
            currentName = route[0]?.name || '';
        } else if (item.type === 'track') {
            const track = Database.query('SELECT name FROM tracks WHERE id = ?', [item.id]);
            currentName = track[0]?.name || '';
        } else if (item.type === 'waypoint') {
            const waypoint = Database.query('SELECT name FROM waypoints WHERE id = ?', [item.id]);
            currentName = waypoint[0]?.name || '';
        } else {
            alert('Cannot rename this type of item');
            return;
        }

        const newName = prompt('Enter new name:', currentName);
        if (!newName || newName === currentName) return;

        // Show save button for route/track/waypoint renames (in-memory changes)
        if (item.type === 'route' || item.type === 'track' || item.type === 'waypoint') {
            showSaveButton();
        }

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
        } else if (item.type === 'route') {
            FileManager.renameRoute(item.id, newName)
                .then(() => {
                    renderFileList();
                })
                .catch(error => {
                    alert('Failed to rename route: ' + error.message);
                });
        } else if (item.type === 'track') {
            FileManager.renameTrack(item.id, newName)
                .then(() => {
                    renderFileList();
                })
                .catch(error => {
                    alert('Failed to rename track: ' + error.message);
                });
        } else if (item.type === 'waypoint') {
            FileManager.renameWaypoint(item.id, newName)
                .then(() => {
                    renderFileList();
                })
                .catch(error => {
                    alert('Failed to rename waypoint: ' + error.message);
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

        // Check if we're deleting routes/tracks/waypoints (in-memory changes)
        const hasGpxContentItems = selectedItems.some(item =>
            item.type === 'route' || item.type === 'track' || item.type === 'waypoint'
        );
        if (hasGpxContentItems) {
            showSaveButton();
        }

        Promise.all(selectedItems.map(item => {
            if (item.type === 'folder') {
                return FileManager.deleteFolder(item.id);
            } else if (item.type === 'gpx') {
                return FileManager.deleteGpxFile(item.id);
            } else if (item.type === 'route') {
                return Database.execute('DELETE FROM routes WHERE id = ?', [item.id]);
            } else if (item.type === 'track') {
                return Database.execute('DELETE FROM tracks WHERE id = ?', [item.id]);
            } else if (item.type === 'waypoint') {
                return Database.execute('DELETE FROM waypoints WHERE id = ?', [item.id]);
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

    function handleRoutingStrategyChange() {
        const strategy = $('#routingStrategy').val();
        Routing.setStrategy(strategy);

        // Get current route ID from container data
        const routeId = $('#routingStrategyContainer').data('currentRouteId');

        if (routeId) {
            const currentGpxId = FileManager.getCurrentGpxId();

            // Recalculate and display route with new strategy
            MapPreview.displayRoute(currentGpxId, routeId);

            // Show Update Track button to save the new routing
            $('#updateTrackBtn').show();
        }
    }

    async function handleUpdateTrackClick() {
        const routeId = $('#routingStrategyContainer').data('currentRouteId');
        const strategy = $('#routingStrategy').val();

        if (!routeId) return;

        try {
            const currentGpxId = FileManager.getCurrentGpxId();

            // Save the routing strategy to the database
            await Database.execute(
                'UPDATE routes SET routing_strategy = ? WHERE id = ?',
                [strategy, routeId]
            );

            // Get the routed path from MapPreview (we need to expose this)
            const routedData = await MapPreview.getLastRoutedPath();

            if (routedData) {
                // Update the corresponding track in the GPX file
                await updateTrackFromRoutedPath(currentGpxId, routeId, routedData);

                // Hide the Update Track button
                $('#updateTrackBtn').hide();

                // Show success message
                updatePreviewTitle('Track updated successfully!', 'Routing strategy saved');

                // Refresh the file list to show updated distances/times
                setTimeout(() => {
                    renderFileList();
                }, 1000);
            }
        } catch (error) {
            alert('Failed to update track: ' + error.message);
        }
    }

    /**
     * Update track with routed path data
     */
    async function updateTrackFromRoutedPath(gpxId, routeId, routedData) {
        const gpxFile = FileManager.getGpxFile(gpxId);
        if (!gpxFile) throw new Error('GPX file not found');

        // Parse the GPX content
        const gpxData = GPXParser.parse(gpxFile.content);

        // Find the route by ID
        const route = Database.query('SELECT * FROM routes WHERE id = ?', [routeId])[0];
        if (!route) throw new Error('Route not found');

        // Find or create corresponding track
        const trackIndex = route.index_in_gpx;

        // Create track from routed data
        const track = {
            name: route.name || 'Unnamed Track',
            desc: `Updated from route using ${Routing.getStrategy()} strategy`,
            segments: [{
                points: routedData.coordinates.map(coord => ({
                    lat: coord[0],
                    lon: coord[1],
                    ele: null,
                    time: null
                }))
            }]
        };

        // Update or add track in GPX data
        if (!gpxData.tracks) {
            gpxData.tracks = [];
        }

        if (trackIndex < gpxData.tracks.length) {
            // Update existing track
            gpxData.tracks[trackIndex] = track;
        } else {
            // Add new track
            gpxData.tracks.push(track);
        }

        // Regenerate GPX XML
        const updatedContent = GPXNormalizer.normalize(gpxData);

        // Update database
        const lengthKm = routedData.distance / 1000;
        const ridingTimeHours = routedData.time / 3600;

        await Database.execute(
            'UPDATE gpx_files SET content = ? WHERE id = ?',
            [updatedContent, gpxId]
        );

        await Database.execute(
            'UPDATE tracks SET length_km = ?, riding_time_hours = ? WHERE gpx_file_id = ? AND index_in_gpx = ?',
            [lengthKm, ridingTimeHours, gpxId, trackIndex]
        );
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
     * Handle keyboard navigation
     */
    function handleKeyboardNavigation(e) {
        // Only handle if not in an input field
        if ($(e.target).is('input, select, textarea')) {
            return;
        }

        const $items = $('#fileList .file-item');
        if ($items.length === 0) return;

        const $selected = $items.filter('.selected').first();

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            let $next;
            if ($selected.length === 0) {
                $next = $items.first();
            } else {
                $next = $selected.nextAll('.file-item').first();
                if ($next.length === 0) $next = $items.last();
            }
            if ($next.length) {
                $items.removeClass('selected');
                $next.addClass('selected');
                FileManager.clearSelection();
                const type = $next.data('type');
                const id = $next.data('id');
                FileManager.addSelectedItem({ type, id });
                updatePreview(type, id);
                $next[0].scrollIntoView({ block: 'nearest' });
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            let $prev;
            if ($selected.length === 0) {
                $prev = $items.last();
            } else {
                $prev = $selected.prevAll('.file-item').first();
                if ($prev.length === 0) $prev = $items.first();
            }
            if ($prev.length) {
                $items.removeClass('selected');
                $prev.addClass('selected');
                FileManager.clearSelection();
                const type = $prev.data('type');
                const id = $prev.data('id');
                FileManager.addSelectedItem({ type, id });
                updatePreview(type, id);
                $prev[0].scrollIntoView({ block: 'nearest' });
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if ($selected.length) {
                const type = $selected.data('type');
                const id = $selected.data('id');
                handleItemDoubleClick(type, id);
            }
        }
    }

    /**
     * Handle copy/paste operations
     */
    let clipboard = null;

    function handleCopyPaste(e) {
        // Copy (Ctrl+C or Cmd+C)
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
            const selectedItems = FileManager.getSelectedItems();
            if (selectedItems.length > 0) {
                // Only copy routes, tracks, waypoints
                const copyableItems = selectedItems.filter(item =>
                    item.type === 'route' || item.type === 'track' || item.type === 'waypoint'
                );
                if (copyableItems.length > 0) {
                    clipboard = {
                        items: copyableItems,
                        sourceGpxId: FileManager.getCurrentGpxId()
                    };
                    updatePreviewTitle('Copied ' + copyableItems.length + ' item(s)', 'Use Ctrl+V to paste');
                }
            }
        }
        // Paste (Ctrl+V or Cmd+V)
        else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
            if (clipboard && clipboard.items.length > 0) {
                const targetGpxId = FileManager.getCurrentGpxId();
                if (targetGpxId) {
                    handlePaste(targetGpxId, clipboard);
                } else {
                    alert('Please open a GPX file to paste into');
                }
            }
        }
    }

    /**
     * Handle paste operation
     */
    async function handlePaste(targetGpxId, clipboard) {
        try {
            // Mark as having unsaved changes
            showSaveButton();

            // TODO: Implement actual paste logic
            // This will be implemented in the in-memory changes feature
            updatePreviewTitle('Pasted ' + clipboard.items.length + ' item(s)', 'Click Save to persist changes');
        } catch (error) {
            alert('Failed to paste: ' + error.message);
        }
    }

    /**
     * Show save button
     */
    function showSaveButton() {
        $('#saveContainer').show();
    }

    /**
     * Hide save button
     */
    function hideSaveButton() {
        $('#saveContainer').hide();
    }

    /**
     * Handle save changes click
     */
    async function handleSaveChangesClick() {
        try {
            // TODO: Implement actual save logic
            // For now just hide the button
            hideSaveButton();
            updatePreviewTitle('Changes saved', '');
        } catch (error) {
            alert('Failed to save changes: ' + error.message);
        }
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
