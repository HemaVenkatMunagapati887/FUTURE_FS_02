import Communication from '../models/Communication.js';
import Lead from '../models/Lead.js';
import { logActivity } from '../utils/activityLogger.js';
import { asyncHandler } from '../middlewares/errorMiddleware.js';

// @desc    Log a new communication for a lead
// @route   POST /api/communications
// @access  Private
export const createCommunication = asyncHandler(async (req, res) => {
  const { leadId, type, summary } = req.body;

  if (!leadId || !type || !summary) {
    res.statusCode = 400;
    throw new Error('Please provide lead ID, communication type, and summary');
  }

  const lead = await Lead.findById(leadId);
  if (!lead) {
    res.statusCode = 404;
    throw new Error('Lead not found');
  }

  // Employees can only log communication for their assigned leads
  if (req.user.role === 'Employee' && lead.assignedTo?.toString() !== req.user._id.toString()) {
    res.statusCode = 403;
    throw new Error('Access Denied: You are not assigned to this lead');
  }

  const communication = await Communication.create({
    lead: leadId,
    type,
    summary,
    performedBy: req.user._id,
  });

  // Log activity in the lead timeline as well
  await logActivity(
    leadId,
    req.user._id,
    'Communication Logged',
    `Logged a ${type} communication: ${summary}`
  );

  // Return the communication with performedBy populated (so the frontend gets name/email)
  const populatedComm = await Communication.findById(communication._id).populate(
    'performedBy',
    'name email role'
  );

  res.status(201).json({
    success: true,
    data: populatedComm,
  });
});

// @desc    Get all communications for a specific lead
// @route   GET /api/communications/lead/:leadId
// @access  Private
export const getLeadCommunications = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.leadId);
  if (!lead) {
    res.statusCode = 404;
    throw new Error('Lead not found');
  }

  // Employees can only view communication logs for their assigned leads
  if (req.user.role === 'Employee' && lead.assignedTo?.toString() !== req.user._id.toString()) {
    res.statusCode = 403;
    throw new Error('Access Denied: You do not have access to this lead');
  }

  const communications = await Communication.find({ lead: req.params.leadId })
    .populate('performedBy', 'name email role')
    .sort({ createdAt: -1 }); // Newest interactions first

  res.status(200).json({
    success: true,
    data: communications,
  });
});
