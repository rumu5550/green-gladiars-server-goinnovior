const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { client } = require('../config/db');
const { ObjectId } = require('mongodb');
const { upload } = require('../config/cloudinary');

// Helper to get users collection
const getUsersCollection = () => {
  return client.db("green-gladiars").collection("users");
};

// 1. REGISTER RIDER: POST /api/users/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, location } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const usersCollection = getUsersCollection();

    // Check existing user
    const existingUser = await usersCollection.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      location: location || 'Not Specified',
      plan: 'Not a Member',
      image: '/assets/profile.jpg',
      rides: '0 rides',
      rating: '5.0',
      createdAt: new Date()
    };

    const result = await usersCollection.insertOne(newUser);

    // Generate JWT token
    const token = jwt.sign(
      { id: result.insertedId, email: newUser.email },
      process.env.JWT_SECRET || 'supersecretkey123',
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = newUser;
    userWithoutPassword._id = result.insertedId;

    res.status(201).json({
      message: 'Rider registered successfully',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// 2. LOGIN RIDER: POST /api/users/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const usersCollection = getUsersCollection();

    const user = await usersCollection.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'supersecretkey123',
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// 3. GET ALL RIDERS (FOR ADMIN & DIRECTORY): GET /api/users
router.get('/', async (req, res) => {
  try {
    const usersCollection = getUsersCollection();
    const users = await usersCollection.find({}).project({ password: 0 }).sort({ createdAt: -1 }).toArray();
    res.json(users);
  } catch (error) {
    console.error('Fetch Users Error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// 4. CLOUDINARY IMAGE UPLOAD API: POST /api/users/upload-avatar
router.post('/upload-avatar', upload.single('image'), (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }
    // Return direct Cloudinary image URL
    res.json({
      message: 'Image uploaded  successfully',
      imageUrl: req.file.path
    });
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    res.status(500).json({ message: 'Failed to upload image to Cloudinary' });
  }
});

// 5. UPDATE RIDER PROFILE / PLAN: PUT /api/users/profile/:id
router.put('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, image, plan } = req.body;

    const usersCollection = getUsersCollection();

    const updateFields = {};
    if (name) updateFields.name = name;
    if (location) updateFields.location = location;
    if (image) updateFields.image = image;
    if (plan) updateFields.plan = plan;

    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateFields },
      { returnDocument: 'after', projection: { password: 0 } }
    );

    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: result
    });
  } catch (error) {
    console.error('Profile Update Error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

module.exports = router;
