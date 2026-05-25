import mongoose from 'mongoose';

const communicationSchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: [true, 'Communication must be associated with a Lead'],
    },
    type: {
      type: String,
      enum: {
        values: ['Call', 'Email', 'WhatsApp', 'Meeting', 'Note'],
        message: '{VALUE} is not a valid communication type',
      },
      required: [true, 'Communication type is required'],
    },
    summary: {
      type: String,
      required: [true, 'Communication summary/description is required'],
      trim: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Communication must have a performer reference'],
    },
  },
  {
    timestamps: true,
  }
);

// Index to speed up listing lead logs chronologically
communicationSchema.index({ lead: 1, createdAt: -1 });

const Communication = mongoose.model('Communication', communicationSchema);
export default Communication;
