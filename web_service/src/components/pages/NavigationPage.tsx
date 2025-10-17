import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Navigation, Volume2, VolumeX, RotateCcw, Phone, AlertTriangle } from 'lucide-react';
import NavigationMap from '../NavigationMap';
import IncidentAlert from '../IncidentAlert';
import TrafficReportModal from '../TrafficReportModal';
import TrafficIncidentsList from '../TrafficIncidentsList';
import GPSTimeline, { GPSTimelinePoint } from '../GPSTimeline';
import { useTrafficIncidents } from '../../hooks/useTrafficIncidents';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useNotifications } from '../../contexts/NotificationContext';
import { useGPSTracking } from '../../hooks/useGPSTracking';
import { useSimulatedGPS } from '../../hooks/useSimulatedGPS';

interface NavigationPageProps {
  routeId?: string;
}

export default function NavigationPage({ routeId: routeIdProp }: NavigationPageProps) {
  // Get route data from navigation state (passed from RoutePlanningPage)
  const location = useLocation();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const routeState = location.state as any;

  const routeId = routeState?.routeId || routeIdProp || '1';
  const routeData = routeState?.route?.data || routeState?.route;
  const fromLocationName = routeState?.fromLocation || 'Main Street';
  const toLocationName = routeState?.toLocation || 'Business District';

  // Debug logging
  useEffect(() => {
    console.log('=== Navigation Page Debug ===');
    console.log('routeState:', routeState);
    console.log('routeData:', routeData);
    console.log('routeData structure:', {
      hasSegments: routeData?.segments ? 'yes' : 'no',
      segmentCount: routeData?.segments?.length || 0,
      hasGeometry: routeData?.geometry ? 'yes' : 'no',
      geometryCount: routeData?.geometry?.length || 0,
      hasWaypoints: routeData?.waypoints ? 'yes' : 'no',
      waypointCount: routeData?.waypoints?.length || 0,
      hasPolyline: routeData?.polyline ? 'yes' : 'no',
      totalDistance: routeData?.total_distance,
      totalDuration: routeData?.total_duration
    });
    if (routeData?.segments && routeData.segments.length > 0) {
      console.log('First segment:', routeData.segments[0]);
      if (routeData.segments[0].instructions) {
        console.log('First instruction:', routeData.segments[0].instructions[0]);
      }
    }
  }, [routeData, routeState]);
  const [isMuted, setIsMuted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(
    routeData?.total_duration ? Math.round(routeData.total_duration) : 27 * 60
  );
  const [showReportModal, setShowReportModal] = useState(false);
  const [useSimulation, setUseSimulation] = useState(true); // Always use simulation for demo

  // Traffic alerts from socket notifications
  const [trafficAlerts, setTrafficAlerts] = useState<Array<{
    id: string;
    type: 'accident' | 'construction' | 'closure' | 'weather';
    location: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    estimatedDuration?: string;
    alternativeRoute?: string;
    coordinates?: { lat: number; lng: number }; // Store coordinates for distance filtering
  }>>([]);

  // Navigation steps - use actual route data if available
  const navigationSteps = useMemo(() => {
    // Extract from segments/instructions (actual API structure)
    if (routeData?.segments && Array.isArray(routeData.segments)) {
      const steps: string[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      routeData.segments.forEach((segment: any) => {
        if (segment.instructions && Array.isArray(segment.instructions)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          segment.instructions.forEach((instruction: any) => {
            if (instruction.instruction) {
              steps.push(instruction.instruction);
            }
          });
        }
      });
      if (steps.length > 0) {
        console.log('Using', steps.length, 'navigation steps from segments');
        return steps;
      }
    }

    // Fallback to steps array if available
    if (routeData?.steps && Array.isArray(routeData.steps)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return routeData.steps.map((step: any) =>
        step.instruction || step.description || 'Continue'
      );
    }

    // Default fallback
    return [
      'Head north on Main St toward Oak Ave',
      'Turn right onto Highway 101',
      'Continue straight for 15 miles',
      'Take exit 42A toward Downtown',
      'Turn left onto Business Blvd'
    ];
  }, [routeData]);

  // Connect to WebSocket for real-time navigation updates
  const { connect, disconnect, subscribe, notifications } = useNotifications();

  // Connect WebSocket when navigation starts
  useEffect(() => {
    console.log('Navigation started - connecting to notification service');
    connect();

    // Use a timeout to subscribe after connection is established
    const subscribeTimer = setTimeout(() => {
      subscribe(undefined, ['traffic-alerts', 'route-updates', 'navigation']);
    }, 500);

    // Cleanup: disconnect when navigation ends
    return () => {
      clearTimeout(subscribeTimer);
      console.log('Navigation ended - disconnecting from notification service');
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount/unmount

  // Get user's current location
  const { latitude, longitude } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000
  });

  // Define simulated route points - use actual route data with same parsing as NavigationMap
  const simulatedRoute = useMemo(() => {
    console.log('=== Building Simulated Route ===');
    console.log('routeData:', routeData);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allPoints: any[] = [];

    // PRIORITY 1: Parse polyline (most accurate, matches what's shown on map)
    if (routeData?.polyline && routeData.polyline.trim() !== '') {
      console.log('Parsing polyline for GPS simulation...');
      try {
        if (routeData.polyline.includes(' ')) {
          // Space-separated lat,lng pairs format
          const pairs = routeData.polyline.split(' ');
          for (const pair of pairs) {
            if (pair.includes(',')) {
              const [latStr, lngStr] = pair.split(',');
              const lat = parseFloat(latStr.trim());
              const lng = parseFloat(lngStr.trim());
              if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                allPoints.push({ lat, lng, instruction: 'Continue' });
              }
            }
          }
        } else if (routeData.polyline.includes(',')) {
          // Comma-separated format: lat1,lng1,lat2,lng2...
          const values = routeData.polyline.split(',');
          for (let i = 0; i < values.length; i += 2) {
            if (i + 1 < values.length) {
              const lat = parseFloat(values[i].trim());
              const lng = parseFloat(values[i + 1].trim());
              if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                allPoints.push({ lat, lng, instruction: 'Continue' });
              }
            }
          }
        }

        if (allPoints.length > 0) {
          console.log('Parsed', allPoints.length, 'points from polyline');

          // Sample the points for smoother simulation (50-100 points is ideal)
          const targetPoints = 80;
          if (allPoints.length > targetPoints) {
            const step = Math.floor(allPoints.length / targetPoints);
            const sampledPoints = [];
            for (let i = 0; i < allPoints.length; i += step) {
              sampledPoints.push(allPoints[i]);
            }
            // Always include the last point
            if (sampledPoints[sampledPoints.length - 1] !== allPoints[allPoints.length - 1]) {
              sampledPoints.push(allPoints[allPoints.length - 1]);
            }

            // Add instructions to sampled points based on segment instructions
            if (routeData.segments && Array.isArray(routeData.segments)) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const instructionPoints: any[] = [];
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              routeData.segments.forEach((segment: any) => {
                if (segment.instructions && Array.isArray(segment.instructions)) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  segment.instructions.forEach((instruction: any) => {
                    if (instruction.coordinates) {
                      instructionPoints.push({
                        lat: instruction.coordinates.lat,
                        lng: instruction.coordinates.lng,
                        instruction: instruction.instruction
                      });
                    }
                  });
                }
              });

              // Match sampled points with nearest instruction
              sampledPoints.forEach(point => {
                let closestInstruction = 'Continue';
                let minDistance = Infinity;

                instructionPoints.forEach(instrPoint => {
                  const distance = Math.sqrt(
                    Math.pow(point.lat - instrPoint.lat, 2) +
                    Math.pow(point.lng - instrPoint.lng, 2)
                  );
                  if (distance < minDistance && distance < 0.001) { // Within ~100m
                    minDistance = distance;
                    closestInstruction = instrPoint.instruction;
                  }
                });

                point.instruction = closestInstruction;
              });
            }

            console.log('Sampled to', sampledPoints.length, 'points for smooth GPS simulation');
            return sampledPoints;
          }

          return allPoints;
        }
      } catch (error) {
        console.warn('Error parsing polyline:', error);
      }
    }

    // PRIORITY 2: Extract from segments/instructions if polyline not available
    if (routeData?.segments && Array.isArray(routeData.segments) && routeData.segments.length > 0) {
      console.log('Using route segments:', routeData.segments.length);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      routeData.segments.forEach((segment: any) => {
        // Add start point
        if (segment.start_point) {
          allPoints.push({
            lat: segment.start_point.lat,
            lng: segment.start_point.lng,
            instruction: 'Start segment'
          });
        }

        // Add all instruction points
        if (segment.instructions && Array.isArray(segment.instructions)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          segment.instructions.forEach((instruction: any) => {
            if (instruction.coordinates) {
              allPoints.push({
                lat: instruction.coordinates.lat,
                lng: instruction.coordinates.lng,
                instruction: instruction.instruction || 'Continue'
              });
            }
          });
        }

        // Add end point
        if (segment.end_point) {
          allPoints.push({
            lat: segment.end_point.lat,
            lng: segment.end_point.lng,
            instruction: 'End segment'
          });
        }
      });

      if (allPoints.length > 0) {
        console.log('Using', allPoints.length, 'points from segments');
        return allPoints;
      }
    }

    // PRIORITY 3: Extract from waypoints
    if (routeData?.waypoints && Array.isArray(routeData.waypoints) && routeData.waypoints.length > 0) {
      console.log('Using route waypoints:', routeData.waypoints.length);
      return routeData.waypoints
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((wp: any) => (wp.latitude || wp.lat) && (wp.longitude || wp.lng))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((wp: any, index: number) => ({
          lat: wp.latitude || wp.lat,
          lng: wp.longitude || wp.lng,
          instruction: wp.instruction || navigationSteps[index] || 'Continue'
        }));
    }

    // FALLBACK: Use mock San Francisco route
    console.log('Using fallback mock route');
    return [
      { lat: 37.7749, lng: -122.4194, instruction: 'Head north on Main St toward Oak Ave' },
      { lat: 37.7849, lng: -122.4194, instruction: 'Turn right onto Highway 101' },
      { lat: 37.7849, lng: -122.4044, instruction: 'Continue straight for 15 miles' },
      { lat: 37.7949, lng: -122.4044, instruction: 'Take exit 42A toward Downtown' },
      { lat: 37.7949, lng: -122.3894, instruction: 'Turn left onto Business Blvd' },
      { lat: 37.7999, lng: -122.3894, instruction: 'Arrive at destination' }
    ];
  }, [routeData, navigationSteps]);

  // Log the simulated route for debugging
  useEffect(() => {
    console.log('=== Simulated Route Ready ===');
    console.log('Total waypoints:', simulatedRoute.length);
    if (simulatedRoute.length > 0) {
      console.log('First point:', simulatedRoute[0]);
      console.log('Last point:', simulatedRoute[simulatedRoute.length - 1]);
      console.log('Sample points (every 10th):',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        simulatedRoute.filter((_: any, i: number) => i % 10 === 0).map((p: any) => `(${p.lat.toFixed(5)}, ${p.lng.toFixed(5)})`).join(' -> ')
      );
    }
  }, [simulatedRoute]);

  // Simulated GPS for demo (use this when not moving)
  const simulatedGPS = useSimulatedGPS({
    enabled: useSimulation,
    updateInterval: 500, // Update every 0.5 seconds for smoother animation
    speed: 120, // 120 km/h - faster demo speed for better visibility
    route: simulatedRoute,
    loop: false,
    onPositionUpdate: (position) => {
      console.log('Simulated GPS position:', position);
    }
  });

  // Real GPS Tracking (use this for actual navigation)
  const realGPS = useGPSTracking({
    enableTracking: !useSimulation,
    trackingInterval: 5000,
    enableHighAccuracy: true,
    onPositionUpdate: (position) => {
      console.log('Real GPS position updated:', position);
    }
  });

  // Use simulated or real GPS based on toggle
  const {
    currentPosition,
    positionHistory,
    isTracking,
    totalDistance,
    averageSpeed
  } = useSimulation ? {
    currentPosition: simulatedGPS.currentPosition,
    positionHistory: simulatedGPS.positionHistory,
    isTracking: simulatedGPS.isSimulating,
    totalDistance: simulatedGPS.totalDistance,
    averageSpeed: simulatedGPS.averageSpeed
  } : realGPS;

  // Traffic incidents management
  const {
    incidents,
    voteOnIncident,
    refreshIncidents
  } = useTrafficIncidents({
    location: latitude && longitude ? { lat: latitude, lng: longitude } : undefined,
    radius: 5.0, // 5km radius
    autoRefresh: true,
    refreshInterval: 60000 // 1 minute
  });

  // Default fallback incident
  const defaultIncident = {
    id: '1',
    type: 'accident' as const,
    location: 'Highway 101, Mile 23',
    description: 'Multi-vehicle accident blocking right lane. Emergency services on scene.',
    severity: 'high' as const,
    estimatedDuration: '45-60 minutes',
    alternativeRoute: 'Oak Street Bypass'
  };

  // Helper function to calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  };

  // Process socket notifications to update traffic alerts
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    // Get current position (prefer GPS position, fallback to geolocation)
    const currentLat = currentPosition?.lat || latitude;
    const currentLng = currentPosition?.lng || longitude;

    if (!currentLat || !currentLng) {
      console.log('No GPS position available for distance filtering');
      return;
    }

    // Find traffic-related notifications
    const trafficNotifications = notifications.filter(
      (n) => n.data && (n.data.reportId || n.data.incidentType)
    );

    if (trafficNotifications.length === 0) return;

    console.log('Processing traffic notifications:', trafficNotifications);

    // Convert notifications to traffic alerts and filter by distance
    const newAlerts = trafficNotifications
      .map((notif) => {
        const data = notif.data || {};
        const location = data.location || {};

        // Extract coordinates from notification
        const alertLat = location.lat;
        const alertLng = location.lng;

        return {
          id: data.reportId || `alert-${Date.now()}-${Math.random()}`,
          type: mapIncidentType(data.incidentType || 'other'),
          location: location.address || `${alertLat?.toFixed(4) || 'Unknown'}, ${alertLng?.toFixed(4) || 'Location'}`,
          description: notif.message || data.description || 'Traffic incident reported',
          severity: mapSeverity(data.severity || notif.type),
          estimatedDuration: data.estimated_duration,
          alternativeRoute: undefined,
          coordinates: alertLat && alertLng ? { lat: alertLat, lng: alertLng } : undefined
        };
      })
      .filter((alert) => {
        // Filter alerts within 5km radius
        if (!alert.coordinates) {
          console.log('Alert has no coordinates, excluding:', alert.id);
          return false;
        }

        const distance = calculateDistance(
          currentLat,
          currentLng,
          alert.coordinates.lat,
          alert.coordinates.lng
        );

        console.log(`Alert ${alert.id} distance: ${distance.toFixed(2)}km`);

        return distance <= 5.0; // Only include alerts within 5km
      });

    console.log(`Filtered ${newAlerts.length} alerts within 5km of current position`);

    // Update traffic alerts, keeping only the most recent 5 within range
    setTrafficAlerts((prev) => {
      const combined = [...newAlerts, ...prev];
      // Remove duplicates by id
      const unique = combined.filter((alert, index, self) =>
        index === self.findIndex((a) => a.id === alert.id)
      );

      // Re-filter all alerts by distance in case position changed
      const withinRange = unique.filter((alert) => {
        if (!alert.coordinates) return false;
        const distance = calculateDistance(
          currentLat,
          currentLng,
          alert.coordinates.lat,
          alert.coordinates.lng
        );
        return distance <= 5.0;
      });

      return withinRange.slice(0, 5);
    });

    // Refresh incidents list when new traffic reports arrive
    refreshIncidents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications, currentPosition, latitude, longitude]);

  // Helper function to map incident types
  const mapIncidentType = (type: string): 'accident' | 'construction' | 'closure' | 'weather' => {
    const typeMap: Record<string, 'accident' | 'construction' | 'closure' | 'weather'> = {
      'accident': 'accident',
      'construction': 'construction',
      'road_closure': 'closure',
      'closure': 'closure',
      'weather': 'weather',
      'congestion': 'accident', // Map to accident as fallback
      'hazard': 'accident',
      'other': 'accident'
    };
    return typeMap[type] || 'accident';
  };

  // Helper function to map severity
  const mapSeverity = (severity: string): 'low' | 'medium' | 'high' => {
    const severityMap: Record<string, 'low' | 'medium' | 'high'> = {
      'low': 'low',
      'info': 'low',
      'medium': 'medium',
      'warning': 'medium',
      'high': 'high',
      'error': 'high',
      'critical': 'high'
    };
    return severityMap[severity] || 'medium';
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const handleRecalculate = () => {
    // Simulate route recalculation
    setTimeRemaining(32 * 60);
    if (useSimulation) {
      simulatedGPS.resetSimulation();
      simulatedGPS.startSimulation();
    }
  };

  const toggleSimulation = () => {
    setUseSimulation(prev => !prev);
    if (!useSimulation) {
      // Starting simulation
      simulatedGPS.startSimulation();
    } else {
      // Stopping simulation
      simulatedGPS.stopSimulation();
    }
  };

  // Generate GPS Timeline Points
  const timelinePoints = useMemo((): GPSTimelinePoint[] => {
    const points: GPSTimelinePoint[] = [];

    // Starting point - use actual route start or first position
    const startPoint = simulatedRoute.length > 0 ? simulatedRoute[0] : null;
    if (positionHistory.length > 0 || startPoint) {
      const start = positionHistory.length > 0 ? positionHistory[0] : startPoint;
      if (start && start.lat && start.lng) {
        points.push({
          id: 'start',
          timestamp: positionHistory.length > 0 && 'timestamp' in start ? start.timestamp : new Date(Date.now() - 10 * 60000),
          coordinates: { lat: start.lat, lng: start.lng },
          address: fromLocationName,
          type: 'start',
          status: 'completed',
          distance: 0,
          speed: positionHistory.length > 0 && 'speed' in start ? start.speed : 0
        });
      }
    }

    // Add waypoints based on navigation steps
    navigationSteps.forEach((step: string, index: number) => {
      if (index < currentStep) {
        // Completed waypoints
        const estimatedPosition = positionHistory[Math.min(index + 1, positionHistory.length - 1)];
        points.push({
          id: `waypoint-${index}`,
          timestamp: estimatedPosition?.timestamp || new Date(),
          coordinates: estimatedPosition
            ? { lat: estimatedPosition.lat, lng: estimatedPosition.lng }
            : { lat: latitude || 0, lng: longitude || 0 },
          address: step.split(' ').slice(0, 5).join(' ') + '...',
          type: 'waypoint',
          status: 'completed',
          distance: (index + 1) * 3000, // Simulated distance
          speed: estimatedPosition?.speed
        });
      } else if (index === currentStep) {
        // Current active waypoint
        points.push({
          id: `waypoint-${index}`,
          timestamp: new Date(),
          coordinates: { lat: latitude || 0, lng: longitude || 0 },
          address: step.split(' ').slice(0, 5).join(' ') + '...',
          type: 'current',
          status: 'active',
          distance: (index + 1) * 3000,
          speed: currentPosition?.speed
        });
      } else if (index === currentStep + 1) {
        // Next waypoint
        const estimatedArrival = new Date();
        estimatedArrival.setMinutes(estimatedArrival.getMinutes() + 5);

        points.push({
          id: `waypoint-${index}`,
          timestamp: new Date(),
          coordinates: { lat: latitude || 0, lng: longitude || 0 },
          address: step.split(' ').slice(0, 5).join(' ') + '...',
          type: 'waypoint',
          status: 'upcoming',
          distance: (index + 1) * 3000,
          eta: estimatedArrival
        });
      }
    });

    // Destination - use actual route end point
    const destinationETA = new Date();
    destinationETA.setMinutes(destinationETA.getMinutes() + Math.floor(timeRemaining / 60));

    const destPoint = simulatedRoute.length > 0
      ? simulatedRoute[simulatedRoute.length - 1]
      : null;

    if (destPoint && destPoint.lat && destPoint.lng) {
      points.push({
        id: 'destination',
        timestamp: new Date(),
        coordinates: { lat: destPoint.lat, lng: destPoint.lng },
        address: toLocationName,
        type: 'destination',
        status: 'upcoming',
        distance: routeData?.total_distance || 18200,
        eta: destinationETA
      });
    }

    return points;
  }, [positionHistory, currentStep, navigationSteps, timeRemaining, latitude, longitude, currentPosition, simulatedRoute, fromLocationName, toLocationName, routeData]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Navigation Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-600 p-2 rounded-lg">
              <Navigation className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Active Navigation</h1>
              <p className="text-gray-600">Route #{routeId || '1'} - Fastest Route</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={toggleSimulation}
              className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors duration-200 ${
                useSimulation
                  ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={useSimulation ? 'Using Simulated GPS (Demo Mode)' : 'Using Real GPS'}
            >
              {useSimulation ? '🎮 Demo' : '📍 Real'}
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3 rounded-lg transition-colors duration-200 ${
                isMuted ? 'bg-gray-100 text-gray-600' : 'bg-purple-100 text-purple-600'
              }`}
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>

            <button
              onClick={handleRecalculate}
              className="p-3 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors duration-200"
              title="Recalculate Route"
            >
              <RotateCcw className="h-5 w-5" />
            </button>

            <button className="p-3 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors duration-200">
              <Phone className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Trip Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{formatTime(timeRemaining)}</div>
            <div className="text-sm text-gray-600">Time Remaining</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {routeData?.total_distance
                ? `${(routeData.total_distance / 1609.34).toFixed(1)} mi`
                : '18.2 mi'}
            </div>
            <div className="text-sm text-gray-600">Distance Left</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {(() => {
                const eta = new Date(Date.now() + timeRemaining * 1000);
                return eta.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                });
              })()}
            </div>
            <div className="text-sm text-gray-600">Arrival Time</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {currentPosition?.speed ? Math.round(currentPosition.speed * 3.6) : 0}
            </div>
            <div className="text-sm text-gray-600">Speed (km/h)</div>
          </div>
        </div>

        {/* GPS Tracking Stats */}
        {isTracking && positionHistory.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-700">
                {(totalDistance / 1000).toFixed(1)} km
              </div>
              <div className="text-xs text-gray-600">Tracked Distance</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-700">
                {Math.round(averageSpeed * 3.6)} km/h
              </div>
              <div className="text-xs text-gray-600">Avg Speed</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-700">
                {positionHistory.length}
              </div>
              <div className="text-xs text-gray-600">GPS Updates</div>
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map and Navigation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Navigation Map with real route data and GPS position */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden relative" style={{ height: '600px' }}>
            <NavigationMap
              routeData={routeData}
              fromLocation={fromLocationName}
              toLocation={toLocationName}
              currentStep={useSimulation ? simulatedGPS.currentRouteIndex : currentStep}
              isNavigating={true}
              userLocation={currentPosition ? { lat: currentPosition.lat, lng: currentPosition.lng } : undefined}
              showTrafficStress={true}
            />

            {/* Map overlay indicators - positioned at bottom right to avoid conflicts */}
            <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2 items-end">
              {/* GPS Status */}
              {currentPosition && (
                <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium text-gray-700">
                      GPS: {currentPosition.lat.toFixed(6)}, {currentPosition.lng.toFixed(6)}
                    </span>
                  </div>
                  {currentPosition.speed && (
                    <div className="text-gray-600 mt-1">
                      Speed: {Math.round(currentPosition.speed * 3.6)} km/h
                    </div>
                  )}
                </div>
              )}

              {/* Simulation Status */}
              {useSimulation && simulatedGPS.isSimulating && (
                <div className="bg-blue-50/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2 text-xs border border-blue-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-blue-700 font-medium">
                      Simulating: {simulatedGPS.completionPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Current Direction */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Current Direction</h2>
              <span className="text-sm text-gray-500">
                {useSimulation
                  ? `Step ${simulatedGPS.currentRouteIndex + 1} of ${simulatedGPS.routeLength}`
                  : `Step ${currentStep + 1} of ${navigationSteps.length}`
                }
              </span>
            </div>

            <div className="text-lg font-medium text-purple-600 mb-4">
              {useSimulation ? simulatedGPS.currentInstruction : navigationSteps[currentStep]}
            </div>

            {useSimulation && (
              <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 text-sm text-orange-800">
                  <span className="font-medium">Demo Mode:</span>
                  <span>Simulated GPS movement</span>
                </div>
                <div className="mt-1 text-xs text-orange-600">
                  Progress: {simulatedGPS.completionPercentage.toFixed(1)}%
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                {useSimulation ? 'Next instruction:' : 'In 0.3 miles:'}
              </div>
              <div className="text-base text-gray-900">
                {useSimulation
                  ? simulatedRoute[simulatedGPS.currentRouteIndex + 2]?.instruction || 'Arrive at destination'
                  : navigationSteps[currentStep + 1] || 'Continue to destination'
                }
              </div>
            </div>

            {!useSimulation && (
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentStep(Math.min(navigationSteps.length - 1, currentStep + 1))}
                  disabled={currentStep === navigationSteps.length - 1}
                  className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700"
                >
                  Next
                </button>
              </div>
            )}

            {useSimulation && (
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={() => simulatedGPS.resetSimulation()}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Reset
                </button>
                <button
                  onClick={() => {
                    if (simulatedGPS.isSimulating) {
                      simulatedGPS.stopSimulation();
                    } else {
                      simulatedGPS.startSimulation();
                    }
                  }}
                  className={`px-4 py-2 text-sm rounded-lg ${
                    simulatedGPS.isSimulating
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {simulatedGPS.isSimulating ? 'Pause' : 'Start'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Incidents and Alerts */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Traffic Alerts
              {trafficAlerts.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-600">
                  ({trafficAlerts.length} within 5km)
                </span>
              )}
            </h2>

            {/* Display traffic alerts from socket notifications */}
            {trafficAlerts.length > 0 ? (
              <div className="space-y-3">
                {trafficAlerts.map((alert) => {
                  // Calculate distance for display
                  const currentLat = currentPosition?.lat || latitude;
                  const currentLng = currentPosition?.lng || longitude;
                  let distanceText = '';

                  if (alert.coordinates && currentLat && currentLng) {
                    const distance = calculateDistance(
                      currentLat,
                      currentLng,
                      alert.coordinates.lat,
                      alert.coordinates.lng
                    );
                    distanceText = `${distance < 1 ? (distance * 1000).toFixed(0) + 'm' : distance.toFixed(1) + 'km'} away`;
                  }

                  return (
                    <div key={alert.id}>
                      {distanceText && (
                        <div className="text-xs text-gray-500 mb-1 flex items-center">
                          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1.5"></span>
                          {distanceText}
                        </div>
                      )}
                      <IncidentAlert
                        incident={alert}
                        onViewAlternative={() => handleRecalculate()}
                        onDismiss={() => {
                          setTrafficAlerts((prev) => prev.filter((a) => a.id !== alert.id));
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div>
                <div className="text-sm text-gray-500 mb-3 text-center">
                  No traffic alerts within 5km of your current position
                </div>
                <IncidentAlert
                  incident={defaultIncident}
                  onViewAlternative={() => handleRecalculate()}
                />
              </div>
            )}

            {/* Show nearby incidents count */}
            {incidents.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-blue-800">
                      {incidents.length} Nearby {incidents.length === 1 ? 'Incident' : 'Incidents'}
                    </h3>
                    <p className="text-sm text-blue-700">
                      Within 5km of your location
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      // Could open a modal or expand to show all incidents
                      console.log('View all incidents:', incidents);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View All
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>

            <div className="space-y-3">
              <button
                onClick={() => setShowReportModal(true)}
                className="w-full text-left p-3 rounded-lg border-2 border-red-200 bg-red-50 hover:bg-red-100 transition-colors duration-200"
              >
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div className="font-medium text-red-900">Report Traffic Incident</div>
                </div>
                <div className="text-sm text-red-700 mt-1">Alert other drivers about hazards</div>
              </button>

              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200">
                <div className="font-medium text-gray-900">Find Gas Stations</div>
                <div className="text-sm text-gray-600">Along your route</div>
              </button>

              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200">
                <div className="font-medium text-gray-900">Rest Areas</div>
                <div className="text-sm text-gray-600">Upcoming stops</div>
              </button>

              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200">
                <div className="font-medium text-gray-900">Share ETA</div>
                <div className="text-sm text-gray-600">Send to contacts</div>
              </button>
            </div>
          </div>

          {/* GPS Timeline */}
          {/* <GPSTimeline
            points={timelinePoints}
            currentLocation={currentPosition ? { lat: currentPosition.lat, lng: currentPosition.lng } : undefined}
            totalDistance={routeData?.total_distance || totalDistance || 18200}
            onPointClick={(point) => console.log('Timeline point clicked:', point)}
            showDetails={true}
          /> */}

          {/* Traffic Incidents List */}
          {/* {incidents.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Nearby Incidents ({incidents.length})
              </h2>
              <TrafficIncidentsList
                incidents={incidents}
                onVote={voteOnIncident}
                showVoting={true}
              />
            </div>
          )} */}
        </div>
      </div>

      {/* Traffic Report Modal */}
      <TrafficReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        initialLocation={latitude && longitude ? { lat: latitude, lng: longitude } : undefined}
        onReportSubmitted={(report) => {
          console.log('Report submitted:', report);
          refreshIncidents();
        }}
      />
    </div>
  );
}
