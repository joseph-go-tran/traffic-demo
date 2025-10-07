import React from 'react';
import { MapPin, Clock, ThumbsUp, ThumbsDown, AlertTriangle } from 'lucide-react';
import { TrafficIncident, getIncidentIcon, getSeverityColor, formatTimeAgo } from '../hooks/useTrafficIncidents';

interface TrafficIncidentsListProps {
  incidents: TrafficIncident[];
  onVote?: (incidentId: string, voteType: 'confirm' | 'dispute') => void;
  onUpdateStatus?: (incidentId: string, status: 'active' | 'resolved' | 'verified' | 'disputed') => void;
  showVoting?: boolean;
  maxItems?: number;
}

export default function TrafficIncidentsList({
  incidents,
  onVote,
  onUpdateStatus,
  showVoting = true,
  maxItems
}: TrafficIncidentsListProps) {
  const displayIncidents = maxItems ? incidents.slice(0, maxItems) : incidents;

  if (displayIncidents.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No traffic incidents reported in this area</p>
        <p className="text-sm text-gray-500 mt-1">Be the first to report road conditions!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayIncidents.map((incident) => {
        const severityColors = getSeverityColor(incident.severity);
        const incidentIcon = getIncidentIcon(incident.type);

        return (
          <div
            key={incident.id}
            className={`border-l-4 p-4 rounded-r-lg bg-white shadow-sm ${severityColors.border}`}
          >
            <div className="flex justify-between items-start">
              <div className="flex space-x-3 flex-1">
                <div className="text-2xl">{incidentIcon}</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-semibold text-gray-900 capitalize">{incident.type.replace('_', ' ')}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityColors.bg} ${severityColors.text}`}>
                      {incident.severity}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      incident.status === 'active' ? 'bg-green-100 text-green-800' :
                      incident.status === 'resolved' ? 'bg-blue-100 text-blue-800' :
                      incident.status === 'verified' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {incident.status}
                    </span>
                  </div>

                  {incident.address && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                      <MapPin className="h-4 w-4" />
                      <span>{incident.address}</span>
                    </div>
                  )}

                  <p className="text-sm text-gray-700 mb-2">{incident.description}</p>

                  {incident.affected_lanes && (
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Affected:</strong> {incident.affected_lanes}
                    </p>
                  )}

                  {incident.estimated_duration && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                      <Clock className="h-4 w-4" />
                      <span>Duration: {incident.estimated_duration}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    <div className="text-xs text-gray-500">
                      Reported {formatTimeAgo(incident.created_at)}
                      {incident.reported_by && ` by ${incident.reported_by}`}
                    </div>

                    {showVoting && onVote && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onVote(incident.id, 'confirm')}
                          className="flex items-center space-x-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                        >
                          <ThumbsUp className="h-3 w-3" />
                          <span>{incident.votes_confirm}</span>
                        </button>

                        <button
                          onClick={() => onVote(incident.id, 'dispute')}
                          className="flex items-center space-x-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        >
                          <ThumbsDown className="h-3 w-3" />
                          <span>{incident.votes_dispute}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {onUpdateStatus && incident.status === 'active' && (
                    <div className="mt-2 flex space-x-2">
                      <button
                        onClick={() => onUpdateStatus(incident.id, 'resolved')}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        Mark Resolved
                      </button>
                      <button
                        onClick={() => onUpdateStatus(incident.id, 'verified')}
                        className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                      >
                        Verify
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {maxItems && incidents.length > maxItems && (
        <div className="text-center py-2">
          <p className="text-sm text-gray-500">
            Showing {maxItems} of {incidents.length} incidents
          </p>
        </div>
      )}
    </div>
  );
}
