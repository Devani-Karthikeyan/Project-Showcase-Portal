import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth, BACKEND_URL } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);

  // Add a transient toast notification
  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Fetch initial notifications
  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.isRead).length);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  // Mark a single notification as read
  const markAsRead = async (id) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        addToast('All notifications marked as read', 'success');
      }
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
  };

  // Establish SSE Connection
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications();

    const token = localStorage.getItem('token');
    const eventSource = new EventSource(`${BACKEND_URL}/api/notifications/stream?token=${token}`);

    eventSource.onmessage = (event) => {
      try {
        const newNotification = JSON.parse(event.data);
        if (newNotification.connected) {
          console.log('📡 Real-time Notification Gateway Connected.');
          return;
        }

        // Add to notification list
        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);
        
        // Push visual toast card
        addToast(newNotification.message, newNotification.type || 'info');
      } catch (err) {
        console.error('Error processing incoming SSE notification:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn('⚠️ Notification SSE stream lost connection. Attempting auto-reconnect...');
      eventSource.close();
    };

    return () => {
      eventSource.close();
      console.log('🔌 SSE connection closed.');
    };
  }, [isAuthenticated, user]);

  const value = {
    notifications,
    unreadCount,
    toasts,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    addToast,
    removeToast
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {/* Visual Toast Manager Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className="pointer-events-auto cursor-pointer p-4 rounded-xl shadow-lg border border-brand-500/20 glass-panel-glow text-white text-sm flex items-center justify-between gap-3 animate-slide-in hover:brightness-110 transition-all duration-300"
            style={{
              animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
              <p>{toast.message}</p>
            </div>
            <button className="text-zinc-400 hover:text-white text-xs font-bold transition">×</button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
