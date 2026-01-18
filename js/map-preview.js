/**
 * Map Preview Module
 * Displays GPX tracks, routes, and waypoints on OpenStreetMap using Leaflet
 */

const MapPreview = (function() {
    'use strict';
    
    let map = null;
    let currentLayers = [];
    
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
                            weight: 4,
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
                        weight: 4,
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
    function displayRoute(gpxId, routeId) {
        clearLayers();
        
        const gpxFile = FileManager.getGpxFile(gpxId);
        if (!gpxFile) return;
        
        const gpxData = GPXParser.parse(gpxFile.content);
        
        // Find the specific route
        const routes = Database.query('SELECT * FROM routes WHERE id = ?', [routeId]);
        if (routes.length === 0) return;
        
        const routeDbData = routes[0];
        
        // Find route in parsed GPX data
        const route = gpxData.routes.find(r => r.name === routeDbData.name);
        if (!route || route.points.length === 0) return;
        
        const latlngs = route.points.map(pt => [pt.lat, pt.lon]);
        
        const polyline = L.polyline(latlngs, {
            color: COLORS[0],
            weight: 4,
            opacity: 0.5
        }).addTo(map);
        
        currentLayers.push(polyline);
        
        // Fit map to route
        map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    }
    
    /**
     * Display specific track on map
     */
    function displayTrack(gpxId, trackId) {
        clearLayers();
        
        const gpxFile = FileManager.getGpxFile(gpxId);
        if (!gpxFile) return;
        
        const gpxData = GPXParser.parse(gpxFile.content);
        
        // Find the specific track
        const tracks = Database.query('SELECT * FROM tracks WHERE id = ?', [trackId]);
        if (tracks.length === 0) return;
        
        const trackDbData = tracks[0];
        
        // Find track in parsed GPX data
        const track = gpxData.tracks.find(t => t.name === trackDbData.name);
        if (!track) return;
        
        const allPoints = [];
        
        track.segments.forEach(segment => {
            if (segment.points.length > 0) {
                const latlngs = segment.points.map(pt => {
                    allPoints.push([pt.lat, pt.lon]);
                    return [pt.lat, pt.lon];
                });
                
                const polyline = L.polyline(latlngs, {
                    color: COLORS[0],
                    weight: 4,
                    opacity: 0.5
                }).addTo(map);
                
                currentLayers.push(polyline);
            }
        });
        
        // Fit map to track
        if (allPoints.length > 0) {
            const bounds = L.latLngBounds(allPoints);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }
    
    /**
     * Display specific waypoint on map
     */
    function displayWaypoint(gpxId, waypointId) {
        clearLayers();
        
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
        
        // Center map on waypoint
        map.setView([waypoint.lat, waypoint.lon], 15);
    }
    
    /**
     * Clear map and show empty state
     */
    function showEmptyState() {
        clearLayers();
        // Could add a message overlay here if desired
    }
    
    // Public API
    return {
        init,
        displayGpx,
        displayRoute,
        displayTrack,
        displayWaypoint,
        showEmptyState,
        clearLayers
    };
})();
