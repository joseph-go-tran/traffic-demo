import React, { useState, useEffect } from 'react';
import { X, MapPin, AlertTriangle, Construction, Car, Clock, Send, Navigation } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';
import LocationInput from './LocationInput';
import { apiService } from '../lib/api';
import PopupModal from './PopupModal';

interface TrafficReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLocation?: { lat: number; lng: number };
  onReportSubmitted?: (report: TrafficReport) => void;
}

interface TrafficReport {
  type: 'accident' | 'construction' | 'closure' | 'congestion' | 'weather' | 'hazard' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: { lat: number; lng: number };
  address: string;
  description: string;
  affected_lanes?: string;
  estimated_duration?: string;
}

export default function TrafficReportModal({
  isOpen,
  onClose,
  initialLocation,
  onReportSubmitted
}: TrafficReportModalProps) {
  const [report, setReport] = useState<TrafficReport>({
    type: 'accident',
    severity: 'medium',
    location: initialLocation || { lat: 0, lng: 0 },
    address: '',
    description: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(!initialLocation);

  // Popup modal states
  const [showPopup, setShowPopup] = useState(false);
  const [popupConfig, setPopupConfig] = useState({
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info'
  });

  // Get user's current location
  const { latitude, longitude, error: locationError } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000
  });

  useEffect(() => {
    if (useCurrentLocation && latitude && longitude) {
      setReport(prev => ({
        ...prev,
        location: { lat: latitude, lng: longitude }
      }));
    }
  }, [latitude, longitude, useCurrentLocation]);

  useEffect(() => {
    if (initialLocation) {
      setReport(prev => ({
        ...prev,
        location: initialLocation
      }));
      setUseCurrentLocation(false);
    }
  }, [initialLocation]);

  const incidentTypes = [
    { id: 'accident', label: 'Traffic Accident', icon: Car, color: 'text-red-600' },
    { id: 'construction', label: 'Construction Work', icon: Construction, color: 'text-orange-600' },
    { id: 'closure', label: 'Road Closure', icon: AlertTriangle, color: 'text-red-600' },
    { id: 'congestion', label: 'Heavy Traffic', icon: Clock, color: 'text-yellow-600' },
    { id: 'weather', label: 'Weather Conditions', icon: AlertTriangle, color: 'text-blue-600' },
    { id: 'hazard', label: 'Road Hazard', icon: AlertTriangle, color: 'text-orange-600' },
    { id: 'other', label: 'Other Issue', icon: AlertTriangle, color: 'text-gray-600' }
  ];

  const severityLevels = [
    { id: 'low', label: 'Minor', color: 'text-green-600 bg-green-100', description: 'Minor delay expected' },
    { id: 'medium', label: 'Moderate', color: 'text-yellow-600 bg-yellow-100', description: 'Some delays likely' },
    { id: 'high', label: 'Major', color: 'text-orange-600 bg-orange-100', description: 'Significant delays' },
    { id: 'critical', label: 'Critical', color: 'text-red-600 bg-red-100', description: 'Major disruption' }
  ];

  const handleLocationSelect = (address: string, coordinates?: { lat: number; lng: number }) => {
    setLocationInput(address);
    if (coordinates) {
      setReport(prev => ({
        ...prev,
        location: coordinates,
        address: address
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!report.description.trim() || (!report.location.lat && !report.location.lng)) {
      setPopupConfig({
        title: 'Missing Information',
        message: 'Please provide a description and location for the incident.',
        type: 'warning'
      });
      setShowPopup(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const reportData = {
        type: report.type,
        severity: report.severity,
        location: report.location,
        description: report.description,
        address: report.address || locationInput || 'User reported location',
        affected_lanes: report.affected_lanes,
        estimated_duration: report.estimated_duration
      };

      const response = await apiService.traffic.reportIncident(reportData);

      if (onReportSubmitted) {
        onReportSubmitted(response.data);
      }

      // Reset form and close modal
      setReport({
        type: 'accident',
        severity: 'medium',
        location: initialLocation || { lat: 0, lng: 0 },
        address: '',
        description: ''
      });
      setLocationInput('');

      // Show success message
      setPopupConfig({
        title: 'Report Submitted!',
        message: 'Traffic report submitted successfully! Thank you for helping other drivers.',
        type: 'success'
      });
      setShowPopup(true);
      onClose();

    } catch (error) {
      console.error('Error submitting traffic report:', error);
      setPopupConfig({
        title: 'Submission Failed',
        message: 'Failed to submit traffic report. Please try again.',
        type: 'error'
      });
      setShowPopup(true);
    } finally {
      setIsSubmitting(false);    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Report Traffic Incident</h2>
                <p className="text-sm text-gray-600">Help other drivers by reporting road conditions</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Incident Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What type of incident are you reporting?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {incidentTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setReport(prev => ({ ...prev, type: type.id as TrafficReport['type'] }))}
                      className={`p-3 rounded-lg border-2 flex items-center space-x-2 transition-colors ${
                        report.type === type.id
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${report.type === type.id ? 'text-purple-600' : type.color}`} />
                      <span className="text-sm font-medium">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                How severe is this incident?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {severityLevels.map((level) => (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => setReport(prev => ({ ...prev, severity: level.id as any }))}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      report.severity === level.id
                        ? `border-purple-500 ${level.color}`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{level.label}</div>
                    <div className="text-xs text-gray-600 mt-1">{level.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Where is this incident located?
              </label>

              <div className="space-y-3">
                <label className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    checked={useCurrentLocation}
                    onChange={(e) => {
                      setUseCurrentLocation(e.target.checked);
                      if (!e.target.checked) {
                        setLocationInput('');
                      }
                    }}
                    className="mr-2 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <Navigation className="h-4 w-4 mr-1 text-gray-600" />
                  <span className="text-sm text-gray-600">Use my current location</span>
                </label>

                {!useCurrentLocation && (
                  <LocationInput
                    label=""
                    value={locationInput}
                    onChange={handleLocationSelect}
                    placeholder="Search for address or location"
                    icon={<MapPin className="h-5 w-5 text-gray-400" />}
                  />
                )}

                {(useCurrentLocation && locationError) && (
                  <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    ⚠️ Location access denied. Please enter the address manually.
                  </p>
                )}

                {(report.location.lat !== 0 && report.location.lng !== 0) && (
                  <div className="text-sm text-gray-700 bg-green-50 p-3 rounded-md border border-green-200">
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-green-800">Location set:</p>
                        <p className="text-gray-700">
                          {report.address || `${report.location.lat.toFixed(4)}, ${report.location.lng.toFixed(4)}`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                value={report.description}
                onChange={(e) => setReport(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                required
                placeholder="Please provide details about the incident (e.g., number of vehicles involved, lanes blocked, visible damage, etc.)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="affectedLanes" className="block text-sm font-medium text-gray-700 mb-2">
                  Affected Lanes (optional)
                </label>
                <input
                  type="text"
                  id="affectedLanes"
                  value={report.affected_lanes || ''}
                  onChange={(e) => setReport(prev => ({ ...prev, affected_lanes: e.target.value }))}
                  placeholder="e.g., Left lane blocked, All lanes closed"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label htmlFor="estimatedDuration" className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Duration (optional)
                </label>
                <input
                  type="text"
                  id="estimatedDuration"
                  value={report.estimated_duration || ''}
                  onChange={(e) => setReport(prev => ({ ...prev, estimated_duration: e.target.value }))}
                  placeholder="e.g., 30 minutes, 1-2 hours"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !report.description.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Submit Report</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Popup Modal for alerts */}
      <PopupModal
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        title={popupConfig.title}
        message={popupConfig.message}
        type={popupConfig.type}
      />
    </div>
  );
}
