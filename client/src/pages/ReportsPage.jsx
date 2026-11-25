import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  Printer,
  Download,
  Users,
  HeartHandshake,
  Flame,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  RefreshCw,
  AlertTriangle,
  Info
} from 'lucide-react';
import { formatDateTime } from '../utils/formatters';

export const ReportsPage = () => {
  const [reportType, setReportType] = useState('campus-summary');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [campusSummary, setCampusSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      if (reportType === 'campus-summary') {
        const { data } = await api.get('/reports/campus-summary', { params });
        if (data.success) {
          setCampusSummary(data.summary);
          setReportData(null);
        }
      } else {
        const { data } = await api.get(`/reports/${reportType}`, { params });
        if (data.success) {
          setReportData(data);
          setCampusSummary(null);
        }
      }
    } catch (err) {
      console.error('Failed to generate report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, startDate, endDate]);

  const handlePrint = () => {
    window.print();
  };

  const exportCSV = () => {
    if (reportType === 'campus-summary' && campusSummary) {
      const summaryRows = [
        ['Metric Category', 'Metric Name', 'Count / Value'],
        ['Campus Donors', 'Total Registered Donors', campusSummary.donors.total],
        ['Campus Donors', 'Available on Campus', campusSummary.donors.available],
        ['Campus Donors', 'Temporarily Unavailable', campusSummary.donors.temporarilyUnavailable],
        ['Campus Donors', 'Away from Campus', campusSummary.donors.awayFromCampus],
        ['Campus Donors', 'Medically Eligible', campusSummary.donors.eligible],
        ['Campus Donors', 'In Cooldown (90 days)', campusSummary.donors.inCooldown],
        ...Object.entries(campusSummary.donors.bloodGroupBreakdown || {}).map(([bg, count]) => [
          'Blood Group Distribution',
          bg,
          count
        ]),
        ['Blood Requests', 'Total Requests', campusSummary.requests.total],
        ['Blood Requests', 'Pending Requests', campusSummary.requests.pending],
        ['Blood Requests', 'Donors Found', campusSummary.requests.donorsFound],
        ['Blood Requests', 'Approved Requests', campusSummary.requests.approved],
        ['Blood Requests', 'Fulfilled Requests', campusSummary.requests.fulfilled],
        ['Blood Requests', 'Cancelled Requests', campusSummary.requests.cancelled],
        ['Blood Requests', 'Emergency SOS Requests', campusSummary.requests.emergencyTotal],
        ['Blood Requests', 'Emergency Fulfilled', campusSummary.requests.emergencyFulfilled],
        ['Blood Requests', 'Emergency Fulfillment Rate', `${campusSummary.requests.emergencyFulfillmentRate}%`],
        ['Campus Camps', 'Total Camps Organized', campusSummary.camps.total],
        ['Campus Camps', 'Upcoming Camps', campusSummary.camps.upcoming],
        ['Campus Camps', 'Completed Camps', campusSummary.camps.completed],
        ['Campus Camps', 'Total Registered Donors', campusSummary.camps.totalRegisteredDonors],
        ['Campus Camps', 'Total Attendees', campusSummary.camps.totalAttendees],
        ['Campus Camps', 'Donations Recorded', campusSummary.camps.totalDonations],
        ['Campus Camps', 'Units Collected', campusSummary.camps.totalUnitsCollected]
      ];

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        summaryRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `CAMPUS_BLOOD_BANK_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (!reportData?.data || reportData.data.length === 0) return;
    const items = reportData.data;
    const headers = Object.keys(items[0]).join(',');
    const rows = items.map(obj => Object.values(obj).map(val => `"${val}"`).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SMART_BLOOD_BANK_${reportType}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Campus Blood Bank Analytics & Reports</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real database audit records, emergency fulfillment metrics, and camp statistics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Tabs & Date Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap gap-4 items-center justify-between no-print">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'campus-summary', label: '📊 Campus Analytics' },
            { id: 'donations', label: 'Donations' },
            { id: 'requests', label: 'Blood Requests' },
            { id: 'inventory', label: 'Inventory' },
            { id: 'expiry', label: 'Expiry Risk' },
            { id: 'low-stock', label: 'Low Stock' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                reportType === tab.id
                  ? 'bg-blood-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="text-slate-500 font-semibold">Filter Date:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-slate-300 rounded-lg p-1.5 text-xs bg-slate-50"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-slate-300 rounded-lg p-1.5 text-xs bg-slate-50"
          />
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs text-blood-600 hover:underline font-bold"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Verified Real-Data Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between text-xs text-slate-600 no-print">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Verified Campus Data:</strong> All metrics are calculated live from real MongoDB database records. No synthetic or AI-predicted demand figures are used.
          </span>
        </div>
        <button
          onClick={fetchReport}
          disabled={loading}
          className="px-2.5 py-1 text-slate-500 hover:text-slate-800 text-[11px] font-semibold flex items-center space-x-1"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner text="Aggregating live campus database records..." />
      ) : reportType === 'campus-summary' && campusSummary ? (
        /* Campus Analytics Dashboard View */
        <div className="space-y-6">
          {/* Top KPI Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Donors</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{campusSummary.donors.total}</span>
              <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
                {campusSummary.donors.available} on campus
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Available Now</span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block">{campusSummary.donors.available}</span>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">Ready for emergency call</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Blood Requests</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{campusSummary.requests.total}</span>
              <span className="text-[10px] text-red-600 font-semibold mt-0.5 block">
                {campusSummary.requests.emergencyTotal} emergency SOS
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-red-200 bg-red-50/20 shadow-2xs">
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">SOS Fulfillment</span>
              <span className="text-2xl font-black text-red-700 mt-1 block">
                {campusSummary.requests.emergencyFulfillmentRate}%
              </span>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">
                {campusSummary.requests.emergencyFulfilled} of {campusSummary.requests.emergencyTotal} SOS
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Campus Camps</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{campusSummary.camps.total}</span>
              <span className="text-[10px] text-purple-600 font-semibold mt-0.5 block">
                {campusSummary.camps.totalRegisteredDonors} registered
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Units Collected</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {campusSummary.camps.totalUnitsCollected}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">From donation drives</span>
            </div>
          </div>

          {/* Breakdown Section Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Campus Donor Availability Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blood-600" />
                  <span>Campus Donor Availability Status</span>
                </h3>
                <span className="text-xs text-slate-400">Total: {campusSummary.donors.total}</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-emerald-50/60 rounded-xl">
                  <span className="font-semibold text-emerald-900 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Available on Campus</span>
                  </span>
                  <span className="font-bold text-emerald-800">{campusSummary.donors.available} donors</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-amber-50/60 rounded-xl">
                  <span className="font-semibold text-amber-900 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Temporarily Unavailable (Unwell / Medications)</span>
                  </span>
                  <span className="font-bold text-amber-800">{campusSummary.donors.temporarilyUnavailable} donors</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-100 rounded-xl">
                  <span className="font-semibold text-slate-800 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>Away from Campus (Vacation / Leave)</span>
                  </span>
                  <span className="font-bold text-slate-700">{campusSummary.donors.awayFromCampus} donors</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-blue-50/60 rounded-xl">
                  <span className="font-semibold text-blue-900 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Medically Eligible Donors</span>
                  </span>
                  <span className="font-bold text-blue-800">{campusSummary.donors.eligible} donors</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-purple-50/60 rounded-xl">
                  <span className="font-semibold text-purple-900 flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-purple-600" />
                    <span>In 90-Day Donation Cooldown</span>
                  </span>
                  <span className="font-bold text-purple-800">{campusSummary.donors.inCooldown} donors</span>
                </div>
              </div>
            </div>

            {/* Blood Group Distribution Grid */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <HeartHandshake className="w-4 h-4 text-blood-600" />
                  <span>Campus Donor Blood Group Matrix</span>
                </h3>
                <span className="text-xs text-slate-400">8 Compatible Groups</span>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {Object.entries(campusSummary.donors.bloodGroupBreakdown || {}).map(([bg, count]) => (
                  <div
                    key={bg}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-center hover:border-blood-300 transition-colors"
                  >
                    <span className="text-base font-black text-blood-600 block">{bg}</span>
                    <span className="text-lg font-black text-slate-900 mt-1 block">{count}</span>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Donors</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-3">
                <span className="text-[11px] font-bold text-slate-500 block mb-2">Campus Community Breakdown:</span>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="font-bold text-slate-800 block">
                      {campusSummary.donors.userTypeBreakdown?.STUDENT || 0}
                    </span>
                    <span className="text-[10px] text-slate-400">Students</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="font-bold text-slate-800 block">
                      {campusSummary.donors.userTypeBreakdown?.FACULTY || 0}
                    </span>
                    <span className="text-[10px] text-slate-400">Faculty</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="font-bold text-slate-800 block">
                      {campusSummary.donors.userTypeBreakdown?.STAFF || 0}
                    </span>
                    <span className="text-[10px] text-slate-400">Staff</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="font-bold text-slate-800 block">
                      {campusSummary.donors.userTypeBreakdown?.OTHER || 0}
                    </span>
                    <span className="text-[10px] text-slate-400">Other</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Blood Requests and Campus Camps Detailed Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Request Status Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Flame className="w-4 h-4 text-red-600" />
                  <span>Blood Requests Pipeline</span>
                </h3>
                <span className="text-xs text-slate-400">{campusSummary.requests.total} Total</span>
              </div>

              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2.5 text-slate-600 font-medium">Pending Verification</td>
                    <td className="py-2.5 text-right font-bold text-slate-800">
                      {campusSummary.requests.pending}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-600 font-medium">Donors Found (Responses Active)</td>
                    <td className="py-2.5 text-right font-bold text-emerald-600">
                      {campusSummary.requests.donorsFound}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-600 font-medium">Approved Requests</td>
                    <td className="py-2.5 text-right font-bold text-blue-600">
                      {campusSummary.requests.approved}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-600 font-medium">Fulfilled Requests</td>
                    <td className="py-2.5 text-right font-bold text-emerald-700">
                      {campusSummary.requests.fulfilled}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-600 font-medium">Cancelled Requests</td>
                    <td className="py-2.5 text-right font-bold text-slate-400">
                      {campusSummary.requests.cancelled}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-600 font-medium">Total Blood Units Requested</td>
                    <td className="py-2.5 text-right font-bold text-slate-800">
                      {campusSummary.requests.totalUnitsRequested} units
                    </td>
                  </tr>
                  <tr className="bg-slate-50 font-bold">
                    <td className="py-2.5 px-2 text-slate-900">Total Blood Units Fulfilled</td>
                    <td className="py-2.5 px-2 text-right text-emerald-700">
                      {campusSummary.requests.totalUnitsFulfilled} units
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Campus Camps & Drives Summary */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <span>Campus Blood Donation Camps & Drives</span>
                </h3>
                <span className="text-xs text-slate-400">{campusSummary.camps.total} Camps</span>
              </div>

              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2.5 text-slate-600 font-medium">Upcoming Scheduled Camps</td>
                    <td className="py-2.5 text-right font-bold text-purple-600">
                      {campusSummary.camps.upcoming}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-600 font-medium">Active / Ongoing Camps</td>
                    <td className="py-2.5 text-right font-bold text-emerald-600">
                      {campusSummary.camps.active}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-600 font-medium">Completed Camps</td>
                    <td className="py-2.5 text-right font-bold text-slate-800">
                      {campusSummary.camps.completed}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-600 font-medium">Registered Student/Faculty Participants</td>
                    <td className="py-2.5 text-right font-bold text-slate-800">
                      {campusSummary.camps.totalRegisteredDonors}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-600 font-medium">Recorded Camp Attendees</td>
                    <td className="py-2.5 text-right font-bold text-emerald-600">
                      {campusSummary.camps.totalAttendees}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-600 font-medium">Successful Donations Recorded</td>
                    <td className="py-2.5 text-right font-bold text-emerald-700">
                      {campusSummary.camps.totalDonations}
                    </td>
                  </tr>
                  <tr className="bg-purple-50/50 font-bold">
                    <td className="py-2.5 px-2 text-purple-900">Total Blood Units Collected in Camps</td>
                    <td className="py-2.5 px-2 text-right text-purple-800">
                      {campusSummary.camps.totalUnitsCollected} units
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Standard Table View for Inventory / Donations / Requests / Expiry */
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm print:shadow-none print:border-none">
          <div className="border-b border-slate-200 pb-4 mb-6 flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-black text-slate-900">{reportData?.title || 'Report'}</h2>
              <p className="text-xs text-slate-500 mt-1">SMART BLOOD BANK — Official Operational Document</p>
            </div>
            <div className="text-right text-xs text-slate-400">
              <p>Generated: {formatDateTime(new Date())}</p>
              <p>Total Records: {reportData?.count || 0}</p>
            </div>
          </div>

          {!reportData?.data || reportData.data.length === 0 ? (
            <p className="p-8 text-center text-slate-400 text-sm">No records found for the selected date range.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase">
                    {Object.keys(reportData.data[0]).map((key) => (
                      <th key={key} className="px-4 py-3">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {reportData.data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      {Object.values(row).map((val, vIdx) => (
                        <td key={vIdx} className="px-4 py-3 whitespace-nowrap">
                          {typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val ?? 'N/A')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
