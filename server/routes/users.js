import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Create new user (onboarding)
router.post('/', async (req, res) => {
  try {
    const {
      childName,
      condition,
      caregiverName,
      metrics,
      medications,
      routineTasks,
      flareMeds,
      flareTasks,
      completed
    } = req.body;

    // Debug logging
    console.log('Received metrics:', JSON.stringify(metrics, null, 2));

    const user = new User({
      childName,
      condition,
      caregiverName,
      metrics,
      medications,
      routineTasks,
      flareMeds,
      flareTasks,
      completed
    });

    const savedUser = await user.save();
    console.log('Saved metrics:', JSON.stringify(savedUser.metrics, null, 2));
    res.status(201).json(savedUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
});

// Add a log entry
router.post('/:id/logs', async (req, res) => {
  try {
    const { metrics, note } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const logEntry = {
      time: new Date(),
      metrics,
      note
    };
    
    user.logs.push(logEntry);
    user.isCheckinNow = false;
    user.lastCheckinTime = new Date();
    
    await user.save();
    
    res.status(201).json({ 
      message: 'Log entry added successfully', 
      log: user.logs[user.logs.length - 1] 
    });
  } catch (error) {
    console.error('Error adding log entry:', error);
    res.status(500).json({ message: 'Error adding log entry', error: error.message });
  }
});

// Get user logs
router.get('/:id/logs', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching logs', error: error.message });
  }
});

// Migrate metrics to add missing fields (for existing data)
router.post('/:id/migrate-metrics', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update each metric to include missing fields with defaults
    user.metrics = user.metrics.map(metric => ({
      name: metric.name,
      metricType: metric.metricType || 'scale',
      unit: metric.unit || '/10',
      min: metric.min ?? 0,
      max: metric.max ?? 10,
      baseline: metric.baseline ?? 5,
      baselineBoolean: metric.baselineBoolean ?? true,
      higherIsWorse: metric.higherIsWorse ?? false,
      yesIsGood: metric.yesIsGood ?? true
    }));

    await user.save();
    res.json({ message: 'Metrics migrated successfully', metrics: user.metrics });
  } catch (error) {
    console.error('Error migrating metrics:', error);
    res.status(500).json({ message: 'Error migrating metrics', error: error.message });
  }
});

export default router;
