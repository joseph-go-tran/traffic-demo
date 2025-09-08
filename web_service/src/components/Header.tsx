import React from 'react';
import { MapPin, Menu, User, Bell } from 'lucide-react';

interface HeaderProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  isAuthenticated: boolean;
  onLoginClick: () => void;
  onNotificationClick: () => void;
  notificationCount?: number;
}

export default function Header({ 
  currentPage, 
  onPageChange, 
  isAuthenticated, 
  onLoginClick, 
  onNotificationClick,
  notificationCount = 0 
}: HeaderProps) {
  return (
    <header className="bg-white shadow-lg border-b-2 border-purple-600/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-2 rounded-lg">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">TrafficFlow</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {['home', 'routes', 'traffic', 'dashboard'].map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  currentPage === page
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                {page.charAt(0).toUpperCase() + page.slice(1)}
              </button>
            ))}
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && (
              <button
                onClick={onNotificationClick}
                className="relative p-2 text-gray-600 hover:text-purple-600 transition-colors duration-200"
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </button>
            )}
            
            <button
              onClick={onLoginClick}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                isAuthenticated
                  ? 'text-gray-600 hover:text-purple-600'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              <User className="h-4 w-4" />
              <span>{isAuthenticated ? 'Profile' : 'Login'}</span>
            </button>

            {/* Mobile Menu */}
            <button className="md:hidden p-2 text-gray-600 hover:text-purple-600">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}