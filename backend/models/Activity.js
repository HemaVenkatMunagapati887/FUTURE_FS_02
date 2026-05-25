import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: [true, 'Activity must be linked to a Lead'],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Activity must be performed by a User'],
    },
    action: {
      type: String,
      required: [true, 'Activity action type is required'],
      trim: true,
    },
    details: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Activities are audit logs, updates are not expected
  }
);

activitySchema.index({ lead: 1, createdAt: -1 });

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;
