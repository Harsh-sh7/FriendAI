import mongoose from 'mongoose';

// User Schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Journal Entry Schema
const journalEntrySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  transcription: {
    type: String,
    required: true
  },
  ai_response: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  mood_score: {
    type: Number,
    min: 1,
    max: 10
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Task Schema
const taskSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  due_date: {
    type: Date,
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  completed: {
    type: Boolean,
    default: false
  },
  goal_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for better query performance
journalEntrySchema.index({ user_id: 1, created_at: -1 });
taskSchema.index({ user_id: 1, created_at: -1 });
taskSchema.index({ user_id: 1, due_date: 1 });

// Goal Schema
const goalSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  category: {
    type: String,
    enum: ['health', 'career', 'personal', 'financial', 'relationships', 'learning', 'other'],
    default: 'personal'
  },
  target_date: {
    type: Date,
    default: null
  },
  milestones: [{
    title: String,
    completed: { type: Boolean, default: false },
    completed_at: Date
  }],
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned'],
    default: 'active'
  },
  completed_at: {
    type: Date,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Habit Schema
const habitSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'custom'],
    default: 'daily'
  },
  target_days: {
    type: [String], // ['monday', 'tuesday', etc.]
    default: []
  },
  streak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 }
  },
  completions: [{
    date: { type: Date, required: true },
    notes: String
  }],
  active: {
    type: Boolean,
    default: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for new models
goalSchema.index({ user_id: 1, status: 1 });
goalSchema.index({ user_id: 1, created_at: -1 });
habitSchema.index({ user_id: 1, active: 1 });
habitSchema.index({ user_id: 1, created_at: -1 });

// Create models
export const User = mongoose.model('User', userSchema);
export const JournalEntry = mongoose.model('JournalEntry', journalEntrySchema);
export const Task = mongoose.model('Task', taskSchema);
export const Goal = mongoose.model('Goal', goalSchema);
export const Habit = mongoose.model('Habit', habitSchema);
