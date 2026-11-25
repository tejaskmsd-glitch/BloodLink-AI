import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatDate } from '../utils/formatters';
import { BLOOD_GROUPS } from '../utils/constants';
import {
  Users,
  Calendar,
  AlertTriangle,
  Droplet,
  Plus,
  GraduationCap,
  ShieldCheck,
  Building2,
  Clock,
  ArrowRight,
  MapPin,
  HeartHandshake
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: dashData } = await api.get('/dashboard/summary');
        if (dashData.success) {
          setData(dashData);
        }
      } catch (err) {
        console.error('Error fetching admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <LoadingSpinner text="Loading Campus Control Center..." />;

  const kpis = data?.kpis || {};
  const upcomingCamps = data?.upcomingCamps || [];
  const activeEmergencies = data?.activeEmergencies || [];
  const donorBloodDistribution = data?.donorBloodDistribution || {};
  const inventoryOverview = data?.inventoryOverview || {};
  const departmentBreakdown = data?.departmentBreakdown || {};
  const recentRequests = (data?.recentRequests || []).slice(0, 5);

  // Format department data for Recharts BarChart
  const departmentChartData = Object.entries(departmentBreakdown).map(([dept, count]) => {
    const shortName = dept.replace(' Engineering', ' Engg').replace('Department of ', '');
    return {
      department: shortName.length > 14 ? shortName.slice(0, 14) + '…' : shortName,
      fullName: dept,
      donors: count
    };
  });

  // Format inventory blood group distribution for Recharts BarChart
  const inventoryChartData = BLOOD_GROUPS.map((bg) => ({
    bloodGroup: bg,
    units: inventoryOverview[bg] || 0
  }));

  return (
    <div className="space-y-4 sm:space-y-5 pb-8 max-w-7xl mx-auto">
      {/* 1. Compact Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              CAMPUS COORDINATOR DESK
            </span>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs font-bold text-slate-700">
              {data?.campus || 'National Institute of Technology'}
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Smart Campus Blood Bank Operations
          </h1>
          <p className="text-xs text-slate-500">
            Real-time donor directory, campus blood donation drives, and hospital emergency coordination
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => navigate('/admin/donors')}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Donor Directory</span>
          </button>
          <button
            onClick={() => navigate('/admin/inventory')}
            className="px-3 py-2 bg-blood-600 hover:bg-blood-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Blood Inventory</span>
          </button>
        </div>
      </div>

      {/* 2. Compact KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Campus Donors */}
        <div
          onClick={() => navigate('/admin/donors')}
          className="bg-white p-3.5 rounded-2xl border border-purple-100/90 hover:border-purple-300 shadow-2xs hover:shadow-xs cursor-pointer transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Donors</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              {kpis.totalDonors || 0}
            </p>
            <p className="text-[10px] text-purple-600 font-semibold mt-0.5">Students & Faculty</p>
          </div>
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-105 transition-transform">
            <Users className="w-4 h-4" />
          </div>
        </div>

        {/* Available on Campus */}
        <div
          onClick={() => navigate('/admin/donors?availability=AVAILABLE')}
          className="bg-white p-3.5 rounded-2xl border border-emerald-100/90 hover:border-emerald-300 shadow-2xs hover:shadow-xs cursor-pointer transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Available on Campus</p>
            <p className="text-2xl font-black text-emerald-700 tracking-tight mt-0.5">
              {kpis.availableDonors || 0}
            </p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Ready for call</p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        {/* Upcoming Camps */}
        <div
          onClick={() => navigate('/admin/camps')}
          className="bg-white p-3.5 rounded-2xl border border-blue-100/90 hover:border-blue-300 shadow-2xs hover:shadow-xs cursor-pointer transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Upcoming Camps</p>
            <p className="text-2xl font-black text-blue-700 tracking-tight mt-0.5">
              {kpis.upcomingCampsCount || upcomingCamps.length || 0}
            </p>
            <p className="text-[10px] text-blue-600 font-semibold mt-0.5">Scheduled drives</p>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-105 transition-transform">
            <Calendar className="w-4 h-4" />
          </div>
        </div>

        {/* Active Emergencies */}
        <div
          onClick={() => navigate('/admin/emergency-sos')}
          className="bg-white p-3.5 rounded-2xl border border-red-100/90 hover:border-red-300 shadow-2xs hover:shadow-xs cursor-pointer transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-red-500">Active Emergencies</p>
            <p className="text-2xl font-black text-red-700 tracking-tight mt-0.5">
              {kpis.emergencyRequests || activeEmergencies.length || 0}
            </p>
            <p className="text-[10px] text-red-600 font-semibold mt-0.5">Urgent SOS dispatch</p>
          </div>
          <div className="p-2.5 bg-red-50 text-blood-600 rounded-xl group-hover:scale-105 transition-transform">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 3. Compact Blood Group Summary */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Droplet className="w-4 h-4 text-blood-600" />
            <h2 className="text-xs font-black text-slate-900 tracking-tight uppercase">
              Blood Group Stock & Donor Network
            </h2>
          </div>
          <button
            onClick={() => navigate('/admin/inventory')}
            className="text-[11px] font-bold text-blood-600 hover:underline flex items-center space-x-1"
          >
            <span>Manage Inventory & Thresholds</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {BLOOD_GROUPS.map((bg) => {
            const units = inventoryOverview[bg] || 0;
            const donors = donorBloodDistribution[bg] || 0;
            const isCritical = units <= 2;
            const isLow = units > 2 && units < 8;

            return (
              <div
                key={bg}
                onClick={() => navigate('/admin/inventory')}
                className="p-2.5 bg-slate-50/70 hover:bg-slate-100/80 rounded-xl border border-slate-200/70 hover:border-blood-300 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-blood-600">{bg}</span>
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isCritical
                        ? 'bg-red-500 animate-pulse'
                        : isLow
                        ? 'bg-amber-400'
                        : 'bg-emerald-500'
                    }`}
                    title={isCritical ? 'Critical Stock (≤ 2 units)' : isLow ? 'Low Stock (< 8 units)' : 'Stock Normal'}
                  />
                </div>

                <div className="mt-1.5">
                  <p className="text-sm font-black text-slate-900 leading-tight">
                    {units} <span className="text-[10px] font-medium text-slate-400">units</span>
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                    {donors} donors
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Charts Section (Side-by-side on desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Department-wise Donor Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between pb-1">
            <h3 className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-blood-600" />
              <span>Donors by Academic Department</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold">
              {Object.keys(departmentBreakdown).length} Departments
            </span>
          </div>

          <div className="h-48">
            {departmentChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No departmental data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentChartData} margin={{ top: 5, right: 5, left: -25, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                  <XAxis
                    dataKey="department"
                    stroke="#94a3b8"
                    fontSize={8.5}
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis stroke="#94a3b8" fontSize={9} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: '11px', borderRadius: '8px', padding: '6px 10px' }}
                  />
                  <Bar dataKey="donors" fill="#dc2626" name="Registered Donors" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Available Inventory Units by Blood Group */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between pb-1">
            <h3 className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
              <Droplet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Available Inventory Units</span>
            </h3>
            <button
              onClick={() => navigate('/admin/inventory')}
              className="text-[10px] font-bold text-blood-600 hover:underline"
            >
              Inventory Directory →
            </button>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                <XAxis dataKey="bloodGroup" stroke="#94a3b8" fontSize={9.5} />
                <YAxis stroke="#94a3b8" fontSize={9} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: '11px', borderRadius: '8px', padding: '6px 10px' }}
                />
                <Bar dataKey="units" fill="#10b981" name="Available Units" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. Compact Campus Blood Donation Camps Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-purple-600" />
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Scheduled Campus Blood Donation Camps
            </h3>
          </div>
          <button
            onClick={() => navigate('/admin/camps')}
            className="text-[11px] font-bold text-blood-600 hover:underline flex items-center space-x-1"
          >
            <span>Manage Camps & Queue</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {upcomingCamps.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs bg-slate-50/60 rounded-xl">
            No upcoming campus blood donation camps scheduled yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="px-3.5 py-2">Camp Title</th>
                  <th className="px-3.5 py-2">Date & Time</th>
                  <th className="px-3.5 py-2">Venue</th>
                  <th className="px-3.5 py-2">Partner Blood Bank</th>
                  <th className="px-3.5 py-2">Registration Progress</th>
                  <th className="px-3.5 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {upcomingCamps.slice(0, 3).map((camp) => {
                  const booked =
                    camp.totalBooked !== undefined
                      ? camp.totalBooked
                      : camp.registeredDonors?.length || 0;
                  const capacity = camp.totalCapacity || 100;
                  const pct = Math.min(100, Math.round((booked / capacity) * 100));

                  return (
                    <tr key={camp._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3.5 py-2.5 font-bold text-slate-900">{camp.title}</td>
                      <td className="px-3.5 py-2.5 text-slate-600">
                        {new Date(camp.campDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                        <span className="block text-[10px] text-slate-400">
                          {camp.startTime} - {camp.endTime}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 font-medium text-slate-800">{camp.venue}</td>
                      <td className="px-3.5 py-2.5 text-slate-600">{camp.partnerBloodBank}</td>
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-purple-600 h-1.5 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="font-semibold text-slate-800 text-[11px]">
                            {booked} / {capacity}
                          </span>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                          {camp.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Compact Recent Blood Requests Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-blood-600" />
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Recent Blood Requests & Emergency Alerts (Top 5)
            </h3>
          </div>
          <button
            onClick={() => navigate('/admin/requests')}
            className="text-[11px] font-bold text-blood-600 hover:underline flex items-center space-x-1"
          >
            <span>View All Requests</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {recentRequests.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs bg-slate-50/60 rounded-xl">
            No blood requests recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="px-3.5 py-2">Requesting Hospital / Center</th>
                  <th className="px-3.5 py-2">Group</th>
                  <th className="px-3.5 py-2">Component</th>
                  <th className="px-3.5 py-2">Units</th>
                  <th className="px-3.5 py-2">Urgency</th>
                  <th className="px-3.5 py-2">Status</th>
                  <th className="px-3.5 py-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentRequests.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3.5 py-2.5 font-semibold text-slate-900">
                      {r.hospitalId?.hospitalName || r.hospitalName || 'Health Centre'}
                    </td>
                    <td className="px-3.5 py-2.5 font-black text-blood-600">{r.bloodGroup}</td>
                    <td className="px-3.5 py-2.5 text-slate-600">{r.component}</td>
                    <td className="px-3.5 py-2.5 font-bold text-slate-800">{r.quantity}</td>
                    <td className="px-3.5 py-2.5">
                      <StatusBadge type="urgency" status={r.urgency} />
                    </td>
                    <td className="px-3.5 py-2.5">
                      <StatusBadge type="request" status={r.status} />
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-400">{formatDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
