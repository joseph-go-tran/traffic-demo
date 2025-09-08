import React from 'react';
import { MapPin, Clock, Route, TrendingUp, Calendar, Settings, Star } from 'lucide-react';

export default function DashboardPage() {
  const recentRoutes = [
    { id: '1', from: 'Home', to: 'Office', time: '25 min', distance: '12.3 mi', frequency: 'Daily' },
    { id: '2', from: 'Office', to: 'Gym', time: '15 min', distance: '6.8 mi', frequency: 'Weekly' },
    { id: '3', from: 'Home', to: 'Shopping Mall', time: '20 min', distance: '9.1 mi', frequency: 'Occasional' }
  ];

  const stats = [
    { label: 'Routes This Month', value: '42', icon: Route, color: 'text-purple-600 bg-purple-100' },
    { label: 'Time Saved', value: '3.2h', icon: Clock, color: 'text-blue-600 bg-blue-100' },
    { label: 'Distance Traveled', value: '847 mi', icon: MapPin, color: 'text-green-600 bg-green-100' },
    { label: 'Efficiency Score', value: '94%', icon: TrendingUp, color: 'text-orange-600 bg-orange-100' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your navigation summary.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">{stat.label}</h3>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Routes */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Routes</h2>
              <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                View All
              </button>
            </div>

            <div className="space-y-4">
              {recentRoutes.map((route) => (
                <div key={route.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col items-center space-y-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div className="w-0.5 h-8 bg-gray-300"></div>
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{route.from} → {route.to}</div>
                      <div className="text-sm text-gray-600">
                        {route.time} • {route.distance} • {route.frequency}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="text-yellow-400 hover:text-yellow-500">
                      <Star className="h-4 w-4" />
                    </button>
                    <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                      Navigate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            
            <div className="space-y-3">
              <button className="w-full flex items-center space-x-3 p-3 text-left rounded-lg border border-gray-200 hover:bg-purple-50 hover:border-purple-300 transition-colors duration-200">
                <Route className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-gray-900">Plan New Route</span>
              </button>
              
              <button className="w-full flex items-center space-x-3 p-3 text-left rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200">
                <Star className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-gray-900">Saved Places</span>
              </button>
              
              <button className="w-full flex items-center space-x-3 p-3 text-left rounded-lg border border-gray-200 hover:bg-green-50 hover:border-green-300 transition-colors duration-200">
                <Calendar className="h-5 w-5 text-green-600" />
                <span className="font-medium text-gray-900">Trip History</span>
              </button>
              
              <button className="w-full flex items-center space-x-3 p-3 text-left rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors duration-200">
                <Settings className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-900">Settings</span>
              </button>
            </div>
          </div>

          {/* Traffic Summary */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Traffic Summary</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Current Conditions</span>
                <span className="text-green-600 font-medium">Good</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Incidents</span>
                <span className="text-orange-600 font-medium">3 nearby</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Best Time to Travel</span>
                <span className="text-blue-600 font-medium">Now - 2 PM</span>
              </div>
            </div>

            <button className="w-full mt-4 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors duration-200">
              View Traffic Map
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}