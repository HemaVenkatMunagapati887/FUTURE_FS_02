import FollowUp from '../models/FollowUp.js';
import Lead from '../models/Lead.js';
import { logActivity } from '../utils/activityLogger.js';
import { asyncHandler } from '../middlewares/errorMiddleware.js';

// @desc    Schedule a new follow-up
// @route   POST /api/followups
// @access  Private
export const createFollowUp = asyncHandler(async (req, res) => {
  const { leadId, scheduledDate, note, type } = req.body;

  if (!leadId || !scheduledDate || !note) {
    res.statusCode = 400;
    throw new Error('Please provide lead ID, scheduled date, and note');
  }

  const lead = await Lead.findById(leadId);
  if (!lead) {
    res.statusCode = 404;
    throw new Error('Lead not found');
  }

  // Employees can only schedule followups for their assigned leads
  if (req.user.role === 'Employee' && lead.assignedTo?.toString() !== req.user._id.toString()) {
    res.statusCode = 403;
    throw new Error('Access Denied: You are not assigned to this lead');
  }

  const followUp = await FollowUp.create({
    lead: leadId,
    assignedTo: lead.assignedTo || req.user._id, // Assign to lead's assignee or the creator
    scheduledDate,
    note,
    type: type || 'Call',
    status: 'Planned',
  });

  // Log activity in the lead timeline
  const formattedDate = new Date(scheduledDate).toLocaleDateString();
  await logActivity(
    leadId,
    req.user._id,
    'FollowUp Scheduled',
    `Scheduled a ${type} follow-up for ${formattedDate}. Details: ${note}`
  );

  res.status(201).json({
    success: true,
    data: followUp,
  });
});

// @desc    Get followups for a specific lead
// @route   GET /api/followups/lead/:leadId
// @access  Private
export const getLeadFollowUps = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.leadId);
  if (!lead) {
    res.statusCode = 404;
    throw new Error('Lead not found');
  }

  // Security guard: Employee can only see followups if assigned to the lead
  if (req.user.role === 'Employee' && lead.assignedTo?.toString() !== req.user._id.toString()) {
    res.statusCode = 403;
    throw new Error('Access Denied: You do not have access to this lead');
  }

  const followUps = await FollowUp.find({ lead: req.params.leadId })
    .populate('assignedTo', 'name email')
    .sort({ scheduledDate: -1 });

  res.status(200).json({
    success: true,
    data: followUps,
  });
});

// @desc    Get followups assigned to the current employee
// @route   GET /api/followups/my
// @access  Private
export const getMyFollowUps = asyncHandler(async (req, res) => {
  const query = {
    assignedTo: req.user._id,
  };

  // Optional filter by status
  if (req.query.status) {
    query.status = req.query.status;
  }

  const followUps = await FollowUp.find(query)
    .populate({
      path: 'lead',
      select: 'name company email phone status assignedTo',
    })
    .sort({ scheduledDate: 1 }); // Sort chronologically (earliest first)

  const validFollowUps = followUps.filter((followUp) => {
    return followUp.lead && followUp.lead._id;
  });

  res.status(200).json({
    success: true,
    data: validFollowUps,
  });
});

// @desc    Update a follow-up (e.g. reschedule or mark as completed)
// @route   PUT /api/followups/:id
// @access  Private
export const updateFollowUp = asyncHandler(async (req, res) => {
  let followUp = await FollowUp.findById(req.params.id);

  if (!followUp) {
    res.statusCode = 404;
    throw new Error('Follow-up event not found');
  }

  // Access validation: Employees can only edit their own follow-ups
  if (req.user.role === 'Employee' && followUp.assignedTo.toString() !== req.user._id.toString()) {
    res.statusCode = 403;
    throw new Error('Access Denied: You cannot modify this follow-up');
  }

  const { scheduledDate, note, status, type } = req.body;

  // Audit status change
  if (status && status !== followUp.status) {
    const actionWord = status === 'Completed' ? 'FollowUp Completed' : 'FollowUp Updated';
    await logActivity(
      followUp.lead,
      req.user._id,
      actionWord,
      `Follow-up status marked as '${status}'. Details: ${note || followUp.note}`
    );
  }

  followUp.scheduledDate = scheduledDate || followUp.scheduledDate;
  followUp.note = note || followUp.note;
  followUp.status = status || followUp.status;
  followUp.type = type || followUp.type;

  const updatedFollowUp = await followUp.save();

  res.status(200).json({
    success: true,
    data: updatedFollowUp,
  });
});

// @desc    Delete a follow-up
// @route   DELETE /api/followups/:id
// @access  Private (Admin & Manager only)
export const deleteFollowUp = asyncHandler(async (req, res) => {
  const followUp = await FollowUp.findById(req.params.id);

  if (!followUp) {
    res.statusCode = 404;
    throw new Error('Follow-up event not found');
  }

  await FollowUp.deleteOne({ _id: followUp._id });

  res.status(200).json({
    success: true,
    message: 'Follow-up event removed successfully',
  });
});
