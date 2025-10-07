import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiService } from "../lib/api";
import { queryKeys } from "./queryKeys";

// Traffic hooks
export const useCurrentTraffic = (location: {
    lat: number;
    lng: number;
    radius?: number;
}) => {
    return useQuery({
        queryKey: queryKeys.trafficCurrent(location),
        queryFn: () => apiService.traffic.getCurrentTraffic(location),
        select: (data) => data.data,
        enabled: !!(location.lat && location.lng),
        refetchInterval: 30000, // Refetch every 30 seconds
        staleTime: 15000, // Consider data stale after 15 seconds
    });
};

export const useTrafficIncidents = () => {
    return useQuery({
        queryKey: queryKeys.trafficIncidents,
        queryFn: () => apiService.traffic.getTrafficIncidents(),
        select: (data) => data.data,
        refetchInterval: 60000, // Refetch every minute
        staleTime: 30000, // Consider data stale after 30 seconds
    });
};

export const useReportIncident = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: apiService.traffic.reportIncident,
        onSuccess: () => {
            // Invalidate traffic incidents to refresh the list
            queryClient.invalidateQueries({
                queryKey: queryKeys.trafficIncidents,
            });
            // Also invalidate current traffic data
            queryClient.invalidateQueries({ queryKey: queryKeys.traffic });
        },
    });
};

// Hook for updating incident status
export const useUpdateIncident = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { incidentId: string; status: string }) =>
            apiService.traffic.updateIncident?.(data.incidentId, data.status) ||
            Promise.reject("Not implemented"),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.trafficIncidents,
            });
        },
    });
};
