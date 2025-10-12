import React, { createContext, useContext, ReactNode } from 'react';
import { useWebSocket, UseWebSocketReturn, Notification } from '../hooks/useWebSocket';

interface NotificationContextType extends UseWebSocketReturn {
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
  wsUrl?: string;
  userId?: string;
  autoConnect?: boolean;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  wsUrl = 'http://localhost:3000',
  userId,
  autoConnect = true,
}) => {
  const websocket = useWebSocket({
    url: wsUrl,
    namespace: '/notifications',
    autoConnect,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    onConnect: () => {
      console.log('Notification service connected');
      if (userId) {
        websocket.subscribe(userId);
      }
    },
    onDisconnect: (reason) => {
      console.log('Notification service disconnected:', reason);
    },
    onReconnect: (attemptNumber) => {
      console.log('Notification service reconnected after', attemptNumber, 'attempts');
      if (userId) {
        websocket.subscribe(userId);
      }
    },
    onReconnectAttempt: (attemptNumber) => {
      console.log('Attempting to reconnect to notification service:', attemptNumber);
    },
    onError: (error) => {
      console.error('Notification service error:', error);
    },
  });

  const unreadCount = websocket.notifications.length;

  const value: NotificationContextType = {
    ...websocket,
    unreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
