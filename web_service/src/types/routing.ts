/**
 * TypeScript types for Routing Service API
 */

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
    user_id?: number;
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

// Database-stored route types
export interface StoredRoute {
    route_id: string;
    user_id?: number;
    origin: Coordinates;
    destination: Coordinates;
    total_distance: number;
    total_duration: number;
    polyline?: string;
    route_type: string;
    vehicle_type: string;
    options?: {
        avoid_tolls: boolean;
        avoid_highways: boolean;
        avoid_ferries: boolean;
        avoid_unpaved: boolean;
    };
    status: "active" | "completed" | "cancelled";
    created_at: string;
    full_route_data?: RouteResponse;
    waypoints?: RouteWaypoint[];
}

export interface RouteWaypoint {
    lat: number;
    lng: number;
    sequence: number;
    name?: string;
    address?: string;
}

export interface UserRoutesResponse {
    user_id: number;
    total_routes: number;
    routes: StoredRoute[];
}

export interface RecentRoutesResponse {
    total_routes: number;
    routes: StoredRoute[];
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

export interface TrafficResponse {
    traffic_data: any;
    coordinates: Coordinates;
    timestamp: string;
}
