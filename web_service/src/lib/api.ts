import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

// Base API URLs - you can set these from environment variables
const USER_SERVICE_URL =
    import.meta.env.VITE_API_URL + "/users/api/v1" || "http://localhost:8000/api/v1";
const ROUTING_API_URL =
    import.meta.env.VITE_API_URL + "/routing/api/v1" || "http://localhost:8001/api/v1";
const TRAFFIC_API_URL =
    import.meta.env.VITE_API_URL + "/traffic/api/v1" || "http://localhost:8002/api/v1";

console.log("User Service URL:", USER_SERVICE_URL);
console.log("Routing API URL:", ROUTING_API_URL);
console.log("Traffic API URL:", TRAFFIC_API_URL);

// Create axios instances
export const api = axios.create({
    baseURL: USER_SERVICE_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

export const routingApi = axios.create({
    baseURL: ROUTING_API_URL,
    timeout: 30000, // Longer timeout for routing calculations
    headers: {
        "Content-Type": "application/json",
    },
});

export const trafficApi = axios.create({
    baseURL: TRAFFIC_API_URL,
    timeout: 15000,
    headers: { "Content-Type": "application/json" },
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
                    const response = await api.post("/auth/token/refresh/", {
                        refresh: refreshToken,
                    });

                    const { access } = response.data;
                    localStorage.setItem("accessToken", access);
                    localStorage.setItem("authToken", access); // backward compatibility

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
        }) =>
            api.post("/auth/register/", {
                email: userData.email,
                password: userData.password,
                first_name: userData.firstName,
                last_name: userData.lastName,
            }),
        logout: () => {
            const refreshToken = localStorage.getItem("refreshToken");
            return api.post("/auth/logout/", {
                refresh: refreshToken,
            });
        },
        refreshToken: (refreshToken: string) =>
            api.post("/auth/token/refresh/", {
                refresh: refreshToken,
            }),
    },

    // Routes (Using TomTom API via routing service)
    routes: {
        // Calculate routes with TomTom API
        calculateRoute: (routeData: {
            origin: { lat: number; lng: number };
            destination: { lat: number; lng: number };
            waypoints?: { lat: number; lng: number }[];
            user_id?: number;
            options?: {
                route_type?: "fastest" | "shortest" | "eco";
                avoid_tolls?: boolean;
                avoid_highways?: boolean;
                avoid_ferries?: boolean;
                avoid_unpaved?: boolean;
                vehicle_type?:
                    | "car"
                    | "truck"
                    | "taxi"
                    | "bus"
                    | "van"
                    | "motorcycle"
                    | "bicycle"
                    | "pedestrian";
            };
        }) => routingApi.post("/routes/calculate", routeData),

        calculateEnhancedRoute: (routeData: {
            origin: { lat: number; lng: number };
            destination: { lat: number; lng: number };
            waypoints?: { lat: number; lng: number }[];
            user_id?: number;
            options?: {
                route_type?: "fastest" | "shortest" | "eco";
                avoid_tolls?: boolean;
                avoid_highways?: boolean;
                avoid_ferries?: boolean;
                avoid_unpaved?: boolean;
                vehicle_type?:
                    | "car"
                    | "truck"
                    | "taxi"
                    | "bus"
                    | "van"
                    | "motorcycle"
                    | "bicycle"
                    | "pedestrian";
            };
        }) => routingApi.post("/routes/calculate-enhanced", routeData),

        // Search and traffic
        searchPlaces: (searchData: {
            query: string;
            coordinates?: { lat: number; lng: number };
            radius?: number;
        }) => routingApi.post("/routes/search", searchData),

        getTrafficInfo: (trafficData: {
            coordinates: { lat: number; lng: number };
            zoom_level?: number;
        }) => routingApi.post("/routes/traffic", trafficData),

        getRouteTypes: () => routingApi.get("/routes/route-types"),

        // Location search/geocoding
        searchLocation: (query: string) =>
            routingApi.post("/routes/search", { query, radius: 50000 }),

        // Stored routes management - NEW endpoints
        getUserRoutes: (params: {
            user_id: number;
            limit?: number;
            offset?: number;
            status?: "active" | "completed" | "cancelled";
        }) =>
            routingApi.get(`/routes/user/${params.user_id}`, {
                params: {
                    limit: params.limit,
                    offset: params.offset,
                    status: params.status,
                },
            }),

        getRecentRoutes: (params?: { limit?: number; user_id?: number }) =>
            routingApi.get("/routes/recent", { params }),

        getRouteDetails: (routeId: string) =>
            routingApi.get(`/routes/${routeId}`),

        updateRouteStatus: (
            routeId: string,
            status: "active" | "completed" | "cancelled"
        ) =>
            routingApi.patch(`/routes/${routeId}/status`, null, {
                params: { new_status: status },
            }),

        deleteRoute: (routeId: string) =>
            routingApi.delete(`/routes/${routeId}`),
    },

    // Traffic - Direct integration with traffic service (port 8002)
    traffic: {
        getCurrentTraffic: (location: {
            lat: number;
            lng: number;
            radius?: number;
        }) => api.get("/traffic/current", { params: location }),

        getTrafficIncidents: (params?: {
            lat?: number;
            lng?: number;
            radius?: number;
            status?: string[];
            limit?: number;
            offset?: number;
        }) => trafficApi.get("/traffic/incidents/", { params }),

        reportIncident: (incident: {
            type:
                | "accident"
                | "construction"
                | "closure"
                | "congestion"
                | "weather"
                | "hazard"
                | "other";
            severity: "low" | "medium" | "high" | "critical";
            location: { lat: number; lng: number };
            description: string;
            address?: string;
            affected_lanes?: string;
            estimated_duration?: string;
            reported_by?: string;
        }) => trafficApi.post("/traffic/incidents/report", incident),

        voteOnIncident: (
            incidentId: string,
            voteData: {
                vote_type: "confirm" | "dispute";
                user_id?: string;
            }
        ) => {
            return trafficApi.put(
                `/traffic/incidents/${incidentId}/vote`,
                voteData
            );
        },

        updateIncident: (
            incidentId: string,
            statusData: {
                status: "active" | "resolved" | "verified" | "disputed";
                updated_by?: string;
            }
        ) => {
            return trafficApi.put(
                `/traffic/incidents/${incidentId}/status`,
                statusData
            );
        },

        getRouteIncidents: (routeData: {
            coordinates: { lat: number; lng: number }[];
            buffer_km?: number;
        }) => {
            return trafficApi.post("/traffic/incidents/route-check", routeData);
        },
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
