import jwt from 'jsonwebtoken';
import User from '../model/user.model.js';

import { auth } from '../config/firebaseAdmin.js';

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_PASSWORD, { expiresIn: '7d' });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public

// POST /api/auth/firebase-login
export const firebaseLogin = async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = await auth.verifyIdToken(token);
    let user = await User.findOne({ email: decoded.email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, token: generateToken(user._id, user.role) });
  } catch (err) { res.status(401).json({ message: 'Invalid token' }); }
};


// POST /api/auth/firebase-register
export const firebaseRegister = async (req, res) => {
  try {
    const { token, name, phone, shippingAddress } = req.body;
    const decoded = await auth.verifyIdToken(token); // ← was admin.auth().verifyIdToken()
    const existing = await User.findOne({ email: decoded.email });
    if (existing) return res.status(400).json({ message: 'Already registered' });
    const user = await User.create({ name, email: decoded.email, phone, password: decoded.uid, shippingAddresses: [shippingAddress] });
    res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role, token: generateToken(user._id, user.role) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const user = await User.create({ name, email, password, phone, role });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get logged in user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
export const updateMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    

    if (req.body.password) user.password = req.body.password;

    const updated = await user.save();
    res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      role: updated.role,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Admin only ──────────────────────────────────────────────

// @desc    Get all users
// @route   GET /api/users
// @access  Admin
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.deleteOne();
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};