import jwt from 'jsonwebtoken';

// Production: Vercel (frontend) + Render (API) = cross-site → SameSite=None + Secure
// Development: use Vite proxy (/api → :5000) so same origin → SameSite=Lax works
export const getAuthCookieOptions = (maxAge) => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    ...(maxAge !== undefined && { maxAge }),
  };
};

const generateTokenAndSetCookie = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  const cookieExpiry = 7 * 24 * 60 * 60 * 1000;

  res.cookie('token', token, getAuthCookieOptions(cookieExpiry));

  return token;
};

export default generateTokenAndSetCookie;
