import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
      
    },
    phone: {
      type: String,
      match: [/^\+63\d{10}$/, 'Phone number must be in the format +63XXXXXXXXXX'],
      default: null,
    },
    shippingAddresses: [
      {
        label: String,       // e.g. "Home", "Office"
        street: String,
        city: String,
        province: String,
        postalCode: String,
        country: { type: String, default: 'Philippines' },
      },
    ],
    avatar: {
        type: String,
        default: null,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return ;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password helper
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);