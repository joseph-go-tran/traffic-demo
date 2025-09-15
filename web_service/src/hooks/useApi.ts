import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiService } from "../lib/api";

// Query Keys
export const queryKeys = {
    auth: ["auth"] as const,
    routes: ["routes"] as const,
    route: (id: string) => ["routes", id] as const,
    traffic: ["traffic"] as const,
    trafficIncidents: ["traffic", "incidents"] as const,
    trafficCurrent: (location: { lat: number; lng: number; radius?: number }) =>
        ["traffic", "current", location] as const,
    user: ["user"] as const,
    userProfile: ["user", "profile"] as const,
    userRoutes: ["user", "routes"] as const,
    userRecentRoutes: ["user", "routes", "recent"] as const,
    userFavoriteRoutes: ["user", "routes", "favorites"] as const,
    notifications: ["notifications"] as const,
    notificationCount: ["notifications", "count"] as const,
};

// Authentication hooks
export const useLogin = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: apiService.auth.login,
        onSuccess: (data) => {
            // Store token
            localStorage.setItem("authToken", data.data.token);
            // Invalidate auth-related queries
            queryClient.invalidateQueries({ queryKey: queryKeys.auth });
            queryClient.invalidateQueries({ queryKey: queryKeys.user });
        },
    });
};

export const useRegister = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: apiService.auth.register,
        onSuccess: (data) => {
            // Store token
            localStorage.setItem("authToken", data.data.token);
            // Invalidate auth-related queries
            queryClient.invalidateQueries({ queryKey: queryKeys.auth });
            queryClient.invalidateQueries({ queryKey: queryKeys.user });
        },
    });
};

export const useLogout = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: apiService.auth.logout,
        onSuccess: () => {
            // Clear token
            localStorage.removeItem("authToken");
            // Clear all queries
            queryClient.clear();
        },
    });
};

// Route hooks
export const usePlanRoute = () => {
    return useMutation({
        mutationFn: apiService.routes.planRoute,
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

// Traffic hooks
export const useCurrentTraffic = (location: {
    lat: number;
    lng: number;
    radius?: number;
}) => {
    return useQuery({
        queryKey: queryKeys.trafficCurrent(location),
        queryFn: () => apiService.traffic.getCurrentTraffic(location),
        select: (data) => data.data,
        enabled: !!(location.lat && location.lng),
        refetchInterval: 30000, // Refetch every 30 seconds
    });
};

export const useTrafficIncidents = () => {
    return useQuery({
        queryKey: queryKeys.trafficIncidents,
        queryFn: () => apiService.traffic.getTrafficIncidents(),
        select: (data) => data.data,
        refetchInterval: 60000, // Refetch every minute
    });
};

export const useReportIncident = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: apiService.traffic.reportIncident,
        onSuccess: () => {
            // Invalidate traffic incidents to refresh the list
            queryClient.invalidateQueries({
                queryKey: queryKeys.trafficIncidents,
            });
        },
    });
};

// User hooks
export const useUserProfile = () => {
    return useQuery({
        queryKey: queryKeys.userProfile,
        queryFn: () => apiService.user.getProfile(),
        select: (data) => data.data,
    });
};

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: apiService.user.updateProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.userProfile });
        },
    });
};

export const useRecentRoutes = () => {
    return useQuery({
        queryKey: queryKeys.userRecentRoutes,
        queryFn: () => apiService.user.getRecentRoutes(),
        select: (data) => data.data,
    });
};

export const useFavoriteRoutes = () => {
    return useQuery({
        queryKey: queryKeys.userFavoriteRoutes,
        queryFn: () => apiService.user.getFavoriteRoutes(),
        select: (data) => data.data,
    });
};

export const useSaveFavoriteRoute = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: apiService.user.saveFavoriteRoute,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.userFavoriteRoutes,
            });
        },
    });
};

// Notification hooks
export const useNotifications = () => {
    return useQuery({
        queryKey: queryKeys.notifications,
        queryFn: () => apiService.notifications.getNotifications(),
        select: (data) => data.data,
    });
};

export const useNotificationCount = () => {
    return useQuery({
        queryKey: queryKeys.notificationCount,
        queryFn: () => apiService.notifications.getUnreadCount(),
        select: (data) => data.data.count,
        refetchInterval: 60000, // Refetch every minute
    });
};

export const useMarkNotificationAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: apiService.notifications.markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.notifications,
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.notificationCount,
            });
        },
    });
};
