import { useMutation, useQuery } from "@tanstack/react-query";
import { apiService } from "../lib/api";

// Types for routing API
export interface Coordinates {
    lat: number;
    lng: number;
}

export interface RouteOptions {
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
}

export interface RouteRequest {
    origin: Coordinates;
    destination: Coordinates;
    waypoints?: Coordinates[];
    options?: RouteOptions;
}

export interface RouteInstruction {
    instruction: string;
    distance: number;
    duration: number;
    coordinates: Coordinates;
}

export interface RouteSegment {
    start_point: Coordinates;
    end_point: Coordinates;
    distance: number;
    duration: number;
    instructions: RouteInstruction[];
}

export interface RouteResponse {
    route_id: string;
    total_distance: number;
    total_duration: number;
    segments: RouteSegment[];
    polyline: string;
    summary: any;
    created_at: string;
}

export interface PlaceSearchRequest {
    query: string;
    coordinates?: Coordinates;
    radius?: number;
}

export interface PlaceResult {
    name: string;
    address: string;
    coordinates: Coordinates;
    category?: string;
    distance?: number;
}

export interface PlaceSearchResponse {
    results: PlaceResult[];
    query: string;
    total_results: number;
}

export interface TrafficRequest {
    coordinates: Coordinates;
    zoom_level?: number;
}

// React Query hooks for routing

/**
 * Hook to calculate a route using TomTom API
 */
export const useCalculateRoute = () => {
    return useMutation({
        mutationFn: (routeData: RouteRequest) =>
            apiService.routes.calculateRoute(routeData),
        onError: (error) => {
            console.error("Route calculation error:", error);
        },
    });
};

/**
 * Hook to search for places
 */
export const useSearchPlaces = () => {
    return useMutation({
        mutationFn: (searchData: PlaceSearchRequest) =>
            apiService.routes.searchPlaces(searchData),
        onError: (error) => {
            console.error("Place search error:", error);
        },
    });
};

/**
 * Hook to get traffic information
 */
export const useGetTrafficInfo = () => {
    return useMutation({
        mutationFn: (trafficData: TrafficRequest) =>
            apiService.routes.getTrafficInfo(trafficData),
        onError: (error) => {
            console.error("Traffic info error:", error);
        },
    });
};

/**
 * Hook to get available route types
 */
export const useGetRouteTypes = () => {
    return useQuery({
        queryKey: ["routeTypes"],
        queryFn: () => apiService.routes.getRouteTypes(),
        staleTime: 1000 * 60 * 60, // 1 hour
        select: (data) => data.data,
    });
};

/**
 * Hook to save a calculated route (for user history/favorites)
 */
export const useSaveRoute = () => {
    return useMutation({
        mutationFn: (routeData: any) => apiService.routes.saveRoute(routeData),
        onError: (error) => {
            console.error("Save route error:", error);
        },
    });
};

/**
 * Hook to get user's saved routes
 */
export const useGetSavedRoutes = () => {
    return useQuery({
        queryKey: ["savedRoutes"],
        queryFn: () => apiService.routes.getRoutes(),
        select: (data) => data.data,
    });
};

/**
 * Hook to delete a saved route
 */
export const useDeleteRoute = () => {
    return useMutation({
        mutationFn: (routeId: string) => apiService.routes.deleteRoute(routeId),
        onError: (error) => {
            console.error("Delete route error:", error);
        },
    });
};

/**
 * Hook to calculate an enhanced route with detailed path information
 */
export const useCalculateEnhancedRoute = () => {
    return useMutation({
        mutationFn: (routeData: RouteRequest) =>
            apiService.routes.calculateEnhancedRoute(routeData),
        onError: (error) => {
            console.error("Enhanced route calculation error:", error);
        },
    });
};

// Utility functions for formatting

/**
 * Format distance from meters to human-readable string
 */
export const formatDistance = (meters: number): string => {
    if (meters < 1000) {
        return `${meters} m`;
    } else if (meters < 10000) {
        return `${(meters / 1000).toFixed(1)} km`;
    } else {
        return `${Math.round(meters / 1000)} km`;
    }
};

/**
 * Format duration from seconds to human-readable string
 */
export const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m`;
    }
};

/**
 * Format traffic level based on duration vs expected
 */
export const getTrafficLevel = (
    actualDuration: number,
    baseDuration: number
): "light" | "moderate" | "heavy" => {
    const ratio = actualDuration / baseDuration;

    if (ratio < 1.2) return "light";
    if (ratio < 1.5) return "moderate";
    return "heavy";
};

/**
 * Convert coordinates to address using reverse geocoding (placeholder)
 */
export const coordinatesToAddress = async (
    coordinates: Coordinates
): Promise<string> => {
    // This would typically use a reverse geocoding service
    return `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`;
};
