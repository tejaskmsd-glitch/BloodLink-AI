import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Droplet, Heart, CheckCircle2, User, Phone, Mail, Building, GraduationCap, MapPin, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { DONOR_AVAILABILITY } from '../utils/constants';

export const DonorProfilePage = () => {
  const { user, setUser } = useAuth();
  const profile = user?.profile || {};

  const [availability, setAvailability] = useState(profile.availabilityStatus || 'AVAILABLE');
  const [updating, setUpdating] = useState(false);
  const [msg, setMsg] = useState('');

  // Handle availability change
  const handleAvailabilityChange = async (newStatus) => {
    setUpdating(true);
    setMsg('');
    try {
      const endpoint = profile._id ? `/donors/${profile._id}` : '/donors/profile/me';
      const { data } = await api.put(endpoint, {
        availabilityStatus: newStatus
      });
      if (data.success) {
        setAvailability(newStatus);
        const updatedUser = {
          ...user,
          profile: data.donor
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setMsg('Campus availability status updated successfully!');
        setTimeout(() => setMsg(''), 4000);
      }
    } catch (err) {
      console.error('Failed to update availability:', err);
      setMsg('Failed to update status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const cooldownDays = profile.cooldownDaysRemaining || 0;
  const isCooldown = profile.isUnderCooldown || cooldownDays > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Identity Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blood-600 to-blood-700 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-blood-200 ring-4 ring-blood-50">
            {profile.bloodGroup || 'O+'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-slate-900">{user?.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blood-100 text-blood-700">
                {profile.userType || 'STUDENT'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center space-x-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>{profile.college || user?.college || 'National Institute of Technology'}</span>
            </p>
          </div>
        </div>

        {/* Quick Blood Group & Eligibility Badges */}
        <div className="flex items-center space-x-2">
          {isCooldown ? (
            <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Cooldown: {cooldownDays} days remaining</span>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Medically Eligible to Donate</span>
            </div>
          )}
        </div>
      </div>

      {/* Campus Availability Status Control */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-black text-slate-900 text-sm tracking-tight">
              Emergency Availability on Campus
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Control whether you receive urgent notifications when someone on campus or a nearby hospital requires your blood group.
            </p>
          </div>
          {updating && <span className="text-xs text-blood-600 font-bold animate-pulse">Saving...</span>}
        </div>

        {msg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl">
            {msg}
          </div>
        )}

        <div className="grid sm:grid-cols-3 gap-3 pt-2">
          {Object.entries(DONOR_AVAILABILITY).map(([key, config]) => {
            const isSelected = availability === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleAvailabilityChange(key)}
                disabled={updating}
                className={`p-4 rounded-2xl border text-left transition-all relative ${
                  isSelected
                    ? `${config.color} border-2 shadow-sm font-bold scale-[1.01]`
                    : 'bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
                  <span className="text-xs font-black tracking-tight">{config.label}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">{config.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* College & Academic Credentials */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 flex items-center space-x-2">
            <GraduationCap className="w-4 h-4 text-blood-600" />
            <span>Campus & Academic Record</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Institution</span>
              <span className="font-bold text-slate-800 text-sm">{profile.college || user?.college || 'National Institute of Technology'}</span>
            </div>

            <div>
              <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Department</span>
              <span className="font-bold text-slate-800 text-sm">{profile.department || user?.department || 'Computer Science & Engineering'}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                  {profile.userType === 'FACULTY' ? 'Employee ID' : 'Roll Number'}
                </span>
                <span className="font-mono font-bold text-slate-800 text-sm">{profile.rollNumber || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Hostel / Hall</span>
                <span className="font-bold text-slate-800 text-sm">{profile.hostel || 'Day Scholar'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Medical & Blood Donor Credentials */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 flex items-center space-x-2">
            <Droplet className="w-4 h-4 text-blood-600" />
            <span>Donation & Medical Record</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Blood Group</span>
                <span className="font-black text-blood-600 text-base">{profile.bloodGroup || 'O+'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Voluntary Donations</span>
                <span className="font-bold text-slate-800 text-base">{profile.totalDonations || 0} times</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Last Donated On</span>
                <span className="font-bold text-slate-800 text-sm">
                  {profile.lastDonationDate
                    ? new Date(profile.lastDonationDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'No previous records'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">90-Day Cooldown</span>
                <span className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isCooldown ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {isCooldown ? `${cooldownDays} days left` : 'Eligible Now'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-500">
              <span className="flex items-center space-x-1.5"><Phone className="w-3.5 h-3.5 text-slate-400"/><span>{user?.phone}</span></span>
              <span className="flex items-center space-x-1.5"><Mail className="w-3.5 h-3.5 text-slate-400"/><span>{user?.email}</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
