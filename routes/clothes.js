import express from 'express';
import { ObjectId } from 'mongodb';
import { getCollections } from '../db.js';
import { verifyJWT } from '../middleware/auth.js';

const router = express.Router();

// Helper to sanitize and format cloth documents
function formatCloth(cloth) {
  if (!cloth) return null;
  return {
    ...cloth,
    id: cloth._id.toString(),
    _id: cloth._id.toString(),
    price: Number(cloth.price),
    stock: Number(cloth.stock),
    rating: Number(cloth.rating || 4.8)
  };
}

// GET /api/clothes/featured -> Exactly 6 items using .limit(6)
router.get('/featured', async (req, res) => {
  try {
    const { clothesCollection } = getCollections();
    const featured = await clothesCollection
      .find({})
      .sort({ rating: -1, createdAt: -1 })
      .limit(6)
      .toArray();

    return res.json({
      success: true,
      data: featured.map(formatCloth)
    });
  } catch (error) {
    console.error('Featured Clothes Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch featured apparel.' });
  }
});

// GET /api/clothes/categories -> Aggregated counts per category
router.get('/categories', async (req, res) => {
  try {
    const { clothesCollection } = getCollections();
    const categories = await clothesCollection
      .aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
      .toArray();

    return res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Categories Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch categories.' });
  }
});

// GET /api/clothes/my-listings -> Private Route, filter by logged-in user email
router.get('/my-listings', verifyJWT, async (req, res) => {
  try {
    const { clothesCollection } = getCollections();
    const userEmail = req.user.email.toLowerCase();

    const listings = await clothesCollection
      .find({ ownerEmail: userEmail })
      .sort({ createdAt: -1 })
      .toArray();

    return res.json({
      success: true,
      data: listings.map(formatCloth)
    });
  } catch (error) {
    console.error('My Listings Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch your clothing listings.' });
  }
});

// GET /api/clothes -> Explore Clothes with filters, search, sort, pagination
router.get('/', async (req, res) => {
  try {
    const {
      search,
      category,
      subCategory,
      subcategory,
      size,
      fabric,
      minPrice,
      maxPrice,
      sortBy = 'newest',
      page = 1,
      limit = 12
    } = req.query;

    const query = {};

    // Search query on title, overview, fabric, subcategory
    if (search && search.trim() !== '') {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      query.$or = [
        { title: searchRegex },
        { overview: searchRegex },
        { fabric: searchRegex },
        { brandOrigin: searchRegex },
        { category: searchRegex },
        { subCategory: searchRegex }
      ];
    }

    // Category filter
    if (category && category !== 'all' && category !== 'All') {
      const cleanCat = category.replace(/s$/i, '');
      query.category = { $regex: new RegExp(`^${cleanCat}s?$`, 'i') };
    }

    // Subcategory filter
    const activeSubCat = subCategory || subcategory;
    if (activeSubCat && activeSubCat !== 'all' && activeSubCat !== 'All') {
      query.subCategory = { $regex: new RegExp(`^${activeSubCat.trim()}$`, 'i') };
    }

    // Size filter
    if (size && size !== 'all') {
      query.sizes = size;
    }

    // Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Sorting
    let sortQuery = { createdAt: -1 };
    if (sortBy === 'price-low') {
      sortQuery = { price: 1 };
    } else if (sortBy === 'price-high') {
      sortQuery = { price: -1 };
    } else if (sortBy === 'rating') {
      sortQuery = { rating: -1 };
    } else if (sortBy === 'popular') {
      sortQuery = { ordersCount: -1 };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 12);
    const skip = (pageNum - 1) * limitNum;

    const { clothesCollection } = getCollections();

    const [items, totalCount] = await Promise.all([
      clothesCollection.find(query).sort(sortQuery).skip(skip).limit(limitNum).toArray(),
      clothesCollection.countDocuments(query)
    ]);

    return res.json({
      success: true,
      data: items.map(formatCloth),
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (error) {
    console.error('Explore Clothes Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve clothes.' });
  }
});

// GET /api/clothes/:id -> Single Cloth Details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid clothing item ID.' });
    }

    const { clothesCollection } = getCollections();
    const cloth = await clothesCollection.findOne({ _id: new ObjectId(id) });

    if (!cloth) {
      return res.status(404).json({ success: false, error: 'Clothing item not found.' });
    }

    return res.json({
      success: true,
      data: formatCloth(cloth)
    });
  } catch (error) {
    console.error('Get Cloth Details Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve clothing item.' });
  }
});

// POST /api/clothes -> Add New Clothing (Protected - Challenge 1)
router.post('/', verifyJWT, async (req, res) => {
  try {
    const {
      title,
      category,
      subCategory,
      price,
      stock,
      sizes,
      fabric,
      image,
      images,
      careInstructions,
      overview,
      brandOrigin
    } = req.body;

    if (!title || !category || price === undefined || stock === undefined || !fabric) {
      return res.status(400).json({
        success: false,
        error: 'Title, category, price, stock, and fabric material are required.'
      });
    }

    const numPrice = Number(price);
    const numStock = Number(stock);

    if (isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({ success: false, error: 'Price must be a positive number.' });
    }

    if (isNaN(numStock) || numStock < 0) {
      return res.status(400).json({ success: false, error: 'Stock quantity cannot be negative.' });
    }

    const primaryImage = image || (Array.isArray(images) && images[0]) || '/image-1.jpg';
    const gallery = Array.isArray(images) && images.length > 0 ? images : [primaryImage];

    const newCloth = {
      title: title.trim(),
      category: category.trim(),
      subCategory: (subCategory || 'Classic Fit').trim(),
      price: numPrice,
      stock: numStock,
      sizes: Array.isArray(sizes) && sizes.length > 0 ? sizes : ['M', 'L'],
      fabric: fabric.trim(),
      brandOrigin: (brandOrigin || 'Artisanal Studio').trim(),
      image: primaryImage,
      images: gallery,
      careInstructions: Array.isArray(careInstructions) ? careInstructions : ['Dry Clean Recommended'],
      overview: overview?.trim() || 'Exquisite handcrafted apparel tailored with premium fabrics and modern aesthetics.',
      ownerEmail: req.user.email.toLowerCase(),
      ownerName: req.user.name || 'Boutique Designer',
      rating: 5.0,
      reviewsCount: 1,
      ordersCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const { clothesCollection } = getCollections();
    const result = await clothesCollection.insertOne(newCloth);

    return res.status(201).json({
      success: true,
      message: 'Clothing listing published successfully.',
      data: formatCloth({ ...newCloth, _id: result.insertedId })
    });
  } catch (error) {
    console.error('Create Cloth Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create clothing listing.' });
  }
});

// PUT /api/clothes/:id -> Update Cloth (Protected)
router.put('/:id', verifyJWT, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid clothing item ID.' });
    }

    const { clothesCollection } = getCollections();
    const existing = await clothesCollection.findOne({ _id: new ObjectId(id) });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Clothing listing not found.' });
    }

    // Ensure the updater is the owner
    if (existing.ownerEmail.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You are not authorized to edit this listing.'
      });
    }

    const {
      title,
      category,
      subCategory,
      price,
      stock,
      sizes,
      fabric,
      image,
      images,
      careInstructions,
      overview,
      brandOrigin
    } = req.body;

    const updateDoc = {
      $set: {
        ...(title && { title: title.trim() }),
        ...(category && { category: category.trim() }),
        ...(subCategory && { subCategory: subCategory.trim() }),
        ...(price !== undefined && { price: Number(price) }),
        ...(stock !== undefined && { stock: Number(stock) }),
        ...(sizes && { sizes: Array.isArray(sizes) ? sizes : [sizes] }),
        ...(fabric && { fabric: fabric.trim() }),
        ...(brandOrigin && { brandOrigin: brandOrigin.trim() }),
        ...(image && { image: image.trim() }),
        ...(images && { images: Array.isArray(images) ? images : [images] }),
        ...(careInstructions && { careInstructions: Array.isArray(careInstructions) ? careInstructions : [careInstructions] }),
        ...(overview && { overview: overview.trim() }),
        updatedAt: new Date()
      }
    };

    await clothesCollection.updateOne({ _id: new ObjectId(id) }, updateDoc);
    const updated = await clothesCollection.findOne({ _id: new ObjectId(id) });

    return res.json({
      success: true,
      message: 'Clothing listing updated successfully.',
      data: formatCloth(updated)
    });
  } catch (error) {
    console.error('Update Cloth Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update clothing listing.' });
  }
});

// DELETE /api/clothes/:id -> Delete Cloth (Protected - Challenge 1)
router.delete('/:id', verifyJWT, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid clothing item ID.' });
    }

    const { clothesCollection } = getCollections();
    const existing = await clothesCollection.findOne({ _id: new ObjectId(id) });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Clothing listing not found.' });
    }

    // Owner check
    if (existing.ownerEmail.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You can only delete your own listings.'
      });
    }

    await clothesCollection.deleteOne({ _id: new ObjectId(id) });

    return res.json({
      success: true,
      message: 'Clothing listing deleted successfully.'
    });
  } catch (error) {
    console.error('Delete Cloth Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete clothing listing.' });
  }
});

export default router;

