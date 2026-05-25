import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  Users,
  Award,
  Clock,
  DollarSign,
  Activity as ActivityIcon,
  Calendar,
  Layers,
  PieChart as PieIcon,
  Loader,
  ArrowRight,
  CheckCircle,
  Briefcase,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

const AnimatedCounter = ({ value, duration = 1000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const isNumeric = typeof value === 'number';
    const numericValue = isNumeric ? value : parseFloat(value.toString().replace(/[^0-9.]/g, ''));
    if (isNaN(numericValue) || numericValue === 0) {
      setCount(value);
      return;
    }

    let start = 0;
    const end = numericValue;
    const totalSteps = 30;
    const stepTime = duration / totalSteps;
    const stepValue = end / totalSteps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= totalSteps) {
        clearInterval(timer);
        setCount(value);
      } else {
        const nextValue = Math.floor(start + stepValue * currentStep);
        if (isNumeric) {
          setCount(nextValue);
        } else {
          setCount(`$${nextValue.toLocaleString()}`);
        }
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count}</span>;
};

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [latestLeads, setLatestLeads] = useState([]);
  const [myFollowups, setMyFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashRes, leadsRes, followRes] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/leads?limit=5'),
          api.get('/followups/my').catch(() => null),
        ]);

        if (dashRes.data?.success) {
          setData(dashRes.data.data);
        }
        if (leadsRes.data?.success) {
          setLatestLeads(leadsRes.data.data.slice(0, 5));
        }
        if (followRes?.data?.success) {
          const todayStr = new Date().toDateString();
          const todayPlanned = followRes.data.data.filter(
            (f) => f.status === 'Planned' && new Date(f.scheduledDate).toDateString() === todayStr
          );
          setMyFollowups(todayPlanned);
        }
      } catch (err) {
        setError(err.message || 'Failed to load analytics dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center space-y-3 animate-pulse">
          <Loader className="h-10 w-10 animate-spin text-crm-primary" />
          <p className="text-sm text-crm-textMuted font-medium">Computing CRM intelligence analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-400">
        <h3 className="text-lg font-bold">Failed to render analytics</h3>
        <p className="mt-1 text-sm">{error}</p>
      </div>
    );
  }

  const { kpis, statusDistribution, sourceDistribution, monthlyRevenue, recentActivities } = data;

  const PIE_COLORS = ['#5f5af6', '#3b82f6', '#10b981', '#fbbf24', '#f43f5e', '#a855f7'];

  const getActivityBadgeStyle = (action) => {
    if (action.includes('Convert') || action.includes('Client')) {
      return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    }
    if (action.includes('Schedule') || action.includes('FollowUp') || action.includes('Communication')) {
      return 'bg-violet-500/20 text-violet-400 border border-violet-500/30';
    }
    if (action.includes('Assign')) {
      return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
    }
    if (action.includes('Create')) {
      return 'bg-sky-500/20 text-sky-400 border border-sky-500/30';
    }
    return 'bg-crm-border/60 text-crm-textMuted border border-crm-border';
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-500/15 text-red-400 border border-red-500/20';
      case 'High':
        return 'bg-orange-500/15 text-orange-400 border border-orange-500/20';
      case 'Medium':
        return 'bg-blue-500/15 text-blue-400 border border-blue-500/20';
      default:
        return 'bg-slate-500/15 text-slate-400 border border-slate-500/20';
    }
  };

  const kpiCards = [
    {
      title: 'Pipeline Leads',
      raw: kpis.totalLeads,
      value: <AnimatedCounter value={kpis.totalLeads} />,
      change: 'Active records',
      icon: Users,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/25',
      action: () => navigate('/leads'),
      sparkPath: 'M0,25 Q20,10 40,22 T80,8 T120,18 L140,12',
      sparkColor: '#38bdf8',
    },
    {
      title: 'Converted Clients',
      raw: kpis.convertedLeads,
      value: <AnimatedCounter value={kpis.convertedLeads} />,
      change: `${kpis.conversionRate}% Conversion`,
      icon: Award,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
      action: () => navigate('/leads'),
      sparkPath: 'M0,28 Q20,25 40,18 T80,10 T120,5 L140,2',
      sparkColor: '#10b981',
    },
    {
      title: 'Pending Follow-Ups',
      raw: kpis.pendingLeads,
      value: <AnimatedCounter value={kpis.pendingLeads} />,
      change: 'Awaiting engagement',
      icon: Clock,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
      action: () => navigate('/leads'),
      sparkPath: 'M0,15 Q20,20 40,12 T80,22 T120,8 L140,20',
      sparkColor: '#fbbf24',
    },
    {
      title: 'Deal Revenue',
      raw: kpis.revenue,
      value: <AnimatedCounter value={kpis.revenue} />,
      change: 'Closed contract earnings',
      icon: DollarSign,
      color: 'text-crm-primary bg-crm-primary/10 border-crm-primary/25',
      action: () => navigate('/leads'),
      sparkPath: 'M0,28 Q15,22 35,15 T75,8 T115,2 L140,1',
      sparkColor: '#5f5af6',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Dashboard Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Dashboard Intelligence</h1>
          <p className="mt-1 text-sm text-crm-textMuted">
            Welcome back, <span className="font-semibold text-white">{user.name}</span> ({user.role}). Viewing pipeline insights.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/leads"
            className="flex items-center space-x-2 rounded-xl bg-crm-primary hover:bg-crm-primaryHover text-white px-4 py-2.5 text-sm font-semibold shadow-glow transition-all active:scale-98"
          >
            <span>Manage Leads</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={card.action}
              className="glass-card rounded-2xl p-5 border border-crm-border/50 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-crm-textMuted">
                    {card.title}
                  </span>
                  <div className={`rounded-xl p-2 border transition-colors group-hover:bg-crm-primary/20 ${card.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <h3 className="text-2xl font-extrabold tracking-tight text-white leading-none">
                      {card.value}
                    </h3>
                    <p className="mt-2 text-xxs text-crm-textMuted flex items-center space-x-1">
                      <TrendingUp className="h-3 w-3 text-crm-success" />
                      <span>{card.change}</span>
                    </p>
                  </div>

                  {/* Sparkline Indicator */}
                  <div className="h-8 w-20 flex items-end opacity-70 group-hover:opacity-100 transition-opacity">
                    <svg className="w-full h-full" viewBox="0 0 140 30">
                      <path
                        d={card.sparkPath}
                        fill="none"
                        stroke={card.sparkColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts & Conversion Rings Panel */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Monthly Earnings Revenue Stream */}
        <div className="glass-panel rounded-3xl p-6 lg:col-span-2 border border-crm-border/60">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="rounded-xl bg-crm-primary/10 p-2 text-crm-primary border border-crm-primary/20">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Revenue & Sales Performance</h3>
                <p className="text-xs text-crm-textMuted">Aggregated contract billing trends</p>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            {monthlyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5f5af6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#5f5af6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#242f44" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#6b7c96" fontSize={11} tickLine={false} />
                  <YAxis stroke="#6b7c96" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(21, 28, 44, 0.95)',
                      borderColor: 'rgba(95, 90, 246, 0.3)',
                      color: '#f1f5f9',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#5f5af6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-crm-textMuted border border-dashed border-crm-border/60 rounded-2xl">
                No revenue reports indexed. Convert leads to populate charts.
              </div>
            )}
          </div>
        </div>

        {/* Conversion rate Ring / Gauge and Sources */}
        <div className="glass-panel rounded-3xl p-6 border border-crm-border/60 flex flex-col justify-between">
          <div className="flex items-center space-x-2.5 mb-6">
            <div className="rounded-xl bg-emerald-500/10 p-2 text-crm-success border border-crm-success/20">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Pipeline Efficiency</h3>
              <p className="text-xs text-crm-textMuted">Conversion rate & sources</p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative h-28 w-28">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-crm-border/40"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="transparent"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-crm-success"
                  strokeDasharray={`${kpis.conversionRate}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-2xl font-black text-white leading-none">{kpis.conversionRate}%</span>
                <span className="text-[9px] text-crm-textMuted font-bold uppercase tracking-wider mt-1">Converted</span>
              </div>
            </div>
          </div>

          {/* Sources breakdown */}
          <div className="mt-4 border-t border-crm-border/40 pt-4">
            <h4 className="text-xxs font-bold text-crm-textMuted uppercase tracking-wider mb-2">Lead Sources</h4>
            {sourceDistribution.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {sourceDistribution.slice(0, 4).map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-1.5 bg-crm-dark/30 border border-crm-border/40 rounded-lg p-1.5">
                    <span
                      className="h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                    />
                    <span className="truncate text-crm-text font-medium">{item.source}:</span>
                    <span className="text-crm-textMuted font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xxs text-crm-textMuted">No source distribution registered.</p>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Follow-ups (Employee) / Latest Leads (Admin) & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Latest Leads / Follow-ups Section */}
        <div className="glass-panel rounded-3xl p-6 border border-crm-border/60 flex flex-col justify-between">
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="rounded-xl bg-crm-primary/10 p-2 text-crm-primary border border-crm-primary/20">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {user.role === 'Employee' ? "My Follow-Ups Today" : "Latest Added Leads"}
                  </h3>
                  <p className="text-xs text-crm-textMuted">
                    {user.role === 'Employee' ? "Assigned activities today" : "Most recent CRM contacts"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {user.role === 'Employee' ? (
                myFollowups.length > 0 ? (
                  myFollowups.map((follow) => (
                    <div
                      key={follow._id}
                      onClick={() => navigate(`/leads/${follow.lead?._id}`)}
                      className="bg-crm-dark/40 border border-crm-border/60 hover:border-crm-primary/40 rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{follow.lead?.name || 'Lead'}</p>
                        <p className="text-xxs text-crm-textMuted truncate mt-0.5">{follow.note}</p>
                      </div>
                      <span className="rounded bg-crm-warning/10 border border-crm-warning/20 px-2 py-0.5 text-xxs font-semibold text-crm-warning">
                        {follow.type}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-crm-border/40 rounded-xl p-4">
                    <CheckCircle className="h-8 w-8 text-crm-success mb-2 opacity-60" />
                    <p className="text-xs font-bold text-white">All caught up!</p>
                    <p className="text-xxs text-crm-textMuted mt-0.5">No planned follow-ups scheduled for today.</p>
                  </div>
                )
              ) : (
                latestLeads.length > 0 ? (
                  latestLeads.map((lead) => (
                    <div
                      key={lead._id}
                      onClick={() => navigate(`/leads/${lead._id}`)}
                      className="bg-crm-dark/40 border border-crm-border/60 hover:border-crm-primary/40 rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{lead.name}</p>
                        <p className="text-xxs text-crm-textMuted truncate mt-0.5">{lead.company || 'Private Lead'}</p>
                      </div>
                      <div className="flex flex-col items-end shrink-0 pl-2">
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getPriorityStyle(lead.priority)}`}>
                          {lead.priority}
                        </span>
                        <span className="text-[10px] text-white font-semibold mt-1">
                          ${lead.estimatedValue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-xs text-crm-textMuted">No leads currently logged.</div>
                )
              )}
            </div>
          </div>
        </div>

        {/* System Activity Feed (Audit logs) */}
        <div className="glass-panel rounded-3xl p-6 lg:col-span-2 border border-crm-border/60 flex flex-col justify-between">
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="rounded-xl bg-violet-500/10 p-2 text-violet-400 border border-violet-500/20">
                  <ActivityIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">System Activity Feed</h3>
                  <p className="text-xs text-crm-textMuted">Live audit log across pipeline</p>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto space-y-4 max-h-[290px] pr-1 scrollbar">
              {recentActivities && recentActivities.length > 0 ? (
                recentActivities.map((act) => (
                  <div key={act._id} className="flex items-start space-x-3 pb-3 border-b border-crm-border/40 last:border-0 last:pb-0">
                    <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded bg-crm-dark border border-crm-border text-xs text-crm-textMuted shrink-0">
                      <Calendar className="h-3 w-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span className="text-xs font-semibold text-white">
                          {act.lead?.name || 'Deleted Lead'}
                        </span>
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${getActivityBadgeStyle(act.action)}`}>
                          {act.action}
                        </span>
                      </div>
                      <p className="mt-1 text-xxs text-crm-textMuted line-clamp-1">
                        {act.details}
                      </p>
                      <div className="mt-1 flex items-center space-x-1.5 text-[9px] text-crm-textMuted/50">
                        <span className="font-semibold text-crm-textMuted">{act.performedBy?.name || 'System'}</span>
                        <span>•</span>
                        <span>{new Date(act.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-full min-h-[180px] items-center justify-center text-xs text-crm-textMuted border border-dashed border-crm-border/40 rounded-xl">
                  No activity logs recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
