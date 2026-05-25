import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const Settings = () => {
  const { user, setUser } = useAuth();
  const toast = useToast();

  // Profile fields state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password fields state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Handle profile submit
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileData.name.trim() || !profileData.email.trim()) {
      toast.warning('Name and Email cannot be empty');
      return;
    }

    setProfileLoading(true);
    try {
      const response = await api.put('/auth/profile', {
        name: profileData.name,
        email: profileData.email,
      });

      if (response.data?.success) {
        setUser(response.data.data);
        toast.success('Profile updated successfully');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle password submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.warning('All password fields are required');
      return;
    }

    if (newPassword.length < 6) {
      toast.warning('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await api.put('/auth/password', {
        currentPassword,
        newPassword,
      });

      if (response.data?.success) {
        toast.success('Password changed successfully');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-crm-text">Account Settings</h1>
        <p className="text-crm-textMuted mt-1">Manage your account information and security preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Card */}
        <div className="glass-panel rounded-xl p-6 border border-crm-border/60">
          <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-crm-border/40">
            <div className="p-2 bg-crm-primary/10 rounded-lg text-crm-primary">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-crm-text">Personal Profile</h2>
              <p className="text-xs text-crm-textMuted">Update your name and primary contact email.</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-crm-textMuted uppercase tracking-wider mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="w-full bg-crm-dark border border-crm-border focus:border-crm-primary rounded-lg px-4 py-2.5 text-sm text-crm-text outline-none transition-all focus:ring-1 focus:ring-crm-primary"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-crm-textMuted uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className="w-full bg-crm-dark border border-crm-border focus:border-crm-primary rounded-lg px-4 py-2.5 text-sm text-crm-text outline-none transition-all focus:ring-1 focus:ring-crm-primary"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-crm-textMuted uppercase tracking-wider mb-2">
                System Role
              </label>
              <input
                type="text"
                value={user?.role || 'Employee'}
                disabled
                className="w-full bg-crm-border/20 border border-crm-border/30 rounded-lg px-4 py-2.5 text-sm text-crm-textMuted outline-none cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="w-full bg-crm-primary hover:bg-crm-primaryHover text-white py-2.5 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-crm-primary/50 disabled:opacity-50 active:scale-98"
            >
              {profileLoading ? 'Saving...' : 'Save Profile Details'}
            </button>
          </form>
        </div>

        {/* Password Card */}
        <div className="glass-panel rounded-xl p-6 border border-crm-border/60">
          <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-crm-border/40">
            <div className="p-2 bg-crm-warning/10 rounded-lg text-crm-warning">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-crm-text">Security credentials</h2>
              <p className="text-xs text-crm-textMuted">Change your login password at any time.</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-crm-textMuted uppercase tracking-wider mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full bg-crm-dark border border-crm-border focus:border-crm-primary rounded-lg px-4 py-2.5 text-sm text-crm-text outline-none transition-all focus:ring-1 focus:ring-crm-primary"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-crm-textMuted uppercase tracking-wider mb-2">
                New Password
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full bg-crm-dark border border-crm-border focus:border-crm-primary rounded-lg px-4 py-2.5 text-sm text-crm-text outline-none transition-all focus:ring-1 focus:ring-crm-primary"
                placeholder="Min 6 characters"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-crm-textMuted uppercase tracking-wider mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full bg-crm-dark border border-crm-border focus:border-crm-primary rounded-lg px-4 py-2.5 text-sm text-crm-text outline-none transition-all focus:ring-1 focus:ring-crm-primary"
                placeholder="Confirm new password"
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full bg-crm-primary hover:bg-crm-primaryHover text-white py-2.5 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-crm-primary/50 disabled:opacity-50 active:scale-98"
            >
              {passwordLoading ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
