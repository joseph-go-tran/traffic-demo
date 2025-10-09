import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "../lib/api";
import { queryKeys } from "./queryKeys";
import { setTokens, clearTokens } from "../lib/tokenUtils";

// Authentication hooks
export const useLogin = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: apiService.auth.login,
        onSuccess: (data) => {
            // Store both access and refresh tokens using utility
            const { access, refresh } = data.data;
            setTokens(access, refresh);

            // Invalidate auth-related queries
            queryClient.invalidateQueries({ queryKey: queryKeys.auth });
            queryClient.invalidateQueries({ queryKey: queryKeys.user });
        },
        onError: (error: any) => {
            console.error(
                "Login error:",
                error?.response?.data || error.message
            );
        },
    });
};

export const useRegister = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: apiService.auth.register,
        onSuccess: (data) => {
            // Store both access and refresh tokens using utility
            const { access, refresh } = data.data;
            setTokens(access, refresh);

            // Invalidate auth-related queries
            queryClient.invalidateQueries({ queryKey: queryKeys.auth });
            queryClient.invalidateQueries({ queryKey: queryKeys.user });
        },
        onError: (error: any) => {
            console.error(
                "Registration error:",
                error?.response?.data || error.message
            );
        },
    });
};

export const useLogout = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: apiService.auth.logout,
        onSuccess: () => {
            // Clear all tokens using utility
            clearTokens();
            // Clear all queries
            queryClient.clear();
        },
    });
};

export const useRefreshToken = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (refreshToken: string) =>
            apiService.auth.refreshToken(refreshToken),
        onSuccess: (data) => {
            // Update access token, keep existing refresh token
            const { access } = data.data;
            const currentRefresh = localStorage.getItem("refreshToken");
            if (currentRefresh) {
                setTokens(access, currentRefresh);
            }

            // Invalidate auth-related queries
            queryClient.invalidateQueries({ queryKey: queryKeys.auth });
        },
        onError: (error: any) => {
            console.error(
                "Token refresh error:",
                error?.response?.data || error.message
            );
            // If refresh fails, clear tokens and redirect to login
            clearTokens();
        },
    });
};
