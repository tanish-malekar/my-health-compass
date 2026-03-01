import mongoose from 'mongoose';

const metricSchema = new mongoose.Schema({
  name: { type: String, required: true },
  metricType: { type: String, enum: ['scale', 'boolean'], default: 'scale' },
  unit: { type: String, default: '/10' },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 10 },
  baseline: { type: Number, default: 5 },
  baselineBoolean: { type: Boolean, default: true },
  higherIsWorse: { type: Boolean, default: false },
  yesIsGood: { type: Boolean, default: true }
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

const logMetricSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  metricType: { type: String, enum: ['scale', 'boolean'], required: true }
});

const logEntrySchema = new mongoose.Schema({
  time: { type: Date, default: Date.now },
  metrics: [logMetricSchema],
  note: { type: String }
});

const userSchema = new mongoose.Schema({
  childName: { type: String, required: true },
  condition: { type: String },
  caregiverName: { type: String },
  mode: { type: String, enum: ['normal', 'flare'], default: 'normal' },
  isCheckinNow: { type: Boolean, default: false },
  lastCheckinTime: { type: Date },
  metrics: [metricSchema],
  medications: [medicationSchema],
  routineTasks: [taskSchema],
  flareMeds: [medicationSchema],
  flareTasks: [taskSchema],
  logs: [logEntrySchema],
  completed: { type: Boolean, default: false }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

export default User;
