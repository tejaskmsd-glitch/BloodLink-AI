import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  LayoutDashboard,
  Boxes,
  Users,
  Building2,
  FileText,
  Bell,
  User,
  History,
  AlertTriangle,
  PlusCircle,
  FileSearch,
  Navigation,
  HeartHandshake,
  Calendar,
  ChevronDown,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

export const Sidebar = ({ mobileOpen, onMobileClose }) => {
  const { user } = useAuth();
  const location = useLocation();
  const { unreadCount = 0 } = useNotifications() || {};

  // Track collapsed/expanded state for multi-item sections
  const [openSections, setOpenSections] = useState({
    overview: true,
    emergency: true,
    'blood-management': true,
    campus: true,
    partners: true,
    insights: true,
    account: true
  });

  // Admin logical sections as specified
  const adminSections = [
    {
      id: 'overview',
      title: 'Overview',
      collapsible: false,
      items: [
        { label: 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard }
      ]
    },
    {
      id: 'emergency',
      title: 'Emergency',
      collapsible: false,
      items: [
        { label: 'Emergency SOS 🚨', path: '/admin/emergency-sos', icon: AlertTriangle, highlight: true }
      ]
    },
    {
      id: 'blood-management',
      title: 'Blood Management',
      collapsible: true,
      items: [
        { label: 'Blood Inventory', path: '/admin/inventory', icon: Boxes },
        { label: 'Blood Requests Queue', path: '/admin/requests', icon: FileText },
        { label: 'Donor Donations Queue', path: '/admin/donations', icon: HeartHandshake },
        { label: 'Donors Directory', path: '/admin/donors', icon: Users }
      ]
    },
    {
      id: 'campus',
      title: 'Campus',
      collapsible: false,
      items: [
        { label: 'Campus Blood Camps ⛺', path: '/admin/camps', icon: Calendar }
      ]
    },
    {
      id: 'partners',
      title: 'Partners',
      collapsible: true,
      items: [
        { label: 'Hospitals Directory', path: '/admin/hospitals', icon: Building2 },
        { label: 'Nearby Blood Banks', path: '/nearby-blood-banks', icon: Navigation, secondary: true }
      ]
    },
    {
      id: 'insights',
      title: 'Insights',
      collapsible: false,
      items: [
        { label: 'Reports & Export', path: '/admin/reports', icon: FileSearch }
      ]
    },
    {
      id: 'account',
      title: 'Account',
      collapsible: true,
      items: [
        { label: 'Notifications', path: '/admin/notifications', icon: Bell, hasBadge: true },
        { label: 'Admin Profile', path: '/admin/profile', icon: User }
      ]
    }
  ];

  // Auto-expand section containing the currently active path
  useEffect(() => {
    adminSections.forEach((section) => {
      const containsActive = section.items.some((item) => {
        if (location.pathname === item.path) return true;
        if (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path)) return true;
        return false;
      });
      if (containsActive && !openSections[section.id]) {
        setOpenSections((prev) => ({ ...prev, [section.id]: true }));
      }
    });
  }, [location.pathname]);

  const toggleSection = (sectionId) => {
    setOpenSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  // Hospital Navigation
  const hospitalNav = [
    { label: 'Hospital Dashboard', path: '/hospital/dashboard', icon: LayoutDashboard },
    { label: 'Emergency SOS 🚨', path: '/hospital/emergency-sos', icon: AlertTriangle },
    { label: 'Campus Blood Camps ⛺', path: '/hospital/camps', icon: Calendar },
    { label: 'Request Portal 🩸', path: '/hospital/request-portal', icon: FileText },
    { label: 'Available Stock', path: '/hospital/available-blood', icon: Boxes },
    { label: 'Nearby Blood Banks', path: '/nearby-blood-banks', icon: Navigation },
    { label: 'Create Request', path: '/hospital/create-request', icon: PlusCircle },
    { label: 'Notifications', path: '/hospital/notifications', icon: Bell, hasBadge: true },
    { label: 'Hospital Profile', path: '/hospital/profile', icon: User }
  ];

  // Donor Navigation
  const donorNav = [
    { label: 'Donor Dashboard', path: '/donor/dashboard', icon: LayoutDashboard },
    { label: 'Emergency SOS 🚨', path: '/donor/emergency-sos', icon: AlertTriangle },
    { label: 'Campus Blood Camps ⛺', path: '/donor/camps', icon: Calendar },
    { label: 'Donate Blood ❤️', path: '/donor/donate', icon: HeartHandshake },
    { label: 'Donation History', path: '/donor/donations', icon: History },
    { label: 'Nearby Blood Banks', path: '/nearby-blood-banks', icon: Navigation },
    { label: 'Notifications', path: '/donor/notifications', icon: Bell, hasBadge: true },
    { label: 'Donor Profile', path: '/donor/profile', icon: User }
  ];

  // Recipient Navigation
  const recipientNav = [
    { label: 'Emergency SOS 🚨', path: '/emergency-sos', icon: AlertTriangle },
    { label: 'Blood Request Portal 🩸', path: '/hospital/request-portal', icon: FileText },
    { label: 'Create Blood Request', path: '/hospital/create-request', icon: PlusCircle },
    { label: 'Nearby Blood Banks', path: '/nearby-blood-banks', icon: Navigation },
    { label: 'Notifications', path: '/donor/notifications', icon: Bell, hasBadge: true }
  ];

  if (!user) return null;

  const isAdminRole = ['ADMIN', 'CAMPUS_ADMIN', 'SUPER_ADMIN'].includes(user.role);

  return (
    <>
      {mobileOpen && (
        <div
          onClick={onMobileClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:sticky top-[5.5rem] left-4 z-30 w-64 bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl h-[calc(100vh-6.5rem)] overflow-y-auto transition-all duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-3.5 space-y-3">
          {/* Header Title */}
          <div className="px-2 pt-1 pb-0.5 border-b border-slate-100 flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {isAdminRole ? 'ADMIN CONSOLE' : `${user.role} PORTAL`}
            </p>
            {isAdminRole && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blood-50 text-blood-600 border border-blood-100">
                v2.0
              </span>
            )}
          </div>

          {/* ADMIN REORGANIZED 7-SECTION NAVIGATION */}
          {isAdminRole ? (
            <div className="space-y-3">
              {adminSections.map((section) => {
                const isOpen = openSections[section.id] !== false;
                return (
                  <div key={section.id} className="space-y-1">
                    {/* Section Header */}
                    {section.collapsible ? (
                      <button
                        type="button"
                        onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center justify-between px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-700 transition-colors rounded-lg group"
                      >
                        <span className="group-hover:translate-x-0.5 transition-transform">
                          {section.title}
                        </span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                            isOpen ? '' : '-rotate-90'
                          }`}
                        />
                      </button>
                    ) : (
                      <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        {section.title}
                      </div>
                    )}

                    {/* Section Items */}
                    {isOpen && (
                      <div className="space-y-0.5">
                        {section.items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <NavLink
                              key={item.path}
                              to={item.path}
                              onClick={onMobileClose}
                              className={({ isActive }) =>
                                `flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                                  isActive
                                    ? 'bg-gradient-to-r from-blood-600 to-blood-500 text-white shadow-[0_4px_15px_rgb(239,68,68,0.25)] scale-[1.01]'
                                    : item.secondary
                                    ? 'text-slate-500 hover:bg-slate-100/70 hover:text-slate-800'
                                    : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                                }`
                              }
                            >
                              <Icon className="w-4 h-4 shrink-0" />
                              <span className="truncate">{item.label}</span>

                              {/* Secondary navigation indicator */}
                              {item.secondary && (
                                <span className="ml-auto text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                                  Secondary
                                </span>
                              )}

                              {/* Notifications unread badge */}
                              {item.hasBadge && unreadCount > 0 && (
                                <span className="ml-auto text-[10px] font-black bg-red-500 text-white px-1.5 py-0.2 rounded-full shrink-0">
                                  {unreadCount}
                                </span>
                              )}
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* NON-ADMIN NAVIGATION (Hospital, Donor, Recipient) */
            <div className="space-y-0.5">
              {(user.role === 'HOSPITAL' || user.role === 'AUTHORIZED_BLOOD_BANK'
                ? hospitalNav
                : user.role === 'RECIPIENT'
                ? recipientNav
                : donorNav
              ).map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onMobileClose}
                    className={({ isActive }) =>
                      `flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-blood-600 to-blood-500 text-white shadow-[0_4px_15px_rgb(239,68,68,0.25)] scale-[1.01]'
                          : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                    {item.hasBadge && unreadCount > 0 && (
                      <span className="ml-auto text-[10px] font-black bg-red-500 text-white px-1.5 py-0.2 rounded-full shrink-0">
                        {unreadCount}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
