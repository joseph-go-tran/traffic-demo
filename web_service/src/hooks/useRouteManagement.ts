import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCalculateRoute, useGetUserRoutes } from "./useRouting";
import { RouteRequest } from "../types/routing";

/**
 * Enhanced hook that calculates route and provides utilities for managing the stored route
 * Automatically invalidates user routes cache after calculation
 */
export const useRouteCalculationWithStorage = (userId?: number) => {
    const queryClient = useQueryClient();
    const calculateRoute = useCalculateRoute();

    return useMutation({
        mutationFn: async (routeRequest: RouteRequest) => {
            // Add user_id to request if available
            const requestWithUser = {
                ...routeRequest,
                user_id: userId || routeRequest.user_id,
            };

            // Calculate and store route
            const response = await calculateRoute.mutateAsync(requestWithUser);
            return response;
        },
        onSuccess: () => {
            // Invalidate and refetch user routes after successful calculation
            if (userId) {
                queryClient.invalidateQueries({
                    queryKey: ["userRoutes", userId],
                });
            }
            queryClient.invalidateQueries({ queryKey: ["recentRoutes"] });
        },
        onError: (error) => {
            console.error("Route calculation with storage failed:", error);
        },
    });
};

/**
 * Hook to manage route lifecycle with automatic query invalidation
 */
export const useRouteLifecycle = (userId?: number) => {
    const queryClient = useQueryClient();

    const invalidateRoutes = () => {
        if (userId) {
            queryClient.invalidateQueries({ queryKey: ["userRoutes", userId] });
        }
        queryClient.invalidateQueries({ queryKey: ["recentRoutes"] });
    };

    return {
        invalidateRoutes,
        /**
         * Refresh route data after external changes
         */
        refreshRoutes: () => {
            invalidateRoutes();
        },
    };
};

/**
 * Hook that provides route statistics for a user
 */
export const useRouteStats = (userId: number) => {
    const { data: userRoutes } = useGetUserRoutes({
        user_id: userId,
        limit: 1000, // Get all routes for stats
    });

    const routes = userRoutes?.routes || [];

    const stats = {
        totalRoutes: routes.length,
        activeRoutes: routes.filter((r) => r.status === "active").length,
        completedRoutes: routes.filter((r) => r.status === "completed").length,
        cancelledRoutes: routes.filter((r) => r.status === "cancelled").length,
        totalDistance: routes.reduce((sum, r) => sum + r.total_distance, 0),
        totalDuration: routes.reduce((sum, r) => sum + r.total_duration, 0),
        averageDistance: routes.length
            ? routes.reduce((sum, r) => sum + r.total_distance, 0) /
              routes.length
            : 0,
        averageDuration: routes.length
            ? routes.reduce((sum, r) => sum + r.total_duration, 0) /
              routes.length
            : 0,
        routesByType: {
            fastest: routes.filter((r) => r.route_type === "fastest").length,
            shortest: routes.filter((r) => r.route_type === "shortest").length,
            eco: routes.filter((r) => r.route_type === "eco").length,
        },
        routesByVehicle: routes.reduce((acc, route) => {
            acc[route.vehicle_type] = (acc[route.vehicle_type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>),
        recentActivity: routes
            .sort(
                (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
            )
            .slice(0, 5),
    };

    return stats;
};

export default useRouteCalculationWithStorage;
