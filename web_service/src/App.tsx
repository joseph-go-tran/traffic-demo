import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './components/pages/HomePage';
import RoutePlanningPage from './components/pages/RoutePlanningPage';
import NavigationPage from './components/pages/NavigationPage';
import LoginPage from './components/pages/LoginPage';
import DashboardPage from './components/pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notificationCount] = useState(2);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleRegister = () => {
    setIsAuthenticated(true);
  };

  const handleLoginClick = () => {
    if (isAuthenticated) {
      // Handle profile/logout
      setIsAuthenticated(false);
    }
    // Navigation to login page is handled by ProtectedRoute
  };

  const handleNotificationClick = () => {
    // Handle notification click
    console.log('Notifications clicked');
  };

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
          <Route path="/routes" element={<RoutePlanningPage />} />
          <Route path="/traffic" element={<RoutePlanningPage />} />
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
