import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: [true, 'Client must refer back to their original Lead'],
      unique: true, // One lead can only convert to one client
    },
    dealValue: {
      type: Number,
      required: [true, 'Deal/Revenue value is required upon conversion'],
      min: [0, 'Deal value cannot be negative'],
    },
    contractStartDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: {
        values: ['Active', 'Churned', 'Suspended'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Active',
    },
    billingDetails: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Client = mongoose.model('Client', clientSchema);
export default Client;
