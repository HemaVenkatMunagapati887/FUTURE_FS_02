import User from '../models/User.js';
import generateTokenAndSetCookie, { getAuthCookieOptions } from '../utils/generateToken.js';
import { asyncHandler } from '../middlewares/errorMiddleware.js';

// @desc    Register a new user (Employee, Manager, Admin)
// @route   POST /api/auth/register
// @access  Public (Can be restricted to Admin only later for security)
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Validate fields
  if (!name || !email || !password) {
    res.statusCode = 400;
    throw new Error('Please enter all required fields');
  }

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.statusCode = 400;
    throw new Error('User with this email already exists');
  }

  // Create new user in DB
  const user = await User.create({
    name,
    email,
    password,
    role: role || 'Employee', // Defaults to Employee if role is omitted
  });

  if (user) {
    // Generate JWT and attach it as a cookie
    generateTokenAndSetCookie(res, user._id);

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } else {
    res.statusCode = 400;
    throw new Error('Invalid user data provided');
  }
});

// @desc    Authenticate user & get token cookie
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate fields
  if (!email || !password) {
    res.statusCode = 400;
    throw new Error('Please provide email and password');
  }

  // Find user and explicitly select password field since it is omitted by default
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    res.statusCode = 401;
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    res.statusCode = 403;
    throw new Error('Your account has been deactivated. Contact an Administrator.');
  }

  // Generate JWT and attach to response cookies
  generateTokenAndSetCookie(res, user._id);

  res.status(200).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
  });
});

// @desc    Log user out / Clear Cookie
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res) => {
  res.cookie('token', '', {
    ...getAuthCookieOptions(),
    expires: new Date(0),
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

// @desc    Get current user profile (session ping)
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user,
  });
});

// @desc    Update current user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.statusCode = 404;
    throw new Error('User not found');
  }

  const { name, email } = req.body;

  if (email && email !== user.email) {
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      res.statusCode = 400;
      throw new Error('A user with that email already exists');
    }
    user.email = email;
  }

  user.name = name !== undefined ? name : user.name;

  const updatedUser = await user.save();

  res.status(200).json({
    success: true,
    data: {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
    },
  });
});

// @desc    Change current user password
// @route   PUT /api/auth/password
// @access  Private
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.statusCode = 400;
    throw new Error('Please enter both current and new password');
  }

  if (newPassword.length < 6) {
    res.statusCode = 400;
    throw new Error('New password must be at least 6 characters long');
  }

  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    res.statusCode = 404;
    throw new Error('User not found');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    res.statusCode = 400;
    throw new Error('Incorrect current password');
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password updated successfully',
  });
});

