import express from 'express';
import { ObjectId } from 'mongodb';
import { getCollections } from '../db.js';
import { verifyJWT } from '../middleware/auth.js';

const router = express.Router();

// GET /api/wishlist -> Get user's saved clothes
router.get('/', verifyJWT, async (req, res) => {
  try {
    const { wishlistCollection, clothesCollection } = getCollections();
    const userEmail = req.user.email.toLowerCase();

    const items = await wishlistCollection.find({ userEmail }).toArray();
    const clothIds = items
      .map(i => (ObjectId.isValid(i.clothId) ? new ObjectId(i.clothId) : null))
      .filter(Boolean);

    const clothes = await clothesCollection.find({ _id: { $in: clothIds } }).toArray();

    return res.json({
      success: true,
      data: clothes.map(c => ({
        ...c,
        id: c._id.toString(),
        _id: c._id.toString()
      })),
      ids: items.map(i => i.clothId.toString())
    });
  } catch (error) {
    console.error('Wishlist Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve wishlist items.' });
  }
});

// POST /api/wishlist/toggle -> Add or remove cloth from wishlist
router.post('/toggle', verifyJWT, async (req, res) => {
  try {
    const { clothId } = req.body;
    if (!clothId || !ObjectId.isValid(clothId)) {
      return res.status(400).json({ success: false, error: 'Valid clothing item ID is required.' });
    }

    const { wishlistCollection } = getCollections();
    const userEmail = req.user.email.toLowerCase();

    const existing = await wishlistCollection.findOne({
      userEmail,
      clothId: new ObjectId(clothId)
    });

    if (existing) {
      await wishlistCollection.deleteOne({ _id: existing._id });
      return res.json({
        success: true,
        action: 'removed',
        message: 'Removed from your saved wishlist.',
        clothId
      });
    } else {
      await wishlistCollection.insertOne({
        userEmail,
        clothId: new ObjectId(clothId),
        createdAt: new Date()
      });
      return res.json({
        success: true,
        action: 'added',
        message: 'Saved to your fashion wishlist!',
        clothId
      });
    }
  } catch (error) {
    console.error('Toggle Wishlist Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update wishlist.' });
  }
});

export default router;

