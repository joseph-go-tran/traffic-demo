import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

// Base API URL - you can set this from environment variables
const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

// Create axios instance
export const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor for auth tokens
api.interceptors.request.use(
    (config: AxiosRequestConfig) => {
        // Get access token from localStorage
        const accessToken =
            localStorage.getItem("accessToken") ||
            localStorage.getItem("authToken");

        if (accessToken && config.headers) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling common errors and token refresh
api.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Handle common errors
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // Try to refresh the token
            const refreshToken = localStorage.getItem("refreshToken");
            if (refreshToken) {
                try {
                    const response = await api.post("/auth/refresh/", {
                        refresh: refreshToken,
                    });

                    const { access, refresh: newRefresh } = response.data;
                    localStorage.setItem("accessToken", access);
                    localStorage.setItem("authToken", access); // backward compatibility

                    if (newRefresh) {
                        localStorage.setItem("refreshToken", newRefresh);
                    }

                    // Retry the original request with the new token
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${access}`;
                    }
                    return api(originalRequest);
                } catch (refreshError) {
                    // Refresh failed, redirect to login
                    localStorage.removeItem("authToken");
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                    window.location.href = "/login";
                }
            } else {
                // No refresh token, redirect to login
                localStorage.removeItem("authToken");
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                window.location.href = "/login";
            }
        } else if (error.response?.status === 403) {
            // Handle forbidden
            console.error("Access forbidden");
        } else if (error.response?.status >= 500) {
            // Handle server errors
            console.error("Server error:", error.message);
        }

        return Promise.reject(error);
    }
);

// API service functions
export const apiService = {
    // Authentication
    auth: {
        login: (credentials: { email: string; password: string }) =>
            api.post("/auth/login/", credentials),
        register: (userData: {
            email: string;
            password: string;
            firstName: string;
            lastName: string;
        }) => api.post("/auth/register/", userData),
        logout: () => api.post("/auth/logout/"),
        refreshToken: () => api.post("/auth/refresh/"),
    },

    // Routes
    routes: {
        planRoute: (routeData: {
            from: string;
            to: string;
            preferences?: {
                routeType?: "fastest" | "shortest" | "eco";
                avoidTolls?: boolean;
                avoidHighways?: boolean;
            };
        }) => api.post("/routes/plan", routeData),
        getRoute: (routeId: string) => api.get(`/routes/${routeId}`),
        getRoutes: () => api.get("/routes"),
        updateRoutePreferences: (routeId: string, preferences: any) =>
            api.put(`/routes/${routeId}/preferences`, preferences),
        deleteRoute: (routeId: string) => api.delete(`/routes/${routeId}`),
    },

    // Traffic
    traffic: {
        getCurrentTraffic: (location: {
            lat: number;
            lng: number;
            radius?: number;
        }) => api.get("/traffic/current", { params: location }),
        getTrafficIncidents: () => api.get("/traffic/incidents"),
        reportIncident: (incident: {
            type: string;
            location: { lat: number; lng: number };
            description: string;
        }) => api.post("/traffic/incidents", incident),
        updateIncident: (incidentId: string, status: string) =>
            api.put(`/traffic/incidents/${incidentId}`, { status }),
        getTrafficPredictions: (
            location: { lat: number; lng: number },
            timeRange?: string
        ) =>
            api.get("/traffic/predictions", {
                params: { ...location, timeRange },
            }),
    },

    // User Dashboard
    user: {
        getProfile: () => api.get("/user/profile"),
        updateProfile: (profileData: any) =>
            api.put("/user/profile", profileData),
        getRecentRoutes: () => api.get("/user/routes/recent"),
        getFavoriteRoutes: () => api.get("/user/routes/favorites"),
        saveFavoriteRoute: (routeId: string) =>
            api.post(`/user/routes/favorites/${routeId}`),
        removeFavoriteRoute: (routeId: string) =>
            api.delete(`/user/routes/favorites/${routeId}`),
        getPreferences: () => api.get("/user/preferences"),
        updatePreferences: (preferences: any) =>
            api.put("/user/preferences", preferences),
        getStats: () => api.get("/user/stats"),
    },

    // Notifications
    notifications: {
        getNotifications: () => api.get("/notifications"),
        markAsRead: (notificationId: string) =>
            api.put(`/notifications/${notificationId}/read`),
        getUnreadCount: () => api.get("/notifications/unread-count"),
        markAllAsRead: () => api.put("/notifications/mark-all-read"),
        deleteNotification: (notificationId: string) =>
            api.delete(`/notifications/${notificationId}`),
        getPreferences: () => api.get("/notifications/preferences"),
        updatePreferences: (preferences: any) =>
            api.put("/notifications/preferences", preferences),
    },
};

export default api;
