import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BLOOD_GROUPS, COLLEGE_DEPARTMENTS, USER_TYPES, DONOR_AVAILABILITY } from '../utils/constants';
import { UserCheck, ShieldAlert, Building2 } from 'lucide-react';

export const RegisterPage = () => {
  const { user, register } = useAuth();
  const navigate = useNavigate();

  // If user is already authenticated, redirect to appropriate role dashboard
  if (user) {
    if (['ADMIN', 'CAMPUS_ADMIN', 'SUPER_ADMIN'].includes(user.role)) return <Navigate to="/admin/dashboard" replace />;
    if (['HOSPITAL', 'AUTHORIZED_BLOOD_BANK'].includes(user.role)) return <Navigate to="/hospital/dashboard" replace />;
    if (user.role === 'RECIPIENT') return <Navigate to="/hospital/request-portal" replace />;
    return <Navigate to="/donor/dashboard" replace />;
  }

  const [role, setRole] = useState('DONOR');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    college: 'JC Bose University of Science and Technology, YMCA',
    department: 'Computer Science & Engineering',
    userType: 'STUDENT',
    rollNumber: '',
    hostel: 'Hostel Block 1',
    bloodGroup: 'O+',
    availabilityStatus: 'AVAILABLE',
    gender: 'Male',
    dateOfBirth: '2003-05-15',
    // Authorized Blood Bank / Hospital fields
    hospitalName: '',
    registrationNumber: '',
    contactPerson: '',
    city: 'Faridabad'
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        name: role === 'AUTHORIZED_BLOOD_BANK' ? formData.hospitalName || formData.name : formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role,
        college: formData.college,
        department: formData.department,
        userType: formData.userType,
        address: {
          street: formData.hostel || 'Campus',
          city: formData.city || 'Campus Zone',
          state: 'State',
          zipCode: '560001'
        },
        extraDetails: role === 'AUTHORIZED_BLOOD_BANK' ? {
          hospitalName: formData.hospitalName || formData.name,
          registrationNumber: formData.registrationNumber || `LIC-BB-${Date.now()}`,
          contactPerson: formData.contactPerson || formData.name,
          city: formData.city,
          emergencyContact: formData.phone
        } : {
          college: formData.college,
          department: formData.department,
          userType: formData.userType,
          rollNumber: formData.rollNumber,
          hostel: formData.hostel,
          bloodGroup: formData.bloodGroup,
          availabilityStatus: formData.availabilityStatus,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender
        }
      };

      const user = await register(payload);
      if (['ADMIN', 'CAMPUS_ADMIN', 'SUPER_ADMIN'].includes(user.role)) navigate('/admin/dashboard');
      else if (['HOSPITAL', 'AUTHORIZED_BLOOD_BANK'].includes(user.role)) navigate('/hospital/dashboard');
      else if (user.role === 'RECIPIENT') navigate('/hospital/request-portal');
      else navigate('/donor/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-center text-2xl font-black tracking-tight text-slate-900">
          Smart Campus Blood Bank
        </h2>
        <p className="mt-1 text-center text-xs font-medium text-slate-500">
          Register for the College Donor Network & Emergency Coordination System
        </p>
      </div>

      {/* Role Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-200/60 backdrop-blur-sm rounded-2xl">
        <button
          type="button"
          onClick={() => setRole('DONOR')}
          className={`py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center space-x-1 ${
            role === 'DONOR' ? 'bg-white text-blood-600 shadow-sm scale-[1.02]' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Donor</span>
        </button>
        <button
          type="button"
          onClick={() => setRole('RECIPIENT')}
          className={`py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center space-x-1 ${
            role === 'RECIPIENT' ? 'bg-white text-amber-600 shadow-sm scale-[1.02]' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Recipient</span>
        </button>
        <button
          type="button"
          onClick={() => setRole('CAMPUS_ADMIN')}
          className={`py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center space-x-1 ${
            role === 'CAMPUS_ADMIN' ? 'bg-white text-purple-700 shadow-sm scale-[1.02]' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Campus Admin</span>
        </button>
        <button
          type="button"
          onClick={() => setRole('AUTHORIZED_BLOOD_BANK')}
          className={`py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center space-x-1 ${
            role === 'AUTHORIZED_BLOOD_BANK' ? 'bg-white text-blue-700 shadow-sm scale-[1.02]' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Blood Bank</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* DONOR / STUDENT / FACULTY FORM */}
        {role === 'DONOR' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Campus / Institution</label>
                <input
                  type="text"
                  name="college"
                  value={formData.college}
                  onChange={handleChange}
                  placeholder="e.g. National Institute of Technology"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Affiliation</label>
                <select
                  name="userType"
                  value={formData.userType}
                  onChange={handleChange}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl font-bold"
                >
                  {USER_TYPES.map(ut => <option key={ut.value} value={ut.value}>{ut.label}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {formData.userType === 'FACULTY' ? 'Faculty / Employee ID' : 'Student Roll Number'}
                </label>
                <input
                  type="text"
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleChange}
                  placeholder={formData.userType === 'FACULTY' ? 'e.g. FAC-ECE-04' : 'e.g. 22CS1048'}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl uppercase font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">College Department</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl"
              >
                {COLLEGE_DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl font-black text-blood-600"
                >
                  {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hostel / Hall</label>
                <input
                  type="text"
                  name="hostel"
                  value={formData.hostel}
                  onChange={handleChange}
                  placeholder="e.g. Hostel 3 / Day Scholar"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Campus Availability Status</label>
              <select
                name="availabilityStatus"
                value={formData.availabilityStatus}
                onChange={handleChange}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl font-medium"
              >
                <option value="AVAILABLE">Available on Campus (Ready to donate in emergencies)</option>
                <option value="TEMP_UNAVAILABLE">Temporarily Unavailable (Unwell / Exams / Medication)</option>
                <option value="AWAY_FROM_CAMPUS">Away from Campus (Vacation / Leave)</option>
              </select>
            </div>
          </>
        )}

        {/* RECIPIENT FORM */}
        {role === 'RECIPIENT' && (
          <>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Recipient / Requester Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Priya Patel (Patient Attendant / Student)"
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">College / Campus</label>
                <input
                  type="text"
                  name="college"
                  value={formData.college}
                  onChange={handleChange}
                  placeholder="e.g. National Institute of Technology"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl"
                >
                  {COLLEGE_DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group Needed</label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl font-black text-blood-600"
                >
                  {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hostel / Campus Location</label>
                <input
                  type="text"
                  name="hostel"
                  value={formData.hostel}
                  onChange={handleChange}
                  placeholder="e.g. Gargi Hostel / Campus Clinic"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl"
                />
              </div>
            </div>
          </>
        )}

        {/* CAMPUS ADMIN FORM */}
        {role === 'CAMPUS_ADMIN' && (
          <>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Administrator / Coordinator Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Prof. Ramesh K. (NSS Coordinator)"
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">College / Campus</label>
                <input
                  type="text"
                  name="college"
                  value={formData.college}
                  onChange={handleChange}
                  placeholder="e.g. National Institute of Technology"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Campus Unit / Office</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="e.g. NSS Cell / Youth Red Cross / Student Affairs"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl"
                  required
                />
              </div>
            </div>
          </>
        )}

        {/* AUTHORIZED BLOOD BANK FORM */}
        {role === 'AUTHORIZED_BLOOD_BANK' && (
          <>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Authorized Blood Bank / Hospital Name</label>
              <input
                type="text"
                name="hospitalName"
                value={formData.hospitalName}
                onChange={handleChange}
                placeholder="e.g. District Red Cross Society Blood Bank"
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Drug License / Regulatory Number</label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  placeholder="e.g. LIC-KA-BL-2024-0089"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nodal Medical Officer / Contact</label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  placeholder="e.g. Dr. Suresh Babu"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">City / Region</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. Bangalore"
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl"
                required
              />
            </div>
          </>
        )}

        {/* SHARED CONTACT & PASSWORD */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Official Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. student@campus.edu.in"
              className="w-full p-2.5 text-xs border border-slate-300 rounded-xl"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number (India)</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              className="w-full p-2.5 text-xs border border-slate-300 rounded-xl"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Min 6 characters"
            className="w-full p-2.5 text-xs border border-slate-300 rounded-xl"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-blood-600 to-blood-500 hover:from-blood-500 hover:to-blood-400 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_8px_20px_rgb(239,68,68,0.25)] transition-all disabled:opacity-50"
        >
          {loading ? 'Registering...' : 'Register for Campus Blood Network'}
        </button>
      </form>

      <p className="text-center text-xs text-slate-500">
        Already registered?{' '}
        <Link to="/login" className="font-bold text-blood-600 hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
};
