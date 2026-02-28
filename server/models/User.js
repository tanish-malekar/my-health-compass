import mongoose from 'mongoose';

const metricSchema = new mongoose.Schema({
  name: { type: String, required: true },
  unit: { type: String, default: '/10' },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 10 },
  baseline: { type: Number, default: 5 },
  higherIsWorse: { type: Boolean, default: false }
});

const medicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dose: { type: String },
  time: { type: String, default: 'Morning' }
});

const taskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, default: 'care' },
  time: { type: String }
});

const userSchema = new mongoose.Schema({
  childName: { type: String, required: true },
  condition: { type: String },
  caregiverName: { type: String },
  metrics: [metricSchema],
  medications: [medicationSchema],
  routineTasks: [taskSchema],
  flareMeds: [medicationSchema],
  flareTasks: [taskSchema],
  completed: { type: Boolean, default: false }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

export default User;
