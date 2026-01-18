/**
 * File Manager Module
 * Handles folder and GPX file operations
 */

const FileManager = (function() {
    'use strict';
    
    let currentFolderId = null; // null = root level
    let selectedItems = []; // Array of {type: 'folder'|'gpx'|'route'|'track'|'waypoint', id: number}
    let currentGpxId = null; // When viewing inside a GPX file
    
    /**
     * Create a new folder
     */
    async function createFolder(name, parentId = null) {
        const timestamp = Date.now();
        await Database.execute(
            'INSERT INTO folders (name, parent_id, created_at) VALUES (?, ?, ?)',
            [name, parentId, timestamp]
        );
        return Database.getLastInsertId();
    }
    
    /**
     * Get folder contents
     */
    function getFolderContents(folderId = null) {
        const folders = Database.query(
            'SELECT * FROM folders WHERE parent_id IS ? ORDER BY name',
            [folderId]
        );
        
        const gpxFiles = Database.query(
            'SELECT * FROM gpx_files WHERE folder_id IS ? ORDER BY name',
            [folderId]
        );
        
        return { folders, gpxFiles };
    }
    
    /**
     * Get GPX file by ID
     */
    function getGpxFile(gpxId) {
        const result = Database.query(
            'SELECT * FROM gpx_files WHERE id = ?',
            [gpxId]
        );
        return result.length > 0 ? result[0] : null;
    }
    
    /**
     * Get GPX file contents (routes, tracks, waypoints)
     */
    function getGpxContents(gpxId) {
        const routes = Database.query(
            'SELECT * FROM routes WHERE gpx_file_id = ? ORDER BY id',
            [gpxId]
        );
        
        const tracks = Database.query(
            'SELECT * FROM tracks WHERE gpx_file_id = ? ORDER BY id',
            [gpxId]
        );
        
        const waypoints = Database.query(
            'SELECT * FROM waypoints WHERE gpx_file_id = ? ORDER BY id',
            [gpxId]
        );
        
        return { routes, tracks, waypoints };
    }
    
    /**
     * Upload and process GPX files
     */
    async function uploadGpxFiles(files, folderId = null) {
        const results = {
            success: [],
            errors: []
        };
        
        for (const file of files) {
            try {
                // Check file size (20MB max)
                if (file.size > 20 * 1024 * 1024) {
                    results.errors.push({
                        file: file.name,
                        error: 'File size exceeds 20MB limit'
                    });
                    continue;
                }
                
                // Read file content
                const content = await readFileAsText(file);
                
                // Parse GPX
                const gpxData = GPXParser.parse(content);
                
                // Validate GPX
                const validation = GPXParser.validate(gpxData);
                if (!validation.valid) {
                    results.errors.push({
                        file: file.name,
                        error: validation.errors.join(', ')
                    });
                    continue;
                }
                
                // Normalize to GPX 1.0
                console.log('Normalizing GPX for file:', file.name);
                const normalizedContent = GPXNormalizer.normalize(gpxData);
                console.log('Normalized content length:', normalizedContent.length);

                // Parse the normalized content to get the final routes, tracks, and waypoints
                // (The normalizer may have created tracks from routes and waypoints from route points)
                const normalizedGpxData = GPXParser.parse(normalizedContent);
                console.log('Normalized GPX data:', normalizedGpxData);
                console.log('Routes:', normalizedGpxData.routes ? normalizedGpxData.routes.length : 0);
                console.log('Tracks:', normalizedGpxData.tracks ? normalizedGpxData.tracks.length : 0);
                console.log('Waypoints:', normalizedGpxData.waypoints ? normalizedGpxData.waypoints.length : 0);

                // Calculate metadata from normalized data
                const lengthKm = GPXNormalizer.calculateLength(normalizedGpxData);
                const waypointCount = normalizedGpxData.waypoints ? normalizedGpxData.waypoints.length : 0;
                const ridingTimeHours = GPXNormalizer.calculateRidingTime(normalizedGpxData);

                // Get file name without extension
                let fileName = file.name;
                if (fileName.toLowerCase().endsWith('.gpx')) {
                    fileName = fileName.substring(0, fileName.length - 4);
                }

                // Insert GPX file
                const timestamp = Date.now();
                await Database.execute(
                    `INSERT INTO gpx_files
                    (name, folder_id, content, length_km, waypoint_count, riding_time_hours, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [fileName, folderId, normalizedContent, lengthKm, waypointCount, ridingTimeHours, timestamp]
                );

                const gpxId = Database.getLastInsertId();

                // Store routes, tracks, waypoints from NORMALIZED data
                // (The normalizer creates tracks from routes and waypoints from route points)
                console.log('Storing routes, tracks, waypoints for GPX ID:', gpxId);

                // Store routes (from normalized GPX)
                if (normalizedGpxData.routes && normalizedGpxData.routes.length > 0) {
                    console.log('Storing', normalizedGpxData.routes.length, 'routes');
                    for (let i = 0; i < normalizedGpxData.routes.length; i++) {
                        const route = normalizedGpxData.routes[i];
                        const routeLength = calculateRouteLength(route.points);
                        const routeTime = routeLength / 50; // Simple estimation
                        console.log(`  Route ${i}: "${route.name}", ${route.points.length} points, ${routeLength.toFixed(1)}km`);
                        await Database.execute(
                            'INSERT INTO routes (gpx_file_id, index_in_gpx, name, length_km, riding_time_hours) VALUES (?, ?, ?, ?, ?)',
                            [gpxId, i, route.name || 'Unnamed Route', routeLength, routeTime]
                        );
                    }
                    console.log('✓ Routes stored');
                } else {
                    console.log('No routes to store');
                }

                // Store tracks (from normalized GPX - may have been created from routes)
                if (normalizedGpxData.tracks && normalizedGpxData.tracks.length > 0) {
                    console.log('Storing', normalizedGpxData.tracks.length, 'tracks');
                    for (let i = 0; i < normalizedGpxData.tracks.length; i++) {
                        const track = normalizedGpxData.tracks[i];
                        let trackLength = 0;
                        track.segments.forEach(segment => {
                            trackLength += calculateRouteLength(segment.points);
                        });
                        const trackTime = trackLength / 50; // Simple estimation
                        console.log(`  Track ${i}: "${track.name}", ${track.segments.length} segments, ${trackLength.toFixed(1)}km`);
                        await Database.execute(
                            'INSERT INTO tracks (gpx_file_id, index_in_gpx, name, length_km, riding_time_hours) VALUES (?, ?, ?, ?, ?)',
                            [gpxId, i, track.name || 'Unnamed Track', trackLength, trackTime]
                        );
                    }
                    console.log('✓ Tracks stored');
                } else {
                    console.log('No tracks to store');
                }

                // Store waypoints (from normalized GPX - may have been created from route points)
                if (normalizedGpxData.waypoints && normalizedGpxData.waypoints.length > 0) {
                    console.log('Storing', normalizedGpxData.waypoints.length, 'waypoints');
                    for (const waypoint of normalizedGpxData.waypoints) {
                        await Database.execute(
                            'INSERT INTO waypoints (gpx_file_id, name, lat, lon) VALUES (?, ?, ?, ?)',
                            [gpxId, waypoint.name || 'Waypoint', waypoint.lat, waypoint.lon]
                        );
                    }
                    console.log('✓ Waypoints stored');
                } else {
                    console.log('No waypoints to store');
                }

                
                results.success.push({
                    file: file.name,
                    id: gpxId
                });
                
            } catch (error) {
                results.errors.push({
                    file: file.name,
                    error: error.message
                });
            }
        }
        
        return results;
    }
    
    /**
     * Calculate route/track length from points
     */
    function calculateRouteLength(points) {
        let length = 0;
        for (let i = 1; i < points.length; i++) {
            const p1 = points[i - 1];
            const p2 = points[i];
            length += GPXNormalizer.calculateDistance(p1.lat, p1.lon, p2.lat, p2.lon);
        }
        return length;
    }
    
    /**
     * Read file as text
     */
    function readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }
    
    /**
     * Rename folder
     */
    async function renameFolder(folderId, newName) {
        await Database.execute(
            'UPDATE folders SET name = ? WHERE id = ?',
            [newName, folderId]
        );
    }
    
    /**
     * Rename GPX file
     */
    async function renameGpxFile(gpxId, newName) {
        await Database.execute(
            'UPDATE gpx_files SET name = ? WHERE id = ?',
            [newName, gpxId]
        );
    }
    
    /**
     * Rename route
     */
    async function renameRoute(routeId, newName) {
        await Database.execute(
            'UPDATE routes SET name = ? WHERE id = ?',
            [newName, routeId]
        );
    }
    
    /**
     * Rename track
     */
    async function renameTrack(trackId, newName) {
        await Database.execute(
            'UPDATE tracks SET name = ? WHERE id = ?',
            [newName, trackId]
        );
    }
    
    /**
     * Rename waypoint
     */
    async function renameWaypoint(waypointId, newName) {
        await Database.execute(
            'UPDATE waypoints SET name = ? WHERE id = ?',
            [newName, waypointId]
        );
    }
    
    /**
     * Delete folder
     */
    async function deleteFolder(folderId) {
        await Database.execute('DELETE FROM folders WHERE id = ?', [folderId]);
    }
    
    /**
     * Delete GPX file
     */
    async function deleteGpxFile(gpxId) {
        await Database.execute('DELETE FROM gpx_files WHERE id = ?', [gpxId]);
    }
    
    /**
     * Get folder path
     */
    function getFolderPath(folderId) {
        if (folderId === null) {
            return '/';
        }
        
        const path = [];
        let currentId = folderId;
        
        while (currentId !== null) {
            const result = Database.query('SELECT name, parent_id FROM folders WHERE id = ?', [currentId]);
            if (result.length === 0) break;
            
            path.unshift(result[0].name);
            currentId = result[0].parent_id;
        }
        
        return '/' + path.join('/');
    }
    
    // Public API
    return {
        createFolder,
        getFolderContents,
        getGpxFile,
        getGpxContents,
        uploadGpxFiles,
        renameFolder,
        renameGpxFile,
        renameRoute,
        renameTrack,
        renameWaypoint,
        deleteFolder,
        deleteGpxFile,
        getFolderPath,
        
        // State management
        getCurrentFolderId: () => currentFolderId,
        setCurrentFolderId: (id) => { currentFolderId = id; },
        getCurrentGpxId: () => currentGpxId,
        setCurrentGpxId: (id) => { currentGpxId = id; },
        getSelectedItems: () => selectedItems,
        setSelectedItems: (items) => { selectedItems = items; },
        addSelectedItem: (item) => { selectedItems.push(item); },
        removeSelectedItem: (item) => {
            selectedItems = selectedItems.filter(i => 
                !(i.type === item.type && i.id === item.id)
            );
        },
        clearSelection: () => { selectedItems = []; }
    };
})();
