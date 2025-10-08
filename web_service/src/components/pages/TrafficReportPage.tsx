import { useState } from 'react';
import { AlertTriangle, MapPin, TrendingUp, Clock, CheckCircle, XCircle, Search } from 'lucide-react';
import TrafficReportModal from '../TrafficReportModal';
import TrafficIncidentsList from '../TrafficIncidentsList';
import { useTrafficIncidents } from '../../hooks/useTrafficIncidents';
import { apiService } from '../../lib/api';

export default function TrafficReportPage() {
  const [showReportModal, setShowReportModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'severity' | 'distance'>('recent');

  // Location search state
  const [locationInput, setLocationInput] = useState('');
  const [searchedLocation, setSearchedLocation] = useState<{
    name: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Traffic incidents management
  const {
    incidents,
    loading,
    error,
    voteOnIncident,
    updateIncidentStatus,
    refreshIncidents
  } = useTrafficIncidents({
    location: searchedLocation ? { lat: searchedLocation.lat, lng: searchedLocation.lng } : undefined,
    radius: 25.0, // 25km radius for report page
    autoRefresh: true,
    refreshInterval: 60000 // 1 minute
  });

  // Filter and sort incidents
  const filteredIncidents = incidents.filter(incident => {
    if (filter === 'all') return true;
    return incident.status === filter;
  });

  const sortedIncidents = [...filteredIncidents].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else if (sortBy === 'severity') {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    }
    // distance sorting would require calculating distance from user location
    return 0;
  });  const handleLocationSearch = async () => {
    if (!locationInput.trim()) {
      setSearchError('Please enter a location or area');
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      // STEP 1: Search and geocode the location
      console.log('🔍 Searching for location:', locationInput);

      const locationResponse = await apiService.routes.searchLocation(locationInput);

      // Validate location response - routing service returns { results: [...] }
      if (!locationResponse.data || !locationResponse.data.results || locationResponse.data.results.length === 0) {
        setSearchError('Location not found. Please try a different search.');
        setSearchedLocation(null);
        return;
      }

      // Get the best result (first one)
      const firstResult = locationResponse.data.results[0];
      const location = {
        name: firstResult.name || firstResult.address || locationInput,
        lat: firstResult.coordinates.lat,
        lng: firstResult.coordinates.lng
      };

      console.log('✅ Location found:', location);

      // STEP 2: Set location state (this will trigger useTrafficIncidents hook)
      setSearchedLocation(location);

      // STEP 3: Immediately fetch incidents for this location
      console.log('📍 Fetching incidents for location...');

      try {
        const incidentsResponse = await apiService.traffic.getTrafficIncidents({
          lat: location.lat,
          lng: location.lng,
          radius: 25.0,
          limit: 100
        });

        console.log('✅ Incidents fetched:', incidentsResponse.data);

        // Trigger hook refresh to ensure latest data
        await refreshIncidents();

      } catch (incidentsError) {
        console.warn('⚠️ Could not fetch incidents immediately, will use hook:', incidentsError);
        // The hook will still fetch incidents, so this is not critical
      }

      setSearchError(null);

    } catch (error: unknown) {
      console.error('❌ Error searching location:', error);

      // Detailed error handling
      const err = error as { response?: { status: number; data?: { message?: string } }; request?: unknown };
      if (err.response) {
        const status = err.response.status;
        if (status === 404) {
          setSearchError('Location service not found. Please check if the routing service is running.');
        } else if (status === 500) {
          setSearchError('Server error. Please try again later.');
        } else {
          setSearchError(`Error ${status}: ${err.response.data?.message || 'Please try again.'}`);
        }
      } else if (err.request) {
        setSearchError('Cannot connect to server. Please check your internet connection.');
      } else {
        setSearchError('Failed to search location. Please try again.');
      }

      setSearchedLocation(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearLocation = () => {
    setLocationInput('');
    setSearchedLocation(null);
    setSearchError(null);
  };

  const handleReportSubmitted = (report: unknown) => {
    console.log('New report submitted:', report);
    refreshIncidents();
    setShowReportModal(false);
  };

  // Statistics
  const stats = {
    total: incidents.length,
    active: incidents.filter(i => i.status === 'active').length,
    resolved: incidents.filter(i => i.status === 'resolved').length,
    critical: incidents.filter(i => i.severity === 'critical').length
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Traffic Reports</h1>
            <p className="text-gray-600">
              Report traffic incidents and view real-time updates from the community
            </p>
          </div>
          <button
            onClick={() => setShowReportModal(true)}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700
                     transition-colors flex items-center space-x-2 shadow-lg"
          >
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Report Incident</span>
          </button>
        </div>

        {/* Location Search */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Location or Area
          </label>
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
                placeholder="Enter city, address, or area (e.g., New York, Manhattan, Times Square)"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2
                         focus:ring-purple-600 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleLocationSearch}
              disabled={isSearching || !locationInput.trim()}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700
                       transition-colors flex items-center space-x-2 disabled:opacity-50
                       disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>Search</span>
                </>
              )}
            </button>
            {searchedLocation && (
              <button
                onClick={handleClearLocation}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200
                         transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Search Error */}
          {searchError && (
            <div className="mt-2 flex items-center space-x-2 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span>{searchError}</span>
            </div>
          )}

          {/* Current Location Display */}
          {searchedLocation && (
            <div className="mt-3 flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-4 py-2 rounded-lg">
              <MapPin className="h-4 w-4" />
              <span>
                Showing incidents within 25km of <strong>{searchedLocation.name}</strong>
                ({searchedLocation.lat.toFixed(4)}, {searchedLocation.lng.toFixed(4)})
              </span>
            </div>
          )}

          {!searchedLocation && !searchError && (
            <div className="mt-2 text-sm text-gray-500">
              💡 Tip: Enter a location to view incidents in that area, or leave blank to see all incidents.
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Reports</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Incidents</p>
              <p className="text-3xl font-bold text-orange-600">{stats.active}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Resolved</p>
              <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Critical</p>
              <p className="text-3xl font-bold text-red-600">{stats.critical}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Filters */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({incidents.length})
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'active'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Active ({stats.active})
              </button>
              <button
                onClick={() => setFilter('resolved')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'resolved'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Resolved ({stats.resolved})
              </button>
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'severity' | 'distance')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none
                       focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              <option value="recent">Most Recent</option>
              <option value="severity">Severity</option>
              <option value="distance">Distance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Incidents List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {filter === 'all' && 'All Incidents'}
            {filter === 'active' && 'Active Incidents'}
            {filter === 'resolved' && 'Resolved Incidents'}
            <span className="text-gray-500 ml-2">({sortedIncidents.length})</span>
          </h2>
          <button
            onClick={refreshIncidents}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 text-gray-700
                     rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <Clock className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {loading && incidents.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading incidents...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <p className="text-red-600 font-medium">Error loading incidents</p>
            <p className="text-sm text-gray-600 mt-2">{error}</p>
            <button
              onClick={refreshIncidents}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        ) : sortedIncidents.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No incidents found</p>
            <p className="text-sm text-gray-500 mt-2">
              {filter === 'active' && 'No active incidents in your area'}
              {filter === 'resolved' && 'No resolved incidents to show'}
              {filter === 'all' && 'Be the first to report road conditions!'}
            </p>
            <button
              onClick={() => setShowReportModal(true)}
              className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Report First Incident
            </button>
          </div>
        ) : (
          <TrafficIncidentsList
            incidents={sortedIncidents}
            onVote={voteOnIncident}
            onUpdateStatus={updateIncidentStatus}
            showVoting={true}
          />
        )}
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">How to Report Traffic Incidents</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">📍 Step 1: Location</h4>
            <p>Your location is automatically detected, or you can enter it manually.</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">🚨 Step 2: Incident Type</h4>
            <p>Select the type: accident, construction, closure, congestion, etc.</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">⚠️ Step 3: Severity</h4>
            <p>Choose the severity level from low to critical based on impact.</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">✍️ Step 4: Description</h4>
            <p>Provide details to help other drivers understand the situation.</p>
          </div>
        </div>
      </div>

      {/* Traffic Report Modal */}
      <TrafficReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        initialLocation={searchedLocation ? { lat: searchedLocation.lat, lng: searchedLocation.lng } : undefined}
        onReportSubmitted={handleReportSubmitted}
      />
    </div>
  );
}
