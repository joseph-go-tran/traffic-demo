import { useState, useCallback } from "react";
import { RouteResponse } from "./useRouting";

interface NavigationState {
    isNavigating: boolean;
    activeRoute: RouteResponse | null;
    fromLocation: string;
    toLocation: string;
    currentStep: number;
    estimatedTimeRemaining: number;
}

interface NavigationControls {
    startNavigation: (
        route: RouteResponse,
        fromLocation: string,
        toLocation: string
    ) => void;
    stopNavigation: () => void;
    nextStep: () => void;
    previousStep: () => void;
    setCurrentStep: (step: number) => void;
    updateTimeRemaining: (seconds: number) => void;
}

export const useNavigation = (): NavigationState & NavigationControls => {
    const [navigationState, setNavigationState] = useState<NavigationState>({
        isNavigating: false,
        activeRoute: null,
        fromLocation: "",
        toLocation: "",
        currentStep: 0,
        estimatedTimeRemaining: 0,
    });

    const startNavigation = useCallback(
        (route: RouteResponse, fromLocation: string, toLocation: string) => {
            setNavigationState({
                isNavigating: true,
                activeRoute: route,
                fromLocation,
                toLocation,
                currentStep: 0,
                estimatedTimeRemaining: route.total_duration,
            });
        },
        []
    );

    const stopNavigation = useCallback(() => {
        setNavigationState((prev) => ({
            ...prev,
            isNavigating: false,
            activeRoute: null,
            currentStep: 0,
        }));
    }, []);

    const nextStep = useCallback(() => {
        setNavigationState((prev) => {
            const totalSteps =
                prev.activeRoute?.segments?.[0]?.instructions?.length || 0;
            return {
                ...prev,
                currentStep: Math.min(prev.currentStep + 1, totalSteps - 1),
            };
        });
    }, []);

    const previousStep = useCallback(() => {
        setNavigationState((prev) => ({
            ...prev,
            currentStep: Math.max(prev.currentStep - 1, 0),
        }));
    }, []);

    const setCurrentStep = useCallback((step: number) => {
        setNavigationState((prev) => ({
            ...prev,
            currentStep: Math.max(0, step),
        }));
    }, []);

    const updateTimeRemaining = useCallback((seconds: number) => {
        setNavigationState((prev) => ({
            ...prev,
            estimatedTimeRemaining: Math.max(0, seconds),
        }));
    }, []);

    return {
        ...navigationState,
        startNavigation,
        stopNavigation,
        nextStep,
        previousStep,
        setCurrentStep,
        updateTimeRemaining,
    };
};
