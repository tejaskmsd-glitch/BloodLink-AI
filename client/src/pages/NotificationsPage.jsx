import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { formatDateTime } from '../utils/formatters';
import {
  Bell,
  CheckCheck,
  Clock,
  AlertTriangle,
  Flame,
  HeartHandshake,
  CheckCircle2,
  XCircle,
  Calendar,
  Trash2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Package
} from 'lucide-react';

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    fetchNotifications,
    loading
  } = useNotifications();

  const [filter, setFilter] = useState('ALL'); // ALL, UNREAD, EMERGENCY

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'UNREAD') return !n.isRead;
    if (filter === 'EMERGENCY') {
      return (
        n.type === 'EMERGENCY_ALERT' ||
        n.title.includes('SOS') ||
        n.title.includes('CRITICAL') ||
        n.title.includes('URGENT')
      );
    }
    return true;
  });

  const getNotificationIcon = (type, title) => {
    if (type === 'EMERGENCY_ALERT' || title?.includes('SOS') || title?.includes('CRITICAL')) {
      return (
        <div className="p-2.5 bg-red-100 text-red-600 rounded-xl shrink-0">
          <Flame className="w-5 h-5 animate-pulse" />
        </div>
      );
    }
    if (type === 'DONOR_RESPONDED') {
      return (
        <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl shrink-0">
          <HeartHandshake className="w-5 h-5" />
        </div>
      );
    }
    if (type === 'REQUEST_FULFILLED') {
      return (
        <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      );
    }
    if (type === 'REQUEST_CANCELLED' || type === 'REQUEST_REJECTED') {
      return (
        <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl shrink-0">
          <XCircle className="w-5 h-5" />
        </div>
      );
    }
    if (type === 'REQUEST_APPROVED') {
      return (
        <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
      );
    }
    if (type === 'CAMP_REGISTERED' || type === 'CAMP_UPDATE') {
      return (
        <div className="p-2.5 bg-purple-100 text-purple-600 rounded-xl shrink-0">
          <Calendar className="w-5 h-5" />
        </div>
      );
    }
    if (type === 'LOW_STOCK' || type === 'EXPIRY_WARNING') {
      return (
        <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl shrink-0">
          <Package className="w-5 h-5" />
        </div>
      );
    }
    return (
      <div className="p-2.5 bg-slate-100 text-blood-600 rounded-xl shrink-0">
        <Bell className="w-5 h-5" />
      </div>
    );
  };

  const handleNotificationClick = (n) => {
    if (!n.isRead) {
      markAsRead(n._id);
    }
    // Smart routing based on type or content
    if (
      n.type === 'EMERGENCY_ALERT' ||
      n.type === 'DONOR_RESPONDED' ||
      n.type === 'REQUEST_CREATED' ||
      n.type === 'REQUEST_FULFILLED' ||
      n.type === 'REQUEST_CANCELLED' ||
      n.title?.includes('SOS')
    ) {
      navigate('/emergency-sos');
    } else if (n.type === 'CAMP_REGISTERED' || n.type === 'CAMP_UPDATE') {
      navigate('/camps');
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">Campus Notification Center</h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time emergency SOS dispatches, donor confirmations, camp updates, and alerts
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => fetchNotifications(false)}
            disabled={loading}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors"
            title="Refresh notifications"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-blood-600 hover:bg-blood-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-sm transition-colors"
            >
              <CheckCheck className="w-4 h-4 text-white" />
              <span>Mark All Read</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all notifications?')) {
                  clearAllNotifications();
                }
              }}
              className="px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors"
              title="Clear all notifications"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 bg-white p-2 rounded-xl border border-slate-200 w-fit">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
            filter === 'ALL'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('UNREAD')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
            filter === 'UNREAD'
              ? 'bg-blood-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('EMERGENCY')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
            filter === 'EMERGENCY'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          🚨 Emergency SOS
        </button>
      </div>

      {/* Notification List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Bell className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-700">You're all caught up!</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {filter === 'UNREAD'
                ? 'No unread notifications right now. Check the "All" tab to view past alerts.'
                : filter === 'EMERGENCY'
                ? 'No emergency SOS notifications found.'
                : 'No campus notifications right now. Emergency requests and donor alerts will appear here.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div
              key={n._id}
              className={`p-5 flex items-start space-x-4 transition-colors group cursor-pointer ${
                n.isRead ? 'bg-white hover:bg-slate-50/70' : 'bg-red-50/25 hover:bg-red-50/40'
              }`}
              onClick={() => handleNotificationClick(n)}
            >
              {getNotificationIcon(n.type, n.title)}

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <h4
                      className={`text-sm font-bold ${
                        !n.isRead ? 'text-slate-900 font-extrabold' : 'text-slate-800'
                      }`}
                    >
                      {n.title}
                    </h4>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blood-600 shrink-0 inline-block" />
                    )}
                    {n.type && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {n.type.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDateTime(n.createdAt)}</span>
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(n._id);
                      }}
                      className="p-1 text-slate-300 hover:text-rose-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>

                {n.relatedId && (
                  <div className="mt-3 flex items-center space-x-2">
                    <span className="text-[11px] text-blood-600 font-bold flex items-center space-x-1 hover:underline">
                      <span>View in Emergency SOS</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
