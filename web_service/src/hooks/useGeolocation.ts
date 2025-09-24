import { useState, useEffect } from "react";

interface GeolocationState {
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
    error: string | null;
    loading: boolean;
}

interface GeolocationOptions {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
}

export const useGeolocation = (options: GeolocationOptions = {}) => {
    const [state, setState] = useState<GeolocationState>({
        latitude: null,
        longitude: null,
        accuracy: null,
        error: null,
        loading: true,
    });

    const {
        enableHighAccuracy = true,
        timeout = 10000,
        maximumAge = 60000,
    } = options;

    useEffect(() => {
        if (!navigator.geolocation) {
            setState((prev) => ({
                ...prev,
                error: "Geolocation is not supported by this browser.",
                loading: false,
            }));
            return;
        }

        const handleSuccess = (position: GeolocationPosition) => {
            setState({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                error: null,
                loading: false,
            });
        };

        const handleError = (error: GeolocationPositionError) => {
            let errorMessage = "Unknown error occurred.";

            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = "User denied the request for Geolocation.";
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = "Location information is unavailable.";
                    break;
                case error.TIMEOUT:
                    errorMessage =
                        "The request to get user location timed out.";
                    break;
            }

            setState((prev) => ({
                ...prev,
                error: errorMessage,
                loading: false,
            }));
        };

        const geoOptions: PositionOptions = {
            enableHighAccuracy,
            timeout,
            maximumAge,
        };

        // Get current position
        navigator.geolocation.getCurrentPosition(
            handleSuccess,
            handleError,
            geoOptions
        );

        // Watch position for real-time updates
        const watchId = navigator.geolocation.watchPosition(
            handleSuccess,
            handleError,
            geoOptions
        );

        // Cleanup function
        return () => {
            navigator.geolocation.clearWatch(watchId);
        };
    }, [enableHighAccuracy, timeout, maximumAge]);

    return state;
};
