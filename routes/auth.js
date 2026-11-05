import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getCollections } from '../db.js';
import { verifyJWT } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'clothspace_super_secret_jwt_key_2026_production';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// Password validator: Uppercase, Lowercase, at least 6 characters
function validatePassword(password) {
  if (!password || password.length < 6) {
    return 'Password must be at least 6 characters long.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter (A-Z).';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter (a-z).';
  }
  return null;
}

// User Registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, photoURL, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
    }

    const passError = validatePassword(password);
    if (passError) {
      return res.status(400).json({ success: false, error: passError });
    }

    const { usersCollection } = getCollections();
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await usersCollection.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const defaultAvatar = '/client-review-1.jpg';
    const newUser = {
      name: name.trim(),
      email: normalizedEmail,
      photoURL: photoURL && photoURL.trim() ? photoURL.trim() : defaultAvatar,
      password: hashedPassword,
      role: 'designer',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await usersCollection.insertOne(newUser);

    const token = jwt.sign(
      {
        userId: result.insertedId.toString(),
        email: newUser.email,
        name: newUser.name,
        photoURL: newUser.photoURL
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, COOKIE_OPTIONS);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: result.insertedId.toString(),
        name: newUser.name,
        email: newUser.email,
        photoURL: newUser.photoURL,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ success: false, error: 'Server error during registration.' });
  }
});

// User Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please enter both email and password.' });
    }

    const { usersCollection } = getCollections();
    const normalizedEmail = email.toLowerCase().trim();

    const user = await usersCollection.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials. User not found.' });
    }

    // Check if password exists (could be oauth account without password)
    if (!user.password) {
      return res.status(401).json({
        success: false,
        error: 'This account was created via Google. Please log in with Google.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Incorrect password. Please try again.' });
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        photoURL: user.photoURL
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, COOKIE_OPTIONS);

    return res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        role: user.role || 'designer'
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ success: false, error: 'Server error during login.' });
  }
});

// Social Login (Google) / Demo Examiner login
router.post('/social-login', async (req, res) => {
  try {
    const { email, name, photoURL } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required for social login.' });
    }

    const { usersCollection } = getCollections();
    const normalizedEmail = email.toLowerCase().trim();

    let user = await usersCollection.findOne({ email: normalizedEmail });

    if (!user) {
      const newUser = {
        name: (name || 'Fashion Designer').trim(),
        email: normalizedEmail,
        photoURL: photoURL || '/client-review-2.jpg',
        role: 'designer',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const result = await usersCollection.insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };
    } else if (photoURL && !user.photoURL) {
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { photoURL, updatedAt: new Date() } }
      );
      user.photoURL = photoURL;
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        photoURL: user.photoURL
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, COOKIE_OPTIONS);

    return res.json({
      success: true,
      message: 'Social authentication successful.',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        role: user.role || 'designer'
      }
    });
  } catch (error) {
    console.error('Social Login Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to authenticate social login.' });
  }
});

// Current User Session verification (Used on page refresh to keep user logged in on private routes)
router.get('/me', verifyJWT, async (req, res) => {
  try {
    const { usersCollection } = getCollections();
    const user = await usersCollection.findOne({ email: req.user.email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User profile not found.' });
    }

    return res.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        role: user.role || 'designer'
      }
    });
  } catch (error) {
    console.error('Session Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to verify session.' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', COOKIE_OPTIONS);
  return res.json({ success: true, message: 'Logged out successfully.' });
});

export default router;

