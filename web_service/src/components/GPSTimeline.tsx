import { useState, useEffect } from 'react';
import { MapPin, Clock, Navigation2, Flag, CheckCircle2, Circle } from 'lucide-react';

export interface GPSTimelinePoint {
  id: string;
  timestamp: Date;
  coordinates: {
    lat: number;
    lng: number;
  };
  address?: string;
  type: 'start' | 'waypoint' | 'current' | 'destination';
  status: 'completed' | 'active' | 'upcoming';
  distance?: number; // Distance from start in meters
  speed?: number; // Speed in km/h
  eta?: Date; // Estimated time of arrival
}

interface GPSTimelineProps {
  points: GPSTimelinePoint[];
  currentLocation?: { lat: number; lng: number };
  totalDistance?: number;
  onPointClick?: (point: GPSTimelinePoint) => void;
  showDetails?: boolean;
}

export default function GPSTimeline({
  points,
  currentLocation,
  totalDistance = 0,
  onPointClick,
  showDetails = true
}: GPSTimelineProps) {
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);
  const [animateProgress, setAnimateProgress] = useState(false);

  useEffect(() => {
    setAnimateProgress(true);
    const timer = setTimeout(() => setAnimateProgress(false), 500);
    return () => clearTimeout(timer);
  }, [currentLocation]);

  const getProgressPercentage = () => {
    const completedPoints = points.filter(p => p.status === 'completed');
    if (completedPoints.length === 0) return 0;

    const currentPoint = points.find(p => p.status === 'active');
    if (!currentPoint || !currentPoint.distance) return 0;

    return totalDistance > 0 ? (currentPoint.distance / totalDistance) * 100 : 0;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const getPointIcon = (point: GPSTimelinePoint) => {
    switch (point.type) {
      case 'start':
        return <MapPin className="h-5 w-5" />;
      case 'current':
        return <Navigation2 className="h-5 w-5" />;
      case 'destination':
        return <Flag className="h-5 w-5" />;
      case 'waypoint':
        return point.status === 'completed'
          ? <CheckCircle2 className="h-5 w-5" />
          : <Circle className="h-5 w-5" />;
      default:
        return <MapPin className="h-5 w-5" />;
    }
  };

  const getPointColor = (point: GPSTimelinePoint) => {
    if (point.status === 'completed') {
      return 'bg-green-500 text-white border-green-500';
    }
    if (point.status === 'active') {
      return 'bg-purple-500 text-white border-purple-500 ring-4 ring-purple-200 animate-pulse';
    }
    return 'bg-gray-200 text-gray-500 border-gray-300';
  };

  const getLineColor = (index: number) => {
    const point = points[index];
    if (point.status === 'completed') {
      return 'bg-green-500';
    }
    if (point.status === 'active') {
      return 'bg-gradient-to-b from-green-500 to-purple-500';
    }
    return 'bg-gray-300';
  };

  const handlePointClick = (point: GPSTimelinePoint) => {
    setSelectedPoint(selectedPoint === point.id ? null : point.id);
    onPointClick?.(point);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="h-5 w-5 text-purple-600" />
          GPS Timeline
        </h2>
        {totalDistance > 0 && (
          <span className="text-sm font-medium text-gray-600">
            {formatDistance(totalDistance)} total
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{Math.round(getProgressPercentage())}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r from-green-500 to-purple-500 rounded-full transition-all duration-500 ${
              animateProgress ? 'scale-105' : ''
            }`}
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {points.map((point, index) => (
          <div key={point.id} className="relative">
            {/* Connection Line */}
            {index < points.length - 1 && (
              <div className="absolute left-6 top-12 w-0.5 h-16 z-0">
                <div className={`h-full ${getLineColor(index)} transition-all duration-300`} />
              </div>
            )}

            {/* Timeline Point */}
            <div
              onClick={() => handlePointClick(point)}
              className={`relative flex items-start gap-4 mb-4 cursor-pointer transition-all duration-200 ${
                selectedPoint === point.id ? 'scale-[1.02]' : ''
              }`}
            >
              {/* Icon */}
              <div
                className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center z-10 transition-all duration-300 ${getPointColor(
                  point
                )}`}
              >
                {getPointIcon(point)}
              </div>

              {/* Content */}
              <div className={`flex-1 pt-1 transition-all duration-200 ${
                selectedPoint === point.id ? 'bg-gray-50 -ml-2 pl-2 pr-4 py-2 rounded-lg' : ''
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-semibold ${
                        point.status === 'active' ? 'text-purple-600' : 'text-gray-900'
                      }`}>
                        {point.type === 'start' && 'Starting Point'}
                        {point.type === 'destination' && 'Destination'}
                        {point.type === 'current' && 'Current Location'}
                        {point.type === 'waypoint' && `Waypoint ${index}`}
                      </span>
                      {point.status === 'active' && (
                        <span className="px-2 py-0.5 text-xs font-medium text-purple-600 bg-purple-100 rounded-full">
                          Active
                        </span>
                      )}
                    </div>

                    {point.address && (
                      <p className="text-sm text-gray-600 mb-1">{point.address}</p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(point.timestamp)}
                      </span>
                      {point.distance !== undefined && (
                        <span>{formatDistance(point.distance)}</span>
                      )}
                      {point.speed !== undefined && (
                        <span>{Math.round(point.speed)} km/h</span>
                      )}
                    </div>

                    {/* Expanded Details */}
                    {showDetails && selectedPoint === point.id && (
                      <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Coordinates:</span>
                            <div className="font-mono text-xs text-gray-700">
                              {point.coordinates.lat.toFixed(6)}, {point.coordinates.lng.toFixed(6)}
                            </div>
                          </div>
                          {point.eta && (
                            <div>
                              <span className="text-gray-500">ETA:</span>
                              <div className="font-medium text-gray-700">
                                {formatTime(point.eta)}
                              </div>
                            </div>
                          )}
                        </div>
                        {point.status === 'upcoming' && (
                          <button className="text-xs text-purple-600 hover:text-purple-700 font-medium">
                            View on map →
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {point.eta && point.status === 'upcoming' && (
                    <div className="text-right ml-4">
                      <div className="text-xs text-gray-500">ETA</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {formatTime(point.eta)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      {points.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {points.filter(p => p.status === 'completed').length}
              </div>
              <div className="text-xs text-gray-600">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {points.filter(p => p.status === 'active').length}
              </div>
              <div className="text-xs text-gray-600">Active</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">
                {points.filter(p => p.status === 'upcoming').length}
              </div>
              <div className="text-xs text-gray-600">Upcoming</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
