import React, { useState } from 'react';
import { Search, MapPin, Clock, Repeat } from 'lucide-react';
import MapPlaceholder from '../MapPlaceholder';
import RouteCard from '../RouteCard';

interface RoutePlanningPageProps {
  onNavigate: (routeId: string) => void;
}

export default function RoutePlanningPage({ onNavigate }: RoutePlanningPageProps) {
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

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

  const handleSearch = () => {
    // Simulate route search
    setSelectedRoute('1');
  };

  const handleSwapLocations = () => {
    const temp = fromLocation;
    setFromLocation(toLocation);
    setToLocation(temp);
  };

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
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                  <input
                    type="text"
                    value={fromLocation}
                    onChange={(e) => setFromLocation(e.target.value)}
                    placeholder="Enter starting location"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleSwapLocations}
                  className="p-2 text-gray-400 hover:text-purple-600 transition-colors duration-200"
                >
                  <Repeat className="h-5 w-5" />
                </button>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
                  <input
                    type="text"
                    value={toLocation}
                    onChange={(e) => setToLocation(e.target.value)}
                    placeholder="Enter destination"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                onClick={handleSearch}
                className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <Search className="h-5 w-5" />
                <span>Find Routes</span>
              </button>
            </div>
          </div>

          {/* Route Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-gray-700">
              <Clock className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Route Options</h2>
              <span className="text-sm text-gray-500">({mockRoutes.length} found)</span>
            </div>

            {mockRoutes.map((route) => (
              <RouteCard
                key={route.id}
                route={route}
                isSelected={selectedRoute === route.id}
                onSelect={() => setSelectedRoute(route.id)}
                onNavigate={() => onNavigate(route.id)}
              />
            ))}
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="space-y-6">
          <MapPlaceholder 
            currentLocation={fromLocation || 'Current Location'}
            destination={toLocation || 'Destination'}
          />
          
          {selectedRoute && (
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Route Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Distance:</span>
                  <span className="font-medium">24.5 miles</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Time:</span>
                  <span className="font-medium">32 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Traffic Condition:</span>
                  <span className="font-medium text-yellow-600">Moderate</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Incidents:</span>
                  <span className="font-medium">1 reported</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}