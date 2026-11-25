import React, { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { BLOOD_GROUPS, BLOOD_COMPONENTS, REQUEST_URGENCY, REQUEST_STATUS } from '../utils/constants';
import {
  AlertTriangle,
  Flame,
  Phone,
  MapPin,
  Calendar,
  Clock,
  HeartHandshake,
  Users,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Building2,
  ChevronDown,
  ChevronUp,
  Info,
  Check,
  X,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';

export const EmergencySOSPage = () => {
  const { user } = useAuth();
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Expandable row state
  const [expandedId, setExpandedId] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 8;

  // Collapsible safety notice
  const [showNotice, setShowNotice] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [inspectingRequest, setInspectingRequest] = useState(null);
  const [inspectingMatches, setInspectingMatches] = useState(null);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [respondingId, setRespondingId] = useState(null);
  const [responseNotes, setResponseNotes] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    patientReference: '',
    bloodGroup: 'B+',
    component: 'Whole Blood',
    quantity: 1,
    urgency: 'CRITICAL',
    hospitalName: 'Campus Health Centre & Blood Bank',
    campusLocation: 'Main Campus Health Post',
    requiredDate: new Date(Date.now() + 6 * 3600 * 1000).toISOString().slice(0, 16),
    contactPerson: user?.name || '',
    contactPhone: user?.phone || '',
    reason: 'Emergency transfusion requirement on campus',
    notes: ''
  });
  const [phoneError, setPhoneError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchEmergencies = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const params = {};
      if (urgencyFilter) params.urgency = urgencyFilter;
      if (statusFilter) params.status = statusFilter;

      const { data } = await api.get('/requests/emergency/active', { params });
      if (data.success) {
        setEmergencies(data.emergencies || []);
      }
    } catch (err) {
      console.error('Failed to fetch emergency requests:', err);
      if (!silent) setError('Failed to load active emergencies. Please refresh.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencies(false);

    // Live polling every 8 seconds
    const interval = setInterval(() => {
      fetchEmergencies(true);
    }, 8000);

    return () => clearInterval(interval);
  }, [urgencyFilter, statusFilter]);

  // Validate Indian Phone format
  const validatePhone = (val) => {
    const cleaned = String(val || '').replace(/[\s\-]/g, '');
    const regex = /^(\+91)?[6-9]\d{9}$/;
    if (!cleaned) return 'Contact phone number is required';
    if (!regex.test(cleaned)) return 'Enter a valid 10-digit Indian phone (e.g. +91 9876543210 or 9876543210)';
    return '';
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, contactPhone: val }));
    setPhoneError(validatePhone(val));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const phoneErr = validatePhone(formData.contactPhone);
    if (phoneErr) {
      setPhoneError(phoneErr);
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post('/requests', formData);
      if (data.success) {
        setShowCreateModal(false);
        setSuccessMsg(data.message || 'Emergency SOS broadcasted successfully!');
        fetchEmergencies();
        setTimeout(() => setSuccessMsg(''), 5000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to broadcast emergency SOS');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDonorResponse = async (requestId, responseType) => {
    try {
      setRespondingId(requestId);
      const { data } = await api.post(`/requests/${requestId}/respond`, {
        response: responseType,
        notes: responseNotes
      });
      if (data.success) {
        setSuccessMsg(data.message);
        fetchEmergencies();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit response');
    } finally {
      setRespondingId(null);
      setResponseNotes('');
    }
  };

  const handleInspectMatches = async (reqItem) => {
    setInspectingRequest(reqItem);
    try {
      setLoadingMatches(true);
      const { data } = await api.get(`/requests/${reqItem._id}/matching-donors`);
      if (data.success) {
        setInspectingMatches(data);
      }
    } catch (err) {
      console.error('Failed to load matching donors:', err);
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleFulfill = async (id) => {
    if (!window.confirm('Are you sure you want to mark this emergency request as fulfilled?')) return;
    try {
      await api.patch(`/requests/${id}/fulfill`);
      fetchEmergencies();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to fulfill request');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this emergency request?')) return;
    try {
      await api.patch(`/requests/${id}/cancel`);
      fetchEmergencies();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel request');
    }
  };

  const canCreate = ['ADMIN', 'CAMPUS_ADMIN', 'SUPER_ADMIN', 'HOSPITAL', 'AUTHORIZED_BLOOD_BANK', 'RECIPIENT'].includes(user?.role);
  const isDonor = user?.role === 'DONOR';

  // Metrics from real DB values
  const activeCount = emergencies.length;
  const criticalCount = emergencies.filter(e => e.urgency === 'CRITICAL' || e.urgency === 'EMERGENCY').length;
  const donorsConfirmedAvailable = emergencies.reduce((acc, curr) => {
    const respondingConfirmed = (curr.respondingDonors || []).filter(
      r => r.response === 'I_CAN_DONATE' || r.response === 'WILL_DONATE'
    ).length;
    return acc + Math.max(curr.availableDonorsCount || 0, respondingConfirmed);
  }, 0);

  // Filter and Sort:
  // Sort priority: Critical (1) > Urgent (2) > Normal (3), then nearest required-by time
  const getPriorityWeight = (urgency) => {
    switch (urgency) {
      case 'CRITICAL':
      case 'EMERGENCY':
        return 1;
      case 'URGENT':
        return 2;
      case 'NORMAL':
        return 3;
      default:
        return 4;
    }
  };

  const filteredAndSortedEmergencies = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    const filtered = emergencies.filter(req => {
      if (urgencyFilter && req.urgency !== urgencyFilter) return false;
      if (statusFilter && req.status !== statusFilter) return false;
      if (q) {
        const bloodMatch = (req.bloodGroup || '').toLowerCase().includes(q);
        const hospMatch = (req.hospitalName || '').toLowerCase().includes(q);
        const refMatch = (req.patientReference || '').toLowerCase().includes(q);
        const compMatch = (req.component || '').toLowerCase().includes(q);
        const locMatch = (req.campusLocation || '').toLowerCase().includes(q);
        if (!bloodMatch && !hospMatch && !refMatch && !compMatch && !locMatch) return false;
      }
      return true;
    });

    return filtered.sort((a, b) => {
      const pA = getPriorityWeight(a.urgency);
      const pB = getPriorityWeight(b.urgency);
      if (pA !== pB) return pA - pB;

      const dateA = a.requiredDate ? new Date(a.requiredDate).getTime() : Infinity;
      const dateB = b.requiredDate ? new Date(b.requiredDate).getTime() : Infinity;
      return dateA - dateB;
    });
  }, [emergencies, searchQuery, urgencyFilter, statusFilter]);

  // Pagination calculation
  const totalItems = filteredAndSortedEmergencies.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;
  const paginatedEmergencies = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAndSortedEmergencies.slice(start, start + PAGE_SIZE);
  }, [filteredAndSortedEmergencies, currentPage]);

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4 pb-12">
      {/* 1. Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Emergency SOS</h1>
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
              <span>Live Coordination</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage urgent blood requests and donor responses
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 shrink-0"
          >
            <AlertTriangle className="w-4 h-4 text-white" />
            <span>Create Emergency SOS</span>
          </button>
        )}
      </div>

      {/* 2. Compact Collapsible Medical Safety Notice */}
      <div className="border border-amber-200 rounded-xl bg-amber-50/80 overflow-hidden text-xs text-amber-900 shadow-2xs">
        <div className="px-3.5 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 min-w-0">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-bold text-amber-900 text-xs">Medical Safety Notice:</span>
            <span className="text-amber-800 text-[11px] truncate hidden md:inline">
              Campus coordination only. Final blood compatibility, screening, and collection must be conducted by certified medical staff.
            </span>
          </div>
          <button
            onClick={() => setShowNotice(!showNotice)}
            className="text-[11px] font-bold text-amber-800 hover:text-amber-950 flex items-center space-x-1 shrink-0 px-2 py-0.5 rounded hover:bg-amber-100/70 transition-colors"
          >
            <span>{showNotice ? 'Hide Details' : 'Read Notice'}</span>
            {showNotice ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
        {showNotice && (
          <div className="px-3.5 pb-3 pt-1 border-t border-amber-200/60 text-[11px] text-amber-800 leading-relaxed bg-amber-50/50">
            This platform facilitates preliminary campus donor coordination and alerts. Colleague students and faculty are not blood screening agents. Final blood compatibility, physical screening, hemoglobin checks, and collection must be performed by certified medical staff at an authorized partner blood bank or transfusion centre.
          </div>
        )}
      </div>

      {/* Success / Error Alerts */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <XCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Compact Summary Row (3 Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Active Requests</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block">{activeCount}</span>
            <span className="text-[10px] text-slate-400">Campus emergency queue</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="bg-white px-4 py-3 rounded-xl border border-red-200 bg-red-50/20 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">Critical Requests</span>
            <span className="text-xl font-black text-red-700 mt-0.5 block">{criticalCount}</span>
            <span className="text-[10px] text-red-500">Immediate response needed</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
            <Flame className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="bg-white px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Donors Confirmed Available</span>
            <span className="text-xl font-black text-emerald-700 mt-0.5 block">{donorsConfirmedAvailable}</span>
            <span className="text-[10px] text-emerald-600">Volunteers ready to donate</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Users className="w-4.5 h-4.5" />
          </div>
        </div>
      </div>

      {/* 4. Compact Filters Toolbar */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search blood group, hospital, or reference..."
            className="w-full pl-8 pr-7 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-red-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filters and Live Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-bold text-slate-500">Urgency:</span>
            <select
              value={urgencyFilter}
              onChange={(e) => {
                setUrgencyFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 focus:outline-hidden"
            >
              <option value="">All Urgencies</option>
              <option value="CRITICAL">Critical</option>
              <option value="URGENT">Urgent</option>
              <option value="NORMAL">Normal</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-bold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 focus:outline-hidden"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="DONORS_FOUND">Donors Found</option>
              <option value="APPROVED">Approved</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-200">
            <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live (8s)</span>
            </span>

            <button
              onClick={() => fetchEmergencies(false)}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="Refresh live requests"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Compact Request List */}
      {loading ? (
        <LoadingSpinner text="Checking live emergency broadcast..." />
      ) : filteredAndSortedEmergencies.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Emergency SOS Requests Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {searchQuery || urgencyFilter || statusFilter
              ? 'No requests match your selected filters. Try clearing your search or filter selections.'
              : 'All campus blood requirements are currently fulfilled or in normal inventory supply.'}
          </p>
          {(searchQuery || urgencyFilter || statusFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setUrgencyFilter('');
                setStatusFilter('');
                setCurrentPage(1);
              }}
              className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline pt-1 block mx-auto"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {paginatedEmergencies.map((reqItem) => {
            const urgencyConfig = REQUEST_URGENCY[reqItem.urgency] || REQUEST_URGENCY.NORMAL;
            const statusConfig = REQUEST_STATUS[reqItem.status] || REQUEST_STATUS.PENDING;
            const respondingDonors = reqItem.respondingDonors || [];
            const confirmedCount = respondingDonors.filter(
              r => r.response === 'I_CAN_DONATE' || r.response === 'WILL_DONATE'
            ).length;
            const availableCount = Math.max(reqItem.availableDonorsCount || 0, confirmedCount);
            const isExpanded = expandedId === reqItem._id;
            const isResponding = respondingId === reqItem._id;
            const myResp = reqItem.myResponse;

            const isCritical = reqItem.urgency === 'CRITICAL' || reqItem.urgency === 'EMERGENCY';

            return (
              <div
                key={reqItem._id}
                className={`bg-white rounded-xl border transition-all duration-150 shadow-2xs overflow-hidden ${
                  isCritical
                    ? 'border-red-200 hover:border-red-300'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Main Compact Row */}
                <div className="p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Left: Blood Group, Component, Quantity, Reference */}
                  <div className="flex items-center space-x-3 min-w-[220px]">
                    <span className="w-11 h-11 rounded-xl bg-red-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                      {reqItem.bloodGroup}
                    </span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                          {reqItem.component}
                        </span>
                        <span className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.2 rounded-md">
                          {reqItem.quantity} unit{reqItem.quantity > 1 ? 's' : ''}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Ref: {reqItem.patientReference || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Middle Left: Hospital & Required Date */}
                  <div className="flex-1 min-w-[200px] text-xs text-slate-600 space-y-0.5">
                    <div className="flex items-center space-x-1.5 font-semibold text-slate-800">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{reqItem.hospitalName}</span>
                      {reqItem.campusLocation && (
                        <span className="text-[10px] text-slate-500 font-normal truncate">
                          ({reqItem.campusLocation})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>
                        Required by:{' '}
                        <strong className="text-slate-700">
                          {new Date(reqItem.requiredDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Middle Right: Priority, Status, Donors Count */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${urgencyConfig.color}`}>
                      {urgencyConfig.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>

                    <div className="flex items-center space-x-2 text-[11px] bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                      <span className="text-slate-500" title="Notified campus donors">
                        📢 {reqItem.notifiedDonorsCount || 0}
                      </span>
                      <span className="text-emerald-700 font-bold" title="Confirmed available donors">
                        🙋 {availableCount}
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions & Expand Button */}
                  <div className="flex items-center space-x-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 justify-end">
                    {canCreate && (
                      <button
                        onClick={() => handleInspectMatches(reqItem)}
                        className="px-2.5 py-1.5 text-xs font-bold text-blood-700 bg-blood-50 hover:bg-blood-100 border border-blood-200 rounded-lg transition-colors flex items-center space-x-1"
                        title="View matching donors and responses"
                      >
                        <Users className="w-3 h-3" />
                        <span className="hidden sm:inline">Donors</span>
                        <span>({respondingDonors.length})</span>
                      </button>
                    )}

                    <button
                      onClick={() => toggleExpand(reqItem._id)}
                      className="px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center space-x-1"
                    >
                      <span>{isExpanded ? 'Hide' : 'Details'}</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* 6. Expandable Details Drawer / Row */}
                {isExpanded && (
                  <div className="bg-slate-50/70 border-t border-slate-200 p-4 space-y-3 text-xs text-slate-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {/* Contact & Location Info */}
                      <div className="bg-white p-3 rounded-lg border border-slate-200/80 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Contact & Location
                        </span>
                        <p className="font-semibold text-slate-800">
                          {reqItem.contactPerson || 'Emergency Desk'}
                        </p>
                        {reqItem.contactPhone && (
                          <p className="flex items-center space-x-1 text-slate-600">
                            <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                            <a
                              href={`tel:${reqItem.contactPhone}`}
                              className="font-bold text-red-600 hover:underline"
                            >
                              {reqItem.contactPhone}
                            </a>
                          </p>
                        )}
                        {reqItem.campusLocation && (
                          <p className="flex items-center space-x-1 text-slate-500 text-[11px]">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{reqItem.campusLocation}</span>
                          </p>
                        )}
                      </div>

                      {/* Clinical Reason / Notes */}
                      <div className="bg-white p-3 rounded-lg border border-slate-200/80 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Clinical Reason & Notes
                        </span>
                        <p className="text-slate-700 italic text-[11px] leading-relaxed">
                          "{reqItem.reason || 'No clinical reason specified.'}"
                        </p>
                        {reqItem.notes && (
                          <p className="text-slate-500 text-[10px]">
                            Note: {reqItem.notes}
                          </p>
                        )}
                      </div>

                      {/* Donors & Notification Stats */}
                      <div className="bg-white p-3 rounded-lg border border-slate-200/80 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Notification & Dispatch Summary
                        </span>
                        <p className="text-[11px] text-slate-600">
                          📢 <strong>{reqItem.notifiedDonorsCount || 0}</strong> registered donors alerted
                        </p>
                        <p className="text-[11px] text-emerald-700 font-bold">
                          🙋 <strong>{availableCount}</strong> confirmed available to donate
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Total responses received: {respondingDonors.length}
                        </p>
                      </div>
                    </div>

                    {/* Responding Donors Mini List */}
                    {respondingDonors.length > 0 && (
                      <div className="bg-white p-3 rounded-lg border border-slate-200/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                            Donor Responses ({respondingDonors.length})
                          </span>
                          <button
                            onClick={() => handleInspectMatches(reqItem)}
                            className="text-[11px] font-bold text-blood-600 hover:underline"
                          >
                            View Full Donor List →
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {respondingDonors.map((resp, idx) => {
                            const isPositive = resp.response === 'I_CAN_DONATE' || resp.response === 'WILL_DONATE';
                            return (
                              <div
                                key={idx}
                                className={`px-2.5 py-1.5 rounded-lg border text-[11px] flex items-center space-x-1.5 ${
                                  isPositive
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                    : 'bg-slate-50 border-slate-200 text-slate-600'
                                }`}
                              >
                                <span className="font-bold">{resp.donorName || 'Donor'}</span>
                                <span className="px-1 py-0.2 bg-white rounded text-[10px] font-black border">
                                  {resp.bloodGroup}
                                </span>
                                <span className={`text-[10px] font-bold ${isPositive ? 'text-emerald-700' : 'text-slate-400'}`}>
                                  {isPositive ? '• Can Donate' : '• Unavailable'}
                                </span>
                                {resp.donorPhone && (
                                  <a href={`tel:${resp.donorPhone}`} className="text-blood-700 underline font-semibold ml-1">
                                    {resp.donorPhone}
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Donor Action Controls (If logged in as DONOR) */}
                    {isDonor && (
                      <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                        {reqItem.isCompatible ? (
                          <div className="text-red-700 font-bold text-[11px] flex items-center space-x-1.5">
                            <HeartHandshake className="w-4 h-4 text-red-600" />
                            <span>Your blood group is compatible with this request! Can you donate?</span>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500 italic">
                            Blood requirement: {reqItem.bloodGroup} needed.
                          </p>
                        )}

                        {myResp ? (
                          <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                            <span className="font-bold text-slate-700">
                              Your response:{' '}
                              <strong className={myResp.response === 'I_CAN_DONATE' ? 'text-emerald-700' : 'text-slate-500'}>
                                {myResp.response === 'I_CAN_DONATE' ? 'I Can Donate ❤️' : 'Unavailable'}
                              </strong>
                            </span>
                            <button
                              disabled={isResponding}
                              onClick={() =>
                                handleDonorResponse(
                                  reqItem._id,
                                  myResp.response === 'I_CAN_DONATE' ? 'UNAVAILABLE' : 'I_CAN_DONATE'
                                )
                              }
                              className="text-[11px] font-bold text-blood-600 hover:underline"
                            >
                              Change Response
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              disabled={isResponding}
                              onClick={() => handleDonorResponse(reqItem._id, 'I_CAN_DONATE')}
                              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-all flex items-center space-x-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>I Can Donate ❤️</span>
                            </button>
                            <button
                              disabled={isResponding}
                              onClick={() => handleDonorResponse(reqItem._id, 'UNAVAILABLE')}
                              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-all flex items-center space-x-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Unavailable</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 7. Simplified Admin Actions */}
                    {canCreate && (
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80">
                        <button
                          onClick={() => handleInspectMatches(reqItem)}
                          className="text-xs font-bold text-blood-600 hover:text-blood-800 flex items-center space-x-1"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>View Donors & Responses ({respondingDonors.length})</span>
                        </button>

                        <div className="flex items-center space-x-2">
                          {reqItem.status !== 'FULFILLED' && (
                            <button
                              onClick={() => handleFulfill(reqItem._id)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all"
                            >
                              Mark Fulfilled
                            </button>
                          )}
                          {reqItem.status !== 'CANCELLED' && reqItem.status !== 'FULFILLED' && (
                            <button
                              onClick={() => handleCancel(reqItem._id)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 text-xs font-bold rounded-lg transition-all"
                            >
                              Cancel Request
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* 8. Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
              <span>
                Showing <strong>{(currentPage - 1) * PAGE_SIZE + 1}</strong> to{' '}
                <strong>{Math.min(currentPage * PAGE_SIZE, totalItems)}</strong> of{' '}
                <strong>{totalItems}</strong> emergency requests
              </span>

              <div className="flex items-center space-x-2 self-end sm:self-auto">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-3 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                >
                  Previous
                </button>
                <span className="font-semibold text-slate-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-3 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Broadcast Emergency SOS Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Broadcast Campus Blood SOS</h2>
                  <p className="text-xs text-slate-500">Alerts compatible campus donors immediately</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Patient Reference / Student Roll No. <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="patientReference"
                  required
                  value={formData.patientReference}
                  onChange={handleFormChange}
                  placeholder="e.g. PAT-2026-NITK-08 or Student ID"
                  className="w-full text-xs border border-slate-300 rounded-xl p-3 focus:outline-hidden focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Patient Blood Group <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleFormChange}
                    className="w-full text-xs font-extrabold text-red-600 border border-slate-300 rounded-xl p-3 focus:outline-hidden"
                  >
                    {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Component Needed</label>
                  <select
                    name="component"
                    value={formData.component}
                    onChange={handleFormChange}
                    className="w-full text-xs border border-slate-300 rounded-xl p-3 focus:outline-hidden"
                  >
                    {BLOOD_COMPONENTS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Required Units <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    name="quantity"
                    required
                    value={formData.quantity}
                    onChange={handleFormChange}
                    className="w-full text-xs border border-slate-300 rounded-xl p-3 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Urgency Priority</label>
                  <select
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleFormChange}
                    className="w-full text-xs font-bold border border-slate-300 rounded-xl p-3 focus:outline-hidden text-red-700"
                  >
                    <option value="CRITICAL">Critical Priority (Immediate)</option>
                    <option value="URGENT">Urgent (Within 6 Hours)</option>
                    <option value="NORMAL">Normal Requirement</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hospital / Medical Center <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="hospitalName"
                    required
                    value={formData.hospitalName}
                    onChange={handleFormChange}
                    placeholder="e.g. Campus Health Centre / District Hospital"
                    className="w-full text-xs border border-slate-300 rounded-xl p-3 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Campus Location / Ward</label>
                  <input
                    type="text"
                    name="campusLocation"
                    value={formData.campusLocation}
                    onChange={handleFormChange}
                    placeholder="e.g. Ward 2, Health Post, Gate 1"
                    className="w-full text-xs border border-slate-300 rounded-xl p-3 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleFormChange}
                    placeholder="Name of attendant / doctor"
                    className="w-full text-xs border border-slate-300 rounded-xl p-3 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Phone (Indian +91) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="contactPhone"
                    required
                    value={formData.contactPhone}
                    onChange={handlePhoneChange}
                    placeholder="e.g. +91 98765 43210"
                    className={`w-full text-xs border rounded-xl p-3 focus:outline-hidden ${
                      phoneError ? 'border-red-500 bg-red-50/50' : 'border-slate-300'
                    }`}
                  />
                  {phoneError && <p className="text-[10px] text-red-600 font-bold mt-1">{phoneError}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Required By Date & Time</label>
                <input
                  type="datetime-local"
                  name="requiredDate"
                  value={formData.requiredDate}
                  onChange={handleFormChange}
                  className="w-full text-xs border border-slate-300 rounded-xl p-3 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Reason / Notes</label>
                <textarea
                  name="reason"
                  rows="2"
                  value={formData.reason}
                  onChange={handleFormChange}
                  placeholder="e.g. Severe blood loss / Dengue platelet transfusion required"
                  className="w-full text-xs border border-slate-300 rounded-xl p-3 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !!phoneError}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? 'Broadcasting...' : 'Broadcast SOS Now 🚨'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Matching Donors & Responses Modal */}
      {inspectingRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 bg-red-600 text-white font-black text-xs rounded-lg">
                    {inspectingRequest.bloodGroup}
                  </span>
                  <h3 className="font-black text-slate-900 text-base">
                    Matching Donors & Responses
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ref: {inspectingRequest.patientReference} • {inspectingRequest.hospitalName}
                </p>
              </div>
              <button
                onClick={() => { setInspectingRequest(null); setInspectingMatches(null); }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Confirmed Responding Donors Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Confirmed Responding Donors ({(inspectingRequest.respondingDonors || []).length})</span>
              </h4>

              {(inspectingRequest.respondingDonors || []).length === 0 ? (
                <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center">
                  No donors have submitted a response to this request yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(inspectingRequest.respondingDonors || []).map((resp, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                        resp.response === 'I_CAN_DONATE' || resp.response === 'WILL_DONATE'
                          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold">{resp.donorName || 'Campus Donor'}</span>
                          <span className="px-1.5 py-0.5 bg-white text-slate-800 text-[10px] font-black rounded-md border">
                            {resp.bloodGroup}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            resp.response === 'I_CAN_DONATE' || resp.response === 'WILL_DONATE'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {resp.response === 'I_CAN_DONATE' || resp.response === 'WILL_DONATE' ? 'I Can Donate' : 'Unavailable'}
                          </span>
                        </div>
                        {resp.donorPhone && (
                          <p className="text-[11px] mt-0.5">
                            Phone: <a href={`tel:${resp.donorPhone}`} className="underline font-bold">{resp.donorPhone}</a>
                          </p>
                        )}
                        {resp.notes && <p className="text-[10px] italic mt-0.5">Note: "{resp.notes}"</p>}
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(resp.respondedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Algorithmic Compatible Campus Donors */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <Users className="w-4 h-4 text-blood-600" />
                <span>Compatible Registered Donors on Campus</span>
              </h4>

              {loadingMatches ? (
                <LoadingSpinner text="Searching compatible campus donors..." />
              ) : !inspectingMatches || inspectingMatches.matchingDonors?.length === 0 ? (
                <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center">
                  No matching active donors available under this blood compatibility right now.
                </p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {inspectingMatches.matchingDonors.map((d) => (
                    <div key={d._id} className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-800">{d.name}</span>
                          <span className="px-1.5 py-0.5 bg-blood-100 text-blood-700 text-[10px] font-black rounded-md">
                            {d.bloodGroup}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">({d.userType})</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {d.department} {d.hostel ? `• Hostel: ${d.hostel}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md block">
                          Available
                        </span>
                        {d.phone && (
                          <a href={`tel:${d.phone}`} className="text-[10px] text-blood-600 font-bold hover:underline block mt-1">
                            {d.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => { setInspectingRequest(null); setInspectingMatches(null); }}
                className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
