import { useState, useEffect, useCallback, useRef } from "react";

interface GPSPosition {
    lat: number;
    lng: number;
    timestamp: Date;
    speed?: number;
    heading?: number;
    accuracy?: number;
}

interface RoutePoint {
    lat: number;
    lng: number;
    instruction?: string;
}

interface UseSimulatedGPSOptions {
    enabled?: boolean;
    updateInterval?: number; // milliseconds between updates
    speed?: number; // km/h
    route?: RoutePoint[];
    loop?: boolean; // restart from beginning when route ends
    onPositionUpdate?: (position: GPSPosition) => void;
}

/**
 * Hook for simulating GPS movement along a predefined route
 * Perfect for demos and testing without actual device movement
 */
export function useSimulatedGPS(options: UseSimulatedGPSOptions = {}) {
    const {
        enabled = true,
        updateInterval = 1000, // 1 second
        speed = 60, // 60 km/h default
        route = [],
        loop = true,
        onPositionUpdate,
    } = options;

    const [currentPosition, setCurrentPosition] = useState<GPSPosition | null>(
        null
    );
    const [positionHistory, setPositionHistory] = useState<GPSPosition[]>([]);
    const [currentRouteIndex, setCurrentRouteIndex] = useState(0);
    const [progress, setProgress] = useState(0); // 0 to 1, progress between current and next point
    const [isSimulating, setIsSimulating] = useState(false);
    const [totalDistance, setTotalDistance] = useState(0);

    const intervalRef = useRef<number | null>(null);
    const startTimeRef = useRef<Date | null>(null);

    // Calculate distance between two coordinates (Haversine formula)
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

    // Calculate bearing/heading between two points
    const calculateBearing = useCallback(
        (
            pos1: { lat: number; lng: number },
            pos2: { lat: number; lng: number }
        ): number => {
            const φ1 = (pos1.lat * Math.PI) / 180;
            const φ2 = (pos2.lat * Math.PI) / 180;
            const Δλ = ((pos2.lng - pos1.lng) * Math.PI) / 180;

            const y = Math.sin(Δλ) * Math.cos(φ2);
            const x =
                Math.cos(φ1) * Math.sin(φ2) -
                Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
            const θ = Math.atan2(y, x);

            return ((θ * 180) / Math.PI + 360) % 360; // Convert to degrees
        },
        []
    );

    // Interpolate position between two points
    const interpolatePosition = useCallback(
        (start: RoutePoint, end: RoutePoint, progress: number): GPSPosition => {
            const lat = start.lat + (end.lat - start.lat) * progress;
            const lng = start.lng + (end.lng - start.lng) * progress;
            const heading = calculateBearing(start, end);

            return {
                lat,
                lng,
                timestamp: new Date(),
                speed: speed / 3.6, // Convert km/h to m/s
                heading,
                accuracy: 10,
            };
        },
        [speed, calculateBearing]
    );

    // Generate default demo route if none provided
    const getDefaultRoute = useCallback((): RoutePoint[] => {
        // Simulated route (roughly resembles a city route)
        const startLat = 37.7749;
        const startLng = -122.4194;

        return [
            { lat: startLat, lng: startLng, instruction: "Starting point" },
            { lat: startLat + 0.01, lng: startLng, instruction: "Head north" },
            {
                lat: startLat + 0.01,
                lng: startLng + 0.015,
                instruction: "Turn right",
            },
            {
                lat: startLat + 0.02,
                lng: startLng + 0.015,
                instruction: "Continue straight",
            },
            {
                lat: startLat + 0.02,
                lng: startLng + 0.025,
                instruction: "Turn right",
            },
            {
                lat: startLat + 0.015,
                lng: startLng + 0.025,
                instruction: "Turn right",
            },
            {
                lat: startLat + 0.015,
                lng: startLng + 0.035,
                instruction: "Turn left",
            },
            {
                lat: startLat + 0.025,
                lng: startLng + 0.035,
                instruction: "Continue to destination",
            },
            {
                lat: startLat + 0.025,
                lng: startLng + 0.045,
                instruction: "Arrive at destination",
            },
        ];
    }, []);

    const activeRoute = route.length > 0 ? route : getDefaultRoute();

    // Start simulation
    const startSimulation = useCallback(() => {
        if (activeRoute.length < 2) {
            console.warn("Route must have at least 2 points");
            return;
        }

        setIsSimulating(true);
        startTimeRef.current = new Date();
        setCurrentRouteIndex(0);
        setProgress(0);
        setPositionHistory([]);
        setTotalDistance(0);

        // Set initial position
        const initialPos: GPSPosition = {
            ...activeRoute[0],
            timestamp: new Date(),
            speed: 0,
            heading: 0,
            accuracy: 10,
        };
        setCurrentPosition(initialPos);
        setPositionHistory([initialPos]);
    }, [activeRoute]);

    // Stop simulation
    const stopSimulation = useCallback(() => {
        setIsSimulating(false);
        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    // Reset simulation
    const resetSimulation = useCallback(() => {
        stopSimulation();
        setCurrentPosition(null);
        setPositionHistory([]);
        setCurrentRouteIndex(0);
        setProgress(0);
        setTotalDistance(0);
    }, [stopSimulation]);

    // Simulation loop
    useEffect(() => {
        if (!enabled || !isSimulating || activeRoute.length < 2) {
            return;
        }

        intervalRef.current = window.setInterval(() => {
            setProgress((prevProgress) => {
                const currentPoint = activeRoute[currentRouteIndex];
                const nextPoint = activeRoute[currentRouteIndex + 1];

                if (!currentPoint || !nextPoint) {
                    if (loop && activeRoute.length > 1) {
                        // Restart from beginning
                        setCurrentRouteIndex(0);
                        return 0;
                    } else {
                        // End of route
                        stopSimulation();
                        return prevProgress;
                    }
                }

                // Calculate segment distance
                const segmentDistance = calculateDistance(
                    currentPoint,
                    nextPoint
                );

                // Calculate how far we move in this update (based on speed)
                const speedMPS = speed / 3.6; // km/h to m/s
                const distancePerUpdate = (speedMPS * updateInterval) / 1000; // meters
                const progressIncrement =
                    segmentDistance > 0
                        ? distancePerUpdate / segmentDistance
                        : 1;

                const newProgress = prevProgress + progressIncrement;

                // Move to next segment if we've completed this one
                if (newProgress >= 1) {
                    setCurrentRouteIndex((prev) => {
                        const newIndex = prev + 1;
                        if (newIndex >= activeRoute.length - 1) {
                            if (loop) {
                                return 0;
                            }
                            return prev;
                        }
                        return newIndex;
                    });
                    return 0;
                }

                return newProgress;
            });
        }, updateInterval);

        return () => {
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current);
            }
        };
    }, [
        enabled,
        isSimulating,
        currentRouteIndex,
        activeRoute,
        speed,
        updateInterval,
        loop,
        calculateDistance,
        stopSimulation,
    ]);

    // Update position based on progress
    useEffect(() => {
        if (!isSimulating) return;

        const currentPoint = activeRoute[currentRouteIndex];
        const nextPoint = activeRoute[currentRouteIndex + 1];

        if (!currentPoint || !nextPoint) return;

        const newPosition = interpolatePosition(
            currentPoint,
            nextPoint,
            progress
        );

        setCurrentPosition((prevPos) => {
            // Calculate distance from previous position
            if (prevPos) {
                const distance = calculateDistance(prevPos, newPosition);
                setTotalDistance((prev) => prev + distance);
            }

            return newPosition;
        });

        setPositionHistory((prev) => {
            const newHistory = [...prev, newPosition];
            // Keep only last 100 positions to avoid memory issues
            return newHistory.slice(-100);
        });

        onPositionUpdate?.(newPosition);
    }, [
        progress,
        currentRouteIndex,
        activeRoute,
        isSimulating,
        interpolatePosition,
        calculateDistance,
        onPositionUpdate,
    ]);

    // Auto-start if enabled
    useEffect(() => {
        if (enabled && !isSimulating && activeRoute.length >= 2) {
            startSimulation();
        }
    }, [enabled, isSimulating, activeRoute.length, startSimulation]);

    // Get current instruction
    const getCurrentInstruction = useCallback(() => {
        const nextPoint = activeRoute[currentRouteIndex + 1];
        return nextPoint?.instruction || "Continue along route";
    }, [activeRoute, currentRouteIndex]);

    // Get route completion percentage
    const getCompletionPercentage = useCallback(() => {
        if (activeRoute.length < 2) return 0;
        const segmentProgress =
            (currentRouteIndex + progress) / (activeRoute.length - 1);
        return Math.min(Math.max(segmentProgress * 100, 0), 100);
    }, [activeRoute.length, currentRouteIndex, progress]);

    // Calculate average speed from history
    const averageSpeed =
        positionHistory.length > 0
            ? positionHistory.reduce((sum, pos) => sum + (pos.speed || 0), 0) /
              positionHistory.length
            : 0;

    return {
        currentPosition,
        positionHistory,
        isSimulating,
        totalDistance,
        averageSpeed,
        currentInstruction: getCurrentInstruction(),
        completionPercentage: getCompletionPercentage(),
        currentRouteIndex,
        routeLength: activeRoute.length,
        startSimulation,
        stopSimulation,
        resetSimulation,
        setSpeed: (newSpeed: number) => {
            // This would require updating the options, keeping for API consistency
            console.log("Speed changed to:", newSpeed);
        },
    };
}
