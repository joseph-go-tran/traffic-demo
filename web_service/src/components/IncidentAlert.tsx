import React from 'react';
import { AlertTriangle, Construction, X, MapPin, Clock } from 'lucide-react';

interface IncidentAlertProps {
  incident: {
    id: string;
    type: 'accident' | 'construction' | 'closure' | 'weather';
    location: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    estimatedDuration?: string;
    alternativeRoute?: string;
  };
  onDismiss?: () => void;
  onViewAlternative?: () => void;
}

export default function IncidentAlert({ incident, onDismiss, onViewAlternative }: IncidentAlertProps) {
  const getIncidentIcon = (type: string) => {
    switch (type) {
      case 'construction': return Construction;
      default: return AlertTriangle;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'border-l-yellow-500 bg-yellow-50';
      case 'medium': return 'border-l-orange-500 bg-orange-50';
      case 'high': return 'border-l-red-500 bg-red-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const Icon = getIncidentIcon(incident.type);

  return (
    <div className={`border-l-4 p-4 mb-4 rounded-r-lg ${getSeverityColor(incident.severity)}`}>
      <div className="flex justify-between items-start">
        <div className="flex space-x-3">
          <Icon className="h-5 w-5 text-orange-600 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h4 className="font-semibold text-gray-900 capitalize">{incident.type}</h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                incident.severity === 'high' ? 'bg-red-100 text-red-800' :
                incident.severity === 'medium' ? 'bg-orange-100 text-orange-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {incident.severity} priority
              </span>
            </div>

            {/* <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
              <MapPin className="h-4 w-4" />
              <span>{incident.location}</span>
            </div> */}

            <p className="text-sm text-gray-700 mb-3">{incident.description}</p>

            {incident.estimatedDuration && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                <Clock className="h-4 w-4" />
                <span>Expected duration: {incident.estimatedDuration}</span>
              </div>
            )}

            {incident.alternativeRoute && onViewAlternative && (
              <button
                onClick={onViewAlternative}
                className="bg-purple-600 text-white px-3 py-1 rounded-md text-sm hover:bg-purple-700 transition-colors duration-200"
              >
                View Alternative Route
              </button>
            )}
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
