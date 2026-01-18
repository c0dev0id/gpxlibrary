/**
 * Routing Module
 * Handles route calculation with different strategies using Leaflet Routing Machine
 */

const Routing = (function() {
    'use strict';

    // Routing strategies
    const STRATEGIES = {
        ROAD: 'road',
        ROAD_NO_MOTORWAY: 'road-no-motorway',
        CURVY: 'curvy',
        PREFER_UNPAVED: 'prefer-unpaved'
    };

    // Current routing strategy (default)
    let currentStrategy = STRATEGIES.ROAD;

    /**
     * Get routing options based on strategy
     */
    function getRoutingOptions(strategy) {
        const baseOptions = {
            serviceUrl: 'https://router.project-osrm.org/route/v1',
            profile: 'driving', // motorcycle profile not available in public OSRM, use driving
            timeout: 30000
        };

        switch (strategy) {
            case STRATEGIES.ROAD_NO_MOTORWAY:
                // OSRM doesn't support excluding motorways directly via URL params
                // We'll need to post-process or use a different service
                return {
                    ...baseOptions,
                    // Note: This is a limitation - OSRM public API doesn't support avoid motorways
                    // For full functionality, we'd need a self-hosted OSRM instance with custom profiles
                };

            case STRATEGIES.CURVY:
                return {
                    ...baseOptions,
                    // Note: "Curvy" routing would require custom routing with curviness scoring
                    // This is beyond what OSRM's public API supports
                    // We'll use the same as ROAD for now, but mark it for future enhancement
                };

            case STRATEGIES.PREFER_UNPAVED:
                return {
                    ...baseOptions,
                    // Note: Unpaved road preference requires custom routing profiles
                    // We'll use the same as ROAD for now, but mark it for future enhancement
                };

            case STRATEGIES.ROAD:
            default:
                return baseOptions;
        }
    }

    /**
     * Calculate route between waypoints using selected strategy
     * @param {Array} waypoints - Array of {lat, lon} objects
     * @param {String} strategy - Routing strategy to use
     * @returns {Promise} - Resolves with route data including distance, time, and coordinates
     */
    async function calculateRoute(waypoints, strategy = currentStrategy) {
        if (!waypoints || waypoints.length < 2) {
            throw new Error('At least 2 waypoints are required for routing');
        }

        const options = getRoutingOptions(strategy);

        return new Promise((resolve, reject) => {
            // Convert waypoints to Leaflet LatLng format
            const latlngs = waypoints.map(wp => L.latLng(wp.lat, wp.lon));

            // Create routing control (but don't add to map)
            const router = L.Routing.osrmv1(options);

            router.route(latlngs, (err, routes) => {
                if (err) {
                    reject(new Error('Routing failed: ' + err.message));
                    return;
                }

                if (!routes || routes.length === 0) {
                    reject(new Error('No route found'));
                    return;
                }

                const route = routes[0];

                // Extract route information
                const result = {
                    coordinates: route.coordinates.map(coord => [coord.lat, coord.lng]),
                    distance: route.summary.totalDistance, // in meters
                    time: route.summary.totalTime, // in seconds
                    waypoints: route.waypoints,
                    instructions: route.instructions
                };

                resolve(result);
            });
        });
    }

    /**
     * Calculate straight-line distance between two points (Haversine formula)
     * Used as fallback when routing fails
     */
    function calculateStraightDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Earth's radius in meters
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    function toRad(degrees) {
        return degrees * Math.PI / 180;
    }

    /**
     * Calculate total distance for a route (sum of waypoint distances)
     * This is a fallback method when routing service is not available
     */
    function calculateFallbackDistance(waypoints) {
        let totalDistance = 0;
        for (let i = 1; i < waypoints.length; i++) {
            totalDistance += calculateStraightDistance(
                waypoints[i - 1].lat,
                waypoints[i - 1].lon,
                waypoints[i].lat,
                waypoints[i].lon
            );
        }
        return totalDistance;
    }

    /**
     * Estimate riding time based on distance and average speed
     * @param {Number} distanceMeters - Distance in meters
     * @param {String} strategy - Routing strategy (affects speed assumptions)
     * @returns {Number} - Time in seconds
     */
    function estimateRidingTime(distanceMeters, strategy = currentStrategy) {
        // Average speeds in km/h for different strategies
        const speeds = {
            [STRATEGIES.ROAD]: 80, // Fast roads
            [STRATEGIES.ROAD_NO_MOTORWAY]: 70, // Avoiding motorways, slightly slower
            [STRATEGIES.CURVY]: 60, // Curvy roads, slower for enjoyment
            [STRATEGIES.PREFER_UNPAVED]: 50 // Unpaved roads, much slower
        };

        const speedKmh = speeds[strategy] || speeds[STRATEGIES.ROAD];
        const distanceKm = distanceMeters / 1000;
        const timeHours = distanceKm / speedKmh;
        return timeHours * 3600; // Convert to seconds
    }

    /**
     * Set current routing strategy
     */
    function setStrategy(strategy) {
        if (Object.values(STRATEGIES).includes(strategy)) {
            currentStrategy = strategy;
        } else {
            console.warn('Invalid routing strategy:', strategy);
        }
    }

    /**
     * Get current routing strategy
     */
    function getStrategy() {
        return currentStrategy;
    }

    /**
     * Get all available strategies
     */
    function getAvailableStrategies() {
        return {
            [STRATEGIES.ROAD]: {
                id: STRATEGIES.ROAD,
                name: 'Road',
                description: 'Allows any motorcycle-suitable road, fastest route'
            },
            [STRATEGIES.ROAD_NO_MOTORWAY]: {
                id: STRATEGIES.ROAD_NO_MOTORWAY,
                name: 'Road - Avoid Motorway',
                description: 'Fastest route avoiding motorways'
            },
            [STRATEGIES.CURVY]: {
                id: STRATEGIES.CURVY,
                name: 'Curvy',
                description: 'Scenic route with many curves, avoiding cities'
            },
            [STRATEGIES.PREFER_UNPAVED]: {
                id: STRATEGIES.PREFER_UNPAVED,
                name: 'Prefer Unpaved',
                description: 'Like Curvy but includes unpaved roads'
            }
        };
    }

    // Public API
    return {
        STRATEGIES,
        calculateRoute,
        calculateStraightDistance,
        calculateFallbackDistance,
        estimateRidingTime,
        setStrategy,
        getStrategy,
        getAvailableStrategies
    };
})();
