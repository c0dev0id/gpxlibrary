/**
 * GPX Parser Module
 * Parses GPX 1.0 and 1.1 files and extracts data
 */

const GPXParser = (function() {
    'use strict';
    
    /**
     * Parse GPX file content
     * @param {string} gpxContent - XML content of GPX file
     * @returns {Object} Parsed GPX data
     */
    function parse(gpxContent) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(gpxContent, 'text/xml');
        
        // Check for parsing errors
        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
            throw new Error('Invalid GPX file: XML parsing error');
        }
        
        const gpxElement = xmlDoc.querySelector('gpx');
        if (!gpxElement) {
            throw new Error('Invalid GPX file: No <gpx> root element found');
        }
        
        // Get GPX version
        const version = gpxElement.getAttribute('version') || '1.0';
        
        // Parse metadata
        const metadata = parseMetadata(xmlDoc);
        
        // Parse waypoints
        const waypoints = parseWaypoints(xmlDoc);
        
        // Parse routes
        const routes = parseRoutes(xmlDoc);
        
        // Parse tracks
        const tracks = parseTracks(xmlDoc);
        
        return {
            version,
            metadata,
            waypoints,
            routes,
            tracks
        };
    }
    
    /**
     * Parse metadata from GPX file
     */
    function parseMetadata(xmlDoc) {
        const metadata = {};
        
        // Try GPX 1.1 metadata
        const metadataElement = xmlDoc.querySelector('gpx > metadata');
        if (metadataElement) {
            metadata.name = getElementText(metadataElement, 'name');
            metadata.desc = getElementText(metadataElement, 'desc');
            metadata.author = getElementText(metadataElement, 'author > name');
            metadata.time = getElementText(metadataElement, 'time');
        } else {
            // Fall back to GPX 1.0 style
            const gpxElement = xmlDoc.querySelector('gpx');
            metadata.name = getElementText(gpxElement, 'name');
            metadata.desc = getElementText(gpxElement, 'desc');
            metadata.author = getElementText(gpxElement, 'author');
            metadata.time = getElementText(gpxElement, 'time');
        }
        
        return metadata;
    }
    
    /**
     * Parse waypoints from GPX file
     */
    function parseWaypoints(xmlDoc) {
        const waypoints = [];
        const wptElements = xmlDoc.querySelectorAll('gpx > wpt');
        
        wptElements.forEach(wpt => {
            const waypoint = {
                lat: parseFloat(wpt.getAttribute('lat')),
                lon: parseFloat(wpt.getAttribute('lon')),
                name: getElementText(wpt, 'name'),
                desc: getElementText(wpt, 'desc'),
                ele: parseFloat(getElementText(wpt, 'ele')) || null,
                time: getElementText(wpt, 'time'),
                sym: getElementText(wpt, 'sym'),
                type: getElementText(wpt, 'type')
            };
            waypoints.push(waypoint);
        });
        
        return waypoints;
    }
    
    /**
     * Parse routes from GPX file
     */
    function parseRoutes(xmlDoc) {
        const routes = [];
        const rteElements = xmlDoc.querySelectorAll('gpx > rte');
        
        rteElements.forEach(rte => {
            const route = {
                name: getElementText(rte, 'name'),
                desc: getElementText(rte, 'desc'),
                points: []
            };
            
            // Parse route points
            const rteptElements = rte.querySelectorAll('rtept');
            rteptElements.forEach(rtept => {
                const point = {
                    lat: parseFloat(rtept.getAttribute('lat')),
                    lon: parseFloat(rtept.getAttribute('lon')),
                    name: getElementText(rtept, 'name'),
                    ele: parseFloat(getElementText(rtept, 'ele')) || null
                };
                route.points.push(point);
            });
            
            // Check for Garmin extensions
            route.extensions = parseGarminRouteExtensions(rte);
            
            routes.push(route);
        });
        
        return routes;
    }
    
    /**
     * Parse tracks from GPX file
     */
    function parseTracks(xmlDoc) {
        const tracks = [];
        const trkElements = xmlDoc.querySelectorAll('gpx > trk');
        
        trkElements.forEach(trk => {
            const track = {
                name: getElementText(trk, 'name'),
                desc: getElementText(trk, 'desc'),
                segments: []
            };
            
            // Parse track segments
            const trksegElements = trk.querySelectorAll('trkseg');
            trksegElements.forEach(trkseg => {
                const segment = {
                    points: []
                };
                
                // Parse track points
                const trkptElements = trkseg.querySelectorAll('trkpt');
                trkptElements.forEach(trkpt => {
                    const point = {
                        lat: parseFloat(trkpt.getAttribute('lat')),
                        lon: parseFloat(trkpt.getAttribute('lon')),
                        ele: parseFloat(getElementText(trkpt, 'ele')) || null,
                        time: getElementText(trkpt, 'time')
                    };
                    
                    // Parse Garmin extensions if present
                    const extensions = parseGarminTrackPointExtensions(trkpt);
                    if (extensions) {
                        point.extensions = extensions;
                    }
                    
                    segment.points.push(point);
                });
                
                track.segments.push(segment);
            });
            
            tracks.push(track);
        });
        
        return tracks;
    }
    
    /**
     * Parse Garmin route extensions
     */
    function parseGarminRouteExtensions(rteElement) {
        const extensions = rteElement.querySelector('extensions');
        if (!extensions) return null;
        
        // Look for route extension waypoints
        const routeExtension = extensions.querySelector('RouteExtension');
        if (!routeExtension) return null;
        
        const extensionWaypoints = [];
        const wptElements = routeExtension.querySelectorAll('Waypoint');
        
        wptElements.forEach(wpt => {
            extensionWaypoints.push({
                lat: parseFloat(getElementText(wpt, 'lat')),
                lon: parseFloat(getElementText(wpt, 'lon')),
                name: getElementText(wpt, 'name')
            });
        });
        
        return extensionWaypoints.length > 0 ? extensionWaypoints : null;
    }
    
    /**
     * Parse Garmin track point extensions
     */
    function parseGarminTrackPointExtensions(trkptElement) {
        const extensions = trkptElement.querySelector('extensions');
        if (!extensions) return null;
        
        const trackPointExtension = extensions.querySelector('TrackPointExtension');
        if (!trackPointExtension) return null;
        
        return {
            hr: parseInt(getElementText(trackPointExtension, 'hr')) || null,
            cad: parseInt(getElementText(trackPointExtension, 'cad')) || null,
            temp: parseFloat(getElementText(trackPointExtension, 'atemp')) || null
        };
    }
    
    /**
     * Helper function to get text content from element
     */
    function getElementText(parent, selector) {
        const element = parent.querySelector(selector);
        return element ? element.textContent.trim() : null;
    }
    
    /**
     * Validate GPX structure
     */
    function validate(gpxData) {
        const errors = [];
        
        if (!gpxData.waypoints && !gpxData.routes && !gpxData.tracks) {
            errors.push('GPX file must contain at least one waypoint, route, or track');
        }
        
        if (gpxData.routes) {
            gpxData.routes.forEach((route, index) => {
                if (route.points.length < 2) {
                    errors.push(`Route ${index + 1} must have at least 2 points`);
                }
            });
        }
        
        if (gpxData.tracks) {
            gpxData.tracks.forEach((track, index) => {
                if (track.segments.length === 0) {
                    errors.push(`Track ${index + 1} must have at least one segment`);
                }
                track.segments.forEach((segment, segIndex) => {
                    if (segment.points.length < 2) {
                        errors.push(`Track ${index + 1}, segment ${segIndex + 1} must have at least 2 points`);
                    }
                });
            });
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    // Public API
    return {
        parse,
        validate
    };
})();
