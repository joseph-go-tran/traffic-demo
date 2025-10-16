import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import SavedRoutesList from "../SavedRoutesList";
import { useGetRouteDetails } from "../../hooks/useRouting";
import { MapPin, Navigation, Clock, ArrowLeft } from "lucide-react";

export const SavedRoutesPage: React.FC = () => {
    const { user } = useAuth();
    const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"all" | "recent">("all");

    const routeDetailsQuery = useGetRouteDetails(selectedRouteId!, !!selectedRouteId);

    const handleRouteSelect = (route: any) => {
        setSelectedRouteId(route.route_id);
    };

    const handleBackToList = () => {
        setSelectedRouteId(null);
    };

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <p className="text-gray-600">Please log in to view your saved routes.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Saved Routes
                    </h1>
                    <p className="text-gray-600">
                        View and manage your route history
                    </p>
                </div>

                {!selectedRouteId ? (
                    <>
                        {/* View Mode Toggle */}
                        <div className="flex gap-4 mb-6">
                            <button
                                onClick={() => setViewMode("all")}
                                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                                    viewMode === "all"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                            >
                                All Routes
                            </button>
                            <button
                                onClick={() => setViewMode("recent")}
                                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                                    viewMode === "recent"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                            >
                                Recent Routes
                            </button>
                        </div>

                        {/* Routes List */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <SavedRoutesList
                                userId={user.id}
                                showRecentOnly={viewMode === "recent"}
                                limit={50}
                                onRouteSelect={handleRouteSelect}
                            />
                        </div>
                    </>
                ) : (
                    // Route Details View
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <button
                            onClick={handleBackToList}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to list
                        </button>

                        {routeDetailsQuery.isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            </div>
                        ) : routeDetailsQuery.error ? (
                            <div className="text-center py-12 text-red-600">
                                Failed to load route details
                            </div>
                        ) : routeDetailsQuery.data ? (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold mb-4">
                                        Route Details
                                    </h2>

                                    {/* Route Summary */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                        <div className="p-4 bg-blue-50 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Navigation className="h-5 w-5 text-blue-600" />
                                                <span className="text-sm font-medium text-gray-600">
                                                    Distance
                                                </span>
                                            </div>
                                            <p className="text-2xl font-bold text-gray-900">
                                                {(
                                                    routeDetailsQuery.data
                                                        .total_distance / 1000
                                                ).toFixed(1)}{" "}
                                                km
                                            </p>
                                        </div>

                                        <div className="p-4 bg-green-50 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Clock className="h-5 w-5 text-green-600" />
                                                <span className="text-sm font-medium text-gray-600">
                                                    Duration
                                                </span>
                                            </div>
                                            <p className="text-2xl font-bold text-gray-900">
                                                {Math.floor(
                                                    routeDetailsQuery.data
                                                        .total_duration / 60
                                                )}{" "}
                                                min
                                            </p>
                                        </div>

                                        <div className="p-4 bg-purple-50 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <MapPin className="h-5 w-5 text-purple-600" />
                                                <span className="text-sm font-medium text-gray-600">
                                                    Status
                                                </span>
                                            </div>
                                            <p className="text-2xl font-bold text-gray-900 capitalize">
                                                {routeDetailsQuery.data.status}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Origin and Destination */}
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                                            <MapPin className="h-5 w-5 text-green-600 mt-1" />
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    Origin
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {routeDetailsQuery.data.origin.lat.toFixed(
                                                        6
                                                    )}
                                                    ,{" "}
                                                    {routeDetailsQuery.data.origin.lng.toFixed(
                                                        6
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                                            <MapPin className="h-5 w-5 text-red-600 mt-1" />
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    Destination
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {routeDetailsQuery.data.destination.lat.toFixed(
                                                        6
                                                    )}
                                                    ,{" "}
                                                    {routeDetailsQuery.data.destination.lng.toFixed(
                                                        6
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Route Options */}
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold mb-3">
                                            Route Options
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <p className="text-sm text-gray-600">
                                                    Type
                                                </p>
                                                <p className="font-medium capitalize">
                                                    {routeDetailsQuery.data.route_type}
                                                </p>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <p className="text-sm text-gray-600">
                                                    Vehicle
                                                </p>
                                                <p className="font-medium capitalize">
                                                    {
                                                        routeDetailsQuery.data
                                                            .vehicle_type
                                                    }
                                                </p>
                                            </div>
                                            {routeDetailsQuery.data.options && (
                                                <>
                                                    {routeDetailsQuery.data.options
                                                        .avoid_tolls && (
                                                        <div className="p-3 bg-gray-50 rounded-lg">
                                                            <p className="text-sm text-green-600">
                                                                ✓ Avoid Tolls
                                                            </p>
                                                        </div>
                                                    )}
                                                    {routeDetailsQuery.data.options
                                                        .avoid_highways && (
                                                        <div className="p-3 bg-gray-50 rounded-lg">
                                                            <p className="text-sm text-green-600">
                                                                ✓ Avoid Highways
                                                            </p>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Waypoints */}
                                    {routeDetailsQuery.data.waypoints &&
                                        routeDetailsQuery.data.waypoints.length >
                                            0 && (
                                            <div className="mb-6">
                                                <h3 className="text-lg font-semibold mb-3">
                                                    Waypoints
                                                </h3>
                                                <div className="space-y-2">
                                                    {routeDetailsQuery.data.waypoints.map(
                                                        (
                                                            wp: any,
                                                            idx: number
                                                        ) => (
                                                            <div
                                                                key={idx}
                                                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                                                            >
                                                                <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-sm">
                                                                    {idx + 1}
                                                                </span>
                                                                <div>
                                                                    <p className="text-sm text-gray-900">
                                                                        {wp.lat.toFixed(
                                                                            6
                                                                        )}
                                                                        ,{" "}
                                                                        {wp.lng.toFixed(
                                                                            6
                                                                        )}
                                                                    </p>
                                                                    {wp.name && (
                                                                        <p className="text-xs text-gray-600">
                                                                            {
                                                                                wp.name
                                                                            }
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                    {/* Metadata */}
                                    <div className="pt-4 border-t border-gray-200">
                                        <p className="text-sm text-gray-500">
                                            Created:{" "}
                                            {new Date(
                                                routeDetailsQuery.data.created_at
                                            ).toLocaleString()}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Route ID:{" "}
                                            {routeDetailsQuery.data.route_id}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SavedRoutesPage;
