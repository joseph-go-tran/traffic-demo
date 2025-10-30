import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { NotificationProvider } from './contexts/NotificationContext';
import App from './App.tsx';
import './index.css';
import { StrictMode } from 'react';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: (failureCount: number, error: any) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

const getNotificationWsUrl = () => {
    // Try to get from runtime config (injected via index.html)
    const runtimeConfig = (window as any).__RUNTIME_CONFIG__;
    if (runtimeConfig?.VITE_NOTIFICATION_WS_URL) {
        return runtimeConfig.VITE_NOTIFICATION_WS_URL;
    }
    // Fall back to build-time environment variable
    return import.meta.env.VITE_NOTIFICATION_WS_URL || "http://localhost:3000";
};

// Get WebSocket URL from environment variable or default to localhost
const NOTIFICATION_WS_URL = getNotificationWsUrl();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <NotificationProvider wsUrl={NOTIFICATION_WS_URL} autoConnect={false}>
          <App />
        </NotificationProvider>
      </BrowserRouter>
      {/* Only show devtools in development */}
      {(import.meta as any).env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </StrictMode>
);
