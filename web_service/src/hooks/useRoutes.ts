import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiService } from "../lib/api";
import { queryKeys } from "./queryKeys";

// Route hooks
export const usePlanRoute = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: apiService.routes.planRoute,
        onSuccess: () => {
            // Invalidate routes to refresh the list
            queryClient.invalidateQueries({ queryKey: queryKeys.routes });
        },
    });
};

export const useRoutes = () => {
    return useQuery({
        queryKey: queryKeys.routes,
        queryFn: () => apiService.routes.getRoutes(),
        select: (data) => data.data,
    });
};

export const useRoute = (routeId: string) => {
    return useQuery({
        queryKey: queryKeys.route(routeId),
        queryFn: () => apiService.routes.getRoute(routeId),
        select: (data) => data.data,
        enabled: !!routeId,
    });
};

// Hook for updating route preferences
export const useUpdateRoutePreferences = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { routeId: string; preferences: any }) =>
            apiService.routes.updateRoutePreferences?.(
                data.routeId,
                data.preferences
            ) || Promise.reject("Not implemented"),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.routes });
        },
    });
};

// Hook for deleting a route
export const useDeleteRoute = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (routeId: string) =>
            apiService.routes.deleteRoute?.(routeId) ||
            Promise.reject("Not implemented"),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.routes });
        },
    });
};
