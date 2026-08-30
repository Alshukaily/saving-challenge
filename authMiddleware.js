import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'saving-challenge-super-secret-key-2026';

export function authenticateToken(req, res, next) {
  let token = req.cookies?.token;

  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'يرجى تسجيل الدخول أولاً' });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'جلسة التصفح منتهية، يرجى إعادة تسجيل الدخول' });
  }
}
