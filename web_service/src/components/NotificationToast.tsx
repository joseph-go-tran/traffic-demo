import { useEffect, useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export default function NotificationToast() {
  const { notifications } = useNotifications();
  const [visibleNotifications, setVisibleNotifications] = useState<
    Array<{ id: number; notification: any; isExiting: boolean }>
  >([]);

  useEffect(() => {
    // Show only the latest notification as a toast
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      const id = Date.now();

      setVisibleNotifications((prev) => [
        ...prev,
        { id, notification: latestNotification, isExiting: false },
      ]);

      // Auto-dismiss after 5 seconds
      const exitTimer = setTimeout(() => {
        setVisibleNotifications((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, isExiting: true } : item
          )
        );
      }, 5000);

      const removeTimer = setTimeout(() => {
        setVisibleNotifications((prev) =>
          prev.filter((item) => item.id !== id)
        );
      }, 5500);

      return () => {
        clearTimeout(exitTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [notifications]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const handleDismiss = (id: number) => {
    setVisibleNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isExiting: true } : item
      )
    );
    setTimeout(() => {
      setVisibleNotifications((prev) => prev.filter((item) => item.id !== id));
    }, 500);
  };

  if (visibleNotifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[60] space-y-2 max-w-sm">
      {visibleNotifications.map(({ id, notification, isExiting }) => (
        <div
          key={id}
          className={`transform transition-all duration-500 ${
            isExiting
              ? 'translate-x-[120%] opacity-0'
              : 'translate-x-0 opacity-100'
          }`}
        >
          <div
            className={`${getBgColor(
              notification.type
            )} border rounded-lg shadow-lg p-4 flex items-start gap-3`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900">
                {notification.title}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => handleDismiss(id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
