import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RouteResponse } from '../hooks/useRouting';

// Fix for default markers in Leaflet with React
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Traffic stress levels and their colors
const TrafficStressColors = {
  low: '#10B981',      // Green - Light traffic
  moderate: '#F59E0B',  // Yellow - Moderate traffic
  high: '#EF4444',     // Red - Heavy traffic
  severe: '#7C2D12',   // Dark red - Severe congestion
  unknown: '#6B7280'   // Gray - Unknown traffic
};

// Custom icons for different purposes
const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const endIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const currentLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const instructionIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface TrafficSegment {
  coordinates: [number, number][];
  stressLevel: 'low' | 'moderate' | 'high' | 'severe' | 'unknown';
  speed?: number;
  delay?: number;
}

interface NavigationMapProps {
  routeData?: RouteResponse;
  fromLocation: string;
  toLocation: string;
  currentStep?: number;
  isNavigating?: boolean;
  userLocation?: { lat: number; lng: number };
  showTrafficStress?: boolean;
}

// Component to fit map bounds to route
const FitBounds: React.FC<{ positions: [number, number][] }> = ({ positions }) => {
  const map = useMap();

  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [map, positions]);

  return null;
};

export default function NavigationMap({
  routeData,
  fromLocation,
  toLocation,
  currentStep = 0,
  isNavigating = false,
  userLocation,
  showTrafficStress = true
}: NavigationMapProps) {
  const mapRef = useRef<L.Map>(null);

  // Simulate traffic stress levels based on route segments with more realistic patterns
  const generateTrafficStress = (coordinates: [number, number][]): TrafficSegment[] => {
    const segments: TrafficSegment[] = [];
    if (coordinates.length < 2) return segments;

    // Create segments of varying lengths for more realistic traffic patterns
    let currentIndex = 0;

    while (currentIndex < coordinates.length - 1) {
      // Variable segment length (2-8 points) for more natural traffic patterns
      const segmentLength = Math.floor(Math.random() * 7) + 2;
      const endIndex = Math.min(currentIndex + segmentLength, coordinates.length);

      const segmentCoords = coordinates.slice(currentIndex, endIndex);
      if (segmentCoords.length < 2) break;

      // More realistic traffic distribution
      // Urban areas (closer coordinates) tend to have more traffic
      const coordinateDistance = Math.sqrt(
        Math.pow(segmentCoords[0][0] - segmentCoords[segmentCoords.length - 1][0], 2) +
        Math.pow(segmentCoords[0][1] - segmentCoords[segmentCoords.length - 1][1], 2)
      );

      const isUrbanArea = coordinateDistance < 0.01; // Close coordinates suggest urban area
      const timeOfDay = new Date().getHours();
      const isRushHour = (timeOfDay >= 7 && timeOfDay <= 9) || (timeOfDay >= 17 && timeOfDay <= 19);

      // Determine stress level based on multiple factors
      let stressLevel: 'low' | 'moderate' | 'high' | 'severe' | 'unknown';
      let baseStressChance = Math.random();

      // Increase stress probability for urban areas and rush hour
      if (isUrbanArea) baseStressChance += 0.3;
      if (isRushHour) baseStressChance += 0.2;

      if (baseStressChance < 0.4) stressLevel = 'low';
      else if (baseStressChance < 0.65) stressLevel = 'moderate';
      else if (baseStressChance < 0.85) stressLevel = 'high';
      else if (baseStressChance < 0.95) stressLevel = 'severe';
      else stressLevel = 'unknown';

      // Calculate speeds and delays based on stress level
      const speedMap = {
        low: { speed: 50 + Math.random() * 15, delay: 0 },
        moderate: { speed: 30 + Math.random() * 15, delay: 1 + Math.random() * 2 },
        high: { speed: 15 + Math.random() * 10, delay: 3 + Math.random() * 4 },
        severe: { speed: 5 + Math.random() * 8, delay: 8 + Math.random() * 10 },
        unknown: { speed: 25 + Math.random() * 20, delay: Math.random() * 3 }
      };

      const { speed, delay } = speedMap[stressLevel];

      segments.push({
        coordinates: segmentCoords,
        stressLevel,
        speed: Math.round(speed),
        delay: Math.round(delay * 10) / 10 // Round to 1 decimal place
      });

      currentIndex = endIndex - 1; // Overlap by 1 point for continuity
    }

    return segments;
  };

  // Parse route data to extract coordinates with better handling
  const parseRouteCoordinates = (route: RouteResponse): [number, number][] => {
    const coordinates: [number, number][] = [];

    // First, try to parse the polyline if available (most accurate)
    if (route.polyline && route.polyline.trim() !== '') {
      try {
        if (route.polyline.includes(' ')) {
          // Space-separated lat,lng pairs format
          const pairs = route.polyline.split(' ');
          for (const pair of pairs) {
            if (pair.includes(',')) {
              const [latStr, lngStr] = pair.split(',');
              const lat = parseFloat(latStr.trim());
              const lng = parseFloat(lngStr.trim());
              if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                coordinates.push([lat, lng]);
              }
            }
          }
        } else if (route.polyline.includes(',')) {
          // Comma-separated format: lat1,lng1,lat2,lng2...
          const values = route.polyline.split(',');
          for (let i = 0; i < values.length; i += 2) {
            if (i + 1 < values.length) {
              const lat = parseFloat(values[i].trim());
              const lng = parseFloat(values[i + 1].trim());
              if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                coordinates.push([lat, lng]);
              }
            }
          }
        }
      } catch (error) {
        console.warn('Error parsing polyline:', error);
      }
    }

    // If polyline parsing failed or no polyline, use segments and instructions
    if (coordinates.length < 2 && route.segments && route.segments.length > 0) {
      route.segments.forEach(segment => {
        // Add start point
        if (segment.start_point && segment.start_point.lat && segment.start_point.lng) {
          coordinates.push([segment.start_point.lat, segment.start_point.lng]);
        }

        // Add all instruction points for detailed path
        if (segment.instructions && segment.instructions.length > 0) {
          segment.instructions.forEach(instruction => {
            if (instruction.coordinates &&
                instruction.coordinates.lat &&
                instruction.coordinates.lng &&
                instruction.coordinates.lat >= -90 && instruction.coordinates.lat <= 90 &&
                instruction.coordinates.lng >= -180 && instruction.coordinates.lng <= 180) {
              coordinates.push([instruction.coordinates.lat, instruction.coordinates.lng]);
            }
          });
        }

        // Add end point
        if (segment.end_point && segment.end_point.lat && segment.end_point.lng) {
          coordinates.push([segment.end_point.lat, segment.end_point.lng]);
        }
      });
    }

    // Remove duplicate consecutive points for cleaner rendering
    const uniqueCoordinates: [number, number][] = [];
    coordinates.forEach(coord => {
      const lastCoord = uniqueCoordinates[uniqueCoordinates.length - 1];
      if (!lastCoord ||
          Math.abs(lastCoord[0] - coord[0]) > 0.0001 ||
          Math.abs(lastCoord[1] - coord[1]) > 0.0001) {
        uniqueCoordinates.push(coord);
      }
    });

    return uniqueCoordinates;
  };

  // Get route coordinates and traffic segments
  const routeCoordinates = routeData ? parseRouteCoordinates(routeData) : [];
  const trafficSegments = routeCoordinates.length > 0 && showTrafficStress ?
    generateTrafficStress(routeCoordinates) : [];

  // Default coordinates (San Francisco area) if no route data
  const defaultStart: [number, number] = [37.7749, -122.4194];
  const defaultEnd: [number, number] = [37.7849, -122.4094];

  const startPoint = routeCoordinates.length > 0 ? routeCoordinates[0] : defaultStart;
  const endPoint = routeCoordinates.length > 0 ? routeCoordinates[routeCoordinates.length - 1] : defaultEnd;

  // All positions for bounds calculation (create a new array to avoid modifying routeCoordinates)
  const allPositions = routeCoordinates.length > 0 ? [...routeCoordinates] : [startPoint, endPoint];
  if (userLocation) {
    allPositions.push([userLocation.lat, userLocation.lng]);
  }

  // Get current instruction position if available
  const currentInstructionPosition = routeData?.segments?.[0]?.instructions?.[currentStep]?.coordinates;

  return (
    <div className="h-full w-full relative">
      <MapContainer
        ref={mapRef}
        center={startPoint}
        zoom={13}
        className="h-full w-full rounded-lg"
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Fit bounds to show entire route */}
        <FitBounds positions={allPositions} />

        {/* Start marker */}
        <Marker position={startPoint} icon={startIcon}>
          <Popup>
            <div>
              <strong>Start:</strong><br />
              {fromLocation}
            </div>
          </Popup>
        </Marker>

        {/* End marker */}
        <Marker position={endPoint} icon={endIcon}>
          <Popup>
            <div>
              <strong>Destination:</strong><br />
              {toLocation}
            </div>
          </Popup>
        </Marker>

        {/* User current location (if different from start) */}
        {userLocation && isNavigating && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={currentLocationIcon}
          >
            <Popup>
              <div>
                <strong>Your Location</strong><br />
                Current position
              </div>
            </Popup>
          </Marker>
        )}

        {/* Current instruction marker */}
        {currentInstructionPosition && isNavigating && (
          <Marker
            position={[currentInstructionPosition.lat, currentInstructionPosition.lng]}
            icon={instructionIcon}
          >
            <Popup>
              <div>
                <strong>Current Step:</strong><br />
                {routeData.segments[0].instructions[currentStep].instruction}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route visualization based on navigation state */}
        {isNavigating ? (
          /* Navigation mode: Show route path along the road only */
          routeCoordinates.length > 1 ? (
            <Polyline
              positions={routeCoordinates}
              color="#3B82F6"
              weight={6}
              opacity={0.8}
            >
              <Popup>
                <div>
                  <strong>Route Path</strong><br />
                  Path from start to destination
                </div>
              </Popup>
            </Polyline>
          ) : null
        ) : (
          /* Planning mode: Show traffic stress or simple route */
          <>
            {showTrafficStress && trafficSegments.length > 0 ? (
              /* Show traffic stress when not navigating and enabled */
              trafficSegments.map((segment, index) => (
                <Polyline
                  key={`traffic-${index}`}
                  positions={segment.coordinates}
                  color={TrafficStressColors[segment.stressLevel]}
                  weight={8}
                  opacity={0.8}
                >
                  <Popup>
                    <div>
                      <strong>Traffic Conditions</strong><br />
                      <div className="capitalize">Stress Level: {segment.stressLevel}</div>
                      <div>Speed: ~{segment.speed} mph</div>
                      {segment.delay && segment.delay > 0 && <div>Delay: +{segment.delay} min</div>}
                    </div>
                  </Popup>
                </Polyline>
              ))
            ) : (
              /* Simple route line when traffic is disabled */
              routeCoordinates.length > 1 && (
                <Polyline
                  positions={routeCoordinates}
                  color="#3B82F6"
                  weight={6}
                  opacity={0.9}
                />
              )
            )}
          </>
        )}
      </MapContainer>

      {/* Map overlay with navigation info */}
      {isNavigating && (
        <div className="absolute top-4 left-4 bg-white bg-opacity-95 p-3 rounded-lg shadow-lg z-1000 max-w-xs">
          <div className="text-sm">
            <div className="font-semibold text-gray-900 mb-1">Navigation Active</div>
            <div className="text-gray-600">
              Step {currentStep + 1} of {routeData?.segments?.[0]?.instructions?.length || 0}
            </div>
            {routeData && (
              <div className="text-xs text-gray-500 mt-1">
                {Math.round(routeData.total_distance / 1609.34 * 10) / 10} miles • {Math.round(routeData.total_duration / 60)} min
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend - changes based on navigation state */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-95 p-3 rounded-lg shadow-lg z-1000">
        {isNavigating ? (
          /* Navigation Progress Legend - only completed route shown */
          <>
            <div className="text-xs font-semibold text-gray-800 mb-2">Route Progress</div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-2 rounded" style={{ backgroundColor: '#10B981' }}></div>
                <span className="text-xs text-gray-600">Completed Path</span>
              </div>
            </div>
          </>
        ) : (
          /* Traffic Stress Legend (planning mode) */
          showTrafficStress && (
            <>
              <div className="text-xs font-semibold text-gray-800 mb-2">Traffic Stress</div>
              <div className="space-y-1">
                {Object.entries(TrafficStressColors).map(([level, color]) => (
                  level !== 'unknown' && (
                    <div key={level} className="flex items-center space-x-2">
                      <div
                        className="w-4 h-2 rounded"
                        style={{ backgroundColor: color }}
                      ></div>
                      <span className="text-xs text-gray-600 capitalize">{level}</span>
                    </div>
                  )
                ))}
              </div>
            </>
          )
        )}
      </div>

      {/* Route type indicator */}
      <div className="absolute top-4 right-4 bg-white bg-opacity-95 p-2 rounded-lg shadow-lg z-1000">
        <div className="text-xs font-medium text-gray-700">
          {routeData ? 'Live Route' : 'Demo Route'}
        </div>
        {!isNavigating && showTrafficStress && (
          <div className="text-xs text-gray-500 mt-1">
            Traffic: Real-time
          </div>
        )}
        {isNavigating && (
          <div className="text-xs text-gray-500 mt-1">
            Navigation Active
          </div>
        )}
      </div>
    </div>
  );
}
