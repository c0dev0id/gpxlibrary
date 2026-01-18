/**
 * GPX Normalizer Module
 * Converts GPX 1.1 files to GPX 1.0
 * - Converts routes to tracks using routing strategies (fallback: straight lines)
 * - Handles Garmin extensions
 * - Removes unsupported extensions
 */

const GPXNormalizer = (function() {
    'use strict';
    
    /**
     * Normalize GPX data to version 1.0
     * @param {Object} gpxData - Parsed GPX data
     * @returns {string} GPX 1.0 XML string
     */
    function normalize(gpxData) {
        // Create new GPX 1.0 document
        const doc = document.implementation.createDocument(null, 'gpx', null);
        const gpxElement = doc.documentElement;
        
        // Set GPX 1.0 attributes
        gpxElement.setAttribute('version', '1.0');
        gpxElement.setAttribute('creator', 'GPX Library - Motorcycle Route Manager');
        gpxElement.setAttribute('xmlns', 'http://www.topografix.com/GPX/1/0');
        gpxElement.setAttribute('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');
        gpxElement.setAttribute('xsi:schemaLocation', 
            'http://www.topografix.com/GPX/1/0 http://www.topografix.com/GPX/1/0/gpx.xsd');
        
        // Add metadata as GPX 1.0 elements
        if (gpxData.metadata.name) {
            addElement(doc, gpxElement, 'name', gpxData.metadata.name);
        }
        if (gpxData.metadata.desc) {
            addElement(doc, gpxElement, 'desc', gpxData.metadata.desc);
        }
        if (gpxData.metadata.author) {
            addElement(doc, gpxElement, 'author', gpxData.metadata.author);
        }
        if (gpxData.metadata.time) {
            addElement(doc, gpxElement, 'time', gpxData.metadata.time);
        }
        
        // Process waypoints
        let waypoints = [...(gpxData.waypoints || [])];
        
        // Extract waypoints from Garmin route extensions if no waypoints exist
        if (waypoints.length === 0 && gpxData.routes) {
            gpxData.routes.forEach(route => {
                if (route.extensions && route.extensions.length > 0) {
                    waypoints = waypoints.concat(route.extensions.map(ext => ({
                        lat: ext.lat,
                        lon: ext.lon,
                        name: ext.name || 'Waypoint'
                    })));
                }
            });
        }
        
        // Add waypoints to GPX
        waypoints.forEach(wpt => {
            const wptElement = doc.createElement('wpt');
            wptElement.setAttribute('lat', wpt.lat.toFixed(6));
            wptElement.setAttribute('lon', wpt.lon.toFixed(6));
            
            if (wpt.name) addElement(doc, wptElement, 'name', wpt.name);
            if (wpt.desc) addElement(doc, wptElement, 'desc', wpt.desc);
            if (wpt.ele !== null && wpt.ele !== undefined) {
                addElement(doc, wptElement, 'ele', wpt.ele.toFixed(1));
            }
            if (wpt.time) addElement(doc, wptElement, 'time', wpt.time);
            if (wpt.sym) addElement(doc, wptElement, 'sym', wpt.sym);
            if (wpt.type) addElement(doc, wptElement, 'type', wpt.type);
            
            gpxElement.appendChild(wptElement);
        });
        
        // Convert routes to tracks if no tracks exist
        const tracks = [...(gpxData.tracks || [])];
        
        if (tracks.length === 0 && gpxData.routes && gpxData.routes.length > 0) {
            // Convert routes to tracks
            gpxData.routes.forEach(route => {
                const track = convertRouteToTrack(route);
                tracks.push(track);
            });
        }
        
        // Add tracks to GPX (without extensions)
        tracks.forEach(trk => {
            const trkElement = doc.createElement('trk');
            
            if (trk.name) addElement(doc, trkElement, 'name', trk.name);
            if (trk.desc) addElement(doc, trkElement, 'desc', trk.desc);
            
            trk.segments.forEach(segment => {
                const trksegElement = doc.createElement('trkseg');
                
                segment.points.forEach(pt => {
                    const trkptElement = doc.createElement('trkpt');
                    trkptElement.setAttribute('lat', pt.lat.toFixed(6));
                    trkptElement.setAttribute('lon', pt.lon.toFixed(6));
                    
                    if (pt.ele !== null && pt.ele !== undefined) {
                        addElement(doc, trkptElement, 'ele', pt.ele.toFixed(1));
                    }
                    if (pt.time) {
                        addElement(doc, trkptElement, 'time', pt.time);
                    }
                    
                    // Note: Extensions are discarded as per GPX 1.0 normalization
                    
                    trksegElement.appendChild(trkptElement);
                });
                
                trkElement.appendChild(trksegElement);
            });
            
            gpxElement.appendChild(trkElement);
        });
        
        // Serialize to string
        const serializer = new XMLSerializer();
        let xmlString = serializer.serializeToString(doc);
        
        // Add XML declaration
        xmlString = '<?xml version="1.0" encoding="UTF-8"?>\n' + xmlString;
        
        return xmlString;
    }
    
    /**
     * Convert route to track
     * For now, this creates a simple track by connecting route points
     * In the future, this will use routing strategies
     */
    function convertRouteToTrack(route) {
        const track = {
            name: route.name || 'Track from Route',
            desc: route.desc,
            segments: [{
                points: []
            }]
        };
        
        // Simple conversion: route points become track points
        route.points.forEach(point => {
            track.segments[0].points.push({
                lat: point.lat,
                lon: point.lon,
                ele: point.ele,
                time: null // No time information from route points
            });
        });
        
        return track;
    }
    
    /**
     * Helper function to add text element
     */
    function addElement(doc, parent, tagName, textContent) {
        const element = doc.createElement(tagName);
        element.textContent = textContent;
        parent.appendChild(element);
    }
    
    /**
     * Calculate distance between two coordinates (Haversine formula)
     * Returns distance in kilometers
     */
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    
    /**
     * Convert degrees to radians
     */
    function toRad(degrees) {
        return degrees * Math.PI / 180;
    }
    
    /**
     * Calculate total length of GPX data in kilometers
     */
    function calculateLength(gpxData) {
        let totalLength = 0;
        
        // Calculate track lengths
        if (gpxData.tracks) {
            gpxData.tracks.forEach(track => {
                track.segments.forEach(segment => {
                    for (let i = 1; i < segment.points.length; i++) {
                        const p1 = segment.points[i - 1];
                        const p2 = segment.points[i];
                        totalLength += calculateDistance(p1.lat, p1.lon, p2.lat, p2.lon);
                    }
                });
            });
        }
        
        // Calculate route lengths
        if (gpxData.routes) {
            gpxData.routes.forEach(route => {
                for (let i = 1; i < route.points.length; i++) {
                    const p1 = route.points[i - 1];
                    const p2 = route.points[i];
                    totalLength += calculateDistance(p1.lat, p1.lon, p2.lat, p2.lon);
                }
            });
        }
        
        return totalLength;
    }
    
    /**
     * Calculate riding time (simple estimation)
     * Uses average speed of 50 km/h as fallback
     * Returns time in hours
     */
    function calculateRidingTime(gpxData) {
        const lengthKm = calculateLength(gpxData);
        const averageSpeedKmh = 50; // Motorcycle average speed
        return lengthKm / averageSpeedKmh;
    }
    
    /**
     * Count waypoints in GPX data
     */
    function countWaypoints(gpxData) {
        return (gpxData.waypoints || []).length;
    }
    
    // Public API
    return {
        normalize,
        calculateLength,
        calculateRidingTime,
        countWaypoints,
        calculateDistance
    };
})();
