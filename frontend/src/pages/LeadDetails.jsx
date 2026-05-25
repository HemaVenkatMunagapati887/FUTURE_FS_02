import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Briefcase,
  Calendar,
  Activity as ActivityIcon,
  Info,
  ChevronLeft,
  Loader,
  AlertCircle,
  Plus,
  CheckCircle,
  Phone,
  Mail,
  User,
  Clock,
  Edit2,
  DollarSign,
  TrendingUp,
  MessageSquare,
  Copy,
  FileText,
  Video,
  X,
} from 'lucide-react';

const LeadDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  // Core Data States
  const [lead, setLead] = useState(null);
  const [followUps, setFollowUps] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Control States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [isEditing, setIsEditing] = useState(false);

  // Form Field States
  const [editForm, setEditForm] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);

  // New Follow-Up Form State
  const [followUpForm, setFollowUpForm] = useState({
    scheduledDate: '',
    note: '',
    type: 'Call',
  });
  const [followUpLoading, setFollowUpLoading] = useState(false);

  // New Communication Form State
  const [commForm, setCommForm] = useState({
    type: 'Call',
    summary: '',
  });
  const [commLoading, setCommLoading] = useState(false);

  // Conversion Form State
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [convertData, setConvertData] = useState({ dealValue: 0, billingDetails: '' });
  const [convertLoading, setConvertLoading] = useState(false);

  // Fetch all details
  const fetchLeadData = async () => {
    try {
      const [leadRes, followRes, timelineRes, commsRes] = await Promise.all([
        api.get(`/leads/${id}`),
        api.get(`/followups/lead/${id}`),
        api.get(`/analytics/timeline/${id}`),
        api.get(`/communications/lead/${id}`).catch(() => ({ data: { success: true, data: [] } })),
      ]);

      if (leadRes.data?.success) {
        setLead(leadRes.data.data);
        setEditForm(leadRes.data.data);
        setConvertData({
          dealValue: leadRes.data.data.estimatedValue || 0,
          billingDetails: '',
        });
      }
      if (followRes.data?.success) {
        setFollowUps(followRes.data.data);
      }
      if (timelineRes.data?.success) {
        setTimeline(timelineRes.data.data);
      }
      if (commsRes.data?.success) {
        setCommunications(commsRes.data.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve lead profile details.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch employees list (Admin/Manager only for assignment drop-downs)
  useEffect(() => {
    const fetchEmployeesList = async () => {
      if (user.role === 'Employee') return;
      try {
        const response = await api.get('/employees');
        if (response.data?.success) {
          setEmployees(response.data.data);
        }
      } catch (err) {
        console.error('Failed to retrieve employee listing', err.message);
      }
    };

    fetchLeadData();
    fetchEmployeesList();
  }, [id, user]);

  // Edit save handler
  const handleUpdateLead = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      const submitForm = { ...editForm };
      if (submitForm.assignedTo && typeof submitForm.assignedTo === 'object') {
        submitForm.assignedTo = submitForm.assignedTo._id;
      }

      const response = await api.put(`/leads/${id}`, submitForm);
      if (response.data?.success) {
        setIsEditing(false);
        toast.success(`Prospect details for "${editForm.name}" updated successfully`);
        fetchLeadData(); // Refresh UI
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update lead details.');
    } finally {
      setSaveLoading(false);
    }
  };

  // Share Lead Link Copy handler
  const handleShareLead = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Lead direct routing link copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy lead link');
    });
  };

  // Follow-Up scheduling handler
  const handleCreateFollowUp = async (e) => {
    e.preventDefault();
    if (!followUpForm.scheduledDate || !followUpForm.note) {
      return toast.warning('Please specify a date and follow-up description.');
    }
    setFollowUpLoading(true);
    try {
      const response = await api.post('/followups', {
        leadId: id,
        ...followUpForm,
      });
      if (response.data?.success) {
        toast.success('New follow-up task successfully scheduled');
        setFollowUpForm({ scheduledDate: '', note: '', type: 'Call' });
        // Refresh follow-ups & timelines
        const [fRes, tRes] = await Promise.all([
          api.get(`/followups/lead/${id}`),
          api.get(`/analytics/timeline/${id}`),
        ]);
        setFollowUps(fRes.data.data);
        setTimeline(tRes.data.data);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to schedule follow-up.');
    } finally {
      setFollowUpLoading(false);
    }
  };

  // Follow-Up completion handler
  const handleCompleteFollowUp = async (followUpId, currentNote) => {
    try {
      const response = await api.put(`/followups/${followUpId}`, {
        status: 'Completed',
        note: currentNote,
      });
      if (response.data?.success) {
        toast.success('Follow-up task marked as Completed');
        // Refresh followups & timelines
        const [fRes, tRes] = await Promise.all([
          api.get(`/followups/lead/${id}`),
          api.get(`/analytics/timeline/${id}`),
        ]);
        setFollowUps(fRes.data.data);
        setTimeline(tRes.data.data);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update follow-up status.');
    }
  };

  // Log Communication handler
  const handleLogCommunication = async (e) => {
    e.preventDefault();
    if (!commForm.summary.trim()) {
      return toast.warning('Please enter a communication summary');
    }
    setCommLoading(true);
    try {
      const response = await api.post('/communications', {
        leadId: id,
        type: commForm.type,
        summary: commForm.summary,
      });
      if (response.data?.success) {
        toast.success(`Successfully logged ${commForm.type} communication`);
        setCommForm({ type: 'Call', summary: '' });
        // Refresh communications list and timeline
        const [cRes, tRes] = await Promise.all([
          api.get(`/communications/lead/${id}`),
          api.get(`/analytics/timeline/${id}`),
        ]);
        setCommunications(cRes.data.data);
        setTimeline(tRes.data.data);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to log interaction log');
    } finally {
      setCommLoading(false);
    }
  };

  // Deal conversion handler
  const handleConvertLead = async (e) => {
    e.preventDefault();
    setConvertLoading(true);
    try {
      const response = await api.post(`/leads/${id}/convert`, convertData);
      if (response.data?.success) {
        setConvertModalOpen(false);
        toast.success(`Lead successfully converted to Client! Record is now Active.`);
        fetchLeadData(); // Refresh UI to Converted state
      }
    } catch (err) {
      toast.error(err.message || 'Failed to convert lead into Client.');
    } finally {
      setConvertLoading(false);
    }
  };

  // Calculate Lead Score (Heat Indicator)
  const calculateLeadScore = () => {
    let score = 10;
    
    // Status metrics
    if (lead.status === 'Contacted') score += 15;
    else if (lead.status === 'Interested') score += 30;
    else if (lead.status === 'Follow-up') score += 40;
    else if (lead.status === 'Proposal Sent') score += 60;
    else if (lead.status === 'Converted') score += 90;

    // Priority metrics
    if (lead.priority === 'Medium') score += 10;
    else if (lead.priority === 'High') score += 20;
    else if (lead.priority === 'Urgent') score += 30;

    // Deal Size metrics
    if (lead.estimatedValue > 15000) score += 20;
    else if (lead.estimatedValue > 5000) score += 10;

    // Minimum check
    return Math.min(score, 100);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 50) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'New':
        return 'bg-sky-500/15 text-sky-400 border border-sky-500/25';
      case 'Contacted':
        return 'bg-blue-500/15 text-blue-400 border border-blue-500/25';
      case 'Interested':
        return 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25';
      case 'Follow-up':
        return 'bg-amber-500/15 text-amber-500 border border-amber-500/25';
      case 'Proposal Sent':
        return 'bg-violet-500/15 text-violet-400 border border-violet-500/25';
      case 'Converted':
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25';
      case 'Rejected':
        return 'bg-red-500/15 text-red-400 border border-red-500/25';
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

  const getActivityIcon = (action) => {
    if (action.includes('Convert') || action.includes('Client')) {
      return <CheckCircle className="h-4 w-4 text-emerald-400" />;
    }
    if (action.includes('Schedule') || action.includes('FollowUp')) {
      return <Calendar className="h-4 w-4 text-violet-400" />;
    }
    if (action.includes('Assign')) {
      return <User className="h-4 w-4 text-blue-400" />;
    }
    if (action.includes('Communication') || action.includes('Log')) {
      return <MessageSquare className="h-4 w-4 text-pink-400" />;
    }
    return <Plus className="h-4 w-4 text-crm-textMuted" />;
  };

  const getCommIcon = (type) => {
    switch (type) {
      case 'Call':
        return <Phone className="h-4 w-4 text-sky-400" />;
      case 'Email':
        return <Mail className="h-4 w-4 text-yellow-400" />;
      case 'WhatsApp':
        return <MessageSquare className="h-4 w-4 text-emerald-400" />;
      case 'Meeting':
        return <Video className="h-4 w-4 text-violet-400" />;
      default:
        return <FileText className="h-4 w-4 text-pink-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader className="h-10 w-10 animate-spin text-crm-primary" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-400">
        <h3 className="text-lg font-bold">Failed to load lead profile</h3>
        <p className="mt-1 text-sm">{error || 'Lead file could not be fetched'}</p>
        <button onClick={() => navigate('/leads')} className="mt-4 inline-flex items-center space-x-2 text-xs font-semibold text-crm-primary hover:underline">
          <ChevronLeft className="h-4 w-4" />
          <span>Back to pipeline catalog</span>
        </button>
      </div>
    );
  }

  const leadScore = calculateLeadScore();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Navigation & Action Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-crm-border/50 pb-6">
        <button
          onClick={() => navigate('/leads')}
          className="flex items-center space-x-2 text-xs font-semibold text-crm-textMuted hover:text-white focus:outline-none transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Pipeline</span>
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:space-x-3">
          <button
            onClick={handleShareLead}
            className="flex items-center justify-center space-x-2 rounded-xl border border-crm-border bg-crm-card hover:bg-crm-cardHover px-4 py-2.5 text-xs font-bold text-crm-text transition-all active:scale-98"
            title="Share lead routing link"
          >
            <Copy className="h-4 w-4" />
            <span>Copy Link</span>
          </button>

          {lead.status !== 'Converted' && (
            <button
              onClick={() => setConvertModalOpen(true)}
              className="flex items-center justify-center space-x-2 rounded-xl bg-crm-success px-4 py-2.5 text-xs font-bold text-crm-dark hover:bg-emerald-400 active:scale-98 shadow-glow transition-all"
            >
              <TrendingUp className="h-4.5 w-4.5" />
              <span>Convert to Client</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid Details Layout */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Card Panel: Profile Details & Engagement Score */}
        <div className="lg:col-span-1 space-y-6">
          {/* Card profile */}
          <div className="glass-panel rounded-3xl p-6 border border-crm-border/60 relative overflow-hidden">
            {lead.status === 'Converted' && (
              <div className="absolute -right-16 -top-16 flex h-32 w-32 items-center justify-center bg-crm-success/15 rotate-45 border border-crm-success/20">
                <CheckCircle className="h-10 w-10 text-crm-success -rotate-45 mt-10 animate-bounce" />
              </div>
            )}

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-crm-primary/15 border border-crm-primary/30 text-crm-primary font-extrabold text-2xl shadow-glow">
                {lead.name.charAt(0).toUpperCase()}
              </div>

              <div>
                <h3 className="text-lg font-bold text-white tracking-wide">{lead.name}</h3>
                <p className="text-xs text-crm-textMuted mt-0.5">{lead.company || 'Private Buyer'}</p>
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeStyle(lead.status)}`}>
                  {lead.status}
                </span>
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getPriorityBadgeStyle(lead.priority)}`}>
                  {lead.priority || 'Medium'}
                </span>
              </div>
            </div>

            {/* Heat Score */}
            <div className="mt-6 border-t border-crm-border/40 pt-5 space-y-2">
              <div className="flex items-center justify-between text-xxs font-bold text-crm-textMuted uppercase tracking-wider">
                <span>Engagement Rating</span>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${getScoreColor(leadScore)}`}>
                  {leadScore} / 100 Score
                </span>
              </div>
              <div className="w-full bg-crm-border/40 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-crm-primary h-full rounded-full transition-all duration-500 shadow-glow"
                  style={{ width: `${leadScore}%` }}
                />
              </div>
            </div>

            {/* Core Specs */}
            <div className="mt-6 border-t border-crm-border/40 pt-5 space-y-3.5 text-xs">
              <div className="flex items-center space-x-3 text-crm-textMuted">
                <Phone className="h-4.5 w-4.5 text-crm-primary shrink-0" />
                <span className="text-white font-medium">{lead.phone}</span>
              </div>
              <div className="flex items-center space-x-3 text-crm-textMuted">
                <Mail className="h-4.5 w-4.5 text-crm-primary shrink-0" />
                <span className="text-white truncate font-medium">{lead.email || 'No email registered'}</span>
              </div>
              <div className="flex items-center space-x-3 text-crm-textMuted">
                <Briefcase className="h-4.5 w-4.5 text-crm-primary shrink-0" />
                <span>Service:{' '}
                  <strong className="text-white font-semibold">
                    {lead.interestedService || 'Generic Sales Inquiry'}
                  </strong>
                </span>
              </div>
              <div className="flex items-center space-x-3 text-crm-textMuted">
                <DollarSign className="h-4.5 w-4.5 text-crm-primary shrink-0" />
                <span>Est. Value:{' '}
                  <strong className="text-crm-success font-bold font-mono">
                    ${lead.estimatedValue.toLocaleString()}
                  </strong>
                </span>
              </div>
              <div className="flex items-center space-x-3 text-crm-textMuted">
                <User className="h-4.5 w-4.5 text-crm-primary shrink-0" />
                <span>Assignee:{' '}
                  <strong className="text-white font-medium">
                    {lead.assignedTo?.name || 'Unassigned'}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Tab Selection Panels */}
        <div className="lg:col-span-2 space-y-6">
          {user.role === 'Employee' && (
            <div className="rounded-3xl border border-crm-border/60 bg-crm-dark/80 p-4 text-sm text-crm-textMuted">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-crm-textMuted mb-2">Next Steps for Employee</h4>
              <ul className="list-disc space-y-2 pl-4 text-xs leading-5">
                <li>Review the lead contact and company details.</li>
                <li>Use the Follow-Ups tab to complete the scheduled call task or schedule the next follow-up.</li>
                <li>Log the actual call summary in the Communication Log tab.</li>
                <li>Update lead status and notes in General Details based on the call outcome.</li>
                <li>If the lead closes, change status to Converted or Rejected.</li>
              </ul>
            </div>
          )}

          {/* Tab buttons */}
          <div className="flex gap-1.5 flex-nowrap overflow-x-auto border-b border-crm-border/60 pb-2">
            {[
              { id: 'summary', name: 'General Details', icon: Info },
              { id: 'reminders', name: 'Follow-Ups', icon: Calendar },
              { id: 'communications', name: 'Communication Log', icon: MessageSquare },
              { id: 'timeline', name: 'Timeline', icon: ActivityIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 rounded-t-xl px-4 py-2.5 text-xs font-semibold border-b-2 transition-all focus:outline-none ${
                    activeTab === tab.id
                      ? 'border-crm-primary text-crm-primary bg-crm-primary/5 font-bold'
                      : 'border-transparent text-crm-textMuted hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>

          {/* TAB Content Render */}
          <div className="glass-panel rounded-3xl p-6 border border-crm-border/60 min-h-[440px] shadow-lg">
            {/* 1. GENERAL DETAILS */}
            {activeTab === 'summary' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-crm-textMuted">
                    Lead Records Profile
                  </h3>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center space-x-1.5 rounded-lg border border-crm-border bg-crm-dark px-3 py-1.5 text-xxs font-semibold text-crm-text hover:bg-crm-border/60 transition-colors focus:outline-none"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      <span>Edit Info</span>
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <form onSubmit={handleUpdateLead} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xxs font-semibold uppercase tracking-wider text-crm-textMuted mb-1">Lead Name</label>
                        <input
                          type="text"
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full rounded-lg border border-crm-border bg-crm-dark px-3 py-2 text-xs text-crm-text outline-none focus:border-crm-primary"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xxs font-semibold uppercase tracking-wider text-crm-textMuted mb-1">Company</label>
                        <input
                          type="text"
                          value={editForm.company || ''}
                          onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                          className="w-full rounded-lg border border-crm-border bg-crm-dark px-3 py-2 text-xs text-crm-text outline-none focus:border-crm-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xxs font-semibold uppercase tracking-wider text-crm-textMuted mb-1">Phone</label>
                        <input
                          type="text"
                          value={editForm.phone || ''}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          className="w-full rounded-lg border border-crm-border bg-crm-dark px-3 py-2 text-xs text-crm-text outline-none focus:border-crm-primary"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xxs font-semibold uppercase tracking-wider text-crm-textMuted mb-1">Email</label>
                        <input
                          type="email"
                          value={editForm.email || ''}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full rounded-lg border border-crm-border bg-crm-dark px-3 py-2 text-xs text-crm-text outline-none focus:border-crm-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xxs font-semibold uppercase tracking-wider text-crm-textMuted mb-1">Lead Source</label>
                        <select
                          value={editForm.source || 'Direct'}
                          onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
                          className="w-full rounded-lg border border-crm-border bg-crm-dark px-3 py-2 text-xs text-crm-text outline-none focus:border-crm-primary"
                        >
                          <option value="Direct">Direct</option>
                          <option value="Website">Website</option>
                          <option value="Referral">Referral</option>
                          <option value="Cold Call">Cold Call</option>
                          <option value="Google Ads">Google Ads</option>
                          <option value="Social Media">Social Media</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xxs font-semibold uppercase tracking-wider text-crm-textMuted mb-1">Priority</label>
                        <select
                          value={editForm.priority || 'Medium'}
                          onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                          className="w-full rounded-lg border border-crm-border bg-crm-dark px-3 py-2 text-xs text-crm-text outline-none focus:border-crm-primary"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xxs font-semibold uppercase tracking-wider text-crm-textMuted mb-1">Service Required</label>
                        <input
                          type="text"
                          value={editForm.interestedService || ''}
                          onChange={(e) => setEditForm({ ...editForm, interestedService: e.target.value })}
                          placeholder="e.g. Website Design"
                          className="w-full rounded-lg border border-crm-border bg-crm-dark px-3 py-2 text-xs text-crm-text outline-none focus:border-crm-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xxs font-semibold uppercase tracking-wider text-crm-textMuted mb-1">Client Budget ($)</label>
                        <input
                          type="number"
                          value={editForm.budget || 0}
                          onChange={(e) => setEditForm({ ...editForm, budget: parseFloat(e.target.value) || 0 })}
                          className="w-full rounded-lg border border-crm-border bg-crm-dark px-3 py-2 text-xs text-crm-text outline-none focus:border-crm-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xxs font-semibold uppercase tracking-wider text-crm-textMuted mb-1">Pipeline Value ($)</label>
                        <input
                          type="number"
                          value={editForm.estimatedValue || 0}
                          onChange={(e) => setEditForm({ ...editForm, estimatedValue: parseFloat(e.target.value) || 0 })}
                          className="w-full rounded-lg border border-crm-border bg-crm-dark px-3 py-2 text-xs text-crm-text outline-none focus:border-crm-primary"
                        />
                      </div>
                      
                      {/* Assignee Selection (Only visible to Admin/Manager) */}
                      {user.role !== 'Employee' && (
                        <div>
                          <label className="block text-xxs font-semibold uppercase tracking-wider text-crm-textMuted mb-1">Assign User</label>
                          <select
                             value={editForm.assignedTo?._id || editForm.assignedTo || ''}
                            onChange={(e) => setEditForm({ ...editForm, assignedTo: e.target.value })}
                            className="w-full rounded-lg border border-crm-border bg-crm-dark px-3 py-2 text-xs text-crm-text outline-none focus:border-crm-primary"
                          >
                            <option value="">Unassigned</option>
                            {employees.map((emp) => (
                              <option key={emp._id} value={emp._id}>
                                {emp.name} ({emp.role})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Lead Status Selection */}
                      <div>
                        <label className="block text-xxs font-semibold uppercase tracking-wider text-crm-textMuted mb-1">Lead Status</label>
                        <select
                          value={editForm.status || 'New'}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                          className="w-full rounded-lg border border-crm-border bg-crm-dark px-3 py-2 text-xs text-crm-text outline-none focus:border-crm-primary"
                          disabled={editForm.status === 'Converted'}
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Interested">Interested</option>
                          <option value="Follow-up">Follow-up</option>
                          <option value="Proposal Sent">Proposal Sent</option>
                          <option value="Converted" disabled>Converted</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                    </div>

                    {/* Freeform Notes textarea */}
                    <div>
                      <label className="block text-xxs font-semibold uppercase tracking-wider text-crm-textMuted mb-1.5">Freeform Notes / Remarks</label>
                      <textarea
                        value={editForm.notes || ''}
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        rows="3"
                        placeholder="Add freeform remarks about client inquiries..."
                        className="w-full rounded-lg border border-crm-border bg-crm-dark px-3 py-2 text-xs text-crm-text outline-none focus:border-crm-primary"
                      />
                    </div>

                    <div className="flex justify-end space-x-2 border-t border-crm-border/40 pt-4 mt-6">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="rounded-lg border border-crm-border bg-crm-card px-4 py-2 text-xs text-crm-text focus:outline-none transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saveLoading}
                        className="rounded-lg bg-crm-primary px-4 py-2 text-xs font-semibold text-white hover:bg-crm-primaryHover disabled:opacity-50 transition-colors focus:outline-none active:scale-98"
                      >
                        {saveLoading ? 'Saving...' : 'Save Updates'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 text-xs">
                    <div>
                      <p className="text-xxs font-semibold uppercase tracking-wider text-crm-textMuted mb-1">Contact Name</p>
                      <p className="font-semibold text-white text-sm">{lead.name}</p>
                    </div>
                    <div>
                      <p className="text-xxs font-semibold uppercase tracking-wider text-crm-textMuted mb-1">Company / Organization</p>
                      <p className="text-white text-sm font-semibold">{lead.company || 'Private Buyer'}</p>
                    </div>
                    <div>
                      <p className="text-xxs font-semibold uppercase tracking-wider text-crm-textMuted mb-1">Primary Phone</p>
                      <p className="text-white">{lead.phone}</p>
                    </div>
                    <div>
                      <p className="text-xxs font-semibold uppercase tracking-wider text-crm-textMuted mb-1">Email Address</p>
                      <p className="text-white">{lead.email || 'No email registered'}</p>
                    </div>
                    <div>
                      <p className="text-xxs font-semibold uppercase tracking-wider text-crm-textMuted mb-1">Service Required</p>
                      <p className="text-white font-medium">{lead.interestedService || 'Generic Sales Inquiry'}</p>
                    </div>
                    <div>
                      <p className="text-xxs font-semibold uppercase tracking-wider text-crm-textMuted mb-1">Client Budget</p>
                      <p className="text-white font-bold font-mono">${(lead.budget || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xxs font-semibold uppercase tracking-wider text-crm-textMuted mb-1">Lead Priority</p>
                      <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider mt-1.5 ${getPriorityBadgeStyle(lead.priority)}`}>
                        {lead.priority || 'Medium'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xxs font-semibold uppercase tracking-wider text-crm-textMuted mb-1">Estimated Value</p>
                      <p className="text-crm-success font-bold text-sm font-mono">${lead.estimatedValue.toLocaleString()}</p>
                    </div>
                    <div className="sm:col-span-2 bg-crm-dark/30 border border-crm-border/40 rounded-xl p-4">
                      <p className="text-xxs font-semibold uppercase tracking-wider text-crm-textMuted mb-1.5">Freeform Background Notes</p>
                      <p className="text-crm-text whitespace-pre-wrap leading-relaxed text-xs">
                        {lead.notes || 'No general notes logged for this prospect.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. REMINDERS & FOLLOW-UPS */}
            {activeTab === 'reminders' && (
              <div className="space-y-6 animate-fade-in">
                {/* Schedule follow-up subform */}
                {lead.status !== 'Converted' && lead.status !== 'Rejected' && (
                  <form onSubmit={handleCreateFollowUp} className="rounded-2xl border border-crm-border/50 bg-crm-dark/30 p-4 space-y-4">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Schedule Next Reminder</h4>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <label className="block text-xxs text-crm-textMuted mb-1 font-semibold">Scheduled Date</label>
                        <input
                          type="datetime-local"
                          value={followUpForm.scheduledDate}
                          onChange={(e) => setFollowUpForm({ ...followUpForm, scheduledDate: e.target.value })}
                          className="w-full rounded-lg border border-crm-border bg-crm-dark px-3 py-1.5 text-xs text-crm-text outline-none focus:border-crm-primary"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xxs text-crm-textMuted mb-1 font-semibold">FollowUp Type</label>
                        <select
                          value={followUpForm.type}
                          onChange={(e) => setFollowUpForm({ ...followUpForm, type: e.target.value })}
                          className="w-full rounded-lg border border-crm-border bg-crm-dark px-3 py-1.5 text-xs text-crm-text outline-none focus:border-crm-primary"
                        >
                          <option value="Call">Call</option>
                          <option value="Email">Email</option>
                          <option value="Meeting">Meeting</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="sm:col-span-1 flex items-end">
                        <button
                          type="submit"
                          disabled={followUpLoading}
                          className="w-full rounded-lg bg-crm-primary py-2 text-xs font-semibold text-white hover:bg-crm-primaryHover disabled:opacity-50 transition-colors focus:outline-none cursor-pointer"
                        >
                          {followUpLoading ? 'Scheduling...' : 'Schedule Task'}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xxs text-crm-textMuted mb-1 font-semibold">Interaction Notes</label>
                      <input
                        type="text"
                        value={followUpForm.note}
                        onChange={(e) => setFollowUpForm({ ...followUpForm, note: e.target.value })}
                        placeholder="e.g. Discuss revised pricing contract proposal options..."
                        className="w-full rounded-lg border border-crm-border bg-crm-dark px-3 py-1.5 text-xs text-crm-text outline-none focus:border-crm-primary"
                        required
                      />
                    </div>
                  </form>
                )}

                {/* Followups listing */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Follow-Up Schedule logs</h4>
                  {followUps.length > 0 ? (
                    <div className="space-y-3">
                      {followUps.map((fu) => (
                        <div key={fu._id} className="rounded-xl border border-crm-border/40 bg-crm-card/50 p-4 space-y-2 relative group hover:border-crm-primary/30 transition-all duration-300">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-white flex items-center space-x-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-crm-primary" />
                              <span>{fu.type} Task</span>
                            </span>
                            <span className={`rounded px-1.5 py-0.5 text-xxs font-medium uppercase ${
                              fu.status === 'Completed'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                            }`}>
                              {fu.status}
                            </span>
                          </div>

                          <p className="text-xs text-crm-textMuted">{fu.note}</p>

                          <div className="flex items-center justify-between border-t border-crm-border/30 pt-2 text-xxs text-crm-textMuted/60">
                            <div className="flex items-center space-x-1.5">
                              <Clock className="h-3.5 w-3.5 text-crm-primary" />
                              <span>Date: {new Date(fu.scheduledDate).toLocaleString()}</span>
                            </div>
                            {fu.status === 'Planned' && (
                              <button
                                onClick={() => handleCompleteFollowUp(fu._id, fu.note)}
                                className="flex items-center space-x-1 text-crm-success hover:underline font-bold focus:outline-none"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                <span>Mark Done</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-crm-textMuted italic">No follow-ups scheduled for this lead.</p>
                  )}
                </div>
              </div>
            )}

            {/* 3. COMMUNICATION LOG */}
            {activeTab === 'communications' && (
              <div className="space-y-6 animate-fade-in">
                {/* Form to log communication */}
                {lead.status !== 'Converted' && lead.status !== 'Rejected' && (
                  <form onSubmit={handleLogCommunication} className="rounded-2xl border border-crm-border/50 bg-crm-dark/30 p-4 space-y-4">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Log Client Interaction</h4>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <label className="block text-xxs text-crm-textMuted mb-1 font-semibold">Contact Type</label>
                        <select
                          value={commForm.type}
                          onChange={(e) => setCommForm({ ...commForm, type: e.target.value })}
                          className="w-full rounded-lg border border-crm-border bg-crm-dark px-3 py-1.5 text-xs text-crm-text outline-none focus:border-crm-primary"
                        >
                          <option value="Call">Phone Call</option>
                          <option value="Email">Email</option>
                          <option value="WhatsApp">WhatsApp</option>
                          <option value="Meeting">Meeting</option>
                          <option value="Note">Internal Note</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2 flex items-end">
                        <button
                          type="submit"
                          disabled={commLoading}
                          className="w-full rounded-lg bg-crm-primary py-2 text-xs font-semibold text-white hover:bg-crm-primaryHover disabled:opacity-50 transition-colors focus:outline-none cursor-pointer"
                        >
                          {commLoading ? 'Saving Log...' : 'Log Interaction'}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xxs text-crm-textMuted mb-1 font-semibold">Conversation Summary</label>
                      <input
                        type="text"
                        value={commForm.summary}
                        onChange={(e) => setCommForm({ ...commForm, summary: e.target.value })}
                        placeholder="e.g. Customer requested a customized quote and expressed high interest..."
                        className="w-full rounded-lg border border-crm-border bg-crm-dark px-3 py-1.5 text-xs text-crm-text outline-none focus:border-crm-primary"
                        required
                      />
                    </div>
                  </form>
                )}

                {/* List of communication logs */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Interaction History</h4>
                  {communications.length > 0 ? (
                    <div className="space-y-3.5">
                      {communications.map((comm) => (
                        <div key={comm._id} className="rounded-xl border border-crm-border/40 bg-crm-card/50 p-4 space-y-2 hover:border-crm-primary/30 transition-all duration-300">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-white flex items-center space-x-2">
                              {getCommIcon(comm.type)}
                              <span>{comm.type} Logged</span>
                            </span>
                            <span className="text-[10px] text-crm-textMuted">
                              {new Date(comm.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-crm-text leading-relaxed">{comm.summary}</p>
                          <div className="border-t border-crm-border/30 pt-2 flex items-center justify-between text-xxs text-crm-textMuted">
                            <span>Performed by: <strong className="text-white">{comm.performedBy?.name || 'User'}</strong> ({comm.performedBy?.role || 'Sales'})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-crm-textMuted italic">No communication logs recorded for this lead yet.</p>
                  )}
                </div>
              </div>
            )}

            {/* 4. TIMELINE TAB */}
            {activeTab === 'timeline' && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-xs font-bold uppercase tracking-wider text-crm-textMuted mb-2">
                  Chronological Audit Trail
                </h3>

                <div className="relative pl-7 border-l border-crm-border/60 space-y-6">
                  {timeline.length > 0 ? (
                    timeline.map((act) => (
                      <div key={act._id} className="relative">
                        {/* Bullet indicators with custom icons */}
                        <span className="absolute -left-[38px] top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-crm-dark border border-crm-border">
                          {getActivityIcon(act.action)}
                        </span>

                        <div className="flex flex-wrap items-center justify-between gap-1 text-xs pl-1">
                          <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${getActivityBadgeStyle(act.action)}`}>
                            {act.action}
                          </span>
                          <span className="text-xxs text-crm-textMuted/65">
                            {new Date(act.createdAt).toLocaleString()}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-crm-textMuted pl-1">{act.details}</p>

                        <p className="mt-1.5 text-xxs text-crm-textMuted/50 pl-1 font-semibold">
                          Logged by: <span className="text-crm-textMuted">{act.performedBy?.name || 'System'}</span> ({act.performedBy?.role || 'Service'})
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-crm-textMuted italic pl-2">No activities registered for this profile.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Convert Lead to Client Modal Overlay */}
      {convertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 shadow-glass border border-crm-border/60 animate-scale-up" style={{ background: 'rgba(21, 28, 44, 0.95)' }}>
            <h3 className="text-lg font-bold text-white mb-4">Complete Client Conversion</h3>
            
            <form onSubmit={handleConvertLead} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-crm-textMuted mb-1.5">
                  Final Deal Value ($) *
                </label>
                <input
                  type="number"
                  value={convertData.dealValue}
                  onChange={(e) => setConvertData({ ...convertData, dealValue: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g. 15000"
                  className="w-full rounded-xl border border-crm-border bg-crm-dark px-3 py-2.5 text-sm text-crm-text focus:border-crm-primary outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-crm-textMuted mb-1.5">
                  Billing / Contract Details
                </label>
                <textarea
                  value={convertData.billingDetails}
                  onChange={(e) => setConvertData({ ...convertData, billingDetails: e.target.value })}
                  placeholder="e.g. Corporate Standard Enterprise License with annual billing terms..."
                  className="w-full rounded-xl border border-crm-border bg-crm-dark px-3 py-2 text-xs text-crm-text h-24 focus:border-crm-primary outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end space-x-2 border-t border-crm-border/40 pt-4">
                <button
                  type="button"
                  onClick={() => setConvertModalOpen(false)}
                  className="rounded-xl border border-crm-border bg-crm-card px-4 py-2.5 text-xs text-crm-text hover:bg-crm-cardHover"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={convertLoading}
                  className="rounded-xl bg-crm-success px-4 py-2.5 text-xs font-bold text-crm-dark hover:bg-emerald-400 disabled:opacity-50 active:scale-98 cursor-pointer"
                >
                  {convertLoading ? 'Converting...' : 'Finalize Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadDetails;
