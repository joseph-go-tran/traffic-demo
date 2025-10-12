import { useState, useEffect } from 'react';
import { Navigation, Volume2, VolumeX, RotateCcw, Phone, AlertTriangle } from 'lucide-react';
import MapPlaceholder from '../MapPlaceholder';
import IncidentAlert from '../IncidentAlert';
import TrafficReportModal from '../TrafficReportModal';
import TrafficIncidentsList from '../TrafficIncidentsList';
import { useTrafficIncidents } from '../../hooks/useTrafficIncidents';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useNotifications } from '../../contexts/NotificationContext';

interface NavigationPageProps {
  routeId?: string;
}

export default function NavigationPage({ routeId }: NavigationPageProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(27 * 60); // 27 minutes in seconds
  const [showReportModal, setShowReportModal] = useState(false);

  // Connect to WebSocket for real-time navigation updates
  const { connect, disconnect, subscribe } = useNotifications();

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

  // Traffic incidents management
  const {
    incidents,
    voteOnIncident,
    refreshIncidents
  } = useTrafficIncidents({
    location: latitude && longitude ? { lat: latitude, lng: longitude } : undefined,
    radius: 15.0, // 15km radius
    autoRefresh: true,
    refreshInterval: 60000 // 1 minute
  });

  const navigationSteps = [
    'Head north on Main St toward Oak Ave',
    'Turn right onto Highway 101',
    'Continue straight for 15 miles',
    'Take exit 42A toward Downtown',
    'Turn left onto Business Blvd'
  ];

  const incident = {
    id: '1',
    type: 'accident' as const,
    location: 'Highway 101, Mile 23',
    description: 'Multi-vehicle accident blocking right lane. Emergency services on scene.',
    severity: 'high' as const,
    estimatedDuration: '45-60 minutes',
    alternativeRoute: 'Oak Street Bypass'
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
  };

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
            >
              <RotateCcw className="h-5 w-5" />
            </button>

            <button className="p-3 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors duration-200">
              <Phone className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Trip Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{formatTime(timeRemaining)}</div>
            <div className="text-sm text-gray-600">Time Remaining</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">18.2 mi</div>
            <div className="text-sm text-gray-600">Distance Left</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">3:45 PM</div>
            <div className="text-sm text-gray-600">Arrival Time</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map and Navigation */}
        <div className="lg:col-span-2 space-y-6">
          <MapPlaceholder
            isNavigating={true}
            currentLocation="Main Street"
            destination="Business District"
          />

          {/* Current Direction */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Current Direction</h2>
              <span className="text-sm text-gray-500">Step {currentStep + 1} of {navigationSteps.length}</span>
            </div>

            <div className="text-lg font-medium text-purple-600 mb-4">
              {navigationSteps[currentStep]}
            </div>

            <div className="space-y-2">
              <div className="text-sm text-gray-600">In 0.3 miles:</div>
              <div className="text-base text-gray-900">
                {navigationSteps[currentStep + 1] || 'Continue to destination'}
              </div>
            </div>

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
          </div>
        </div>

        {/* Incidents and Alerts */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Traffic Alerts</h2>

            <IncidentAlert
              incident={incident}
              onViewAlternative={() => handleRecalculate()}
            />

            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-medium text-yellow-800 mb-2">Construction Ahead</h3>
              <p className="text-sm text-yellow-700">
                Lane closure on Business Blvd starting tomorrow. Consider alternate routes.
              </p>
            </div>
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

          {/* Traffic Incidents List */}
          {incidents.length > 0 && (
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
          )}
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
