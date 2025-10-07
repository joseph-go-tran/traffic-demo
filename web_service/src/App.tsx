import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './components/pages/HomePage';
import RoutePlanningPage from './components/pages/RoutePlanningPage';
import NavigationPage from './components/pages/NavigationPage';
import TrafficReportPage from './components/pages/TrafficReportPage';
import LoginPage from './components/pages/LoginPage';
import DashboardPage from './components/pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import { isAuthenticated as checkAuth, hasValidAuthentication, clearTokens } from './lib/tokenUtils';

export default function App() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationCount] = useState(2);

  // Check authentication status on app initialization
  useEffect(() => {
    const checkAuthStatus = () => {
      const hasValidAuth = hasValidAuthentication();

      if (!hasValidAuth && checkAuth()) {
        // If we have tokens but they're all expired, clear them
        clearTokens();
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(hasValidAuth);
      }

      setIsLoading(false);
    };

    checkAuthStatus();

    // Listen for storage changes (login/logout in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken' || e.key === 'authToken' || e.key === 'refreshToken') {
        checkAuthStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleRegister = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    clearTokens();
    setIsAuthenticated(false);
    navigate('/');
  };

  const handleLoginClick = () => {
    if (isAuthenticated) {
      handleLogout();
    } else {
      // Navigation to login page
      navigate('/login');
    }
  };

  const handleNotificationClick = () => {
    // Handle notification click
    console.log('Notifications clicked');
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        isAuthenticated={isAuthenticated}
        onLoginClick={handleLoginClick}
        onNotificationClick={handleNotificationClick}
        notificationCount={notificationCount}
      />

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/routes"
            element={
              <RoutePlanningPage
                onNavigate={(routeId, routeData) => {
                  navigate('/navigation', {
                    state: {
                      routeId,
                      route: routeData?.data,
                      fromLocation: routeData?.fromLocation,
                      toLocation: routeData?.toLocation
                    }
                  });
                }}
              />
            }
          />
          <Route path="/traffic" element={<TrafficReportPage />} />
          <Route path="/navigation" element={<NavigationPage />} />
          <Route
            path="/login"
            element={<LoginPage onLogin={handleLogin} onRegister={handleRegister} />}
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
