import mongoose from 'mongoose';
import Lead from '../models/Lead.js';
import Client from '../models/Client.js';
import Activity from '../models/Activity.js';
import { asyncHandler } from '../middlewares/errorMiddleware.js';

// @desc    Get dashboard analytics metrics
// @route   GET /api/analytics/dashboard
// @access  Private
export const getDashboardAnalytics = asyncHandler(async (req, res) => {
  // Query object for general queries
  const query = {};
  // Match query for aggregation pipelines (requires casting to mongoose ObjectId)
  const matchQuery = {};

  if (req.user.role === 'Employee') {
    query.assignedTo = req.user._id;
    matchQuery.assignedTo = new mongoose.Types.ObjectId(req.user._id);
  }

  // 1. Core KPIs
  const totalLeads = await Lead.countDocuments(query);
  const convertedLeads = await Lead.countDocuments({ ...query, status: 'Converted' });
  const pendingLeads = await Lead.countDocuments({
    ...query,
    status: { $nin: ['Converted', 'Rejected'] },
  });

  // Calculate revenue
  let revenue = 0;
  if (req.user.role === 'Employee') {
    const employeeLeads = await Lead.find({ assignedTo: req.user._id, status: 'Converted' }).select('_id');
    const leadIds = employeeLeads.map((lead) => lead._id);
    const clients = await Client.find({ lead: { $in: leadIds } });
    revenue = clients.reduce((sum, client) => sum + client.dealValue, 0);
  } else {
    const clients = await Client.find();
    revenue = clients.reduce((sum, client) => sum + client.dealValue, 0);
  }

  // 2. Status Distribution Aggregation
  const statusCounts = await Lead.aggregate([
    { $match: matchQuery },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  // Transform status aggregation into easy-to-use key-value object
  const statusDistribution = {
    New: 0,
    Contacted: 0,
    Interested: 0,
    'Follow-up': 0,
    'Proposal Sent': 0,
    Converted: 0,
    Rejected: 0,
  };
  statusCounts.forEach((item) => {
    if (statusDistribution[item._id] !== undefined) {
      statusDistribution[item._id] = item.count;
    }
  });

  // 3. Source Distribution Aggregation
  const sourceCounts = await Lead.aggregate([
    { $match: matchQuery },
    { $group: { _id: '$source', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const sourceDistribution = sourceCounts.map((item) => ({
    source: item._id,
    count: item.count,
  }));

  // 4. Recent Activities Timeline
  let activityQuery = {};
  if (req.user.role === 'Employee') {
    const employeeLeads = await Lead.find({ assignedTo: req.user._id }).select('_id');
    const leadIds = employeeLeads.map((lead) => lead._id);
    activityQuery = { lead: { $in: leadIds } };
  }

  const recentActivities = await Activity.find(activityQuery)
    .populate('lead', 'name company')
    .populate('performedBy', 'name email role')
    .sort({ createdAt: -1 })
    .limit(10);

  // 5. Monthly Revenue Pipeline (For charts)
  // Let's aggregate total client earnings grouped by contract date
  let clientMatch = {};
  if (req.user.role === 'Employee') {
    const employeeLeads = await Lead.find({ assignedTo: req.user._id, status: 'Converted' }).select('_id');
    const leadIds = employeeLeads.map((lead) => lead._id);
    clientMatch = { lead: { $in: leadIds } };
  }

  const monthlyEarnings = await Client.aggregate([
    { $match: clientMatch },
    {
      $group: {
        _id: {
          year: { $year: '$contractStartDate' },
          month: { $month: '$contractStartDate' },
        },
        revenue: { $sum: '$dealValue' },
        dealsCount: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const monthsName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyRevenueChartData = monthlyEarnings.map((item) => ({
    name: `${monthsName[item._id.month - 1]} ${item._id.year}`,
    revenue: item.revenue,
    deals: item.dealsCount,
  }));

  res.status(200).json({
    success: true,
    data: {
      kpis: {
        totalLeads,
        convertedLeads,
        pendingLeads,
        revenue,
        conversionRate: totalLeads > 0 ? parseFloat(((convertedLeads / totalLeads) * 100).toFixed(1)) : 0,
      },
      statusDistribution,
      sourceDistribution,
      monthlyRevenue: monthlyRevenueChartData,
      recentActivities,
    },
  });
});

// @desc    Get activity timeline for a single lead
// @route   GET /api/analytics/timeline/:leadId
// @access  Private
export const getLeadTimeline = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.leadId);
  if (!lead) {
    res.statusCode = 404;
    throw new Error('Lead not found');
  }

  // Employee guard check
  if (req.user.role === 'Employee' && lead.assignedTo?.toString() !== req.user._id.toString()) {
    res.statusCode = 403;
    throw new Error('Access Denied: You are not assigned to this lead');
  }

  const timeline = await Activity.find({ lead: req.params.leadId })
    .populate('performedBy', 'name email role')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: timeline,
  });
});
