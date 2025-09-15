import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiService } from "../lib/api";
import { queryKeys } from "./queryKeys";

// User profile hooks
export const useUserProfile = () => {
    return useQuery({
        queryKey: queryKeys.userProfile,
        queryFn: () => apiService.user.getProfile(),
        select: (data) => data.data,
        staleTime: 5 * 60 * 1000, // 5 minutes
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

// User routes hooks
export const useRecentRoutes = () => {
    return useQuery({
        queryKey: queryKeys.userRecentRoutes,
        queryFn: () => apiService.user.getRecentRoutes(),
        select: (data) => data.data,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};

export const useFavoriteRoutes = () => {
    return useQuery({
        queryKey: queryKeys.userFavoriteRoutes,
        queryFn: () => apiService.user.getFavoriteRoutes(),
        select: (data) => data.data,
        staleTime: 5 * 60 * 1000, // 5 minutes
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

export const useRemoveFavoriteRoute = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (routeId: string) =>
            apiService.user.removeFavoriteRoute?.(routeId) ||
            Promise.reject("Not implemented"),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.userFavoriteRoutes,
            });
        },
    });
};

// User preferences hooks
export const useUserPreferences = () => {
    return useQuery({
        queryKey: ["user", "preferences"],
        queryFn: () =>
            apiService.user.getPreferences?.() ||
            Promise.reject("Not implemented"),
        select: (data) => data.data,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
};

export const useUpdateUserPreferences = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (preferences: any) =>
            apiService.user.updatePreferences?.(preferences) ||
            Promise.reject("Not implemented"),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["user", "preferences"],
            });
        },
    });
};

// User statistics hooks
export const useUserStats = () => {
    return useQuery({
        queryKey: ["user", "stats"],
        queryFn: () =>
            apiService.user.getStats?.() || Promise.reject("Not implemented"),
        select: (data) => data.data,
        staleTime: 15 * 60 * 1000, // 15 minutes
    });
};
