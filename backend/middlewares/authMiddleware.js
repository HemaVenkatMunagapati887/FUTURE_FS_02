import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Protect routes - validates JWT token from cookie
export const protect = async (req, res, next) => {
  let token;

  // Retrieve token from request cookies
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // Fallback: Check authorization header (Bearer <token>)
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // No token — return clean 401 JSON (not a thrown error that becomes 500)
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Please log in to access this resource.',
    });
  }

  try {
    // Verify token signature
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user and attach to request (excluding password hash)
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user associated with this session no longer exists.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Contact an administrator.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Session expired or invalid. Please log in again.',
    });
  }
};

// Restrict access to specific user roles (RBAC)
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, session missing.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access Denied: Role '${req.user.role}' is not authorized for this resource.`,
      });
    }

    next();
  };
};
