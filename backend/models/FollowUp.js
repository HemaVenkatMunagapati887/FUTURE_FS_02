import mongoose from 'mongoose';

const followUpSchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: [true, 'FollowUp must be associated with a Lead'],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'FollowUp must have an assignee'],
    },
    scheduledDate: {
      type: Date,
      required: [true, 'FollowUp scheduled date is required'],
    },
    note: {
      type: String,
      required: [true, 'FollowUp note/description is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['Planned', 'Completed', 'Missed'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Planned',
    },
    type: {
      type: String,
      enum: {
        values: ['Call', 'Email', 'Meeting', 'Other'],
        message: '{VALUE} is not a valid communication type',
      },
      default: 'Call',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes to speed up queries for scheduled reminders and performance tracking
followUpSchema.index({ lead: 1 });
followUpSchema.index({ assignedTo: 1, scheduledDate: 1 });

const FollowUp = mongoose.model('FollowUp', followUpSchema);
export default FollowUp;
