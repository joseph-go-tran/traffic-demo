import React, { useState, useEffect } from 'react';
import { Navigation, Volume2, VolumeX, RotateCcw, Phone, ArrowLeft, ArrowRight, Home } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import NavigationMap from '../NavigationMap';
import IncidentAlert from '../IncidentAlert';

import { useGeolocation } from '../../hooks/useGeolocation';

interface NavigationPageProps {
  routeId?: string;
}

export default function NavigationPage({ routeId }: NavigationPageProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showTrafficStress, setShowTrafficStress] = useState(true);

  // Get user's current location
  const { latitude, longitude, error: locationError } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000
  });

  // Get route data from navigation state or use default
  const routeData = location.state?.route as RouteResponse | undefined;
  const fromLocation = location.state?.fromLocation || 'Current Location';
  const toLocation = location.state?.toLocation || 'Destination';
  const routeIdFromState = location.state?.routeId || routeId || '1';

  const [timeRemaining, setTimeRemaining] = useState(
    routeData?.total_duration || 27 * 60
  );

  // Extract navigation instructions from route data
  const navigationSteps = routeData?.segments?.[0]?.instructions?.map(
    instruction => instruction.instruction
  ) || [
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
    setCurrentStep(0);
  };

  const handleStopNavigation = () => {
    navigate('/routes');
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, navigationSteps.length - 1));
  };

  const previousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
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
              <p className="text-gray-600">Route #{routeIdFromState} - {routeData ? 'Live Route' : 'Demo Route'}</p>
              <p className="text-sm text-gray-500">{fromLocation} → {toLocation}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowTrafficStress(!showTrafficStress)}
              className={`p-3 rounded-lg transition-colors duration-200 ${
                showTrafficStress ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'
              }`}
              title="Toggle Traffic Stress View"
            >
              <Navigation className="h-5 w-5" />
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
            >
              <RotateCcw className="h-5 w-5" />
            </button>

            <button className="p-3 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors duration-200">
              <Phone className="h-5 w-5" />
            </button>

            <button
              onClick={handleStopNavigation}
              className="p-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors duration-200"
              title="Stop Navigation"
            >
              <Home className="h-5 w-5" />
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
            <div className="text-2xl font-bold text-blue-600">
              {routeData ? `${(routeData.total_distance / 1609.34).toFixed(1)} mi` : '18.2 mi'}
            </div>
            <div className="text-sm text-gray-600">Distance Left</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {new Date(Date.now() + timeRemaining * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
            <div className="text-sm text-gray-600">Arrival Time</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map and Navigation */}
        <div className="lg:col-span-2 space-y-6">
          <div className="h-96 rounded-lg overflow-hidden shadow-lg">
            <NavigationMap
              routeData={routeData}
              fromLocation={fromLocation}
              toLocation={toLocation}
              currentStep={currentStep}
              isNavigating={true}
              userLocation={latitude && longitude ? { lat: latitude, lng: longitude } : undefined}
              showTrafficStress={showTrafficStress}
            />
          </div>

          {/* Location permission alert */}
          {locationError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-yellow-800">
                  <strong>Location Access:</strong> {locationError}
                </div>
              </div>
              <div className="text-sm text-yellow-700 mt-1">
                Enable location access to see your position on the map and get accurate navigation.
              </div>
            </div>
          )}

          {/* Current Direction */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Current Direction</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={previousStep}
                  disabled={currentStep === 0}
                  className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-500">Step {currentStep + 1} of {navigationSteps.length}</span>
                <button
                  onClick={nextStep}
                  disabled={currentStep === navigationSteps.length - 1}
                  className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
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
        </div>
      </div>
    </div>
  );
}
