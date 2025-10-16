import React from "react";
import { Clock, MapPin, Navigation, Trash2, Check, X } from "lucide-react";
import {
    useGetUserRoutes,
    useGetRecentRoutesFromDB,
    useUpdateRouteStatus,
    useDeleteRouteFromDB,
    formatDistance,
    formatDuration,
} from "../hooks/useRouting";

interface SavedRoutesListProps {
    userId?: number;
    onRouteSelect?: (route: any) => void;
    showRecentOnly?: boolean;
    limit?: number;
}

export const SavedRoutesList: React.FC<SavedRoutesListProps> = ({
    userId,
    onRouteSelect,
    showRecentOnly = false,
    limit = 20,
}) => {
    const [selectedStatus, setSelectedStatus] = React.useState<
        "active" | "completed" | "cancelled" | undefined
    >(undefined);

    // Fetch routes based on mode - conditionally call hooks
    const shouldFetchUserRoutes = !!userId && !showRecentOnly;
    const userRoutesQuery = useGetUserRoutes({
        user_id: userId || 0,
        limit,
        status: selectedStatus,
    });

    const recentRoutesQuery = useGetRecentRoutesFromDB({
        limit,
        user_id: userId,
    });

    const updateStatusMutation = useUpdateRouteStatus();
    const deleteRouteMutation = useDeleteRouteFromDB();

    const routes = showRecentOnly
        ? recentRoutesQuery.data?.routes || []
        : shouldFetchUserRoutes
        ? userRoutesQuery.data?.routes || []
        : [];

    const isLoading = showRecentOnly
        ? recentRoutesQuery.isLoading
        : shouldFetchUserRoutes
        ? userRoutesQuery.isLoading
        : false;

    const handleStatusUpdate = async (
        routeId: string,
        status: "active" | "completed" | "cancelled"
    ) => {
        try {
            await updateStatusMutation.mutateAsync({ routeId, status });
            // Refetch routes after update
            if (showRecentOnly) {
                recentRoutesQuery.refetch();
            } else {
                userRoutesQuery.refetch();
            }
        } catch (error) {
            console.error("Failed to update route status:", error);
        }
    };

    const handleDelete = async (routeId: string) => {
        if (window.confirm("Are you sure you want to delete this route?")) {
            try {
                await deleteRouteMutation.mutateAsync(routeId);
                // Refetch routes after deletion
                if (showRecentOnly) {
                    recentRoutesQuery.refetch();
                } else {
                    userRoutesQuery.refetch();
                }
            } catch (error) {
                console.error("Failed to delete route:", error);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {!showRecentOnly && (
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setSelectedStatus(undefined)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedStatus === undefined
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setSelectedStatus("active")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedStatus === "active"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setSelectedStatus("completed")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedStatus === "completed"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                        Completed
                    </button>
                </div>
            )}

            {routes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <Navigation className="mx-auto h-12 w-12 mb-2 opacity-30" />
                    <p>No routes found</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {routes.map((route: any) => (
                        <div
                            key={route.route_id}
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    {/* Route info */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <MapPin className="h-4 w-4 text-green-600" />
                                        <span className="text-sm text-gray-600">
                                            {route.origin.lat.toFixed(4)},{" "}
                                            {route.origin.lng.toFixed(4)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <MapPin className="h-4 w-4 text-red-600" />
                                        <span className="text-sm text-gray-600">
                                            {route.destination.lat.toFixed(4)},{" "}
                                            {route.destination.lng.toFixed(4)}
                                        </span>
                                    </div>

                                    {/* Route details */}
                                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                        <div className="flex items-center gap-1">
                                            <Navigation className="h-3 w-3" />
                                            <span>
                                                {formatDistance(
                                                    route.total_distance
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            <span>
                                                {formatDuration(
                                                    route.total_duration
                                                )}
                                            </span>
                                        </div>
                                        {route.route_type && (
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                                {route.route_type}
                                            </span>
                                        )}
                                        {route.vehicle_type && (
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                                                {route.vehicle_type}
                                            </span>
                                        )}
                                    </div>

                                    {/* Status badge */}
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`px-2 py-1 rounded text-xs font-medium ${
                                                route.status === "active"
                                                    ? "bg-green-100 text-green-700"
                                                    : route.status === "completed"
                                                    ? "bg-blue-100 text-blue-700"
                                                    : "bg-gray-100 text-gray-700"
                                            }`}
                                        >
                                            {route.status}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(
                                                route.created_at
                                            ).toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex flex-col gap-2 ml-4">
                                    {onRouteSelect && (
                                        <button
                                            onClick={() => onRouteSelect(route)}
                                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                        >
                                            View
                                        </button>
                                    )}

                                    {route.status === "active" && (
                                        <button
                                            onClick={() =>
                                                handleStatusUpdate(
                                                    route.route_id,
                                                    "completed"
                                                )
                                            }
                                            className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200 transition-colors flex items-center gap-1"
                                            disabled={
                                                updateStatusMutation.isPending
                                            }
                                        >
                                            <Check className="h-3 w-3" />
                                            Complete
                                        </button>
                                    )}

                                    {route.status !== "cancelled" && (
                                        <button
                                            onClick={() =>
                                                handleStatusUpdate(
                                                    route.route_id,
                                                    "cancelled"
                                                )
                                            }
                                            className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 transition-colors flex items-center gap-1"
                                            disabled={
                                                updateStatusMutation.isPending
                                            }
                                        >
                                            <X className="h-3 w-3" />
                                            Cancel
                                        </button>
                                    )}

                                    <button
                                        onClick={() =>
                                            handleDelete(route.route_id)
                                        }
                                        className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200 transition-colors flex items-center gap-1"
                                        disabled={deleteRouteMutation.isPending}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                        Delete
                                    </button>
                                </div>
                            </div>

                            {/* Waypoints if any */}
                            {route.waypoints && route.waypoints.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <p className="text-xs text-gray-500 mb-1">
                                        Waypoints:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {route.waypoints.map(
                                            (wp: any, idx: number) => (
                                                <span
                                                    key={idx}
                                                    className="text-xs px-2 py-1 bg-gray-50 rounded"
                                                >
                                                    {wp.lat.toFixed(4)},{" "}
                                                    {wp.lng.toFixed(4)}
                                                </span>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SavedRoutesList;
