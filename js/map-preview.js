/**
 * Map Preview Module
 * Displays GPX tracks, routes, and waypoints on OpenStreetMap using Leaflet
 */

const MapPreview = (function() {
    'use strict';

    let map = null;
    let currentLayers = [];
    let lastRoutedPath = null; // Store last routed path for Update Track functionality

    // Color palette for routes and tracks (high contrast with map background)
    const COLORS = [
        '#FF0000', // Red
        '#0000FF', // Blue
        '#00FF00', // Lime
        '#FF00FF', // Magenta
        '#00FFFF', // Cyan
        '#FFA500', // Orange
        '#FF1493', // Deep Pink
        '#32CD32', // Lime Green
        '#4169E1', // Royal Blue
        '#FF4500'  // Orange Red
    ];
    
    /**
     * Initialize map
     */
    function init() {
        const mapContainer = document.getElementById('mapContainer');
        
        // Create map div if not exists
        if (!document.getElementById('map')) {
            const mapDiv = document.createElement('div');
            mapDiv.id = 'map';
            mapContainer.appendChild(mapDiv);
        }
        
        // Initialize Leaflet map
        map = L.map('map').setView([51.505, -0.09], 13);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(map);
        
        return map;
    }
    
    /**
     * Clear all layers from map
     */
    function clearLayers() {
        currentLayers.forEach(layer => {
            map.removeLayer(layer);
        });
        currentLayers = [];
    }
    
    /**
     * Display GPX file on map
     */
    function displayGpx(gpxId) {
        clearLayers();
        
        const gpxFile = FileManager.getGpxFile(gpxId);
        if (!gpxFile) return;
        
        // Parse GPX content
        const gpxData = GPXParser.parse(gpxFile.content);
        
        const allPoints = [];
        let colorIndex = 0;
        
        // Display tracks
        if (gpxData.tracks && gpxData.tracks.length > 0) {
            gpxData.tracks.forEach((track, trackIndex) => {
                const color = COLORS[colorIndex % COLORS.length];
                colorIndex++;
                
                track.segments.forEach(segment => {
                    if (segment.points.length > 0) {
                        const latlngs = segment.points.map(pt => {
                            allPoints.push([pt.lat, pt.lon]);
                            return [pt.lat, pt.lon];
                        });
                        
                        const polyline = L.polyline(latlngs, {
                            color: color,
                            weight: 6,
                            opacity: 0.3
                        }).addTo(map);
                        
                        // Add popup with track name
                        if (track.name) {
                            polyline.bindPopup(`<strong>Track:</strong> ${track.name}`);
                        }
                        
                        currentLayers.push(polyline);
                    }
                });
            });
        }
        
        // Display routes
        if (gpxData.routes && gpxData.routes.length > 0) {
            gpxData.routes.forEach((route, routeIndex) => {
                const color = COLORS[colorIndex % COLORS.length];
                colorIndex++;
                
                if (route.points.length > 0) {
                    const latlngs = route.points.map(pt => {
                        allPoints.push([pt.lat, pt.lon]);
                        return [pt.lat, pt.lon];
                    });
                    
                    const polyline = L.polyline(latlngs, {
                        color: color,
                        weight: 6,
                        opacity: 0.3
                    }).addTo(map);
                    
                    // Add popup with route name
                    if (route.name) {
                        polyline.bindPopup(`<strong>Route:</strong> ${route.name}`);
                    }
                    
                    currentLayers.push(polyline);
                }
            });
        }
        
        // Display waypoints
        if (gpxData.waypoints && gpxData.waypoints.length > 0) {
            gpxData.waypoints.forEach(waypoint => {
                allPoints.push([waypoint.lat, waypoint.lon]);
                
                // Create custom marker
                const marker = L.circleMarker([waypoint.lat, waypoint.lon], {
                    radius: 6,
                    fillColor: '#dc3545',
                    color: '#fff',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                }).addTo(map);
                
                // Add popup with waypoint name
                const name = waypoint.name || 'Waypoint';
                marker.bindPopup(`<strong>${name}</strong>`);
                
                // Add tooltip (always visible label)
                marker.bindTooltip(name, {
                    permanent: true,
                    direction: 'top',
                    className: 'waypoint-label',
                    offset: [0, -10]
                });
                
                currentLayers.push(marker);
            });
        }
        
        // Fit map to show all points
        if (allPoints.length > 0) {
            const bounds = L.latLngBounds(allPoints);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }
    
    /**
     * Display specific route on map
     */
    async function displayRoute(gpxId, routeId, keepExisting = false) {
        if (!keepExisting) {
            clearLayers();
        }

        const gpxFile = FileManager.getGpxFile(gpxId);
        if (!gpxFile) {
            console.error('displayRoute: GPX file not found', gpxId);
            return;
        }

        const gpxData = GPXParser.parse(gpxFile.content);

        // Find the specific route in database
        const routes = Database.query('SELECT * FROM routes WHERE id = ?', [routeId]);
        if (routes.length === 0) {
            console.error('displayRoute: Route not found in database', routeId);
            return;
        }

        const routeDbData = routes[0];

        // Check if routes array exists and has elements
        if (!gpxData.routes || !Array.isArray(gpxData.routes)) {
            console.error('displayRoute: No routes in GPX data', gpxData);
            return;
        }

        if (routeDbData.index_in_gpx >= gpxData.routes.length) {
            console.error('displayRoute: Route index out of bounds', routeDbData.index_in_gpx, 'of', gpxData.routes.length);
            return;
        }

        // Find route in parsed GPX data by index
        const route = gpxData.routes[routeDbData.index_in_gpx];
        if (!route) {
            console.error('displayRoute: Route is null/undefined', routeDbData.index_in_gpx);
            return;
        }

        if (!route.points || route.points.length === 0) {
            console.error('displayRoute: Route has no points', route);
            return;
        }

        // Use index_in_gpx for consistent colors across views
        const colorIndex = keepExisting ? currentLayers.length % COLORS.length : routeDbData.index_in_gpx % COLORS.length;

        // Try to calculate routed path using routing service
        try {
            const waypoints = route.points.map(pt => ({ lat: pt.lat, lon: pt.lon }));
            const routedPath = await Routing.calculateRoute(waypoints);

            // Store last routed path for Update Track functionality
            lastRoutedPath = routedPath;

            // Display routed path
            const polyline = L.polyline(routedPath.coordinates, {
                color: COLORS[colorIndex],
                weight: 6,
                opacity: 0.5
            }).addTo(map);

            // Add popup with route info
            if (route.name) {
                const distanceKm = (routedPath.distance / 1000).toFixed(1);
                const timeHours = (routedPath.time / 3600).toFixed(1);
                polyline.bindPopup(`<strong>Route:</strong> ${route.name}<br><strong>Distance:</strong> ${distanceKm} km<br><strong>Time:</strong> ${timeHours} h`);
            }

            currentLayers.push(polyline);

            // Fit map to route (unless keeping existing layers)
            if (!keepExisting) {
                map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
            }
        } catch (error) {
            console.error('Routing failed, falling back to straight lines:', error);

            // Clear last routed path since routing failed
            lastRoutedPath = null;

            // Fallback: draw straight lines between waypoints
            const latlngs = route.points.map(pt => [pt.lat, pt.lon]);
            const polyline = L.polyline(latlngs, {
                color: COLORS[colorIndex],
                weight: 6,
                opacity: 0.5,
                dashArray: '10, 5' // Dashed to indicate it's not a real route
            }).addTo(map);

            if (route.name) {
                polyline.bindPopup(`<strong>Route:</strong> ${route.name}<br><em>(Straight line - routing failed)</em>`);
            }

            currentLayers.push(polyline);

            // Fit map to route (unless keeping existing layers)
            if (!keepExisting) {
                map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
            }
        }
    }
    
    /**
     * Display specific track on map
     */
    function displayTrack(gpxId, trackId, keepExisting = false) {
        if (!keepExisting) {
            clearLayers();
        }

        const gpxFile = FileManager.getGpxFile(gpxId);
        if (!gpxFile) {
            console.error('displayTrack: GPX file not found', gpxId);
            return;
        }

        const gpxData = GPXParser.parse(gpxFile.content);

        // Find the specific track in database
        const tracks = Database.query('SELECT * FROM tracks WHERE id = ?', [trackId]);
        if (tracks.length === 0) {
            console.error('displayTrack: Track not found in database', trackId);
            return;
        }

        const trackDbData = tracks[0];

        // Check if tracks array exists and has elements
        if (!gpxData.tracks || !Array.isArray(gpxData.tracks)) {
            console.error('displayTrack: No tracks in GPX data', gpxData);
            return;
        }

        if (trackDbData.index_in_gpx >= gpxData.tracks.length) {
            console.error('displayTrack: Track index out of bounds', trackDbData.index_in_gpx, 'of', gpxData.tracks.length);
            return;
        }

        // Find track in parsed GPX data by index
        const track = gpxData.tracks[trackDbData.index_in_gpx];
        if (!track) {
            console.error('displayTrack: Track is null/undefined', trackDbData.index_in_gpx);
            return;
        }

        if (!track.segments || track.segments.length === 0) {
            console.error('displayTrack: Track has no segments', track);
            return;
        }

        const allPoints = [];
        // Use index_in_gpx for consistent colors across views
        const colorIndex = keepExisting ? currentLayers.length % COLORS.length : trackDbData.index_in_gpx % COLORS.length;

        track.segments.forEach(segment => {
            if (segment.points && segment.points.length > 0) {
                const latlngs = segment.points.map(pt => {
                    allPoints.push([pt.lat, pt.lon]);
                    return [pt.lat, pt.lon];
                });

                const polyline = L.polyline(latlngs, {
                    color: COLORS[colorIndex],
                    weight: 6,
                    opacity: 0.5
                }).addTo(map);

                currentLayers.push(polyline);
            }
        });

        // Fit map to track (unless keeping existing layers)
        if (!keepExisting && allPoints.length > 0) {
            const bounds = L.latLngBounds(allPoints);
            map.fitBounds(bounds, { padding: [50, 50] });
        } else if (!keepExisting) {
            console.error('displayTrack: No points found in track segments');
        }
    }
    
    /**
     * Display specific waypoint on map
     */
    function displayWaypoint(gpxId, waypointId, keepExisting = false) {
        if (!keepExisting) {
            clearLayers();
        }

        const waypoints = Database.query('SELECT * FROM waypoints WHERE id = ?', [waypointId]);
        if (waypoints.length === 0) return;

        const waypoint = waypoints[0];

        const marker = L.circleMarker([waypoint.lat, waypoint.lon], {
            radius: 8,
            fillColor: '#dc3545',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(map);

        const name = waypoint.name || 'Waypoint';
        marker.bindPopup(`<strong>${name}</strong>`).openPopup();

        currentLayers.push(marker);

        // Center map on waypoint (unless keeping existing layers)
        if (!keepExisting) {
            map.setView([waypoint.lat, waypoint.lon], 15);
        }
    }

    /**
     * Fit map bounds to show all current layers
     */
    function fitBounds() {
        if (currentLayers.length === 0) return;

        const group = L.featureGroup(currentLayers);
        map.fitBounds(group.getBounds(), { padding: [50, 50] });
    }

    /**
     * Alias for clearLayers
     */
    function clearMap() {
        clearLayers();
    }
    
    /**
     * Clear map and show empty state
     */
    function showEmptyState() {
        clearLayers();
        // Could add a message overlay here if desired
    }

    /**
     * Get last routed path (for Update Track functionality)
     */
    function getLastRoutedPath() {
        return lastRoutedPath;
    }

    // Public API
    return {
        init,
        displayGpx,
        displayRoute,
        displayTrack,
        displayWaypoint,
        showEmptyState,
        clearLayers,
        clearMap,
        fitBounds,
        getLastRoutedPath
    };
})();
