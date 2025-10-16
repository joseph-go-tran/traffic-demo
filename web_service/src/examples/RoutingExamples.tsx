/**
 * Example Usage of Routing Service Integration
 *
 * This file demonstrates how to use the routing service API
 * in React components with the web_service integration.
 */

import React from 'react';
import {
    useCalculateRoute,
    useGetUserRoutes,
    useGetRouteDetails,
    useUpdateRouteStatus,
    useDeleteRouteFromDB,
    formatDistance,
    formatDuration,
} from '../hooks/useRouting';
import {
    useRouteCalculationWithStorage,
    useRouteStats,
} from '../hooks/useRouteManagement';

// =================================================================
// Example 1: Calculate and Store a Route
// =================================================================
export const CalculateRouteExample = () => {
    const userId = 123; // Get from auth context
    const { mutate: calculateRoute, isPending, data } = useCalculateRoute();

    const handleCalculateRoute = () => {
        calculateRoute({
            origin: { lat: 40.7128, lng: -74.0060 }, // New York
            destination: { lat: 34.0522, lng: -118.2437 }, // Los Angeles
            user_id: userId,
            options: {
                route_type: 'fastest',
                avoid_tolls: true,
                vehicle_type: 'car',
            },
        });
    };

    return (
        <div>
            <button onClick={handleCalculateRoute} disabled={isPending}>
                {isPending ? 'Calculating...' : 'Calculate Route'}
            </button>

            {data && (
                <div>
                    <p>Distance: {formatDistance(data.data.total_distance)}</p>
                    <p>Duration: {formatDuration(data.data.total_duration)}</p>
                    <p>Route ID: {data.data.route_id}</p>
                </div>
            )}
        </div>
    );
};

// =================================================================
// Example 2: Display User's Saved Routes
// =================================================================
export const UserRoutesExample = () => {
    const userId = 123;
    const { data, isLoading } = useGetUserRoutes({
        user_id: userId,
        limit: 20,
        status: 'active',
    });

    if (isLoading) return <div>Loading routes...</div>;

    const routes = data?.routes || [];

    return (
        <div>
            <h2>My Routes ({data?.total_routes})</h2>
            {routes.map((route) => (
                <div key={route.route_id}>
                    <p>From: {route.origin.lat}, {route.origin.lng}</p>
                    <p>To: {route.destination.lat}, {route.destination.lng}</p>
                    <p>Distance: {formatDistance(route.total_distance)}</p>
                    <p>Status: {route.status}</p>
                </div>
            ))}
        </div>
    );
};

// =================================================================
// Example 3: View Route Details
// =================================================================
export const RouteDetailsExample = ({ routeId }: { routeId: string }) => {
    const { data: route, isLoading } = useGetRouteDetails(routeId, true);

    if (isLoading) return <div>Loading...</div>;
    if (!route) return <div>Route not found</div>;

    return (
        <div>
            <h2>Route Details</h2>
            <p>Distance: {formatDistance(route.total_distance)}</p>
            <p>Duration: {formatDuration(route.total_duration)}</p>
            <p>Type: {route.route_type}</p>
            <p>Vehicle: {route.vehicle_type}</p>

            <h3>Options</h3>
            <ul>
                {route.options?.avoid_tolls && <li>Avoid Tolls</li>}
                {route.options?.avoid_highways && <li>Avoid Highways</li>}
                {route.options?.avoid_ferries && <li>Avoid Ferries</li>}
            </ul>

            {route.waypoints && route.waypoints.length > 0 && (
                <>
                    <h3>Waypoints</h3>
                    {route.waypoints.map((wp, idx) => (
                        <div key={idx}>
                            Point {idx + 1}: {wp.lat}, {wp.lng}
                        </div>
                    ))}
                </>
            )}

            {/* Full route data from TomTom */}
            {route.full_route_data && (
                <details>
                    <summary>Full Route Data</summary>
                    <pre>{JSON.stringify(route.full_route_data, null, 2)}</pre>
                </details>
            )}
        </div>
    );
};

// =================================================================
// Example 4: Update Route Status
// =================================================================
export const RouteActionsExample = ({ routeId }: { routeId: string }) => {
    const { mutate: updateStatus } = useUpdateRouteStatus();
    const { mutate: deleteRoute } = useDeleteRouteFromDB();

    const handleComplete = () => {
        updateStatus({ routeId, status: 'completed' });
    };

    const handleCancel = () => {
        updateStatus({ routeId, status: 'cancelled' });
    };

    const handleDelete = () => {
        if (confirm('Are you sure?')) {
            deleteRoute(routeId);
        }
    };

    return (
        <div>
            <button onClick={handleComplete}>Mark as Completed</button>
            <button onClick={handleCancel}>Cancel Route</button>
            <button onClick={handleDelete}>Delete Route</button>
        </div>
    );
};

// =================================================================
// Example 5: Calculate Route with Automatic Storage
// =================================================================
export const EnhancedCalculateExample = () => {
    const userId = 123;
    const { mutate: calculateRoute, isPending } =
        useRouteCalculationWithStorage(userId);

    const handleCalculate = () => {
        calculateRoute({
            origin: { lat: 51.5074, lng: -0.1278 }, // London
            destination: { lat: 48.8566, lng: 2.3522 }, // Paris
            waypoints: [
                { lat: 50.8503, lng: 4.3517 }, // Brussels
            ],
            options: {
                route_type: 'eco',
                vehicle_type: 'car',
            },
        });
    };

    return (
        <button onClick={handleCalculate} disabled={isPending}>
            {isPending ? 'Calculating...' : 'Calculate Route'}
        </button>
    );
};

// =================================================================
// Example 6: Display Route Statistics
// =================================================================
export const RouteStatsExample = () => {
    const userId = 123;
    const stats = useRouteStats(userId);

    return (
        <div>
            <h2>Your Route Statistics</h2>
            <div>
                <p>Total Routes: {stats.totalRoutes}</p>
                <p>Active Routes: {stats.activeRoutes}</p>
                <p>Completed Routes: {stats.completedRoutes}</p>
            </div>

            <div>
                <h3>Distance Traveled</h3>
                <p>Total: {formatDistance(stats.totalDistance)}</p>
                <p>Average: {formatDistance(stats.averageDistance)}</p>
            </div>

            <div>
                <h3>Time Spent</h3>
                <p>Total: {formatDuration(stats.totalDuration)}</p>
                <p>Average: {formatDuration(stats.averageDuration)}</p>
            </div>

            <div>
                <h3>Route Types</h3>
                <p>Fastest: {stats.routesByType.fastest}</p>
                <p>Shortest: {stats.routesByType.shortest}</p>
                <p>Eco: {stats.routesByType.eco}</p>
            </div>

            <div>
                <h3>By Vehicle Type</h3>
                {Object.entries(stats.routesByVehicle).map(([vehicle, count]) => (
                    <p key={vehicle}>{vehicle}: {count}</p>
                ))}
            </div>

            <div>
                <h3>Recent Activity</h3>
                {stats.recentActivity.map((route) => (
                    <div key={route.route_id}>
                        {new Date(route.created_at).toLocaleDateString()} -
                        {formatDistance(route.total_distance)}
                    </div>
                ))}
            </div>
        </div>
    );
};

// =================================================================
// Example 7: Using SavedRoutesList Component
// =================================================================
export const SavedRoutesPageExample = () => {
    const userId = 123;
    const [selectedRoute, setSelectedRoute] = React.useState<any>(null);

    return (
        <div>
            <h1>My Saved Routes</h1>

            <SavedRoutesList
                userId={userId}
                showRecentOnly={false}
                limit={50}
                onRouteSelect={(route) => {
                    setSelectedRoute(route);
                    console.log('Selected route:', route);
                }}
            />

            {selectedRoute && (
                <RouteDetailsExample routeId={selectedRoute.route_id} />
            )}
        </div>
    );
};

// =================================================================
// Example 8: Complete Route Planning Flow
// =================================================================
export const CompleteRoutePlanningExample = () => {
    const userId = 123;
    const [origin, setOrigin] = React.useState({ lat: 0, lng: 0 });
    const [destination, setDestination] = React.useState({ lat: 0, lng: 0 });
    const [calculatedRoute, setCalculatedRoute] = React.useState<any>(null);

    const { mutate: calculateRoute, isPending } =
        useRouteCalculationWithStorage(userId);

    const handleCalculate = () => {
        calculateRoute(
            {
                origin,
                destination,
                options: {
                    route_type: 'fastest',
                    vehicle_type: 'car',
                },
            },
            {
                onSuccess: (data) => {
                    setCalculatedRoute(data.data);
                    console.log('Route calculated and stored!');
                },
            }
        );
    };

    return (
        <div>
            <h2>Plan Your Route</h2>

            {/* Origin Input */}
            <div>
                <input
                    type="number"
                    placeholder="Origin Lat"
                    onChange={(e) => setOrigin({ ...origin, lat: +e.target.value })}
                />
                <input
                    type="number"
                    placeholder="Origin Lng"
                    onChange={(e) => setOrigin({ ...origin, lng: +e.target.value })}
                />
            </div>

            {/* Destination Input */}
            <div>
                <input
                    type="number"
                    placeholder="Destination Lat"
                    onChange={(e) => setDestination({ ...destination, lat: +e.target.value })}
                />
                <input
                    type="number"
                    placeholder="Destination Lng"
                    onChange={(e) => setDestination({ ...destination, lng: +e.target.value })}
                />
            </div>

            <button onClick={handleCalculate} disabled={isPending}>
                {isPending ? 'Calculating...' : 'Calculate Route'}
            </button>

            {calculatedRoute && (
                <div>
                    <h3>Route Calculated!</h3>
                    <p>Route ID: {calculatedRoute.route_id}</p>
                    <p>Distance: {formatDistance(calculatedRoute.total_distance)}</p>
                    <p>Duration: {formatDuration(calculatedRoute.total_duration)}</p>
                    <p>This route has been saved to your account.</p>
                </div>
            )}
        </div>
    );
};

// Import the component (need to add to imports at the top)
import SavedRoutesList from '../components/SavedRoutesList';
