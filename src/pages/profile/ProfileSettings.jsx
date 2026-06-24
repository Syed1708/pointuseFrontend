import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSelector, useDispatch } from 'react-redux';
import { 
  FiUser, FiLock, FiShield, FiSave, 
  FiCheckCircle, FiCamera 
} from 'react-icons/fi';
import toast from 'react-hot-toast';

import api from '../../services/api';
import { updateUser } from '../../store/authSlice';
import { editProfileSchema, changePasswordSchema } from './profileValidation';

export default function ProfileSettings() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const fileInputRef = useRef(null); // Ref to trigger native file input
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'security'

  // ==========================================
  // FORM 1: EDIT PROFILE DETAILS
  // ==========================================
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    setValue: setProfileValue,
    formState: { errors: errorsProfile, isSubmitting: isSubmittingProfile }
  } = useForm({
    resolver: zodResolver(editProfileSchema),
  });

  // Pre-fill profile fields with current Redux state on mount
  useEffect(() => {
    if (user) {
      setProfileValue('name', user.name);
      setProfileValue('email', user.email);
    }
  }, [user, setProfileValue]);

  const onProfileSubmit = async (data) => {
    try {
          // 🛑 Safe check: uses user._id if it exists, otherwise falls back to user.id [2]
    const userId = user._id || user.id; 
    
    const res = await api.put(`/users/${userId}`, data);
      
      // Update local Redux store user object state [2]
      dispatch(updateUser({ name: res.data.user.name, email: res.data.user.email }));
      toast.success('Profile details updated successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    }
  };

  // ==========================================
  // AVATAR PHOTO UPLOAD HANDLER
  // ==========================================
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size locally (< 3MB)
    if (file.size > 3 * 1024 * 1024) {
      return toast.error('File is too large. Max size is 3MB.');
    }

    const formData = new FormData();
    formData.append('avatar', file); // 'avatar' matches req.file name in Multer [3]

    try {
      const res = await api.post('/users/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Instantly update Redux store with the new URL [2]
      dispatch(updateUser({ avatar: res.data.avatar }));
      toast.success('Profile picture updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload photo.');
    }
  };

  // ==========================================
  // FORM 2: CHANGE PASSWORD
  // ==========================================
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPasswordForm,
    formState: { errors: errorsPassword, isSubmitting: isSubmittingPassword }
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
  });

  const onPasswordSubmit = async (data) => {
    try {
      await api.post('/users/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      toast.success('Your password has been changed successfully.');
      resetPasswordForm(); // Clears password inputs safely
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Block */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 transition-colors">
          Account Settings
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Manage your profile details, edit your contact info, and configure security parameters.
        </p>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        {/* Left Side: Tabs Navigation Bar */}
        <aside className="w-full md:w-64 space-y-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex w-full items-center rounded-lg px-3 py-2 text-sm font-semibold transition ${
              activeTab === 'profile'
                ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-50'
            }`}
          >
            <FiUser className="mr-3 h-4 w-4" /> Profile Details
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex w-full items-center rounded-lg px-3 py-2 text-sm font-semibold transition ${
              activeTab === 'security'
                ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-50'
            }`}
          >
            <FiLock className="mr-3 h-4 w-4" /> Password Security
          </button>
        </aside>

        {/* Right Side: Tab Viewport Panel */}
        <div className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm transition-colors">
          
          {/* TAB 1: PROFILE FORM & AVATAR UPLOAD */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Profile Information</h3>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">Update your account photo, public name, and email address.</p>
              </div>

              {/* Profile Avatar Block */}
              <div className="flex flex-col items-center space-y-3 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0 border-t border-zinc-100 dark:border-zinc-800 pt-6">
                <div className="relative group h-20 w-20">
                  {/* Photo Display (Fallback to Text Circle if no photo is uploaded) */}
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className="h-20 w-20 rounded-full object-cover border border-zinc-200 dark:border-zinc-800 shadow-sm"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 font-bold text-2xl flex items-center justify-center uppercase shadow-sm">
                      {user?.name?.charAt(0)}
                    </div>
                  )}

                  {/* Camera Hover Overlay (Triggered on hover) */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition duration-150 cursor-pointer"
                  >
                    <FiCamera className="h-5 w-5" />
                  </button>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Profile Picture</h4>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">JPG, PNG or WEBP. Max size 3MB.</p>
                  
                  {/* Hidden Native File Input */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handlePhotoUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="mt-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                  >
                    Change photo
                  </button>
                </div>
              </div>

              {/* Profile Fields Form */}
              <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="space-y-5 border-t border-zinc-100 dark:border-zinc-800 pt-6">
                {/* Full Name Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Full Name</label>
                  <input
                    {...registerProfile('name')}
                    type="text"
                    className="block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none transition-colors"
                  />
                  {errorsProfile.name && <p className="text-xs text-red-500">{errorsProfile.name.message}</p>}
                </div>

                {/* Email Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Email Address</label>
                  <input
                    {...registerProfile('email')}
                    type="email"
                    className="block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none transition-colors"
                  />
                  {errorsProfile.email && <p className="text-xs text-red-500">{errorsProfile.email.message}</p>}
                </div>

                {/* Assigned Role (Read-only badge) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Assigned Role</label>
                  <span className="inline-flex items-center rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300 capitalize">
                    <FiShield className="mr-1.5 h-3.5 w-3.5 text-zinc-500" /> {user?.role?.name || 'No Role'}
                  </span>
                </div>

                <div className="flex justify-end pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="submit"
                    disabled={isSubmittingProfile}
                    className="flex items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-50 px-4 py-2 text-sm font-semibold text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:bg-zinc-400 transition shadow-sm"
                  >
                    <FiSave className="mr-2 h-4 w-4" /> Save Profile Details
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: CHANGE PASSWORD */}
          {activeTab === 'security' && (
            <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-5">
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Change Password</h3>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">Ensure your account is using a secure and robust password.</p>
              </div>

              <div className="space-y-4 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                {/* Current Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Current Password</label>
                  <input
                    {...registerPassword('currentPassword')}
                    type="password"
                    placeholder="••••••••"
                    className="block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none transition-colors"
                  />
                  {errorsPassword.currentPassword && <p className="text-xs text-red-500">{errorsPassword.currentPassword.message}</p>}
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">New Password</label>
                  <input
                    {...registerPassword('newPassword')}
                    type="password"
                    placeholder="••••••••"
                    className="block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none transition-colors"
                  />
                  {errorsPassword.newPassword && <p className="text-xs text-red-500">{errorsPassword.newPassword.message}</p>}
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Confirm New Password</label>
                  <input
                    {...registerPassword('confirmPassword')}
                    type="password"
                    placeholder="••••••••"
                    className="block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none transition-colors"
                  />
                  {errorsPassword.confirmPassword && <p className="text-xs text-red-500">{errorsPassword.confirmPassword.message}</p>}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="submit"
                  disabled={isSubmittingPassword}
                  className="flex items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-50 px-4 py-2 text-sm font-semibold text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-400 transition shadow-sm"
                >
                  <FiSave className="mr-2 h-4 w-4" /> Change Password
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}