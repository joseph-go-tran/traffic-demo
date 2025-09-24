import React from 'react';
import { Map, Navigation, Zap } from 'lucide-react';

interface MapPlaceholderProps {
  isNavigating?: boolean;
  currentLocation?: string;
  destination?: string;
}

export default function MapPlaceholder({ isNavigating, currentLocation, destination }: MapPlaceholderProps) {
  return (
    <div className="w-full h-96 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="grid grid-cols-8 grid-rows-6 h-full w-full">
          {[...Array(48)].map((_, i) => (
            <div key={i} className="border border-purple-300/30"></div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="text-center z-10">
        <div className="bg-white p-6 rounded-xl shadow-lg max-w-sm">
          <div className="flex justify-center mb-4">
            {isNavigating ? (
              <div className="bg-purple-600 p-3 rounded-full">
                <Navigation className="h-8 w-8 text-white" />
              </div>
            ) : (
              <div className="bg-blue-600 p-3 rounded-full">
                <Map className="h-8 w-8 text-white" />
              </div>
            )}
          </div>

          <h3 className="font-semibold text-gray-900 mb-2">
            {isNavigating ? 'Live Navigation' : 'Interactive Map'}
          </h3>

          <p className="text-sm text-gray-600 mb-4">
            {isNavigating
              ? 'Real-time GPS navigation with traffic updates'
              : 'Plan your route with live traffic data'
            }
          </p>

          {currentLocation && destination && (
            <div className="space-y-2 text-left">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 min-w-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">{currentLocation}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 min-w-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-700">{destination}</span>
              </div>
            </div>
          )}

          {isNavigating && (
            <div className="flex items-center justify-center space-x-1 mt-3 text-purple-600">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">Live Updates</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
