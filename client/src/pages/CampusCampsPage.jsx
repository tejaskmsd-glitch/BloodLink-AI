import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  Calendar,
  Clock,
  MapPin,
  Building2,
  Users,
  Plus,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Edit,
  Trash2,
  Heart,
  Droplet,
  ChevronRight,
  ShieldCheck,
  Check,
  X,
  UserCheck,
  Info
} from 'lucide-react';

export const CampusCampsPage = () => {
  const { user } = useAuth();
  const isAdmin = ['ADMIN', 'CAMPUS_ADMIN', 'SUPER_ADMIN'].includes(user?.role);
  const isBloodBank = ['HOSPITAL', 'AUTHORIZED_BLOOD_BANK'].includes(user?.role);
  const canManage = isAdmin || isBloodBank;

  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals state
  const [bookingCamp, setBookingCamp] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  const [attendeeCamp, setAttendeeCamp] = useState(null);
  const [attendeeLoading, setAttendeeLoading] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingCamp, setEditingCamp] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const [campForm, setCampForm] = useState({
    title: '',
    venue: '',
    description: '',
    campDate: '',
    registrationDeadline: '',
    startTime: '09:30 AM',
    endTime: '04:30 PM',
    organizer: 'Campus NSS & Youth Red Cross Chapter',
    partnerBloodBank: 'District Red Cross Authorized Blood Bank',
    targetUnits: 100,
    slots: [
      { slotTime: '09:30 AM - 11:00 AM', capacity: 25, bookedCount: 0 },
      { slotTime: '11:00 AM - 12:30 PM', capacity: 25, bookedCount: 0 },
      { slotTime: '01:30 PM - 03:00 PM', capacity: 25, bookedCount: 0 },
      { slotTime: '03:00 PM - 04:30 PM', capacity: 25, bookedCount: 0 }
    ]
  });

  const fetchCamps = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/camps');
      if (data.success) {
        setCamps(data.camps || []);
      }
    } catch (err) {
      console.error('Failed to load campus camps:', err);
      setError('Unable to load blood donation camps. Please check server connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCamps();
  }, []);

  const handleOpenCreate = () => {
    setEditingCamp(null);
    setCampForm({
      title: '',
      venue: 'Campus Indoor Stadium & Health Centre',
      description: 'Campus voluntary blood donation drive for students and faculty.',
      campDate: '',
      registrationDeadline: '',
      startTime: '09:30 AM',
      endTime: '04:30 PM',
      organizer: 'Campus NSS & Youth Red Cross Chapter',
      partnerBloodBank: 'District Red Cross Authorized Blood Bank',
      targetUnits: 100,
      slots: [
        { slotTime: '09:30 AM - 11:00 AM', capacity: 25, bookedCount: 0 },
        { slotTime: '11:00 AM - 12:30 PM', capacity: 25, bookedCount: 0 },
        { slotTime: '01:30 PM - 03:00 PM', capacity: 25, bookedCount: 0 },
        { slotTime: '03:00 PM - 04:30 PM', capacity: 25, bookedCount: 0 }
      ]
    });
    setCreateModalOpen(true);
  };

  const handleOpenEdit = (camp) => {
    setEditingCamp(camp);
    setCampForm({
      title: camp.title || '',
      venue: camp.venue || '',
      description: camp.description || '',
      campDate: camp.campDate ? new Date(camp.campDate).toISOString().split('T')[0] : '',
      registrationDeadline: camp.registrationDeadline ? new Date(camp.registrationDeadline).toISOString().split('T')[0] : '',
      startTime: camp.startTime || '09:30 AM',
      endTime: camp.endTime || '04:30 PM',
      organizer: camp.organizer || '',
      partnerBloodBank: camp.partnerBloodBank || '',
      targetUnits: camp.targetUnits || 100,
      slots: camp.slots && camp.slots.length ? camp.slots : [
        { slotTime: '09:30 AM - 11:00 AM', capacity: 25, bookedCount: 0 },
        { slotTime: '11:00 AM - 12:30 PM', capacity: 25, bookedCount: 0 },
        { slotTime: '01:30 PM - 03:00 PM', capacity: 25, bookedCount: 0 },
        { slotTime: '03:00 PM - 04:30 PM', capacity: 25, bookedCount: 0 }
      ]
    });
    setCreateModalOpen(true);
  };

  const handleSaveCamp = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');
    try {
      if (editingCamp) {
        const { data } = await api.put(`/camps/${editingCamp._id}`, campForm);
        if (data.success) {
          setSuccessMsg('Camp updated successfully!');
          setCreateModalOpen(false);
          fetchCamps();
        }
      } else {
        const { data } = await api.post('/camps', campForm);
        if (data.success) {
          setSuccessMsg('New campus blood camp created successfully!');
          setCreateModalOpen(false);
          fetchCamps();
        }
      }
    } catch (err) {
      console.error('Save camp error:', err);
      setError(err.response?.data?.message || 'Failed to save camp details.');
    } finally {
      setFormLoading(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleCancelCamp = async (campId) => {
    if (!window.confirm('Are you sure you want to mark this blood camp as CANCELLED?')) return;
    try {
      const { data } = await api.patch(`/camps/${campId}/cancel`);
      if (data.success) {
        setSuccessMsg('Camp marked as cancelled.');
        fetchCamps();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel camp.');
    }
  };

  const handleBookSlot = async () => {
    if (!bookingCamp || !selectedSlot) return;
    setBookingLoading(true);
    setError('');
    try {
      const { data } = await api.post(`/camps/${bookingCamp._id}/book`, {
        slotTime: selectedSlot
      });
      if (data.success) {
        setSuccessMsg('Donation slot booked successfully! See you at the camp.');
        setBookingCamp(null);
        fetchCamps();
      }
    } catch (err) {
      console.error('Booking error:', err);
      setError(err.response?.data?.message || 'Failed to book slot.');
    } finally {
      setBookingLoading(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleUpdateAttendee = async (attendeeId, statusKey, value) => {
    if (!attendeeCamp) return;
    setAttendeeLoading(true);
    try {
      const payload = {};
      if (statusKey === 'attendanceStatus') {
        payload.attendanceStatus = value;
      } else {
        payload[statusKey] = value;
      }

      const { data } = await api.patch(`/camps/${attendeeCamp._id}/attendees/${attendeeId}`, payload);
      if (data.success) {
        // Refresh single camp modal view and main list
        const campRes = await api.get(`/camps/${attendeeCamp._id}`);
        if (campRes.data.success) {
          setAttendeeCamp(campRes.data.camp);
        }
        fetchCamps();
      }
    } catch (err) {
      console.error('Failed to update attendee status:', err);
      setError(err.response?.data?.message || 'Failed to update attendee.');
    } finally {
      setAttendeeLoading(false);
    }
  };

  const handleRemoveAttendee = async (attendeeId) => {
    if (!window.confirm('Remove this donor registration from the camp queue?')) return;
    setAttendeeLoading(true);
    try {
      const { data } = await api.delete(`/camps/${attendeeCamp._id}/attendees/${attendeeId}`);
      if (data.success) {
        const campRes = await api.get(`/camps/${attendeeCamp._id}`);
        if (campRes.data.success) {
          setAttendeeCamp(campRes.data.camp);
        }
        fetchCamps();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove registration.');
    } finally {
      setAttendeeLoading(false);
    }
  };

  if (loading && !camps.length) {
    return <LoadingSpinner text="Loading campus blood donation camps..." />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-blood-600 bg-blood-50 px-2.5 py-1 rounded-full border border-blood-200">
            Campus Blood Drives
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
            Campus Blood Donation Camps
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Organized student & faculty voluntary blood donation drives in partnership with authorized transfusion centers
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-blood-600 hover:bg-blood-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center space-x-2 transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule New Camp</span>
          </button>
        )}
      </div>

      {/* Notifications / Alerts */}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center space-x-2 text-red-700 text-xs font-semibold animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-700">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2 text-emerald-800 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Camps List */}
      {camps.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No Blood Donation Camps Scheduled Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {canManage
              ? 'Click the "Schedule New Camp" button above to organize a voluntary blood donation drive on campus.'
              : 'Upcoming blood donation camps organized by NSS or Youth Red Cross will appear here once announced.'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {camps.map((camp) => {
            const campDateObj = new Date(camp.campDate);
            const isPast = campDateObj < new Date() && camp.status !== 'ACTIVE';
            const totalCapacity = (camp.slots || []).reduce((sum, s) => sum + (s.capacity || 0), 0);
            const totalBooked = (camp.slots || []).reduce((sum, s) => sum + (s.bookedCount || 0), 0);
            const percentBooked = totalCapacity > 0 ? Math.min(100, Math.round((totalBooked / totalCapacity) * 100)) : 0;

            const myRegistration = (camp.registeredDonors || []).find(
              (r) => (r.donorId?._id && r.donorId._id.toString() === user?.profile?._id?.toString()) ||
                     (r.userId?._id && r.userId._id.toString() === user?._id?.toString())
            );

            const isDeadlinePassed = camp.registrationDeadline && new Date() > new Date(camp.registrationDeadline);

            return (
              <div
                key={camp._id}
                className={`bg-white rounded-3xl border shadow-xs p-6 space-y-5 transition-all relative overflow-hidden flex flex-col justify-between ${
                  camp.status === 'CANCELLED'
                    ? 'border-slate-200 opacity-60 bg-slate-50'
                    : 'border-slate-200/90 hover:border-blood-200 hover:shadow-md'
                }`}
              >
                {/* Status Bar */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block ${
                        camp.status === 'UPCOMING'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : camp.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse'
                          : camp.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {camp.status}
                    </span>
                    <h2 className="text-lg font-black text-slate-900 mt-2 leading-snug">
                      {camp.title}
                    </h2>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-blood-600 block">
                      Target: {camp.targetUnits} Units
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 block">
                      Collected: {camp.unitsCollected || 0} Units
                    </span>
                  </div>
                </div>

                {/* Camp Metadata Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-blood-600 shrink-0" />
                    <span>
                      {campDateObj.toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blood-600 shrink-0" />
                    <span>{camp.startTime} - {camp.endTime}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{camp.venue}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{camp.partnerBloodBank}</span>
                  </div>
                </div>

                {camp.description && (
                  <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-100 line-clamp-2">
                    {camp.description}
                  </p>
                )}

                {/* Registration Capacity Meter */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Registration Capacity</span>
                    <span>{totalBooked} / {totalCapacity} slots booked ({percentBooked}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full transition-all duration-500 ${
                        percentBooked >= 90 ? 'bg-amber-500' : 'bg-blood-500'
                      }`}
                      style={{ width: `${percentBooked}%` }}
                    />
                  </div>
                </div>

                {/* Registration Deadline Warning if near */}
                {camp.registrationDeadline && (
                  <div className="text-[11px] text-slate-400 font-medium">
                    Registration Deadline:{' '}
                    <strong className={isDeadlinePassed ? 'text-red-600' : 'text-slate-700'}>
                      {new Date(camp.registrationDeadline).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                      {isDeadlinePassed ? ' (Closed)' : ''}
                    </strong>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  {/* Donor RSVP Button / Status */}
                  {user?.role === 'DONOR' && (
                    <>
                      {myRegistration ? (
                        <div className="flex items-center space-x-2">
                          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Registered ({myRegistration.slotTime})</span>
                          </span>
                        </div>
                      ) : (
                        <button
                          disabled={camp.status !== 'UPCOMING' && camp.status !== 'ACTIVE' || isDeadlinePassed || percentBooked >= 100}
                          onClick={() => {
                            setBookingCamp(camp);
                            setSelectedSlot(camp.slots?.[0]?.slotTime || '');
                          }}
                          className="px-4 py-2 bg-blood-600 hover:bg-blood-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95 flex items-center space-x-1.5"
                        >
                          <Heart className="w-3.5 h-3.5" />
                          <span>Book Time Slot</span>
                        </button>
                      )}
                    </>
                  )}

                  {/* Admin Controls */}
                  {canManage && (
                    <div className="flex items-center space-x-2 w-full sm:w-auto justify-end ml-auto">
                      <button
                        onClick={() => {
                          setAttendeeCamp(camp);
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center space-x-1"
                      >
                        <Users className="w-3.5 h-3.5 text-slate-600" />
                        <span>Queue ({camp.registeredDonors?.length || 0})</span>
                      </button>

                      <button
                        onClick={() => handleOpenEdit(camp)}
                        className="p-2 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-xl transition-all"
                        title="Edit Camp"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      {camp.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleCancelCamp(camp._id)}
                          className="p-2 hover:bg-red-50 text-red-600 hover:text-red-700 rounded-xl transition-all"
                          title="Cancel Camp"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODAL: BOOK TIME SLOT (DONOR) ================= */}
      {bookingCamp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-5 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Select Donation Time Slot</h3>
                <p className="text-xs text-slate-500">{bookingCamp.title}</p>
              </div>
              <button
                onClick={() => setBookingCamp(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">Available Slots</label>
              <div className="space-y-2">
                {(bookingCamp.slots || []).map((slot, idx) => {
                  const isFull = slot.bookedCount >= slot.capacity;
                  const isSelected = selectedSlot === slot.slotTime;

                  return (
                    <label
                      key={idx}
                      className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                        isFull
                          ? 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
                          : isSelected
                          ? 'border-blood-500 bg-blood-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <input
                          type="radio"
                          name="slotSelection"
                          value={slot.slotTime}
                          disabled={isFull}
                          checked={isSelected}
                          onChange={(e) => setSelectedSlot(e.target.value)}
                          className="text-blood-600 focus:ring-blood-500"
                        />
                        <span className="text-xs font-bold text-slate-800">{slot.slotTime}</span>
                      </div>
                      <span className={`text-[10px] font-bold ${isFull ? 'text-red-600' : 'text-slate-500'}`}>
                        {slot.bookedCount} / {slot.capacity} booked
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Donor Quick Card */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Registered as</span>
              <p className="font-bold text-slate-800">
                {user?.name} ({user?.profile?.bloodGroup || 'O+'})
              </p>
              <p className="text-slate-500 text-[11px]">
                {user?.profile?.department} • Roll No: {user?.profile?.rollNumber || 'N/A'}
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setBookingCamp(null)}
                className="w-1/2 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bookingLoading || !selectedSlot}
                onClick={handleBookSlot}
                className="w-1/2 py-2.5 bg-blood-600 hover:bg-blood-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all"
              >
                {bookingLoading ? 'Confirming...' : 'Confirm RSVP'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: QUEUE & ATTENDEES (ADMIN) ================= */}
      {attendeeCamp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-4xl w-full p-6 space-y-5 shadow-2xl animate-fade-in max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Participants Queue & Attendance Management
                </h3>
                <p className="text-xs text-slate-500">
                  {attendeeCamp.title} • {attendeeCamp.registeredDonors?.length || 0} registered
                </p>
              </div>
              <button
                onClick={() => setAttendeeCamp(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3 pr-1">
              {(!attendeeCamp.registeredDonors || attendeeCamp.registeredDonors.length === 0) ? (
                <div className="text-center py-10 text-slate-400 text-xs font-medium">
                  No students or faculty have registered for this camp yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-black">
                        <th className="py-2.5 px-3">Donor</th>
                        <th className="py-2.5 px-3">Blood Group</th>
                        <th className="py-2.5 px-3">Dept / Roll No</th>
                        <th className="py-2.5 px-3">Slot</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {attendeeCamp.registeredDonors.map((att) => {
                        const donor = att.donorId || {};
                        const u = att.userId || {};

                        return (
                          <tr key={att._id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3">
                              <span className="font-bold text-slate-900 block">{u.name || 'Anonymous'}</span>
                              <span className="text-[10px] text-slate-400 block">{donor.phone || u.phone}</span>
                            </td>

                            <td className="py-3 px-3">
                              <span className="w-7 h-7 rounded-lg bg-blood-100 text-blood-700 font-black text-xs flex items-center justify-center">
                                {donor.bloodGroup || 'O+'}
                              </span>
                            </td>

                            <td className="py-3 px-3">
                              <span className="font-medium text-slate-800 block">{donor.department || 'N/A'}</span>
                              <span className="text-[10px] text-slate-400 block font-mono">
                                {donor.rollNumber || donor.userType || 'STUDENT'}
                              </span>
                            </td>

                            <td className="py-3 px-3 font-semibold text-slate-600">
                              {att.slotTime || 'General'}
                            </td>

                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                  att.attendanceStatus === 'DONATED' || att.donated
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : att.attendanceStatus === 'ATTENDED' || att.attended
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                    : att.attendanceStatus === 'ABSENT'
                                    ? 'bg-red-100 text-red-800 border border-red-200'
                                    : att.attendanceStatus === 'DEFERRED'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                }`}
                              >
                                {att.attendanceStatus || (att.donated ? 'DONATED' : att.attended ? 'ATTENDED' : 'REGISTERED')}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end space-x-1.5">
                                {/* Mark Attended */}
                                <button
                                  disabled={attendeeLoading}
                                  onClick={() => handleUpdateAttendee(att._id, 'attendanceStatus', 'ATTENDED')}
                                  className="px-2 py-1 text-[10px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-all"
                                  title="Mark Attended"
                                >
                                  Attended
                                </button>

                                {/* Mark Donated */}
                                <button
                                  disabled={attendeeLoading}
                                  onClick={() => handleUpdateAttendee(att._id, 'attendanceStatus', 'DONATED')}
                                  className="px-2 py-1 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs transition-all flex items-center space-x-1"
                                  title="Mark Blood Donated"
                                >
                                  <Droplet className="w-2.5 h-2.5" />
                                  <span>Donated</span>
                                </button>

                                {/* Mark Absent */}
                                <button
                                  disabled={attendeeLoading}
                                  onClick={() => handleUpdateAttendee(att._id, 'attendanceStatus', 'ABSENT')}
                                  className="px-2 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all"
                                  title="Did not attend"
                                >
                                  Absent
                                </button>

                                {/* Remove from Queue */}
                                <button
                                  disabled={attendeeLoading}
                                  onClick={() => handleRemoveAttendee(att._id)}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded-lg"
                                  title="Remove registration"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600 shrink-0">
              <span>Total Units Collected: <strong className="text-emerald-700">{attendeeCamp.unitsCollected || 0}</strong></span>
              <button
                onClick={() => setAttendeeCamp(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE / EDIT CAMP (ADMIN) ================= */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-xl w-full p-6 space-y-4 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editingCamp ? 'Edit Blood Donation Camp' : 'Schedule Campus Blood Donation Camp'}
                </h3>
                <p className="text-xs text-slate-500">Configure camp venue, partner blood bank, and donation slots</p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCamp} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Camp Title / Drive Name</label>
                <input
                  type="text"
                  value={campForm.title}
                  onChange={(e) => setCampForm({ ...campForm, title: e.target.value })}
                  placeholder="e.g. Annual Youth Red Cross Mega Blood Donation Drive 2026"
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Campus Venue / Location</label>
                  <input
                    type="text"
                    value={campForm.venue}
                    onChange={(e) => setCampForm({ ...campForm, venue: e.target.value })}
                    placeholder="e.g. Campus Indoor Stadium & Clinic"
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Authorized Partner Blood Bank</label>
                  <input
                    type="text"
                    value={campForm.partnerBloodBank}
                    onChange={(e) => setCampForm({ ...campForm, partnerBloodBank: e.target.value })}
                    placeholder="e.g. District Red Cross Society Blood Bank"
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Camp Date</label>
                  <input
                    type="date"
                    value={campForm.campDate}
                    onChange={(e) => setCampForm({ ...campForm, campDate: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Registration Deadline (Optional)</label>
                  <input
                    type="date"
                    value={campForm.registrationDeadline}
                    onChange={(e) => setCampForm({ ...campForm, registrationDeadline: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="text"
                    value={campForm.startTime}
                    onChange={(e) => setCampForm({ ...campForm, startTime: e.target.value })}
                    placeholder="09:30 AM"
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Time</label>
                  <input
                    type="text"
                    value={campForm.endTime}
                    onChange={(e) => setCampForm({ ...campForm, endTime: e.target.value })}
                    placeholder="04:30 PM"
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Units</label>
                  <input
                    type="number"
                    value={campForm.targetUnits}
                    onChange={(e) => setCampForm({ ...campForm, targetUnits: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                    min="10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Organizer / Chapter</label>
                <input
                  type="text"
                  value={campForm.organizer}
                  onChange={(e) => setCampForm({ ...campForm, organizer: e.target.value })}
                  placeholder="e.g. Campus NSS & Youth Red Cross Chapter"
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows="2"
                  value={campForm.description}
                  onChange={(e) => setCampForm({ ...campForm, description: e.target.value })}
                  placeholder="Brief note for student donors (e.g. bring college ID card, eat breakfast)"
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="w-1/2 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-1/2 py-2.5 bg-blood-600 hover:bg-blood-700 disabled:opacity-50 text-white font-bold uppercase tracking-wider rounded-xl shadow-md transition-all"
                >
                  {formLoading ? 'Saving...' : editingCamp ? 'Save Changes' : 'Schedule Camp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
