import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { StatCard } from '../components/common/StatCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  Droplet,
  HeartHandshake,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  AlertTriangle,
  Building,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Award,
  FileText,
  Download,
  FileCheck,
  Receipt
} from 'lucide-react';
import { DONOR_AVAILABILITY } from '../utils/constants';

export const DonorDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [downloadingDocId, setDownloadingDocId] = useState(null);

  useEffect(() => {
    const fetchDonorDashboard = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/dashboard/summary');
        if (data.success) setData(data);
      } catch (err) {
        console.error('Failed to fetch donor dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchDocuments = async () => {
      try {
        setLoadingDocs(true);
        const { data } = await api.get('/documents/my-documents');
        if (data.success) {
          setDocuments(data.documents || []);
        }
      } catch (err) {
        console.error('Failed to fetch donor documents:', err);
      } finally {
        setLoadingDocs(false);
      }
    };

    fetchDonorDashboard();
    fetchDocuments();
  }, []);

  const handleDownloadDocument = async (docItem) => {
    try {
      setDownloadingDocId(docItem.id);
      const res = await api.get(docItem.downloadUrl, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', docItem.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert(err.response?.data?.message || 'Failed to download document. Please try again.');
    } finally {
      setDownloadingDocId(null);
    }
  };

  if (loading) return <LoadingSpinner text="Loading Campus Donor Portal..." />;

  const kpis = data?.kpis || {};
  const donorProfile = data?.donorProfile || {};
  const upcomingCamps = data?.upcomingCamps || [];
  const activeEmergencies = data?.activeEmergencies || [];
  const history = data?.donations || [];

  const availabilityKey = kpis.availabilityStatus || 'AVAILABLE';
  const availabilityConfig = DONOR_AVAILABILITY[availabilityKey] || DONOR_AVAILABILITY.AVAILABLE;
  const isCooldown = kpis.isUnderCooldown || (kpis.cooldownDaysRemaining > 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-blood-600 via-blood-700 to-blood-800 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-blood-200 bg-white/10 px-3 py-1 rounded-full border border-white/20">
              SMART CAMPUS BLOOD BANK
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-blood-100 bg-blood-900/40 px-3 py-1 rounded-full">
              {donorProfile.college || process.env.CAMPUS_NAME || 'JC Bose University of Science and Technology, YMCA'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome, {donorProfile.userType === 'FACULTY' ? 'Professor' : 'Campus Donor'}!
          </h1>
          <p className="text-xs text-blood-100 max-w-xl">
            You are registered with blood group <span className="font-black text-white underline">{kpis.bloodGroup || 'O+'}</span> in the <span className="font-bold text-white">{donorProfile.department || 'Computer Science & Engineering'}</span> department.
          </p>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <Link
            to="/donor/profile"
            className="px-5 py-3 bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center space-x-2"
          >
            <UserCheck className="w-4 h-4" />
            <span>Manage Availability</span>
          </Link>
          <Link
            to="/donor/donate"
            className="px-5 py-3 bg-white text-blood-700 hover:bg-blood-50 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
          >
            <HeartHandshake className="w-4 h-4 text-blood-600" />
            <span>Schedule / RSVP</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Blood Group" value={kpis.bloodGroup || 'O+'} icon={Droplet} color="red" />
        <StatCard title="Total Donations" value={kpis.totalDonations || 0} icon={HeartHandshake} color="emerald" />
        <StatCard
          title="Campus Status"
          value={availabilityConfig.label}
          icon={UserCheck}
          color="blue"
        />
        <StatCard
          title="Medical Eligibility"
          value={isCooldown ? `Cooldown (${kpis.cooldownDaysRemaining}d)` : 'ELIGIBLE'}
          icon={isCooldown ? Clock : ShieldCheck}
          color={isCooldown ? 'amber' : 'purple'}
        />
      </div>

      {/* Emergency SOS Banner (If active requests exist) */}
      {activeEmergencies.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-red-700">
            <AlertTriangle className="w-5 h-5 animate-bounce" />
            <h3 className="font-black text-sm uppercase tracking-wider">
              Urgent Campus & Hospital Blood Requests ({activeEmergencies.length})
            </h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {activeEmergencies.map((req) => (
              <div key={req._id} className="bg-white p-4 rounded-2xl border border-red-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-black text-xs">
                      {req.bloodGroup} Needed
                    </span>
                    <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                      🚨 EMERGENCY SOS
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800">{req.hospitalId?.hospitalName || 'Local Medical Center'}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Quantity: {req.quantity || 1} Unit(s) • {req.reason || 'Critical Emergency'}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Contact: {req.hospitalId?.phone || 'Emergency Desk'}</span>
                  <Link
                    to="/donor/emergency-sos"
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all"
                  >
                    Respond & Donate 🚨
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Campus Blood Donation Camps */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blood-600" />
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Upcoming Campus Blood Donation Camps
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-semibold">Organized on Campus</span>
        </div>

        {upcomingCamps.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl text-slate-500 text-xs">
            No upcoming campus blood donation camps scheduled at this moment.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {upcomingCamps.map((camp) => (
              <div key={camp._id} className="p-5 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded-md bg-blood-100 text-blood-700 text-[10px] font-black uppercase tracking-wider">
                      {camp.status}
                    </span>
                    <h3 className="font-black text-slate-800 text-sm mt-1">{camp.title}</h3>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-slate-900 block">
                      {new Date(camp.campDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">{camp.startTime} - {camp.endTime}</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  <p className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blood-600 shrink-0" />
                    <span>Venue: <strong className="text-slate-800">{camp.venue}</strong></span>
                  </p>
                  <p className="flex items-center space-x-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Authorized Partner: <strong className="text-slate-800">{camp.partnerBloodBank}</strong></span>
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-semibold">
                    {camp.availableSpots !== undefined ? `${camp.availableSpots} spots left` : `Target: ${camp.targetUnits} Units`}
                  </span>
                  {camp.isRegistered ? (
                    <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold rounded-xl flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Registered ({camp.registeredSlot || 'RSVP'})</span>
                    </span>
                  ) : (
                    <Link
                      to="/donor/camps"
                      className="px-3.5 py-1.5 bg-blood-600 hover:bg-blood-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1"
                    >
                      <span>Book Slot</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. My Documents & Appreciation Certificates */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-blood-600" />
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              My Documents & Certificates
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-semibold">
            {documents.length} Available Document{documents.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loadingDocs ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl">
            <LoadingSpinner text="Loading official documents..." />
          </div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl text-slate-500 text-xs">
            No documents generated yet. Complete your profile registration to access your documents.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((docItem) => {
              const isCertificate = docItem.type === 'CERTIFICATE_OF_APPRECIATION';
              const isReceipt = docItem.type === 'DONATION_RECEIPT';
              const isReg = docItem.type === 'REGISTRATION_CONFIRMATION';
              const isDownloading = downloadingDocId === docItem.id;

              return (
                <div
                  key={docItem.id}
                  className={`p-4 rounded-2xl border transition-all duration-150 flex flex-col justify-between space-y-3 ${
                    isCertificate
                      ? 'border-amber-200 bg-amber-50/20 hover:border-amber-300'
                      : isReceipt
                      ? 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-300'
                      : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            isCertificate
                              ? 'bg-amber-100 text-amber-700'
                              : isReceipt
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-blood-100 text-blood-700'
                          }`}
                        >
                          {isCertificate ? (
                            <Award className="w-4.5 h-4.5" />
                          ) : isReceipt ? (
                            <Receipt className="w-4.5 h-4.5" />
                          ) : (
                            <FileCheck className="w-4.5 h-4.5" />
                          )}
                        </div>
                        <div>
                          <span
                            className={`px-1.5 py-0.2 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                              isCertificate
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : isReceipt
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {isCertificate ? 'Official Award' : isReceipt ? 'Verified Receipt' : 'Registration Record'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                        {docItem.title}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                        Ref: <strong className="text-slate-700">{docItem.reference}</strong>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Issued: {new Date(docItem.issueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-2">
                      {docItem.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">PDF • A4</span>
                    <button
                      onClick={() => handleDownloadDocument(docItem)}
                      disabled={isDownloading}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center space-x-1.5 ${
                        isCertificate
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : isReceipt
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      } disabled:opacity-50`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isDownloading ? 'Downloading...' : 'Download PDF'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Motivational Card if donor hasn't donated yet */}
        {documents.filter(d => d.type !== 'REGISTRATION_CONFIRMATION').length === 0 && (
          <div className="p-4 bg-gradient-to-r from-red-50 to-amber-50 rounded-2xl border border-red-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <p className="font-extrabold text-slate-900">
                  Earn Your Official Blood Donation Receipt & Certificate!
                </p>
                <p className="text-[11px] text-slate-600">
                  Complete your first voluntary blood donation at an upcoming campus drive or partner health centre.
                </p>
              </div>
            </div>
            <Link
              to="/donor/camps"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 self-start sm:self-auto"
            >
              View Campus Camps →
            </Link>
          </div>
        )}
      </div>

      {/* Donation History Snapshot */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900 tracking-tight">Your Voluntary Donation Record</h2>
          <Link to="/donor/donations" className="text-xs font-bold text-blood-600 hover:underline">
            View All History →
          </Link>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl text-slate-500 text-xs">
            No past donation history found. Join an upcoming campus drive to donate your first unit!
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {history.slice(0, 3).map((item) => (
              <div key={item._id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800 block">Blood Unit Donation ({item.bloodGroup})</span>
                  <span className="text-slate-400 text-[11px]">
                    {new Date(item.preferredDate || item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                    {item.status}
                  </span>
                  <Link
                    to={`/donor/donations/${item._id}`}
                    className="text-[11px] font-bold text-blood-600 hover:underline"
                  >
                    Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
