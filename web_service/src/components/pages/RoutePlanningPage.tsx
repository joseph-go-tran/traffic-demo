import React, { useState, useEffect } from 'react';
import { Search, MapPin, Clock, Repeat } from 'lucide-react';
import NavigationMap from '../NavigationMap';
import RouteCard from '../RouteCard';
import LocationInput from '../LocationInput';
import { useCalculateEnhancedRoute, RouteRequest, Coordinates } from '../../hooks/useRouting';
import { useNotifications } from '../../contexts/NotificationContext';

interface RoutePlanningPageProps {
  onNavigate?: (routeId: string, routeData?: any) => void;
}

export default function RoutePlanningPage({ onNavigate }: RoutePlanningPageProps) {
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [fromCoordinates, setFromCoordinates] = useState<Coordinates | null>(null);
  const [toCoordinates, setToCoordinates] = useState<Coordinates | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [routes, setRoutes] = useState<any[]>([]);

  const calculateRouteMutation = useCalculateEnhancedRoute();

  // Connect to WebSocket for real-time route updates
  const { connect, disconnect, isConnected, subscribe } = useNotifications();

  // Connect WebSocket when route planning page loads
  useEffect(() => {
    console.log('Route planning started - connecting to notification service');
    connect();

    // Use a timeout to subscribe after connection is established
    const subscribeTimer = setTimeout(() => {
      subscribe(undefined, ['traffic-alerts', 'route-updates']);
    }, 500);

    // Cleanup: disconnect when leaving route planning page
    return () => {
      clearTimeout(subscribeTimer);
      console.log('Route planning ended - disconnecting from notification service');
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount/unmount

  const mockRoutes = [
    {
      id: '1',
      name: 'Fastest Route',
      distance: '24.5 miles',
      duration: '32 min',
      delay: '5 min',
      incidents: 1,
      traffic: 'moderate' as const
    },
    {
      id: '2',
      name: 'Scenic Route',
      distance: '28.1 miles',
      duration: '38 min',
      incidents: 0,
      traffic: 'light' as const
    },
    {
      id: '3',
      name: 'Highway Route',
      distance: '22.8 miles',
      duration: '45 min',
      delay: '12 min',
      incidents: 3,
      traffic: 'heavy' as const
    }
  ];

  const handleSearch = async () => {
    if (!fromCoordinates || !toCoordinates) {
      alert('Please select both origin and destination locations');
      return;
    }

    const baseRouteRequest: RouteRequest = {
      origin: fromCoordinates,
      destination: toCoordinates,
      options: {
        vehicle_type: 'car'
      }
    };

    try {
      // Calculate multiple route types in parallel for better comparison
      const [fastestResult, shortestResult, ecoResult] = await Promise.allSettled([
        calculateRouteMutation.mutateAsync({
          ...baseRouteRequest,
          options: { ...baseRouteRequest.options, route_type: 'fastest' }
        }),
        calculateRouteMutation.mutateAsync({
          ...baseRouteRequest,
          options: { ...baseRouteRequest.options, route_type: 'shortest' }
        }),
        calculateRouteMutation.mutateAsync({
          ...baseRouteRequest,
          options: { ...baseRouteRequest.options, route_type: 'eco' }
        })
      ]);

      const newRoutes = [];

      // Process fastest route
      if (fastestResult.status === 'fulfilled') {
        const routeData = fastestResult.value.data;
        newRoutes.push({
          id: routeData.route_id,
          name: 'Fastest Route',
          distance: `${(routeData.total_distance / 1609.34).toFixed(1)} miles`,
          duration: `${Math.round(routeData.total_duration / 60)} min`,
          delay: '0 min',
          incidents: 0,
          traffic: 'light' as const,
          data: routeData
        });
      }

      // Process shortest route
      if (shortestResult.status === 'fulfilled') {
        const routeData = shortestResult.value.data;
        newRoutes.push({
          id: routeData.route_id,
          name: 'Shortest Route',
          distance: `${(routeData.total_distance / 1609.34).toFixed(1)} miles`,
          duration: `${Math.round(routeData.total_duration / 60)} min`,
          delay: '1 min',
          incidents: 1,
          traffic: 'moderate' as const,
          data: routeData
        });
      }

      // Process eco route
      if (ecoResult.status === 'fulfilled') {
        const routeData = ecoResult.value.data;
        newRoutes.push({
          id: routeData.route_id,
          name: 'Eco Route',
          distance: `${(routeData.total_distance / 1609.34).toFixed(1)} miles`,
          duration: `${Math.round(routeData.total_duration / 60)} min`,
          delay: '0 min',
          incidents: 0,
          traffic: 'light' as const,
          data: routeData
        });
      }

      // If no routes were calculated successfully, fall back to mock data
      if (newRoutes.length === 0) {
        console.warn('No routes calculated successfully, using mock data');
        setRoutes([]);
      } else {
        setRoutes(newRoutes);
        setSelectedRoute(newRoutes[0].id);
      }

    } catch (error) {
      console.error('Route calculation failed:', error);
      alert('Failed to calculate route. Please try again.');
    }
  };

  const handleSwapLocations = () => {
    const tempLocation = fromLocation;
    const tempCoordinates = fromCoordinates;
    setFromLocation(toLocation);
    setFromCoordinates(toCoordinates);
    setToLocation(tempLocation);
    setToCoordinates(tempCoordinates);
  };

  const handleFromLocationChange = (value: string, coordinates?: Coordinates) => {
    setFromLocation(value);
    setFromCoordinates(coordinates || null);
  };

  const handleToLocationChange = (value: string, coordinates?: Coordinates) => {
    setToLocation(value);
    setToCoordinates(coordinates || null);
  };

  const handleNavigateToRoute = (routeId: string) => {
    const route = displayRoutes.find(r => r.id === routeId);
    if (route && onNavigate) {
      onNavigate(routeId, {
        data: route.data || route,
        fromLocation,
        toLocation
      });
    }
  };

  // Use real routes data or fallback to mock data
  const displayRoutes = routes.length > 0 ? routes : mockRoutes;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Plan Your Route</h1>
        <p className="text-gray-600">Get real-time route options with traffic conditions and incident alerts.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Panel - Route Search */}
        <div className="space-y-6">
          {/* Search Form */}
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <div className="space-y-4">
              <LocationInput
                label="From"
                value={fromLocation}
                onChange={handleFromLocationChange}
                placeholder="Enter starting location"
                icon={<MapPin className="h-5 w-5 text-green-500" />}
              />

              <div className="flex justify-center">
                <button
                  onClick={handleSwapLocations}
                  className="p-2 text-gray-400 hover:text-purple-600 transition-colors duration-200"
                >
                  <Repeat className="h-5 w-5" />
                </button>
              </div>

              <LocationInput
                label="To"
                value={toLocation}
                onChange={handleToLocationChange}
                placeholder="Enter destination"
                icon={<MapPin className="h-5 w-5 text-red-500" />}
              />

              <button
                onClick={handleSearch}
                disabled={calculateRouteMutation.isPending || !fromCoordinates || !toCoordinates}
                className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Search className="h-5 w-5" />
                <span>
                  {calculateRouteMutation.isPending ? 'Calculating...' : 'Find Routes'}
                </span>
              </button>
            </div>
          </div>

          {/* Route Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-gray-700">
              <Clock className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Route Options</h2>
              <span className="text-sm text-gray-500">({displayRoutes.length} found)</span>
            </div>

            {calculateRouteMutation.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-600 text-sm">
                  Failed to calculate route. Please check your locations and try again.
                </p>
              </div>
            )}

            {displayRoutes.map((route) => (
              <RouteCard
                key={route.id}
                route={route}
                isSelected={selectedRoute === route.id}
                onSelect={() => setSelectedRoute(route.id)}
                onNavigate={() => handleNavigateToRoute(route.id)}
              />
            ))}
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="space-y-6">
          <div className="h-96 rounded-lg overflow-hidden shadow-lg">
            <NavigationMap
              routeData={selectedRoute ? displayRoutes.find(r => r.id === selectedRoute)?.data : undefined}
              fromLocation={fromLocation}
              toLocation={toLocation}
              isNavigating={false}
              showTrafficStress={true}
            />
          </div>

          {selectedRoute && (
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Route Summary</h3>
              <div className="space-y-3">
                {(() => {
                  const route = displayRoutes.find(r => r.id === selectedRoute);
                  const routeData = route?.data;

                  return (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Distance:</span>
                        <span className="font-medium">{route?.distance || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Estimated Time:</span>
                        <span className="font-medium">{route?.duration || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Traffic Condition:</span>
                        <span className={`font-medium ${
                          route?.traffic === 'light' ? 'text-green-600' :
                          route?.traffic === 'moderate' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {route?.traffic ? route.traffic.charAt(0).toUpperCase() + route.traffic.slice(1) : 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Incidents:</span>
                        <span className="font-medium">{route?.incidents || 0} reported</span>
                      </div>
                      {routeData && (
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Route ID:</span>
                            <span className="font-mono text-xs">{routeData.route_id}</span>
                          </div>
                          <div className="flex justify-between text-sm mt-1">
                            <span className="text-gray-600">Segments:</span>
                            <span>{routeData.segments?.length || 0}</span>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
