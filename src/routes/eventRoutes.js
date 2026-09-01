const express = require('express');
const router = express.Router();
const { client } = require('../config/db');
const { ObjectId } = require('mongodb');

// Helper to get events collection
const getEventsCollection = () => {
  return client.db("green-gladiars").collection("events");
};

// 1. GET ALL EVENTS: GET /api/events
router.get('/', async (req, res) => {
  try {
    const eventsCollection = getEventsCollection();
    const events = await eventsCollection.find({}).sort({ createdAt: -1 }).toArray();
    res.json(events);
  } catch (error) {
    console.error('Fetch Events Error:', error);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

// 2. CREATE NEW EVENT: POST /api/events
router.post('/', async (req, res) => {
  try {
    const { title, organizer, location, distance, time, difficulty, totalCapacity, image } = req.body;

    if (!title || !location) {
      return res.status(400).json({ message: 'Event title and location are required' });
    }

    const eventsCollection = getEventsCollection();

    const newEvent = {
      title,
      organizer: organizer || 'Green Gladiators Club',
      location,
      distance: distance || '45 km',
      time: time || '7:00 AM',
      difficulty: difficulty || 'Moderate',
      totalCapacity: Number(totalCapacity) || 25,
      image: image || '/assets/event-1.jpg',
      participants: [],
      status: 'Active',
      createdAt: new Date()
    };

    const result = await eventsCollection.insertOne(newEvent);
    newEvent._id = result.insertedId;

    res.status(201).json({
      message: 'Event created successfully',
      event: newEvent
    });
  } catch (error) {
    console.error('Create Event Error:', error);
    res.status(500).json({ message: 'Failed to create event' });
  }
});

// 3. JOIN EVENT (RIDER RSVP): POST /api/events/:id/join
router.post('/:id/join', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, name, email, image } = req.body;

    if (!userId || !name || !email) {
      return res.status(400).json({ message: 'User information required to join event' });
    }

    const eventsCollection = getEventsCollection();
    const event = await eventsCollection.findOne({ _id: new ObjectId(id) });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user already joined
    const alreadyJoined = event.participants?.some(p => p.userId === userId || p.email === email);
    if (alreadyJoined) {
      return res.status(400).json({ message: 'You have already joined this ride!' });
    }

    const participantData = {
      userId,
      name,
      email,
      image: image || '/assets/profile.jpg',
      joinedAt: new Date()
    };

    const result = await eventsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $push: { participants: participantData } },
      { returnDocument: 'after' }
    );

    res.json({
      message: 'Successfully joined event!',
      event: result
    });
  } catch (error) {
    console.error('Join Event Error:', error);
    res.status(500).json({ message: 'Failed to join event' });
  }
});

// 4. DELETE EVENT: DELETE /api/events/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const eventsCollection = getEventsCollection();

    const result = await eventsCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete Event Error:', error);
    res.status(500).json({ message: 'Failed to delete event' });
  }
});

module.exports = router;
