import { useState, useEffect, useCallback, useRef } from "react";
import { GPSTimelinePoint } from "../components/GPSTimeline";

interface GPSPosition {
    lat: number;
    lng: number;
    timestamp: Date;
    speed?: number;
    heading?: number;
    accuracy?: number;
}

interface UseGPSTrackingOptions {
    enableTracking?: boolean;
    trackingInterval?: number; // milliseconds
    enableHighAccuracy?: boolean;
    maxAge?: number;
    timeout?: number;
    onPositionUpdate?: (position: GPSPosition) => void;
    onError?: (error: GeolocationPositionError) => void;
}

interface GPSTrackingState {
    currentPosition: GPSPosition | null;
    positionHistory: GPSPosition[];
    isTracking: boolean;
    error: string | null;
    totalDistance: number;
    averageSpeed: number;
    maxSpeed: number;
}

export function useGPSTracking(options: UseGPSTrackingOptions = {}) {
    const {
        enableTracking = true,
        enableHighAccuracy = true,
        maxAge = 0,
        timeout = 10000,
        onPositionUpdate,
        onError,
    } = options;

    const [state, setState] = useState<GPSTrackingState>({
        currentPosition: null,
        positionHistory: [],
        isTracking: false,
        error: null,
        totalDistance: 0,
        averageSpeed: 0,
        maxSpeed: 0,
    });

    const watchIdRef = useRef<number | null>(null);
    // Calculate distance between two coordinates using Haversine formula
    const calculateDistance = useCallback(
        (
            pos1: { lat: number; lng: number },
            pos2: { lat: number; lng: number }
        ): number => {
            const R = 6371e3; // Earth's radius in meters
            const φ1 = (pos1.lat * Math.PI) / 180;
            const φ2 = (pos2.lat * Math.PI) / 180;
            const Δφ = ((pos2.lat - pos1.lat) * Math.PI) / 180;
            const Δλ = ((pos2.lng - pos1.lng) * Math.PI) / 180;

            const a =
                Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) *
                    Math.cos(φ2) *
                    Math.sin(Δλ / 2) *
                    Math.sin(Δλ / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

            return R * c; // Distance in meters
        },
        []
    );

    // Update position
    const updatePosition = useCallback(
        (position: GeolocationPosition) => {
            const newPosition: GPSPosition = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                timestamp: new Date(position.timestamp),
                speed: position.coords.speed ?? undefined,
                heading: position.coords.heading ?? undefined,
                accuracy: position.coords.accuracy,
            };

            setState((prev) => {
                const newHistory = [...prev.positionHistory, newPosition];

                // Calculate new total distance
                let newTotalDistance = prev.totalDistance;
                if (prev.currentPosition) {
                    const segmentDistance = calculateDistance(
                        prev.currentPosition,
                        newPosition
                    );
                    newTotalDistance += segmentDistance;
                }

                // Calculate speeds
                const speeds = newHistory
                    .map((p) => p.speed)
                    .filter((s): s is number => s !== undefined && s > 0);

                const newAverageSpeed =
                    speeds.length > 0
                        ? speeds.reduce((a, b) => a + b, 0) / speeds.length
                        : 0;

                const newMaxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;

                return {
                    ...prev,
                    currentPosition: newPosition,
                    positionHistory: newHistory,
                    totalDistance: newTotalDistance,
                    averageSpeed: newAverageSpeed,
                    maxSpeed: newMaxSpeed,
                    error: null,
                };
            });

            onPositionUpdate?.(newPosition);
        },
        [calculateDistance, onPositionUpdate]
    );

    // Handle geolocation errors
    const handleError = useCallback(
        (error: GeolocationPositionError) => {
            let errorMessage = "Unknown error occurred";
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = "Location access denied by user";
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = "Location information unavailable";
                    break;
                case error.TIMEOUT:
                    errorMessage = "Location request timed out";
                    break;
            }

            setState((prev) => ({
                ...prev,
                error: errorMessage,
                isTracking: false,
            }));

            onError?.(error);
        },
        [onError]
    );

    // Start tracking
    const startTracking = useCallback(() => {
        if (!navigator.geolocation) {
            setState((prev) => ({
                ...prev,
                error: "Geolocation is not supported by this browser",
                isTracking: false,
            }));
            return;
        }

        setState((prev) => ({ ...prev, isTracking: true, error: null }));

        const geoOptions: PositionOptions = {
            enableHighAccuracy,
            maximumAge: maxAge,
            timeout,
        };

        // Use watchPosition for continuous tracking
        watchIdRef.current = navigator.geolocation.watchPosition(
            updatePosition,
            handleError,
            geoOptions
        );
    }, [enableHighAccuracy, maxAge, timeout, updatePosition, handleError]);

    // Stop tracking
    const stopTracking = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }

        setState((prev) => ({ ...prev, isTracking: false }));
    }, []);

    // Reset tracking data
    const resetTracking = useCallback(() => {
        setState({
            currentPosition: null,
            positionHistory: [],
            isTracking: false,
            error: null,
            totalDistance: 0,
            averageSpeed: 0,
            maxSpeed: 0,
        });
    }, []);

    // Clear error
    const clearError = useCallback(() => {
        setState((prev) => ({ ...prev, error: null }));
    }, []);

    // Get current position once
    const getCurrentPosition = useCallback((): Promise<GPSPosition> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation is not supported"));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const gpsPosition: GPSPosition = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        timestamp: new Date(position.timestamp),
                        speed: position.coords.speed ?? undefined,
                        heading: position.coords.heading ?? undefined,
                        accuracy: position.coords.accuracy,
                    };
                    resolve(gpsPosition);
                },
                reject,
                { enableHighAccuracy, maximumAge: maxAge, timeout }
            );
        });
    }, [enableHighAccuracy, maxAge, timeout]);

    // Auto-start tracking if enabled
    useEffect(() => {
        if (enableTracking) {
            startTracking();
        }

        return () => {
            stopTracking();
        };
    }, [enableTracking, startTracking, stopTracking]);

    return {
        ...state,
        startTracking,
        stopTracking,
        resetTracking,
        clearError,
        getCurrentPosition,
        calculateDistance,
    };
}

// Helper function to convert GPS history to timeline points
export function convertToTimelinePoints(
    history: GPSPosition[],
    destination?: { lat: number; lng: number; address?: string },
    waypoints?: Array<{ lat: number; lng: number; address?: string }>
): GPSTimelinePoint[] {
    const points: GPSTimelinePoint[] = [];

    if (history.length === 0) return points;

    // Start point
    const start = history[0];
    points.push({
        id: `start-${start.timestamp.getTime()}`,
        timestamp: start.timestamp,
        coordinates: { lat: start.lat, lng: start.lng },
        type: "start",
        status: "completed",
        distance: 0,
        speed: start.speed,
    });

    // Waypoints (if any)
    waypoints?.forEach((waypoint, index) => {
        points.push({
            id: `waypoint-${index}`,
            timestamp: new Date(), // Would need actual timestamp
            coordinates: { lat: waypoint.lat, lng: waypoint.lng },
            address: waypoint.address,
            type: "waypoint",
            status: "upcoming",
            distance: 0, // Would calculate based on route
        });
    });

    // Current position (last in history)
    const current = history[history.length - 1];
    points.push({
        id: `current-${current.timestamp.getTime()}`,
        timestamp: current.timestamp,
        coordinates: { lat: current.lat, lng: current.lng },
        type: "current",
        status: "active",
        distance: 0, // Calculate from route
        speed: current.speed,
    });

    // Destination
    if (destination) {
        points.push({
            id: "destination",
            timestamp: new Date(), // Estimated
            coordinates: { lat: destination.lat, lng: destination.lng },
            address: destination.address,
            type: "destination",
            status: "upcoming",
            eta: new Date(), // Would calculate based on speed and distance
        });
    }

    return points;
}
