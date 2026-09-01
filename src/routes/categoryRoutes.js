const express = require('express');
const router = express.Router();
const { client } = require('../config/db');
const { ObjectId } = require('mongodb');

// Helper to get categories collection
const getCategoriesCollection = () => {
  return client.db("green-gladiars").collection("categories");
};

// Default seed categories if empty
const defaultCategories = ['Apparel', 'Helmets', 'Accessories', 'Components'];

// 1. GET ALL CATEGORIES: GET /api/categories
router.get('/', async (req, res) => {
  try {
    const categoriesCollection = getCategoriesCollection();
    let categories = await categoriesCollection.find({}).sort({ name: 1 }).toArray();

    // If no categories in DB, seed default ones
    if (categories.length === 0) {
      const seedDocs = defaultCategories.map(name => ({ name, createdAt: new Date() }));
      await categoriesCollection.insertMany(seedDocs);
      categories = await categoriesCollection.find({}).sort({ name: 1 }).toArray();
    }

    res.json(categories);
  } catch (error) {
    console.error('Fetch Categories Error:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

// 2. CREATE CATEGORY: POST /api/categories
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const categoriesCollection = getCategoriesCollection();
    const formattedName = name.trim();

    // Check duplicate
    const existing = await categoriesCollection.findOne({ name: { $regex: new RegExp(`^${formattedName}$`, 'i') } });
    if (existing) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const newCategory = {
      name: formattedName,
      createdAt: new Date()
    };

    const result = await categoriesCollection.insertOne(newCategory);
    newCategory._id = result.insertedId;

    res.status(201).json({
      message: 'Category created successfully',
      category: newCategory
    });
  } catch (error) {
    console.error('Create Category Error:', error);
    res.status(500).json({ message: 'Failed to create category' });
  }
});

// 3. DELETE CATEGORY: DELETE /api/categories/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const categoriesCollection = getCategoriesCollection();
    await categoriesCollection.deleteOne({ _id: new ObjectId(id) });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete Category Error:', error);
    res.status(500).json({ message: 'Failed to delete category' });
  }
});

module.exports = router;
