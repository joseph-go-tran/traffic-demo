import { useEffect, useState } from 'react';
import { Map, Navigation, Zap, MapPin, Flag } from 'lucide-react';

interface MapPlaceholderProps {
  isNavigating?: boolean;
  currentLocation?: string;
  destination?: string;
  gpsPosition?: {
    lat: number;
    lng: number;
  };
  routePoints?: Array<{ lat: number; lng: number }>;
  completionPercentage?: number;
}

export default function MapPlaceholder({
  isNavigating,
  currentLocation,
  destination,
  gpsPosition,
  routePoints = [],
  completionPercentage = 0
}: MapPlaceholderProps) {
  const [pulseAnimation, setPulseAnimation] = useState(false);

  // Trigger pulse animation when position updates
  useEffect(() => {
    if (gpsPosition) {
      setPulseAnimation(true);
      const timer = setTimeout(() => setPulseAnimation(false), 300);
      return () => clearTimeout(timer);
    }
  }, [gpsPosition]);
  // Calculate position on the visual map
  const getVisualPosition = (lat: number, lng: number) => {
    // Simple scaling for visual representation
    const minLat = 37.76;
    const maxLat = 37.80;
    const minLng = -122.45;
    const maxLng = -122.38;

    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = 100 - ((lat - minLat) / (maxLat - minLat)) * 100;

    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  };

  return (
    <div className="w-full h-96 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg relative overflow-hidden shadow-lg">
      {/* Background Pattern - Road Grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="grid grid-cols-8 grid-rows-6 h-full w-full">
          {[...Array(48)].map((_, i) => (
            <div key={i} className="border border-purple-300/30"></div>
          ))}
        </div>
      </div>

      {/* Route Path Visualization */}
      {isNavigating && routePoints.length > 1 && (
        <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none">
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 0.8 }} />
              <stop offset={`${completionPercentage}%`} style={{ stopColor: '#10b981', stopOpacity: 0.8 }} />
              <stop offset={`${completionPercentage}%`} style={{ stopColor: '#6366f1', stopOpacity: 0.5 }} />
              <stop offset="100%" style={{ stopColor: '#6366f1', stopOpacity: 0.5 }} />
            </linearGradient>
          </defs>
          <polyline
            points={routePoints.map(p => {
              const pos = getVisualPosition(p.lat, p.lng);
              return `${pos.x}%,${pos.y}%`;
            }).join(' ')}
            fill="none"
            stroke="url(#routeGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {/* Start Point Marker */}
      {isNavigating && routePoints.length > 0 && (
        <div
          className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${getVisualPosition(routePoints[0].lat, routePoints[0].lng).x}%`,
            top: `${getVisualPosition(routePoints[0].lat, routePoints[0].lng).y}%`
          }}
        >
          <div className="relative">
            <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
            <div className="absolute inset-0 w-4 h-4 bg-green-500 rounded-full animate-ping opacity-75"></div>
          </div>
        </div>
      )}

      {/* Destination Marker */}
      {isNavigating && routePoints.length > 1 && (
        <div
          className="absolute z-20 transform -translate-x-1/2 -translate-y-full"
          style={{
            left: `${getVisualPosition(routePoints[routePoints.length - 1].lat, routePoints[routePoints.length - 1].lng).x}%`,
            top: `${getVisualPosition(routePoints[routePoints.length - 1].lat, routePoints[routePoints.length - 1].lng).y}%`
          }}
        >
          <Flag className="h-6 w-6 text-red-600 drop-shadow-lg" />
        </div>
      )}

      {/* Current GPS Position */}
      {isNavigating && gpsPosition && (
        <div
          className={`absolute z-30 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
            pulseAnimation ? 'scale-110' : 'scale-100'
          }`}
          style={{
            left: `${getVisualPosition(gpsPosition.lat, gpsPosition.lng).x}%`,
            top: `${getVisualPosition(gpsPosition.lat, gpsPosition.lng).y}%`
          }}
        >
          <div className="relative">
            <div className="w-6 h-6 bg-purple-600 rounded-full border-3 border-white shadow-xl flex items-center justify-center">
              <Navigation className="h-3 w-3 text-white" />
            </div>
            {/* Pulsing circle effect */}
            <div className="absolute inset-0 w-6 h-6 bg-purple-600 rounded-full animate-ping opacity-50"></div>
            {/* Direction indicator circle */}
            <div className="absolute -inset-2 w-10 h-10 border-2 border-purple-400 rounded-full opacity-30"></div>
          </div>
        </div>
      )}

      {/* Info Overlay */}
      <div className="absolute bottom-4 left-4 right-4 z-20">
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${isNavigating ? 'bg-purple-100' : 'bg-blue-100'}`}>
                {isNavigating ? (
                  <Navigation className="h-5 w-5 text-purple-600" />
                ) : (
                  <Map className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">
                  {isNavigating ? 'Live Navigation (Demo)' : 'Interactive Map'}
                </h3>
                {isNavigating && gpsPosition && (
                  <p className="text-xs text-gray-600">
                    {completionPercentage.toFixed(0)}% complete
                  </p>
                )}
              </div>
            </div>

            {isNavigating && (
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-purple-600 animate-pulse" />
                <span className="text-xs font-medium text-purple-600">Simulated GPS</span>
              </div>
            )}
          </div>

          {currentLocation && destination && (
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center space-x-2">
                <MapPin className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                <span className="text-xs text-gray-700 truncate">{currentLocation}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Flag className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                <span className="text-xs text-gray-700 truncate">{destination}</span>
              </div>
            </div>
          )}

          {gpsPosition && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="text-xs font-mono text-gray-500">
                {gpsPosition.lat.toFixed(6)}, {gpsPosition.lng.toFixed(6)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
