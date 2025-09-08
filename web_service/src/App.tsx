import React, { useState } from 'react';
import Header from './components/Header';
import HomePage from './components/pages/HomePage';
import RoutePlanningPage from './components/pages/RoutePlanningPage';
import NavigationPage from './components/pages/NavigationPage';
import LoginPage from './components/pages/LoginPage';
import DashboardPage from './components/pages/DashboardPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [notificationCount] = useState(2);

  const handlePageChange = (page: string) => {
    if (page === 'dashboard' && !isAuthenticated) {
      setShowLogin(true);
      return;
    }
    setCurrentPage(page);
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    setShowLogin(false);
    setCurrentPage('dashboard');
  };

  const handleRegister = () => {
    setIsAuthenticated(true);
    setShowLogin(false);
    setCurrentPage('dashboard');
  };

  const handleNavigate = (routeId: string) => {
    setCurrentPage('navigation');
  };

  const handleNotificationClick = () => {
    // Handle notification click
    console.log('Notifications clicked');
  };

  if (showLogin) {
    return <LoginPage onLogin={handleLogin} onRegister={handleRegister} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        currentPage={currentPage}
        onPageChange={handlePageChange}
        isAuthenticated={isAuthenticated}
        onLoginClick={() => setShowLogin(true)}
        onNotificationClick={handleNotificationClick}
        notificationCount={notificationCount}
      />

      <main>
        {currentPage === 'home' && (
          <HomePage onGetStarted={() => setCurrentPage('routes')} />
        )}
        {currentPage === 'routes' && (
          <RoutePlanningPage onNavigate={handleNavigate} />
        )}
        {currentPage === 'navigation' && (
          <NavigationPage />
        )}
        {currentPage === 'traffic' && (
          <RoutePlanningPage onNavigate={handleNavigate} />
        )}
        {currentPage === 'dashboard' && isAuthenticated && (
          <DashboardPage />
        )}
      </main>
    </div>
  );
}