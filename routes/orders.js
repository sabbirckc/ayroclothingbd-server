import express from 'express';
import { ObjectId } from 'mongodb';
import { getCollections } from '../db.js';
import { verifyJWT } from '../middleware/auth.js';

const router = express.Router();

function formatOrder(order) {
  if (!order) return null;
  return {
    ...order,
    id: order._id.toString(),
    _id: order._id.toString(),
    quantity: Number(order.quantity),
    unitPrice: Number(order.unitPrice),
    totalPrice: Number(order.totalPrice)
  };
}

// POST /api/orders -> Place Order (Protected - Challenge 1 & Challenge 2)
router.post('/', verifyJWT, async (req, res) => {
  try {
    const {
      clothId,
      size,
      quantity = 1,
      shippingAddress,
      phone,
      paymentMethod = 'Cash on Delivery',
      notes
    } = req.body;

    if (!clothId || !ObjectId.isValid(clothId)) {
      return res.status(400).json({ success: false, error: 'Valid clothing item ID is required.' });
    }

    const orderQty = Math.max(1, parseInt(quantity, 10) || 1);

    if (!size) {
      return res.status(400).json({ success: false, error: 'Please select a clothing size.' });
    }

    if (!shippingAddress || shippingAddress.trim() === '') {
      return res.status(400).json({ success: false, error: 'Shipping delivery address is required.' });
    }

    if (!phone || phone.trim() === '') {
      return res.status(400).json({ success: false, error: 'Contact phone number is required.' });
    }

    const { clothesCollection, ordersCollection } = getCollections();

    // Challenge 2: Atomic Verification & Stock Deduction Prevention
    // Using findOneAndUpdate with condition { _id, stock: { $gte: orderQty } }
    // This prevents race condition and double-booking down to the millisecond!
    const updatedCloth = await clothesCollection.findOneAndUpdate(
      {
        _id: new ObjectId(clothId),
        stock: { $gte: orderQty }
      },
      {
        $inc: { stock: -orderQty, ordersCount: 1 }
      },
      { returnDocument: 'after' }
    );

    // If updatedCloth is null or doesn't have value, stock was insufficient or item doesn't exist
    if (!updatedCloth) {
      // Check if item exists to give precise error
      const currentItem = await clothesCollection.findOne({ _id: new ObjectId(clothId) });
      if (!currentItem) {
        return res.status(404).json({ success: false, error: 'Clothing item no longer exists.' });
      }
      return res.status(400).json({
        success: false,
        error: `Insufficient stock! Only ${currentItem.stock} unit(s) remaining for "${currentItem.title}". Order rejected.`
      });
    }

    const item = updatedCloth;
    const unitPrice = Number(item.price);
    const totalPrice = unitPrice * orderQty;

    const newOrder = {
      clothId: new ObjectId(clothId),
      clothTitle: item.title,
      clothImage: item.image || (item.images && item.images[0]) || '/image-1.jpg',
      clothCategory: item.category,
      fabric: item.fabric,
      brandOrigin: item.brandOrigin || 'Boutique Atelier',
      size,
      quantity: orderQty,
      unitPrice,
      totalPrice,
      shippingAddress: shippingAddress.trim(),
      phone: phone.trim(),
      paymentMethod,
      notes: notes?.trim() || '',
      buyerEmail: req.user.email.toLowerCase(),
      buyerName: req.user.name || 'Valued Fashion Connoisseur',
      sellerEmail: item.ownerEmail || 'atelier@clothspace.com',
      sellerName: item.ownerName || 'Boutique Designer',
      status: 'Pending', // Default initial status
      orderDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const orderResult = await ordersCollection.insertOne(newOrder);

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully! Designer notified.',
      data: formatOrder({ ...newOrder, _id: orderResult.insertedId })
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to process order.' });
  }
});

// GET /api/orders/my-orders -> Fetch user's orders (Protected)
router.get('/my-orders', verifyJWT, async (req, res) => {
  try {
    const { ordersCollection } = getCollections();
    const userEmail = req.user.email.toLowerCase();

    const orders = await ordersCollection
      .find({ buyerEmail: userEmail })
      .sort({ createdAt: -1 })
      .toArray();

    return res.json({
      success: true,
      data: orders.map(formatOrder)
    });
  } catch (error) {
    console.error('Fetch My Orders Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve your orders.' });
  }
});

// GET /api/orders/:id -> Fetch single order details (for invoice download)
router.get('/:id', verifyJWT, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid order ID.' });
    }

    const { ordersCollection } = getCollections();
    const order = await ordersCollection.findOne({ _id: new ObjectId(id) });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    // Access control: buyer or seller
    const userEmail = req.user.email.toLowerCase();
    if (order.buyerEmail.toLowerCase() !== userEmail && order.sellerEmail?.toLowerCase() !== userEmail) {
      return res.status(403).json({ success: false, error: 'Forbidden: You cannot view this order.' });
    }

    return res.json({
      success: true,
      data: formatOrder(order)
    });
  } catch (error) {
    console.error('Fetch Order Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve order details.' });
  }
});

// PATCH /api/orders/:id/cancel -> Cancel pending order and restore stock
router.patch('/:id/cancel', verifyJWT, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid order ID.' });
    }

    const { ordersCollection, clothesCollection } = getCollections();
    const order = await ordersCollection.findOne({ _id: new ObjectId(id) });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    if (order.buyerEmail.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You can only cancel your own orders.'
      });
    }

    if (order.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        error: `Cannot cancel an order with status "${order.status}". Only Pending orders can be cancelled.`
      });
    }

    // Atomically restore stock back to the clothing item
    if (order.clothId) {
      await clothesCollection.updateOne(
        { _id: new ObjectId(order.clothId) },
        { $inc: { stock: Number(order.quantity) } }
      );
    }

    await ordersCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: 'Cancelled',
          cancelledAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    const updated = await ordersCollection.findOne({ _id: new ObjectId(id) });

    return res.json({
      success: true,
      message: 'Order cancelled successfully. Stock inventory restored.',
      data: formatOrder(updated)
    });
  } catch (error) {
    console.error('Cancel Order Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to cancel order.' });
  }
});

export default router;
