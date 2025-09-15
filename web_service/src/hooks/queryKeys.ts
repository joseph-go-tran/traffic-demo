// Centralized query keys for React Query
export const queryKeys = {
    // Authentication
    auth: ["auth"] as const,

    // Routes
    routes: ["routes"] as const,
    route: (id: string) => ["routes", id] as const,

    // Traffic
    traffic: ["traffic"] as const,
    trafficIncidents: ["traffic", "incidents"] as const,
    trafficCurrent: (location: { lat: number; lng: number; radius?: number }) =>
        ["traffic", "current", location] as const,

    // User
    user: ["user"] as const,
    userProfile: ["user", "profile"] as const,
    userRoutes: ["user", "routes"] as const,
    userRecentRoutes: ["user", "routes", "recent"] as const,
    userFavoriteRoutes: ["user", "routes", "favorites"] as const,

    // Notifications
    notifications: ["notifications"] as const,
    notificationCount: ["notifications", "count"] as const,
} as const;
