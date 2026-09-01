const express = require('express');
const router = express.Router();
const { client } = require('../config/db');
const { ObjectId } = require('mongodb');

// Helper to get orders collection
const getOrdersCollection = () => {
  return client.db("green-gladiars").collection("orders");
};

// 1. GET ALL ORDERS (FOR ADMIN): GET /api/orders
router.get('/', async (req, res) => {
  try {
    const ordersCollection = getOrdersCollection();
    const orders = await ordersCollection.find({}).sort({ createdAt: -1 }).toArray();
    res.json(orders);
  } catch (error) {
    console.error('Fetch Orders Error:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// 2. GET USER ORDERS: GET /api/orders/user/:email
router.get('/user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const ordersCollection = getOrdersCollection();
    const userOrders = await ordersCollection
      .find({ customerEmail: { $regex: new RegExp(`^${email}$`, 'i') } })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(userOrders);
  } catch (error) {
    console.error('Fetch User Orders Error:', error);
    res.status(500).json({ message: 'Failed to fetch user orders' });
  }
});

// 3. PLACE NEW ORDER (CLIENT CHECKOUT): POST /api/orders
router.post('/', async (req, res) => {
  try {
    const { customerName, customerEmail, phone, shippingAddress, items, totalAmount } = req.body;

    if (!customerName || !customerEmail || !items || items.length === 0) {
      return res.status(400).json({ message: 'Customer details and items are required' });
    }

    const ordersCollection = getOrdersCollection();

    const newOrder = {
      customerName,
      customerEmail,
      phone: phone || 'Not Provided',
      shippingAddress: shippingAddress || 'Standard Pickup',
      items,
      totalAmount: Number(totalAmount),
      status: 'Pending',
      createdAt: new Date()
    };

    const result = await ordersCollection.insertOne(newOrder);
    newOrder._id = result.insertedId;

    res.status(201).json({
      message: 'Order placed successfully',
      order: newOrder
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(500).json({ message: 'Failed to place order' });
  }
});

// 4. UPDATE ORDER STATUS: PUT /api/orders/:id/status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const ordersCollection = getOrdersCollection();

    const result = await ordersCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status } },
      { returnDocument: 'after' }
    );

    res.json({ message: 'Order status updated', order: result });
  } catch (error) {
    console.error('Update Order Status Error:', error);
    res.status(500).json({ message: 'Failed to update order status' });
  }
});

module.exports = router;
