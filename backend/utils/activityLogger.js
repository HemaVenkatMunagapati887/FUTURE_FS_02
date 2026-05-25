import Activity from '../models/Activity.js';

/**
 * Helper to log lead activities
 * @param {string} leadId - The ID of the lead
 * @param {string} userId - The ID of the user performing the action
 * @param {string} action - The action type (e.g. 'Status Updated')
 * @param {string} details - Additional explanation (e.g. 'Changed from New to Contacted')
 */
export const logActivity = async (leadId, userId, action, details = '') => {
  try {
    await Activity.create({
      lead: leadId,
      performedBy: userId,
      action,
      details,
    });
  } catch (error) {
    console.error(`Failed to log activity: ${error.message}`);
  }
};
