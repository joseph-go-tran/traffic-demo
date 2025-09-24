import React from 'react';
import { Clock, MapPin, AlertTriangle, Navigation } from 'lucide-react';

interface RouteCardProps {
  route: {
    id: string;
    name: string;
    distance: string;
    duration: string;
    delay?: string;
    incidents: number;
    traffic: 'light' | 'moderate' | 'heavy';
    data?: any; // Additional route data from API
  };
  isSelected?: boolean;
  onSelect: () => void;
  onNavigate: () => void;
}

export default function RouteCard({ route, isSelected, onSelect, onNavigate }: RouteCardProps) {
  const getTrafficColor = (traffic: string) => {
    switch (traffic) {
      case 'light': return 'text-green-600 bg-green-50';
      case 'moderate': return 'text-yellow-600 bg-yellow-50';
      case 'heavy': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected
          ? 'border-purple-600 bg-purple-50'
          : 'border-gray-200 bg-white hover:border-purple-300'
      }`}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-gray-900 text-lg">{route.name}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTrafficColor(route.traffic)}`}>
          {route.traffic} traffic
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2 text-gray-600">
          <MapPin className="h-4 w-4" />
          <span className="text-sm">{route.distance}</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-600">
          <Clock className="h-4 w-4" />
          <span className="text-sm">
            {route.duration}
            {route.delay && <span className="text-red-600 ml-1">({route.delay} delay)</span>}
          </span>
        </div>
      </div>

      {route.incidents > 0 && (
        <div className="flex items-center space-x-2 text-orange-600 mb-3">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">{route.incidents} incident{route.incidents > 1 ? 's' : ''} reported</span>
        </div>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          onNavigate();
        }}
        className={`w-full py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 font-medium ${
          isSelected
            ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg'
            : 'bg-gray-100 text-gray-700 hover:bg-purple-600 hover:text-white'
        }`}
      >
        <Navigation className="h-4 w-4" />
        <span>Start Navigation</span>
      </button>
    </div>
  );
}
