import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

categorySchema.index({ userId: 1 });

const Category = mongoose.model('Category', categorySchema);

export default Category;
