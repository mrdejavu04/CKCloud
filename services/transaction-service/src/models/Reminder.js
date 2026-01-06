import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

reminderSchema.index({ userId: 1 });

const Reminder = mongoose.model('Reminder', reminderSchema);

export default Reminder;
