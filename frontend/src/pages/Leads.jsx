import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import {
  Briefcase,
  Search,
  Filter,
  Plus,
  ArrowLeft,
  ArrowRight,
  Eye,
  Trash2,
  Loader,
  AlertCircle,
  X,
  Download,
  CheckSquare,
  Square,
  ArrowUpDown,
  Calendar,
} from 'lucide-react';

const Leads = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Data States
  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Sorting States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Bulk Selection States
  const [selectedLeads, setSelectedLeads] = useState([]);

  // Modal / Confirm States
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

  // Form State for creating Lead
  const [newLead, setNewLead] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    source: 'Direct',
    estimatedValue: 0,
    assignedTo: '',
    priority: 'Medium',
    status: 'New',
    interestedService: '',
    notes: '',
    budget: 0,
    followUpDate: '',
  });

  const statuses = ['New', 'Contacted', 'Interested', 'Follow-up', 'Proposal Sent', 'Converted', 'Rejected'];

  // Fetch Leads
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
      };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (sourceFilter) params.source = sourceFilter;
      if (assigneeFilter) params.assignedTo = assigneeFilter;

      const response = await api.get('/leads', { params });
      if (response.data?.success) {
        setLeads(response.data.data);
        setPagination(response.data.pagination);
        setSelectedLeads([]); // Reset selection
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve leads pipeline.');
    }
    finally {
      setLoading(false);
    }
  };

  // Fetch Employees for assignment lists (Only Admin/Manager)
  useEffect(() => {
    const fetchEmployees = async () => {
      if (user.role === 'Employee') return;
      try {
        const response = await api.get('/employees');
        if (response.data?.success) {
          setEmployees(response.data.data);
        }
      } catch (err) {
        console.error('Failed to load employee list', err.message);
      }
    };
    fetchEmployees();
  }, [user]);

  // Trigger leads fetch on filter modifications
  useEffect(() => {
    fetchLeads();
  }, [page, statusFilter, sourceFilter, assigneeFilter]);

  // Debounced Search Effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      fetchLeads();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  // Confirm delete handler
  const promptDeleteLead = (leadId) => {
    setLeadToDelete(leadId);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!leadToDelete) return;
    try {
      const response = await api.delete(`/leads/${leadToDelete}`);
      if (response.data?.success) {
        toast.success('Lead and associated data removed successfully');
        fetchLeads();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to remove lead');
    }
  };

  // Lead creation handler
  const handleCreateLead = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');
    try {
      const leadData = { ...newLead };
      if (!leadData.assignedTo) delete leadData.assignedTo;
      if (!leadData.followUpDate) delete leadData.followUpDate;

      const response = await api.post('/leads', leadData);
      if (response.data?.success) {
        setModalOpen(false);
        toast.success(`Prospect "${newLead.name}" has been successfully added to CRM`);
        // Reset Modal Form
        setNewLead({
          name: '',
          company: '',
          email: '',
          phone: '',
          source: 'Direct',
          estimatedValue: 0,
          assignedTo: '',
          priority: 'Medium',
          status: 'New',
          interestedService: '',
          notes: '',
          budget: 0,
          followUpDate: '',
        });
        fetchLeads(); // Refresh Table
      }
    } catch (err) {
      setModalError(err.message || 'Failed to create lead.');
    } finally {
      setModalLoading(false);
    }
  };

  // CSV Export handler
  const handleExportCSV = () => {
    const leadsToExport = selectedLeads.length > 0
      ? leads.filter(l => selectedLeads.includes(l._id))
      : leads;

    if (leadsToExport.length === 0) {
      toast.warning('No leads available to export');
      return;
    }

    const headers = ['Name', 'Company', 'Email', 'Phone', 'Source', 'Status', 'Priority', 'Budget ($)', 'Estimated Value ($)', 'Assigned To'];
    const csvRows = [headers.join(',')];

    leadsToExport.forEach(lead => {
      const row = [
        `"${lead.name.replace(/"/g, '""')}"`,
        `"${(lead.company || '').replace(/"/g, '""')}"`,
        `"${(lead.email || '').replace(/"/g, '""')}"`,
        `"${lead.phone}"`,
        `"${lead.source}"`,
        `"${lead.status}"`,
        `"${lead.priority || 'Medium'}"`,
        lead.budget || 0,
        lead.estimatedValue || 0,
        `"${(lead.assignedTo?.name || 'Unassigned').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mini_crm_leads_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${leadsToExport.length} leads exported to CSV successfully`);
  };

  // Sorting columns handler
  const requestSort = (key) => {
    let order = 'asc';
    if (sortBy === key && sortOrder === 'asc') {
      order = 'desc';
    }
    setSortBy(key);
    setSortOrder(order);
  };

  const getSortedLeads = () => {
    return [...leads].sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'assignedTo') {
        valA = a.assignedTo?.name || '';
        valB = b.assignedTo?.name || '';
      }

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  };

  // Checkbox management
  const handleSelectLead = (id) => {
    setSelectedLeads((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllLeads = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leads.map((l) => l._id));
    }
  };

  // Bulk Delete Handler
  const handleBulkDelete = async () => {
    setBulkDeleteConfirmOpen(true);
  };

  const handleConfirmBulkDelete = async () => {
    try {
      let successes = 0;
      await Promise.all(
        selectedLeads.map(async (leadId) => {
          try {
            await api.delete(`/leads/${leadId}`);
            successes++;
          } catch (err) {
            console.error('Failed to delete lead in bulk', leadId, err.message);
          }
        })
      );
      toast.success(`Successfully removed ${successes} selected leads`);
      fetchLeads();
    } catch (err) {
      toast.error('Bulk deletion encounter errors');
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'New':
        return 'bg-sky-500/10 text-sky-400 border border-sky-500/25';
      case 'Contacted':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/25';
      case 'Interested':
        return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/25';
      case 'Follow-up':
        return 'bg-amber-500/10 text-amber-500 border border-amber-500/25';
      case 'Proposal Sent':
        return 'bg-violet-500/10 text-violet-400 border border-violet-500/25';
      case 'Converted':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25';
      case 'Rejected':
        return 'bg-red-500/10 text-red-400 border border-red-500/25';
      default:
        return 'bg-crm-border/60 text-crm-textMuted border border-crm-border';
    }
  };

  const getPriorityBadgeStyle = (priority) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-500/15 text-red-400 border border-red-500/30';
      case 'High':
        return 'bg-orange-500/15 text-orange-400 border border-orange-500/30';
      case 'Medium':
        return 'bg-blue-500/15 text-blue-400 border border-blue-500/30';
      default:
        return 'bg-slate-500/15 text-slate-400 border border-slate-500/30';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in relative pb-16">
      {/* Header section */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Pipeline Leads</h1>
          <p className="mt-1 text-sm text-crm-textMuted font-medium">
            Manage, assign, and track sales prospects across conversion stages.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 rounded-xl border border-crm-border bg-crm-card hover:bg-crm-cardHover px-4 py-2.5 text-sm font-semibold text-crm-text transition-all duration-300 active:scale-98"
          >
            <Download className="h-4.5 w-4.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center justify-center space-x-2 rounded-xl bg-crm-primary px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-all duration-300 hover:bg-crm-primaryHover active:scale-98"
          >
            <Plus className="h-5 w-5" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Advanced Filter Chips Panel */}
      <div className="glass-panel rounded-3xl p-6 border border-crm-border/60">
        <h3 className="text-xxs font-bold text-crm-textMuted uppercase tracking-wider mb-3">Quick Filter by Status</h3>
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => { setStatusFilter(''); setPage(1); }}
            className={`px-3.5 py-1.5 rounded-full text-xxs font-semibold border transition-all cursor-pointer ${
              statusFilter === ''
                ? 'bg-crm-primary text-white border-crm-primary shadow-glow'
                : 'bg-crm-card/50 text-crm-textMuted border-crm-border hover:text-crm-text hover:bg-crm-card'
            }`}
          >
            All Statuses
          </button>
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setPage(1); }}
              className={`px-3.5 py-1.5 rounded-full text-xxs font-semibold border transition-all cursor-pointer ${
                statusFilter === status
                  ? 'bg-crm-primary text-white border-crm-primary shadow-glow'
                  : 'bg-crm-card/50 text-crm-textMuted border-crm-border hover:text-crm-text hover:bg-crm-card'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search Box */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-crm-textMuted">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads, email, company..."
              className="w-full rounded-xl border border-crm-border bg-crm-dark/50 py-2.5 pl-10 pr-4 text-xs text-crm-text placeholder-crm-textMuted/60 focus:border-crm-primary focus:outline-none"
            />
          </div>

          {/* Source Filter */}
          <div>
            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-crm-border bg-crm-dark/50 px-3 py-2.5 text-xs text-crm-text focus:border-crm-primary focus:outline-none focus:ring-1 focus:ring-crm-primary"
            >
              <option value="">All Sources</option>
              <option value="Direct">Direct</option>
              <option value="Website">Website</option>
              <option value="Referral">Referral</option>
              <option value="Cold Call">Cold Call</option>
              <option value="Google Ads">Google Ads</option>
              <option value="Social Media">Social Media</option>
            </select>
          </div>

          {/* Assignee Filter */}
          {user.role !== 'Employee' ? (
            <div>
              <select
                value={assigneeFilter}
                onChange={(e) => {
                  setAssigneeFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-crm-border bg-crm-dark/50 px-3 py-2.5 text-xs text-crm-text focus:border-crm-primary focus:outline-none"
              >
                <option value="">All Assignees</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} ({emp.role})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center px-4 py-2.5 text-xs text-crm-textMuted bg-crm-dark/20 border border-crm-border/40 rounded-xl">
              Showing leads assigned to you
            </div>
          )}

          {/* Value summary */}
          <div className="flex items-center justify-end pr-2">
            <span className="text-xxs text-crm-textMuted font-bold uppercase tracking-wider">
              Filtered Sum:{' '}
              <span className="text-sm font-extrabold text-white pl-1 font-mono">
                ${leads.reduce((sum, lead) => sum + lead.estimatedValue, 0).toLocaleString()}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      {error && (
        <div className="flex items-start space-x-2.5 rounded-2xl bg-red-500/10 border border-red-500/25 p-4 text-sm text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader className="h-8 w-8 animate-spin text-crm-primary" />
        </div>
      ) : leads.length > 0 ? (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-crm-border/80 bg-crm-card/50">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="border-b border-crm-border bg-crm-dark/40 font-bold text-crm-textMuted">
                <tr>
                  <th className="px-6 py-4 w-12">
                    <button
                      onClick={handleSelectAllLeads}
                      className="text-crm-textMuted hover:text-crm-text focus:outline-none"
                    >
                      {selectedLeads.length === leads.length ? (
                        <CheckSquare className="h-4.5 w-4.5 text-crm-primary" />
                      ) : (
                        <Square className="h-4.5 w-4.5" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => requestSort('name')}>
                    <div className="flex items-center space-x-1.5">
                      <span>Lead Details</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => requestSort('phone')}>
                    <div className="flex items-center space-x-1.5">
                      <span>Contact Info</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => requestSort('priority')}>
                    <div className="flex items-center space-x-1.5">
                      <span>Priority</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => requestSort('status')}>
                    <div className="flex items-center space-x-1.5">
                      <span>Status</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-white text-right" onClick={() => requestSort('estimatedValue')}>
                    <div className="flex items-center justify-end space-x-1.5">
                      <span>Pipeline Value</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  {user.role !== 'Employee' && (
                    <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => requestSort('assignedTo')}>
                      <div className="flex items-center space-x-1.5">
                        <span>Assigned To</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                  )}
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-crm-border/40 font-medium">
                {getSortedLeads().map((lead) => (
                  <tr key={lead._id} className="transition-all hover:bg-crm-border/20 group">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleSelectLead(lead._id)}
                        className="text-crm-textMuted hover:text-crm-text focus:outline-none"
                      >
                        {selectedLeads.includes(lead._id) ? (
                          <CheckSquare className="h-4.5 w-4.5 text-crm-primary animate-scale-up" />
                        ) : (
                          <Square className="h-4.5 w-4.5" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-white text-sm group-hover:text-crm-primary transition-colors cursor-pointer" onClick={() => navigate(`/leads/${lead._id}`)}>
                        {lead.name}
                      </div>
                      <div className="text-crm-textMuted text-xxs mt-0.5">{lead.company || 'Private Buyer'}</div>
                    </td>
                    <td className="px-6 py-4 space-y-0.5">
                      <div className="text-white">{lead.phone}</div>
                      <div className="text-crm-textMuted text-[10px]">{lead.email || 'No email registered'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getPriorityBadgeStyle(lead.priority)}`}>
                        {lead.priority || 'Medium'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block rounded px-1.5 py-0.5 text-xxs font-semibold uppercase tracking-wider ${getStatusBadgeStyle(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-white font-mono font-bold">
                      ${lead.estimatedValue.toLocaleString()}
                    </td>
                    {user.role !== 'Employee' && (
                      <td className="px-6 py-4">
                        {lead.assignedTo ? (
                          <div className="flex items-center space-x-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-crm-primary animate-pulse" />
                            <span className="text-white">{lead.assignedTo.name}</span>
                          </div>
                        ) : (
                          <span className="text-crm-textMuted/60 text-xxs italic">Unassigned</span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => navigate(`/leads/${lead._id}`)}
                          className="rounded-lg p-2 text-crm-textMuted hover:bg-crm-border hover:text-crm-text focus:outline-none transition-colors"
                          title="View lead timeline & follow-ups"
                        >
                          <Eye className="h-4.5 w-4.5" />
                        </button>
                        {user.role !== 'Employee' && (
                          <button
                            onClick={() => promptDeleteLead(lead._id)}
                            className="rounded-lg p-2 text-red-500/60 hover:bg-red-500/10 hover:text-red-400 focus:outline-none transition-colors"
                            title="Remove lead"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controllers */}
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-xs text-crm-textMuted">
              Showing page <strong className="text-white">{pagination.page}</strong> of{' '}
              <strong className="text-white">{pagination.pages}</strong> ({pagination.total} total leads)
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={pagination.page === 1}
                className="flex items-center space-x-1 rounded-lg border border-crm-border bg-crm-card px-3 py-1.5 text-xs text-crm-text hover:bg-crm-border/60 disabled:opacity-40 disabled:pointer-events-none focus:outline-none active:scale-98"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Prev</span>
              </button>
              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, pagination.pages))}
                disabled={pagination.page === pagination.pages}
                className="flex items-center space-x-1 rounded-lg border border-crm-border bg-crm-card px-3 py-1.5 text-xs text-crm-text hover:bg-crm-border/60 disabled:opacity-40 disabled:pointer-events-none focus:outline-none active:scale-98"
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-crm-border/60 p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-crm-card text-crm-textMuted mb-4 border border-crm-border">
            <Briefcase className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No Leads Found</h3>
          <p className="mt-1 text-xs text-crm-textMuted">
            Try adjusting your search criteria or add a new lead to start logging.
          </p>
        </div>
      )}

      {/* Bulk actions floating bar */}
      {selectedLeads.length > 0 && (
        <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 glass-panel border border-crm-primary/40 rounded-full px-6 py-3 flex items-center space-x-6 shadow-2xl z-40 bg-crm-card/90 backdrop-blur-md animate-[scaleUp_0.2s_cubic-bezier(0.34,1.56,0.64,1)]">
          <span className="text-xs font-bold text-crm-text">
            <span className="text-crm-primary pl-1 pr-1 font-mono text-sm">{selectedLeads.length}</span> Leads selected
          </span>
          <div className="h-5 w-px bg-crm-border" />
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1 text-xxs font-bold text-white hover:text-crm-primary transition-colors focus:outline-none"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
            {user.role !== 'Employee' && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center space-x-1 text-xxs font-bold text-red-400 hover:text-red-300 transition-colors focus:outline-none"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Selected</span>
              </button>
            )}
          </div>
          <button
            onClick={() => setSelectedLeads([])}
            className="text-crm-textMuted hover:text-crm-text pl-2 focus:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Add Lead Dialog Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-xl glass-panel rounded-3xl p-6 shadow-glass border border-crm-border/60 animate-scale-up z-10" style={{ background: 'rgba(21, 28, 44, 0.95)' }}>
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-crm-border/65 pb-4 mb-5">
              <div className="flex items-center space-x-2.5">
                <Briefcase className="h-5 w-5 text-crm-primary" />
                <h3 className="text-lg font-bold text-white">Create Lead Record</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-crm-textMuted hover:bg-crm-border hover:text-crm-text focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 flex items-start space-x-2.5 rounded-xl bg-red-500/10 border border-red-500/25 p-3 text-xs text-red-400 animate-bounce">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleCreateLead} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Lead Name */}
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-crm-textMuted mb-1.5">
                    Lead Name *
                  </label>
                  <input
                    type="text"
                    value={newLead.name}
                    onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full bg-crm-dark border border-crm-border focus:border-crm-primary rounded-xl px-3.5 py-2 text-xs text-crm-text outline-none transition-all"
                    required
                  />
                </div>

                {/* Company Name */}
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-crm-textMuted mb-1.5">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={newLead.company}
                    onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                    placeholder="e.g. TechCorp LLC"
                    className="w-full bg-crm-dark border border-crm-border focus:border-crm-primary rounded-xl px-3.5 py-2 text-xs text-crm-text outline-none transition-all"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-crm-textMuted mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    placeholder="e.g. john@techcorp.com"
                    className="w-full bg-crm-dark border border-crm-border focus:border-crm-primary rounded-xl px-3.5 py-2 text-xs text-crm-text outline-none"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-crm-textMuted mb-1.5">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    placeholder="e.g. +1-555-0100"
                    className="w-full bg-crm-dark border border-crm-border focus:border-crm-primary rounded-xl px-3.5 py-2 text-xs text-crm-text outline-none"
                    required
                  />
                </div>

                {/* Lead Source */}
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-crm-textMuted mb-1.5">
                    Lead Source
                  </label>
                  <select
                    value={newLead.source}
                    onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                    className="w-full bg-crm-dark border border-crm-border focus:border-crm-primary rounded-xl px-3.5 py-2 text-xs text-crm-text outline-none"
                  >
                    <option value="Direct">Direct</option>
                    <option value="Website">Website</option>
                    <option value="Referral">Referral</option>
                    <option value="Cold Call">Cold Call</option>
                    <option value="Google Ads">Google Ads</option>
                    <option value="Social Media">Social Media</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-crm-textMuted mb-1.5">
                    Priority
                  </label>
                  <select
                    value={newLead.priority}
                    onChange={(e) => setNewLead({ ...newLead, priority: e.target.value })}
                    className="w-full bg-crm-dark border border-crm-border focus:border-crm-primary rounded-xl px-3.5 py-2 text-xs text-crm-text outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                {/* Lead Status */}
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-crm-textMuted mb-1.5">
                    Lead Status
                  </label>
                  <select
                    value={newLead.status}
                    onChange={(e) => setNewLead({ ...newLead, status: e.target.value })}
                    className="w-full bg-crm-dark border border-crm-border focus:border-crm-primary rounded-xl px-3.5 py-2 text-xs text-crm-text outline-none"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Interested">Interested</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Proposal Sent">Proposal Sent</option>
                    <option value="Converted">Converted</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                {/* Interested Service */}
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-crm-textMuted mb-1.5">
                    Interested Service
                  </label>
                  <input
                    type="text"
                    value={newLead.interestedService}
                    onChange={(e) => setNewLead({ ...newLead, interestedService: e.target.value })}
                    placeholder="e.g. Cloud Architecture"
                    className="w-full bg-crm-dark border border-crm-border focus:border-crm-primary rounded-xl px-3.5 py-2 text-xs text-crm-text outline-none"
                  />
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-crm-textMuted mb-1.5">
                    Client Budget ($)
                  </label>
                  <input
                    type="number"
                    value={newLead.budget}
                    onChange={(e) => setNewLead({ ...newLead, budget: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g. 10000"
                    className="w-full bg-crm-dark border border-crm-border focus:border-crm-primary rounded-xl px-3.5 py-2 text-xs text-crm-text outline-none"
                  />
                </div>

                {/* Estimated Value */}
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-crm-textMuted mb-1.5">
                    Pipeline Value ($)
                  </label>
                  <input
                    type="number"
                    value={newLead.estimatedValue}
                    onChange={(e) => setNewLead({ ...newLead, estimatedValue: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g. 5000"
                    min="0"
                    className="w-full bg-crm-dark border border-crm-border focus:border-crm-primary rounded-xl px-3.5 py-2 text-xs text-crm-text outline-none"
                  />
                </div>

                {/* Next Follow-Up Date */}
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-crm-textMuted mb-1.5">
                    Next Follow-Up Date
                  </label>
                  <input
                    type="date"
                    value={newLead.followUpDate}
                    onChange={(e) => setNewLead({ ...newLead, followUpDate: e.target.value })}
                    className="w-full bg-crm-dark border border-crm-border focus:border-crm-primary rounded-xl px-3.5 py-2 text-xs text-crm-text outline-none"
                  />
                </div>
              </div>

              {/* Assign Lead (Only visible to Admin/Manager) */}
              {user.role !== 'Employee' && (
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-crm-textMuted mb-1.5">
                    Assign Lead Employee
                  </label>
                  <select
                    value={newLead.assignedTo}
                    onChange={(e) => setNewLead({ ...newLead, assignedTo: e.target.value })}
                    className="w-full bg-crm-dark border border-crm-border focus:border-crm-primary rounded-xl px-3.5 py-2 text-xs text-crm-text outline-none"
                  >
                    <option value="">Leave Unassigned</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} ({emp.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-crm-textMuted mb-1.5">
                  Initial Notes
                </label>
                <textarea
                  value={newLead.notes}
                  onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                  placeholder="Enter initial background details discussed..."
                  rows="2"
                  className="w-full bg-crm-dark border border-crm-border focus:border-crm-primary rounded-xl px-3.5 py-2 text-xs text-crm-text outline-none"
                />
              </div>

              {/* Modal Footer Controls */}
              <div className="mt-6 flex justify-end space-x-2 border-t border-crm-border/40 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-crm-border bg-crm-card px-4 py-2.5 text-xs font-semibold text-crm-text hover:bg-crm-border/60 transition-colors focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex items-center justify-center rounded-xl bg-crm-primary px-4 py-2.5 text-xs font-semibold text-white shadow-glow hover:bg-crm-primaryHover disabled:opacity-50 transition-all active:scale-98 cursor-pointer"
                >
                  {modalLoading ? 'Creating...' : 'Save Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog Modals */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Lead Removal"
        message="Are you absolutely sure you want to delete this lead? This action is permanent and all communication history, follow-up timers, and client conversions associated will be completely removed from our records."
        confirmText="Yes, Delete Lead"
        cancelText="Keep Lead"
      />

      <ConfirmModal
        isOpen={bulkDeleteConfirmOpen}
        onClose={() => setBulkDeleteConfirmOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        title="Confirm Bulk Deletion"
        message={`Are you sure you want to permanently delete the ${selectedLeads.length} selected leads? This action cannot be undone and will purge all related records from the database.`}
        confirmText="Yes, Purge Selected"
        cancelText="Cancel"
      />
    </div>
  );
};

export default Leads;
