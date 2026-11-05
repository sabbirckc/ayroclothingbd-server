import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { connectDB } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'clothspace_super_secret_jwt_key_2026_production';

export async function verifyJWT(req, res, next) {
  // Collect all candidate tokens in order of priority:
  // 1. Authorization header (Bearer token sent explicitly by frontend API)
  // 2. Better-Auth session cookies
  // 3. Legacy JWT cookie
  const candidateTokens = [];

  if (req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer' && parts[1]) {
      candidateTokens.push(parts[1].trim());
    }
  }

  const baCookie =
    req.cookies?.['better-auth.session_token'] ||
    req.cookies?.['__Secure-better-auth.session_token'];
  if (baCookie) {
    candidateTokens.push(baCookie.trim());
  }

  if (req.cookies?.clothspace_token) {
    candidateTokens.push(req.cookies.clothspace_token.trim());
  }

  if (req.cookies?.token) {
    candidateTokens.push(req.cookies.token.trim());
  }

  if (candidateTokens.length === 0) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. Authentication token missing (401 Unauthorized).'
    });
  }

  // 1. Check Better-Auth session in MongoDB
  try {
    const db = await connectDB();
    if (db) {
      for (const rawToken of candidateTokens) {
        // Better-Auth tokens from cookies may be signed (token.signature) or URL-encoded
        const cleanTokens = [
          rawToken,
          rawToken.includes('.') ? rawToken.split('.')[0] : null,
          decodeURIComponent(rawToken),
          decodeURIComponent(rawToken).includes('.')
            ? decodeURIComponent(rawToken).split('.')[0]
            : null
        ].filter(Boolean);

        const validObjectIds = cleanTokens
          .filter(t => typeof t === 'string' && ObjectId.isValid(t) && t.length === 24)
          .map(t => new ObjectId(t));

        const sessionQuery = [
          { token: { $in: cleanTokens } },
          { _id: { $in: cleanTokens } },
          { id: { $in: cleanTokens } }
        ];

        if (validObjectIds.length > 0) {
          sessionQuery.push({ _id: { $in: validObjectIds } });
        }

        const session = await db.collection('session').findOne({ $or: sessionQuery });

        if (session) {
          // Check session expiration
          if (session.expiresAt && new Date(session.expiresAt) <= new Date()) {
            continue;
          }

          const queryConditions = [
            { _id: session.userId },
            { id: session.userId }
          ];
          if (typeof session.userId === 'string' && ObjectId.isValid(session.userId)) {
            queryConditions.push({ _id: new ObjectId(session.userId) });
          }

          let user = await db.collection('user').findOne({ $or: queryConditions });
          if (!user) {
            user = await db.collection('users').findOne({ $or: queryConditions });
          }

          if (user) {
            req.user = {
              userId: user._id?.toString() || user.id,
              email: user.email,
              name: user.name,
              photoURL: user.image || user.photoURL || '/client-review-1.jpg',
              role: user.role || 'designer'
            };
            return next();
          }
        }
      }
    }
  } catch (dbErr) {
    console.error('Better-Auth Session lookup error:', dbErr);
  }

  // 2. Check JWT verification
  for (const rawToken of candidateTokens) {
    try {
      const decoded = jwt.verify(rawToken, JWT_SECRET);
      if (decoded) {
        req.user = decoded;
        return next();
      }
    } catch {
      // Continue to next candidate
    }
  }

  // Clear stale legacy cookie if present so it doesn't cause repeated failures
  if (req.cookies?.token) {
    res.clearCookie('token');
  }

  return res.status(401).json({
    success: false,
    error: 'Invalid or expired authentication token. Please log in again.'
  });
}
