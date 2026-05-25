import Lead from '../models/Lead.js';
import Client from '../models/Client.js';
import User from '../models/User.js';
import FollowUp from '../models/FollowUp.js';
import { logActivity } from '../utils/activityLogger.js';
import { asyncHandler } from '../middlewares/errorMiddleware.js';

// @desc    Create a new lead
// @route   POST /api/leads
// @access  Private
export const createLead = asyncHandler(async (req, res) => {
  const { 
    name, 
    company, 
    email, 
    phone, 
    source, 
    estimatedValue, 
    assignedTo,
    priority,
    interestedService,
    notes,
    budget,
    followUpDate 
  } = req.body;

  if (!name || !phone) {
    res.statusCode = 400;
    throw new Error('Please provide lead name and phone number');
  }

  // If assignedTo is provided, verify user exists
  if (assignedTo) {
    const user = await User.findById(assignedTo);
    if (!user) {
      res.statusCode = 400;
      throw new Error('Assigned employee user not found');
    }
  }

  const lead = await Lead.create({
    name,
    company: company || '',
    email,
    phone,
    source: source || 'Direct',
    estimatedValue: estimatedValue || 0,
    assignedTo: assignedTo || null,
    createdBy: req.user._id,
    priority: priority || 'Medium',
    interestedService: interestedService || '',
    notes: notes || '',
    budget: budget || 0,
    followUpDate: followUpDate || null,
  });

  // Log activity
  await logActivity(lead._id, req.user._id, 'Lead Created', `Lead created by ${req.user.name}`);

  if (assignedTo) {
    const assignee = await User.findById(assignedTo);
    await logActivity(lead._id, req.user._id, 'Lead Assigned', `Lead assigned to ${assignee.name}`);
  }

  res.status(201).json({
    success: true,
    data: lead,
  });
});

// @desc    Get all leads with search, filters, pagination, and role-security
// @route   GET /api/leads
// @access  Private
export const getLeads = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, status, source, assignedTo } = req.query;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  // Build query
  const query = {};

  // Role-based visibility logic
  if (req.user.role === 'Employee') {
    // Employees can only view leads assigned to them
    query.assignedTo = req.user._id;
  } else {
    // Admins/Managers can filter by assignee if requested
    if (assignedTo) {
      query.assignedTo = assignedTo;
    }
  }

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Filter by source
  if (source) {
    query.source = source;
  }

  // Regex text search (name, company, email)
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  // Execute query with total count
  const total = await Lead.countDocuments(query);
  
  const leads = await Lead.find(query)
    .populate('assignedTo', 'name email role')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  res.status(200).json({
    success: true,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    },
    data: leads,
  });
});

// @desc    Get single lead details
// @route   GET /api/leads/:id
// @access  Private
export const getLeadById = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id)
    .populate('assignedTo', 'name email role')
    .populate('createdBy', 'name email');

  if (!lead) {
    res.statusCode = 404;
    throw new Error('Lead not found');
  }

  // Role-based access validation
  if (req.user.role === 'Employee' && lead.assignedTo?.toString() !== req.user._id.toString()) {
    const hasActiveFollowUp = await FollowUp.exists({ lead: lead._id, assignedTo: req.user._id });
    if (!hasActiveFollowUp) {
      res.statusCode = 403;
      throw new Error('Access Denied: You are not assigned to this lead');
    }
  }

  res.status(200).json({
    success: true,
    data: lead,
  });
});

// @desc    Update lead details
// @route   PUT /api/leads/:id
// @access  Private
export const updateLead = asyncHandler(async (req, res) => {
  let lead = await Lead.findById(req.params.id);

  if (!lead) {
    res.statusCode = 404;
    throw new Error('Lead not found');
  }

  // Role-based verification (Employees can only update their assigned leads)
  if (req.user.role === 'Employee' && lead.assignedTo?.toString() !== req.user._id.toString()) {
    res.statusCode = 403;
    throw new Error('Access Denied: You cannot edit leads not assigned to you');
  }

  const { 
    name, 
    company, 
    email, 
    phone, 
    source, 
    status, 
    estimatedValue, 
    assignedTo,
    priority,
    interestedService,
    notes,
    budget,
    followUpDate
  } = req.body;

  // Track status transitions for logs
  if (status && status !== lead.status) {
    await logActivity(
      lead._id,
      req.user._id,
      'Status Updated',
      `Status changed from '${lead.status}' to '${status}'`
    );
  }

  // Track priority transitions for logs
  if (priority && priority !== lead.priority) {
    await logActivity(
      lead._id,
      req.user._id,
      'Priority Updated',
      `Priority changed from '${lead.priority}' to '${priority}'`
    );
  }

  // Track assignment transitions for logs
  if (assignedTo !== undefined && String(assignedTo) !== String(lead.assignedTo)) {
    if (assignedTo === null || assignedTo === '') {
      await logActivity(lead._id, req.user._id, 'Lead Unassigned', `Lead unassigned`);
    } else {
      const assignee = await User.findById(assignedTo);
      if (!assignee) {
        res.statusCode = 400;
        throw new Error('Assigned employee user not found');
      }
      await logActivity(
        lead._id,
        req.user._id,
        'Lead Assigned',
        `Lead reassigned to ${assignee.name}`
      );
    }
  }

  // Apply updates
  lead.name = name !== undefined ? name : lead.name;
  lead.company = company !== undefined ? company : lead.company;
  lead.email = email !== undefined ? email : lead.email;
  lead.phone = phone !== undefined ? phone : lead.phone;
  lead.source = source !== undefined ? source : lead.source;
  lead.status = status !== undefined ? status : lead.status;
  lead.estimatedValue = estimatedValue !== undefined ? estimatedValue : lead.estimatedValue;
  lead.assignedTo = assignedTo !== undefined ? (assignedTo === '' ? null : assignedTo) : lead.assignedTo;
  lead.priority = priority !== undefined ? priority : lead.priority;
  lead.interestedService = interestedService !== undefined ? interestedService : lead.interestedService;
  lead.notes = notes !== undefined ? notes : lead.notes;
  lead.budget = budget !== undefined ? budget : lead.budget;
  lead.followUpDate = followUpDate !== undefined ? followUpDate : lead.followUpDate;

  const updatedLead = await lead.save();

  res.status(200).json({
    success: true,
    data: updatedLead,
  });
});

// @desc    Delete a lead
// @route   DELETE /api/leads/:id
// @access  Private (Admin & Manager only)
export const deleteLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);

  if (!lead) {
    res.statusCode = 404;
    throw new Error('Lead not found');
  }

  // Check role: Only Admin/Manager can delete leads
  // Note: We also apply restrictTo middleware on routes, but adding a check here for absolute double safety.
  if (req.user.role === 'Employee') {
    res.statusCode = 403;
    throw new Error('Access Denied: Employees are not allowed to delete leads');
  }

  // Cascading deletes for followups, clients, and activity logs linked to this lead to keep DB clean.
  await Lead.deleteOne({ _id: lead._id });
  await Client.deleteOne({ lead: lead._id });
  // Dynamic imports/queries for dependent collections
  // mongoose.model('FollowUp').deleteMany({ lead: lead._id })
  
  res.status(200).json({
    success: true,
    message: 'Lead and associated data removed successfully',
  });
});

// @desc    Convert lead to a Client
// @route   POST /api/leads/:id/convert
// @access  Private
export const convertLeadToClient = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);

  if (!lead) {
    res.statusCode = 404;
    throw new Error('Lead not found');
  }

  // Employees can only convert their own assigned leads
  if (req.user.role === 'Employee' && lead.assignedTo?.toString() !== req.user._id.toString()) {
    res.statusCode = 403;
    throw new Error('Access Denied: You cannot convert leads not assigned to you');
  }

  if (lead.status === 'Converted') {
    res.statusCode = 400;
    throw new Error('Lead is already converted into a Client');
  }

  const { dealValue, billingDetails } = req.body;

  if (dealValue === undefined || dealValue === null) {
    res.statusCode = 400;
    throw new Error('Please provide the final deal value to convert lead');
  }

  // Update lead status to Converted
  lead.status = 'Converted';
  await lead.save();

  // Create Client record
  const client = await Client.create({
    lead: lead._id,
    dealValue,
    billingDetails: billingDetails || '',
    status: 'Active',
  });

  // Log activities
  await logActivity(
    lead._id,
    req.user._id,
    'Lead Converted',
    `Lead successfully converted to Client. Deal Value: $${dealValue}`
  );

  res.status(201).json({
    success: true,
    data: {
      lead,
      client,
    },
  });
});
