import jwt from 'jsonwebtoken';

const generateTokenAndSetCookie = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  // Calculate cookie expiration (matching JWT 7d standard)
  const cookieExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

  res.cookie('token', token, {
    httpOnly: true, // Shield token from front-end Javascript access (mitigates XSS)
    secure: process.env.NODE_ENV === 'production', // Enforce SSL in production environment
    sameSite: 'none', // Required for cross-site cookie sharing with frontend and backend on different hosts
    maxAge: cookieExpiry,
  });

  return token;
};

export default generateTokenAndSetCookie;
