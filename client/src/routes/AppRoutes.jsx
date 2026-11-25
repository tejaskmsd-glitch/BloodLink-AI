import React from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '../context/AuthContext';

// Layouts
import { MainLayout } from '../layouts/MainLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';

// Public Pages
import { LandingPage } from '../pages/LandingPage';
import { AboutPage } from '../pages/AboutPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ContactPage } from '../pages/ContactPage';
import { UnauthorizedPage } from '../pages/UnauthorizedPage';
import { NotFoundPage } from '../pages/NotFoundPage';

// Shared Protected Page
import { NearbyBloodBanksPage } from '../pages/NearbyBloodBanksPage';
import { CampusCampsPage } from '../pages/CampusCampsPage';
import { EmergencySOSPage } from '../pages/EmergencySOSPage';

// Admin Pages
import { AdminDashboard } from '../pages/AdminDashboard';
import { AdminDonationsPage } from '../pages/AdminDonationsPage';
import { InventoryPage } from '../pages/InventoryPage';
import { DonorsPage } from '../pages/DonorsPage';
import { HospitalsPage } from '../pages/HospitalsPage';
import { BloodRequestsPage } from '../pages/BloodRequestsPage';
import { NotificationsPage } from '../pages/NotificationsPage';
import { ReportsPage } from '../pages/ReportsPage';
import { ProfilePage } from '../pages/ProfilePage';

// Hospital Pages
import { HospitalDashboard } from '../pages/HospitalDashboard';
import { AvailableBloodPage } from '../pages/AvailableBloodPage';
import { CreateBloodRequestPage } from '../pages/CreateBloodRequestPage';
import { MyRequestsPage } from '../pages/MyRequestsPage';
import { HospitalRequestPortalPage } from '../pages/HospitalRequestPortalPage';
import { HospitalProfilePage } from '../pages/HospitalProfilePage';

// Donor Pages
import { DonorDashboard } from '../pages/DonorDashboard';
import { CreateDonationPage } from '../pages/CreateDonationPage';
import { DonationHistoryPage } from '../pages/DonationHistoryPage';
import { DonationDetailPage } from '../pages/DonationDetailPage';
import { DonorProfilePage } from '../pages/DonorProfilePage';

const DashboardRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (['ADMIN', 'CAMPUS_ADMIN', 'SUPER_ADMIN'].includes(user.role)) return <Navigate to="/admin/dashboard" replace />;
  if (['HOSPITAL', 'AUTHORIZED_BLOOD_BANK'].includes(user.role)) return <Navigate to="/hospital/dashboard" replace />;
  if (user.role === 'RECIPIENT') return <Navigate to="/hospital/request-portal" replace />;
  return <Navigate to="/donor/dashboard" replace />;
};

const RootRoute = () => {
  const { user } = useAuth();
  if (user) {
    if (['ADMIN', 'CAMPUS_ADMIN', 'SUPER_ADMIN'].includes(user.role)) return <Navigate to="/admin/dashboard" replace />;
    if (['HOSPITAL', 'AUTHORIZED_BLOOD_BANK'].includes(user.role)) return <Navigate to="/hospital/dashboard" replace />;
    if (user.role === 'RECIPIENT') return <Navigate to="/hospital/request-portal" replace />;
    return <Navigate to="/donor/dashboard" replace />;
  }
  return <LandingPage />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Landing Page at Root */}
      <Route path="/" element={<RootRoute />} />
      <Route path="/home" element={<RootRoute />} />

      {/* Public Pages wrapped in MainLayout */}
      <Route element={<MainLayout />}>
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
      </Route>

      {/* Auth Pages */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Shared Dashboard Route */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'HOSPITAL', 'DONOR', 'RECIPIENT']} />}>
        <Route path="/dashboard" element={<DashboardRedirect />} />
        <Route path="/admin" element={<DashboardRedirect />} />
        <Route path="/hospital" element={<DashboardRedirect />} />
        <Route path="/donor" element={<DashboardRedirect />} />
        <Route element={<DashboardLayout />}>
          <Route path="/nearby-blood-banks" element={<NearbyBloodBanksPage />} />
          <Route path="/emergency-sos" element={<EmergencySOSPage />} />
        </Route>
      </Route>

      {/* Admin Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/emergency-sos" element={<EmergencySOSPage />} />
          <Route path="/admin/camps" element={<CampusCampsPage />} />
          <Route path="/admin/inventory" element={<InventoryPage />} />
          <Route path="/admin/donations" element={<AdminDonationsPage />} />
          <Route path="/admin/donors" element={<DonorsPage />} />
          <Route path="/admin/hospitals" element={<HospitalsPage />} />
          <Route path="/admin/requests" element={<BloodRequestsPage />} />
          <Route path="/admin/notifications" element={<NotificationsPage />} />
          <Route path="/admin/reports" element={<ReportsPage />} />
          <Route path="/admin/thresholds" element={<Navigate to="/admin/inventory?tab=thresholds" replace />} />
          <Route path="/admin/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Hospital / Recipient Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['HOSPITAL', 'RECIPIENT']} />}>
        <Route element={<DashboardLayout border />}>
          <Route path="/hospital/dashboard" element={<HospitalDashboard />} />
          <Route path="/hospital/emergency-sos" element={<EmergencySOSPage />} />
          <Route path="/hospital/camps" element={<CampusCampsPage />} />
          <Route path="/hospital/request-portal" element={<HospitalRequestPortalPage />} />
          <Route path="/hospital/available-blood" element={<AvailableBloodPage />} />
          <Route path="/hospital/create-request" element={<CreateBloodRequestPage />} />
          <Route path="/hospital/my-requests" element={<HospitalRequestPortalPage />} />
          <Route path="/hospital/notifications" element={<NotificationsPage />} />
          <Route path="/hospital/profile" element={<HospitalProfilePage />} />
        </Route>
      </Route>

      {/* Donor Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['DONOR']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/donor/dashboard" element={<DonorDashboard />} />
          <Route path="/donor/emergency-sos" element={<EmergencySOSPage />} />
          <Route path="/donor/camps" element={<CampusCampsPage />} />
          <Route path="/donor/donate" element={<CreateDonationPage />} />
          <Route path="/donor/donations" element={<DonationHistoryPage />} />
          <Route path="/donor/donations/:id" element={<DonationDetailPage />} />
          <Route path="/donor/history" element={<DonationHistoryPage />} />
          <Route path="/donor/notifications" element={<NotificationsPage />} />
          <Route path="/donor/profile" element={<DonorProfilePage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
