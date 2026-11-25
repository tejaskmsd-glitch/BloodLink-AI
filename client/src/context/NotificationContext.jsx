import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!user) return;
    try {
      if (!silent) setLoading(true);
      const { data } = await api.get('/notifications');
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchNotifications(false);
      const interval = setInterval(() => {
        fetchNotifications(true);
      }, 15000); // 15s refresh for real-time notification alerts
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      const { data } = await api.patch(`/notifications/${id}/read`);
      if (data.success) {
        setNotifications(prev => prev.map(n => (n._id === id ? { ...n, isRead: true } : n)));
        setUnreadCount(prev => (typeof data.unreadCount === 'number' ? data.unreadCount : Math.max(0, prev - 1)));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data } = await api.patch('/notifications/read-all');
      if (data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const { data } = await api.delete(`/notifications/${id}`);
      if (data.success) {
        setNotifications(prev => prev.filter(n => n._id !== id));
        if (typeof data.unreadCount === 'number') {
          setUnreadCount(data.unreadCount);
        }
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const { data } = await api.delete('/notifications/clear-all');
      if (data.success) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error clearing all notifications:', err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
