const express = require('express');
const router = express.Router();
const { client } = require('../config/db');
const { ObjectId } = require('mongodb');

// Helper to get products collection
const getProductsCollection = () => {
  return client.db("green-gladiars").collection("products");
};

// 1. GET ALL PRODUCTS: GET /api/products
router.get('/', async (req, res) => {
  try {
    const productsCollection = getProductsCollection();
    const products = await productsCollection.find({}).sort({ createdAt: -1 }).toArray();
    res.json(products);
  } catch (error) {
    console.error('Fetch Products Error:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// 2. CREATE PRODUCT: POST /api/products
router.post('/', async (req, res) => {
  try {
    const { title, category, price, brand, inStock, image } = req.body;

    if (!title || !price) {
      return res.status(400).json({ message: 'Product title and price are required' });
    }

    const productsCollection = getProductsCollection();

    const newProduct = {
      title,
      category: category ? category.toUpperCase() : 'GENERAL',
      price: Number(price),
      brand: brand || 'CyclePro',
      inStock: inStock !== undefined ? Boolean(inStock) : true,
      image: image || '/assets/jersey.jpg',
      rating: 5,
      reviews: 1,
      createdAt: new Date()
    };

    const result = await productsCollection.insertOne(newProduct);
    newProduct._id = result.insertedId;

    res.status(201).json({
      message: 'Product created successfully',
      product: newProduct
    });
  } catch (error) {
    console.error('Create Product Error:', error);
    res.status(500).json({ message: 'Failed to create product' });
  }
});

// 3. UPDATE STOCK / PRODUCT: PUT /api/products/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { inStock, price, title } = req.body;
    const productsCollection = getProductsCollection();

    const updateFields = {};
    if (inStock !== undefined) updateFields.inStock = Boolean(inStock);
    if (price) updateFields.price = Number(price);
    if (title) updateFields.title = title;

    const result = await productsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    res.json({ message: 'Product updated', product: result });
  } catch (error) {
    console.error('Update Product Error:', error);
    res.status(500).json({ message: 'Failed to update product' });
  }
});

// 4. DELETE PRODUCT: DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const productsCollection = getProductsCollection();
    await productsCollection.deleteOne({ _id: new ObjectId(id) });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    console.error('Delete Product Error:', error);
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

module.exports = router;
