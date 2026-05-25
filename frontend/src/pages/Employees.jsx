import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import {
  Users,
  Plus,
  TrendingUp,
  TrendingDown,
  Mail,
  Shield,
  Loader,
  AlertCircle,
  X,
  ToggleLeft,
  ToggleRight,
  Edit2,
  Trash2,
  Search,
} from 'lucide-react';

const Employees = () => {
  const { user } = useAuth();
  const toast = useToast();

  // Data States
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search Filter State
  const [searchQuery, setSearchQuery] = useState('');

  // Invite Modal States
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Employee',
  });

  // Edit Modal States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [employeeToEdit, setEmployeeToEdit] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    role: 'Employee',
  });

  // Delete Confirm States
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  // Fetch performance report
  const fetchPerformanceData = async () => {
    try {
      const response = await api.get('/employees/performance');
      if (response.data?.success) {
        setEmployees(response.data.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch team performance statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  // Provision employee handler
  const handleInvite = async (e) => {
    e.preventDefault();
    if (!newEmployee.name.trim() || !newEmployee.email.trim() || !newEmployee.password.trim()) {
      return setInviteError('Please enter all required employee fields.');
    }
    setInviteLoading(true);
    setInviteError('');
    try {
      const response = await api.post('/employees', newEmployee);
      if (response.data?.success) {
        toast.success(`Account for "${newEmployee.name}" successfully provisioned`);
        setInviteModalOpen(false);
        setNewEmployee({ name: '', email: '', password: '', role: 'Employee' });
        fetchPerformanceData(); // Refresh UI
      }
    } catch (err) {
      setInviteError(err.message || 'Failed to create employee profile.');
    } finally {
      setInviteLoading(false);
    }
  };

  // Edit employee details handler
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      return setEditError('Name is required');
    }
    setEditLoading(true);
    setEditError('');
    try {
      const response = await api.put(`/employees/${employeeToEdit}`, editForm);
      if (response.data?.success) {
        toast.success(`Account details updated successfully`);
        setEditModalOpen(false);
        setEmployeeToEdit(null);
        fetchPerformanceData();
      }
    } catch (err) {
      setEditError(err.message || 'Failed to update employee details.');
    } finally {
      setEditLoading(false);
    }
  };

  // Open Edit Modal with prefilled data
  const handleOpenEdit = (emp) => {
    setEmployeeToEdit(emp._id);
    setEditForm({
      name: emp.name,
      role: emp.role,
    });
    setEditError('');
    setEditModalOpen(true);
  };

  // Trigger Delete confirmation
  const promptDeleteEmployee = (emp) => {
    setEmployeeToDelete(emp);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    try {
      const response = await api.delete(`/employees/${employeeToDelete._id}`);
      if (response.data?.success) {
        toast.success(`Account for "${employeeToDelete.name}" has been deleted, and assigned leads unassigned`);
        fetchPerformanceData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete employee account');
    }
  };

  // Toggle account active status handler
  const handleToggleStatus = async (empId, empName, currentStatus) => {
    try {
      const response = await api.put(`/employees/${empId}/toggle`);
      if (response.data?.success) {
        toast.success(`Account for "${empName}" has been successfully ${currentStatus ? 'suspended' : 'reactivated'}`);
        fetchPerformanceData(); // Refresh metrics
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update employee account status.');
    }
  };

  // Client-side search filtering
  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Gradient colors for avatar badges
  const avatarGradients = [
    'from-crm-primary to-indigo-500',
    'from-emerald-400 to-teal-500',
    'from-amber-400 to-orange-500',
    'from-red-400 to-pink-500',
    'from-sky-400 to-blue-500',
    'from-purple-400 to-violet-500',
  ];

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader className="h-10 w-10 animate-spin text-crm-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Employee Performance Analytics</h1>
          <p className="mt-1 text-sm text-crm-textMuted font-medium">
            Monitor sales conversions, closed deal values, and status ratios.
          </p>
        </div>
        {user.role === 'Admin' && (
          <button
            onClick={() => setInviteModalOpen(true)}
            className="flex items-center justify-center space-x-2 rounded-xl bg-crm-primary px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-all duration-300 hover:bg-crm-primaryHover active:scale-98 cursor-pointer"
          >
            <Plus className="h-5 w-5" />
            <span>Provision Team Member</span>
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-start space-x-2.5 rounded-2xl bg-red-500/10 border border-red-500/25 p-4 text-sm text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and search panel */}
      <div className="glass-panel rounded-2xl p-4 border border-crm-border/60 max-w-md">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-crm-textMuted">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employees by name or email..."
            className="w-full bg-crm-dark border border-crm-border focus:border-crm-primary rounded-xl py-2 pl-9 pr-4 text-xs text-crm-text outline-none transition-all"
          />
        </div>
      </div>

      {/* Analytics Performance Grid */}
      {filteredEmployees.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-crm-border/80 bg-crm-card/50">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="border-b border-crm-border bg-crm-dark/40 font-bold text-crm-textMuted">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-center">Leads Assigned</th>
                <th className="px-6 py-4 text-center">Deals Converted</th>
                <th className="px-6 py-4">Conversion Rate</th>
                <th className="px-6 py-4">Revenue Earned</th>
                <th className="px-6 py-4">Status</th>
                {user.role === 'Admin' && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-crm-border/40 font-medium">
              {filteredEmployees.map((emp, idx) => (
                <tr key={emp._id} className="transition-all hover:bg-crm-border/20 group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      {/* Premium initials gradient avatar */}
                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${avatarGradients[idx % avatarGradients.length]} text-white font-extrabold text-xs shrink-0 shadow-md select-none`}>
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm group-hover:text-crm-primary transition-colors">{emp.name}</div>
                        <div className="text-crm-textMuted text-[10px] mt-0.5">{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block rounded px-1.5 py-0.5 text-xxs font-semibold border ${
                      emp.role === 'Manager'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/25'
                    }`}>
                      {emp.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-white font-semibold">{emp.totalLeads}</td>
                  <td className="px-6 py-4 text-center text-white font-semibold">{emp.convertedLeads}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col justify-center">
                      <div className="flex items-center space-x-1.5 font-bold">
                        {emp.conversionRate >= 20 ? (
                          <TrendingUp className="h-4 w-4 text-crm-success" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-crm-danger" />
                        )}
                        <span className={emp.conversionRate >= 20 ? 'text-crm-success' : 'text-crm-textMuted'}>
                          {emp.conversionRate}%
                        </span>
                      </div>
                      {/* Micro Progress Bar */}
                      <div className="w-24 bg-crm-border/40 h-1.5 rounded-full overflow-hidden mt-1.5">
                        <div
                          className={`h-full rounded-full ${emp.conversionRate >= 25 ? 'bg-crm-success' : emp.conversionRate >= 10 ? 'bg-crm-warning' : 'bg-crm-danger'}`}
                          style={{ width: `${Math.min(emp.conversionRate, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-crm-success font-extrabold text-sm font-mono">
                    ${emp.closedRevenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block rounded px-1.5 py-0.5 text-xxs font-semibold uppercase tracking-wider ${
                      emp.isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                        : 'bg-red-500/10 text-red-400 border border-red-500/25'
                    }`}>
                      {emp.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  {user.role === 'Admin' && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2.5">
                        {/* Suspension Toggle */}
                        <button
                          onClick={() => handleToggleStatus(emp._id, emp.name, emp.isActive)}
                          className={`p-1.5 rounded-lg transition-colors border focus:outline-none ${
                            emp.isActive
                              ? 'text-crm-success border-crm-success/20 bg-crm-success/5 hover:bg-crm-success/15'
                              : 'text-crm-textMuted border-crm-border bg-crm-border/20 hover:bg-crm-border/60'
                          }`}
                          title={emp.isActive ? 'Suspend Account' : 'Reactivate Account'}
                        >
                          {emp.isActive ? (
                            <ToggleRight className="h-4.5 w-4.5" />
                          ) : (
                            <ToggleLeft className="h-4.5 w-4.5" />
                          )}
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          className="p-1.5 rounded-lg border border-crm-border bg-crm-card hover:bg-crm-cardHover text-crm-textMuted hover:text-white transition-colors focus:outline-none"
                          title="Edit Account Details"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => promptDeleteEmployee(emp)}
                          className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors focus:outline-none"
                          title="Delete Account"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-crm-border/60 p-12 text-center">
          <p className="text-sm text-crm-textMuted">No team members match your search filter query.</p>
        </div>
      )}

      {/* Provision Employee Modal Dialogue */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setInviteModalOpen(false)} />
          <div className="relative w-full max-w-md glass-panel rounded-3xl p-6 shadow-glass border border-crm-border/60 animate-scale-up z-10" style={{ background: 'rgba(21, 28, 44, 0.95)' }}>
            <div className="flex items-center justify-between border-b border-crm-border/60 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-crm-primary" />
                <h3 className="text-lg font-bold text-white">Create Employee Credentials</h3>
              </div>
              <button
                onClick={() => setInviteModalOpen(false)}
                className="rounded-lg p-1.5 text-crm-textMuted hover:bg-crm-border hover:text-crm-text focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {inviteError && (
              <div className="mb-4 flex items-start space-x-2.5 rounded-xl bg-red-500/10 border border-red-500/25 p-3 text-xs text-red-400 animate-bounce">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{inviteError}</span>
              </div>
            )}

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-crm-textMuted mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  placeholder="e.g. Charlie Brown"
                  className="w-full bg-crm-dark border border-crm-border focus:border-crm-primary rounded-xl px-3.5 py-2.5 text-sm text-crm-text outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-crm-textMuted mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  placeholder="e.g. charlie@company.com"
                  className="w-full bg-crm-dark border border-crm-border focus:border-crm-primary rounded-xl px-3.5 py-2.5 text-sm text-crm-text outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-crm-textMuted mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={newEmployee.password}
                  onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-crm-dark border border-crm-border focus:border-crm-primary rounded-xl px-3.5 py-2.5 text-sm text-crm-text outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-crm-textMuted mb-1.5">
                  Authorized Role
                </label>
                <select
                  value={newEmployee.role}
                  onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                  className="w-full bg-crm-dark border border-crm-border focus:border-crm-primary rounded-xl px-3.5 py-2.5 text-sm text-crm-text outline-none"
                >
                  <option value="Employee">Employee (Standard Sales Agent)</option>
                  <option value="Manager">Manager (Regional Sales Manager)</option>
                </select>
              </div>

              <div className="mt-6 flex justify-end space-x-2 border-t border-crm-border/40 pt-4">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="rounded-xl border border-crm-border bg-crm-card px-4 py-2.5 text-xs text-crm-text hover:bg-crm-cardHover"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="rounded-xl bg-crm-primary px-4 py-2.5 text-xs font-semibold text-white shadow-glow hover:bg-crm-primaryHover disabled:opacity-50 active:scale-98 cursor-pointer"
                >
                  {inviteLoading ? 'Creating...' : 'Provision User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal Dialogue */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setEditModalOpen(false)} />
          <div className="relative w-full max-w-md glass-panel rounded-3xl p-6 shadow-glass border border-crm-border/60 animate-scale-up z-10" style={{ background: 'rgba(21, 28, 44, 0.95)' }}>
            <div className="flex items-center justify-between border-b border-crm-border/60 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-crm-primary" />
                <h3 className="text-lg font-bold text-white">Modify Employee Profile</h3>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="rounded-lg p-1.5 text-crm-textMuted hover:bg-crm-border hover:text-crm-text focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {editError && (
              <div className="mb-4 flex items-start space-x-2.5 rounded-xl bg-red-500/10 border border-red-500/25 p-3 text-xs text-red-400 animate-bounce">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-crm-textMuted mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="e.g. Charlie Brown"
                  className="w-full bg-crm-dark border border-crm-border focus:border-crm-primary rounded-xl px-3.5 py-2.5 text-sm text-crm-text outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-crm-textMuted mb-1.5">
                  Authorized Role
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full bg-crm-dark border border-crm-border focus:border-crm-primary rounded-xl px-3.5 py-2.5 text-sm text-crm-text outline-none"
                >
                  <option value="Employee">Employee (Standard Sales Agent)</option>
                  <option value="Manager">Manager (Regional Sales Manager)</option>
                </select>
              </div>

              <div className="mt-6 flex justify-end space-x-2 border-t border-crm-border/40 pt-4">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="rounded-xl border border-crm-border bg-crm-card px-4 py-2.5 text-xs text-crm-text hover:bg-crm-cardHover"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="rounded-xl bg-crm-primary px-4 py-2.5 text-xs font-semibold text-white shadow-glow hover:bg-crm-primaryHover disabled:opacity-50 active:scale-98 cursor-pointer"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Employee Deletion"
        message={`Are you absolutely sure you want to permanently delete the account for "${employeeToDelete?.name}"? Doing so will purge their credentials, and all leads currently assigned to them will be instantly set to Unassigned to avoid pipeline leaks.`}
        confirmText="Yes, Delete User"
        cancelText="Cancel"
      />
    </div>
  );
};

export default Employees;
