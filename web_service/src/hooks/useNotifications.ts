import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiService } from "../lib/api";
import { queryKeys } from "./queryKeys";

// Notification hooks
export const useNotifications = () => {
    return useQuery({
        queryKey: queryKeys.notifications,
        queryFn: () => apiService.notifications.getNotifications(),
        select: (data) => data.data,
        staleTime: 30 * 1000, // 30 seconds
    });
};

export const useNotificationCount = () => {
    return useQuery({
        queryKey: queryKeys.notificationCount,
        queryFn: () => apiService.notifications.getUnreadCount(),
        select: (data) => data.data.count,
        refetchInterval: 60000, // Refetch every minute
        staleTime: 30 * 1000, // 30 seconds
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

export const useMarkAllNotificationsAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () =>
            apiService.notifications.markAllAsRead?.() ||
            Promise.reject("Not implemented"),
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

export const useDeleteNotification = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (notificationId: string) =>
            apiService.notifications.deleteNotification?.(notificationId) ||
            Promise.reject("Not implemented"),
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

// Hook for getting notification preferences
export const useNotificationPreferences = () => {
    return useQuery({
        queryKey: ["notifications", "preferences"],
        queryFn: () =>
            apiService.notifications.getPreferences?.() ||
            Promise.reject("Not implemented"),
        select: (data) => data.data,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
};

export const useUpdateNotificationPreferences = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (preferences: any) =>
            apiService.notifications.updatePreferences?.(preferences) ||
            Promise.reject("Not implemented"),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["notifications", "preferences"],
            });
        },
    });
};
