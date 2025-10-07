import { useState, useEffect } from 'react';
import { apiService } from '../lib/api';

export interface TrafficIncident {
  id: string;
  type: 'accident' | 'construction' | 'closure' | 'congestion' | 'weather' | 'hazard' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'verified' | 'disputed';
  location: { lat: number; lng: number };
  description: string;
  address?: string;
  affected_lanes?: string;
  estimated_duration?: string;
  reported_by?: string;
  created_at: string;
  updated_at?: string;
  votes_confirm: number;
  votes_dispute: number;
  total_votes: number;
}

interface UseTrafficIncidentsOptions {
  location?: { lat: number; lng: number };
  radius?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useTrafficIncidents(options: UseTrafficIncidentsOptions = {}) {
  const [incidents, setIncidents] = useState<TrafficIncident[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    location,
    radius = 10.0,
    autoRefresh = false,
    refreshInterval = 30000 // 30 seconds
  } = options;

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {};
      if (location) {
        params.lat = location.lat;
        params.lng = location.lng;
        params.radius = radius;
      }

      const response = await apiService.traffic.getTrafficIncidents(params);
      setIncidents(response.data.data || []);
    } catch (err: any) {
      console.error('Error fetching traffic incidents:', err);
      setError(err.response?.data?.detail || 'Failed to fetch traffic incidents');
    } finally {
      setLoading(false);
    }
  };

  const reportIncident = async (incidentData: {
    type: 'accident' | 'construction' | 'closure' | 'congestion' | 'weather' | 'hazard' | 'other';
    severity: 'low' | 'medium' | 'high' | 'critical';
    location: { lat: number; lng: number };
    description: string;
    address?: string;
    affected_lanes?: string;
    estimated_duration?: string;
  }) => {
    try {
      setError(null);

      const response = await apiService.traffic.reportIncident({
        ...incidentData,
        reported_by: 'user' // In real app, this would be the actual user ID
      });

      // Add the new incident to the local state
      const newIncident = response.data.data as TrafficIncident;
      setIncidents(prev => [newIncident, ...prev]);

      return newIncident;
    } catch (err: any) {
      console.error('Error reporting incident:', err);
      const errorMessage = err.response?.data?.detail || 'Failed to report incident';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const voteOnIncident = async (incidentId: string, voteType: 'confirm' | 'dispute') => {
    try {
      setError(null);

      await apiService.traffic.voteOnIncident(incidentId, {
        vote_type: voteType,
        user_id: 'user' // In real app, this would be the actual user ID
      });

      // Update the local incident
      setIncidents(prev => prev.map(incident => {
        if (incident.id === incidentId) {
          return {
            ...incident,
            votes_confirm: voteType === 'confirm' ? incident.votes_confirm + 1 : incident.votes_confirm,
            votes_dispute: voteType === 'dispute' ? incident.votes_dispute + 1 : incident.votes_dispute,
            total_votes: incident.total_votes + 1
          };
        }
        return incident;
      }));
    } catch (err: any) {
      console.error('Error voting on incident:', err);
      setError(err.response?.data?.detail || 'Failed to vote on incident');
    }
  };

  const updateIncidentStatus = async (incidentId: string, status: 'active' | 'resolved' | 'verified' | 'disputed') => {
    try {
      setError(null);

      await apiService.traffic.updateIncident(incidentId, {
        status,
        updated_by: 'user' // In real app, this would be the actual user ID
      });

      // Update the local incident
      setIncidents(prev => prev.map(incident =>
        incident.id === incidentId
          ? { ...incident, status }
          : incident
      ));
    } catch (err: any) {
      console.error('Error updating incident status:', err);
      setError(err.response?.data?.detail || 'Failed to update incident status');
    }
  };

  const getIncidentsNearRoute = (routeCoordinates: [number, number][], bufferKm: number = 1) => {
    if (!routeCoordinates.length) return [];

    return incidents.filter(incident => {
      // Simple distance check - in real app you'd use proper geometric calculations
      return routeCoordinates.some(([lat, lng]) => {
        const distance = Math.sqrt(
          Math.pow(incident.location.lat - lat, 2) +
          Math.pow(incident.location.lng - lng, 2)
        ) * 111; // Rough conversion to km

        return distance <= bufferKm;
      });
    });
  };

  // Auto-refresh incidents
  useEffect(() => {
    fetchIncidents();

    if (autoRefresh) {
      const interval = setInterval(fetchIncidents, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [location?.lat, location?.lng, radius, autoRefresh, refreshInterval]);

  return {
    incidents,
    loading,
    error,
    fetchIncidents,
    reportIncident,
    voteOnIncident,
    updateIncidentStatus,
    getIncidentsNearRoute,
    refreshIncidents: fetchIncidents
  };
}

// Utility functions
export const getIncidentIcon = (type: string) => {
  const icons = {
    accident: '🚗💥',
    construction: '🚧',
    closure: '🚫',
    congestion: '🚦',
    weather: '🌧️',
    hazard: '⚠️',
    other: '❓'
  };
  return icons[type as keyof typeof icons] || '⚠️';
};

export const getSeverityColor = (severity: string) => {
  const colors = {
    low: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
    high: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
    critical: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' }
  };
  return colors[severity as keyof typeof colors] || colors.medium;
};

export const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return time.toLocaleDateString();
};
