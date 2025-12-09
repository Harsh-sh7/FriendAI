import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import FormData from 'form-data';
import { GoogleGenerativeAI } from '@google/generative-ai';
import mongoose from 'mongoose';
import { User, JournalEntry, Task } from './models.js';
import { storage } from './storage.js';

// Helper to convert string ID to ObjectId
const toObjectId = (id) => {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch (error) {
    return id; // Return as-is if conversion fails
  }
};

// Helper to safely get ISO string from date
const toISOString = (date) => {
  if (!date) return null;
  if (typeof date === 'string') return date;
  if (date instanceof Date) return date.toISOString();
  return String(date);
};

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// In-memory storage fallback
let isMongoConnected = false;
const inMemoryStorage = {
  users: new Map(),
  journalEntries: new Map(),
  tasks: new Map()
};

// Initialize MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB connected successfully');
    isMongoConnected = true;
    storage.setMongoStatus(true);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('⚠️  Running in FALLBACK MODE with in-memory storage');
    console.log('⚠️  Data will NOT persist after server restart');
    isMongoConnected = false;
    storage.setMongoStatus(false);
    // Don't exit - continue with in-memory storage
  }
};

// Connect to MongoDB (non-blocking)
connectDB();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 1000 requests for dev, 100 for prod
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 50, // 50 requests for dev, 5 for prod
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 AI requests per minute
  message: { error: 'Too many AI requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/ai/', aiLimiter);

// Configure multer for audio uploads
const multerStorage = multer.memoryStorage();
const upload = multer({
  storage: multerStorage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/') || file.mimetype === 'video/webm') {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed!'), false);
    }
  }
});

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // For now, we'll trust the JWT token and create a user object
    // In production, you might want to verify against database
    req.user = { id: decoded.userId };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Utility functions
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const hashPassword = async (password) => {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  return await bcrypt.hash(password, rounds);
};

const validatePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Error handler
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'File too large' });
  }
  
  if (err.message === 'Only audio files are allowed!') {
    return res.status(400).json({ error: 'Only audio files are allowed' });
  }
  
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' 
  });
};

app.get("/",(req,res)=>{
  res.send("Welcome to the server!!")
})

setInterval(()=>{

  const fetchApi = async () =>{
    const res = await fetch("https://friendai-5ww9.onrender.com/api/health")
  }

  fetchApi();
},600000)
// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Authentication Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await storage.findUser({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const newUser = await storage.createUser({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      created_at: new Date(),
      updated_at: new Date()
    });

    // Generate token
    const token = generateToken(newUser._id.toString());

    // Return user without password
    const userWithoutPassword = {
      id: newUser._id,
      email: newUser.email,
      name: newUser.name,
      created_at: newUser.created_at,
      updated_at: newUser.updated_at
    };

    res.status(201).json({
      token,
      user: userWithoutPassword,
      message: 'Registration successful'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user
    const user = await storage.findUser({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Validate password
    const isValidPassword = await validatePassword(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await storage.updateUser(user._id, { updated_at: new Date() });

    // Generate token
    const token = generateToken(user._id.toString());

    // Return user without password
    const userWithoutPassword = {
      id: user._id,
      email: user.email,
      name: user.name,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    res.json({
      token,
      user: userWithoutPassword,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const { password: _, ...userWithoutPassword } = req.user;
  res.json({ user: userWithoutPassword });
});

// Speech-to-Text Route - Browser-based only (free)
app.post('/api/ai/transcribe', authenticateToken, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log('Audio file received:', {
      size: `${Math.round(req.file.buffer.length / 1024)}KB`,
      type: req.file.mimetype
    });

    // We don't actually transcribe on server - browser does it
    // This endpoint just acknowledges receipt
    res.json({
      transcription: '',
      message: 'Please use browser speech recognition or type your message',
      method: 'Browser-based (free)',
      audioReceived: true
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to process audio' });
  }
});

// AI Analysis Route
app.post('/api/ai/analyze', authenticateToken, async (req, res) => {
  try {
    const { transcription, context } = req.body;

    if (!transcription) {
      return res.status(400).json({ error: 'Transcription is required' });
    }

    console.log('Analyzing journal entry with Gemini AI...');

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an empathetic AI wellness companion and personal friend. Analyze this daily journal entry and provide supportive insights.

Context: This is a daily check-in from someone sharing their day with their AI friend.

Instructions:
1. Provide a warm, supportive summary of their day (2-3 sentences)
2. Offer empathetic consolation if they faced challenges (can be empty if day was positive)
3. Suggest 2-3 practical, actionable improvements for tomorrow
4. Assign a mood score from 1-10 based on their overall emotional tone
5. Share an uplifting motivational message
6. Include a relevant wellness tip, quote, or interesting fact

Your response MUST be valid JSON in this exact format:
{
  "summary": "A warm, supportive summary of their day",
  "consolation": "Empathetic support if they faced difficulties (can be empty string if day was positive)",
  "suggestions": ["First practical suggestion", "Second practical suggestion", "Third practical suggestion"],
  "moodScore": 7,
  "motivation": "An uplifting, personalized motivational message",
  "knowledgeNugget": "A relevant wellness tip, inspiring quote, or interesting fact"
}

Keep responses natural, empathetic, and encouraging. Adapt your tone to match their emotional state.

--- USER'S JOURNAL ENTRY ---
${transcription}
--- END OF ENTRY ---

Respond with only the JSON object:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text();

    console.log('Raw AI response:', aiResponse.substring(0, 200) + '...');

    // Parse JSON response
    let parsedResponse;
    try {
      // Extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : aiResponse;
      parsedResponse = JSON.parse(jsonText);

      // Validate and sanitize response
      if (!parsedResponse.summary || !parsedResponse.suggestions || !parsedResponse.moodScore) {
        throw new Error('Missing required fields');
      }

      // Ensure suggestions is array
      if (!Array.isArray(parsedResponse.suggestions)) {
        parsedResponse.suggestions = [parsedResponse.suggestions].filter(Boolean);
      }

      // Validate mood score
      if (typeof parsedResponse.moodScore !== 'number' || parsedResponse.moodScore < 1 || parsedResponse.moodScore > 10) {
        parsedResponse.moodScore = Math.max(1, Math.min(10, parseInt(parsedResponse.moodScore) || 5));
      }

      // Ensure all fields are strings (except moodScore and suggestions)
      parsedResponse.summary = String(parsedResponse.summary || '').trim();
      parsedResponse.consolation = String(parsedResponse.consolation || '').trim();
      parsedResponse.motivation = String(parsedResponse.motivation || '').trim();
      parsedResponse.knowledgeNugget = String(parsedResponse.knowledgeNugget || '').trim();

    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      
      // Fallback response with sentiment analysis
      const positiveWords = ['good', 'great', 'amazing', 'wonderful', 'happy', 'excited', 'proud', 'accomplished', 'successful', 'joy'];
      const negativeWords = ['bad', 'terrible', 'awful', 'sad', 'depressed', 'angry', 'frustrated', 'stressed', 'worried', 'difficult'];
      
      const lowerTranscription = transcription.toLowerCase();
      const positiveCount = positiveWords.filter(word => lowerTranscription.includes(word)).length;
      const negativeCount = negativeWords.filter(word => lowerTranscription.includes(word)).length;
      
      let moodScore = 5;
      let consolation = '';
      let motivation = 'Every day is a step forward in your journey.';
      
      if (positiveCount > negativeCount) {
        moodScore = Math.min(9, 6 + positiveCount);
        motivation = 'It sounds like you had a positive day! Keep building on this momentum.';
      } else if (negativeCount > positiveCount) {
        moodScore = Math.max(2, 5 - negativeCount);
        consolation = 'It sounds like today brought some challenges. Remember that difficult days are temporary.';
        motivation = 'Tomorrow is a fresh start with new possibilities. You\'ve got this!';
      }
      
      parsedResponse = {
        summary: 'Thank you for sharing your thoughts with me today. I appreciate your openness in reflecting on your experiences.',
        consolation: consolation,
        suggestions: [
          'Take a few minutes for deep breathing or meditation',
          'Write down three things you\'re grateful for today',
          'Plan one enjoyable activity for tomorrow'
        ],
        moodScore: moodScore,
        motivation: motivation,
        knowledgeNugget: 'Research shows that daily reflection can improve emotional awareness by up to 23%. You\'re on the right path!'
      };
    }

    // Save journal entry to database
    try {
      await storage.createJournalEntry({
        user_id: toObjectId(req.user.id),
        transcription,
        ai_response: parsedResponse,
        mood_score: parsedResponse.moodScore,
        created_at: new Date()
      });
    } catch (journalError) {
      console.error('Failed to save journal entry:', journalError);
    }

    res.json(parsedResponse);

  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// Text-to-Speech Route - Browser TTS Only
app.post('/api/ai/speak', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Return fallback response - client will use browser TTS
    return res.status(200).json({ 
      fallback: true,
      message: 'Using browser text-to-speech',
      text: text
    });

  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ 
      error: 'Text-to-speech failed',
      fallback: true,
      message: 'Using browser fallback'
    });
  }
});

// Dashboard Route
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = toObjectId(req.user.id);

    // Get journal entries
    const journalEntries = await storage.findJournalEntries(
      { user_id: userId },
      { sort: { created_at: -1 } }
    );

    // Get tasks
    const tasks = await storage.findTasks(
      { user_id: userId },
      { sort: { due_date: 1 } }
    );

    // Simple approach: use journal entries to track task completions
    // We'll store task completion events as special journal entries
    const completionEntries = await storage.findJournalEntries({
      user_id: userId,
      transcription: { $regex: '^TASK_COMPLETED:' }
    });
    
    const completedTasksCount = (completionEntries?.length || 0) + (tasks?.filter(task => task.completed).length || 0);

    // Calculate stats - exclude task completion entries from total sessions
    const realJournalEntries = journalEntries?.filter(entry => 
      !entry.transcription.startsWith('TASK_COMPLETED:')
    ) || [];
    
    const totalSessions = realJournalEntries?.length || 0;
    const recentEntries = realJournalEntries?.slice(0, 5) || [];
    
    const moodEntries = realJournalEntries?.filter(entry => entry.mood_score) || [];
    const averageMood = moodEntries.length > 0 
      ? moodEntries.reduce((sum, entry) => sum + entry.mood_score, 0) / moodEntries.length 
      : 0;

    // Calculate streak (only for real journal entries, not task completions)
    const today = new Date().toISOString().split('T')[0];
    const hasEntryToday = realJournalEntries?.some(entry => 
      toISOString(entry.created_at).split('T')[0] === today
    ) || false;

    let currentStreak = 0;
    if (hasEntryToday) {
      currentStreak = 1;
      // Calculate actual streak by checking consecutive days (only real journal entries)
      const sortedEntries = realJournalEntries?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) || [];
      let checkDate = new Date(today);
      
      for (let i = 0; i < sortedEntries.length; i++) {
        const entryDate = toISOString(sortedEntries[i].created_at).split('T')[0];
        const checkDateStr = checkDate.toISOString().split('T')[0];
        
        if (entryDate === checkDateStr) {
          if (i === 0 || entryDate !== toISOString(sortedEntries[i-1]?.created_at).split('T')[0]) {
            currentStreak = i + 1;
          }
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Get mood data for last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayEntry = realJournalEntries?.find(entry => 
        toISOString(entry.created_at).split('T')[0] === dateStr
      );
      
      last7Days.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: dateStr,
        mood: dayEntry ? dayEntry.mood_score : null,
        hasEntry: !!dayEntry
      });
    }

    // Get upcoming tasks (next 3 days)
    const upcomingTasks = tasks?.filter(task => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date);
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      return taskDate <= threeDaysFromNow && !task.completed;
    }).slice(0, 5) || [];

    // Get active goals
    const goals = await storage.findGoals(
      { user_id: userId, status: 'active' },
      { sort: { created_at: -1 } }
    );

    // Get active habits
    const habits = await storage.findHabits(
      { user_id: userId, active: true },
      { sort: { created_at: -1 } }
    );

    // Calculate habit completion rate for today
    const todayStr = new Date().toISOString().split('T')[0];
    const habitsCompletedToday = habits?.filter(habit => 
      habit.completions?.some(c => new Date(c.date).toISOString().split('T')[0] === todayStr)
    ).length || 0;
    const totalActiveHabits = habits?.length || 0;

    // Calculate overall progress
    const activeGoalsCount = goals?.length || 0;
    const averageGoalProgress = activeGoalsCount > 0
      ? goals.reduce((sum, goal) => sum + (goal.progress || 0), 0) / activeGoalsCount
      : 0;

    // Generate AI-powered insights
    const insights = [];
    
    // Mood-based insights
    if (averageMood >= 7) {
      insights.push({
        type: 'positive',
        icon: '🌟',
        title: 'Great Mood Trend',
        message: `Your average mood is ${averageMood.toFixed(1)}/10. Keep up the positive energy!`
      });
    } else if (averageMood < 5 && averageMood > 0) {
      insights.push({
        type: 'suggestion',
        icon: '💙',
        title: 'Self-Care Reminder',
        message: `Your mood has been lower recently. Consider taking time for activities you enjoy.`
      });
    }

    // Streak insights
    if (currentStreak >= 7) {
      insights.push({
        type: 'achievement',
        icon: '🔥',
        title: 'Amazing Streak!',
        message: `${currentStreak} days of consistent journaling. You're building great habits!`
      });
    } else if (currentStreak === 0 && totalSessions > 0) {
      insights.push({
        type: 'reminder',
        icon: '📝',
        title: 'Check-in Reminder',
        message: `Haven't checked in today. A few minutes of reflection can make a big difference.`
      });
    }

    // Habit insights
    if (totalActiveHabits > 0) {
      const completionRate = (habitsCompletedToday / totalActiveHabits) * 100;
      if (completionRate === 100) {
        insights.push({
          type: 'achievement',
          icon: '✨',
          title: 'All Habits Complete!',
          message: `You've completed all ${totalActiveHabits} habits today. Excellent work!`
        });
      } else if (completionRate > 0) {
        insights.push({
          type: 'progress',
          icon: '⚡',
          title: 'Habit Progress',
          message: `${habitsCompletedToday}/${totalActiveHabits} habits completed today. Keep going!`
        });
      }
    }

    // Goal insights
    if (activeGoalsCount > 0) {
      if (averageGoalProgress >= 75) {
        insights.push({
          type: 'positive',
          icon: '🎯',
          title: 'Goals On Track',
          message: `Your goals are ${averageGoalProgress.toFixed(0)}% complete on average. Great progress!`
        });
      } else if (averageGoalProgress < 25) {
        insights.push({
          type: 'suggestion',
          icon: '🚀',
          title: 'Goal Momentum',
          message: `Break down your goals into smaller tasks to build momentum.`
        });
      }
    }

    // Task insights
    const overdueTasks = tasks?.filter(task => {
      if (!task.due_date || task.completed) return false;
      return new Date(task.due_date) < new Date();
    }).length || 0;

    if (overdueTasks > 0) {
      insights.push({
        type: 'warning',
        icon: '⏰',
        title: 'Overdue Tasks',
        message: `You have ${overdueTasks} overdue task${overdueTasks > 1 ? 's' : ''}. Consider rescheduling or completing them.`
      });
    }

    // Correlation insights (mood + productivity)
    if (averageMood >= 7 && completedTasksCount >= 5) {
      insights.push({
        type: 'insight',
        icon: '💡',
        title: 'Productivity Pattern',
        message: `Your high mood (${averageMood.toFixed(1)}/10) correlates with strong productivity (${completedTasksCount} tasks completed).`
      });
    }

    // Limit to top 4 insights
    const topInsights = insights.slice(0, 4);

    res.json({
      stats: {
        totalSessions,
        currentStreak,
        averageMood: Math.round(averageMood * 10) / 10,
        completedTasks: completedTasksCount,
        activeGoals: activeGoalsCount,
        activeHabits: totalActiveHabits,
        habitsCompletedToday,
        goalProgress: Math.round(averageGoalProgress)
      },
      moodData: last7Days,
      recentEntries,
      upcomingTasks,
      activeGoals: goals?.slice(0, 3) || [],
      todayHabits: habits?.slice(0, 5) || [],
      insights: topInsights
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Task Management Routes
app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const userId = toObjectId(req.user.id);
    console.log('Fetching tasks for user:', userId, '(type:', typeof userId, ')');
    
    const tasks = await storage.findTasks(
      { user_id: userId },
      { sort: { created_at: -1 } }
    );

    console.log('Found tasks:', tasks?.length || 0, 'tasks');
    res.json(tasks || []);
  } catch (error) {
    console.error('Tasks fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const { title, description, due_date, priority } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const task = await storage.createTask({
      user_id: toObjectId(req.user.id),
      title,
      description: description || '',
      due_date: due_date || null,
      priority: priority || 'medium',
      completed: false,
      created_at: new Date()
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Task creation error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Get the current task state to check if it's being completed
    const currentTask = await storage.findTask({
      _id: id,
      user_id: toObjectId(req.user.id)
    });

    if (!currentTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if task is being completed
    const wasCompleted = currentTask.completed;
    
    // Update task
    const task = await storage.updateTask(id, { ...updates, updated_at: new Date() });

    // If task is being marked as completed (from false to true), create completion tracking entry
    if (!wasCompleted && updates.completed === true) {
      console.log('Creating task completion tracking entry for user:', req.user.id);
      
      // Create a special journal entry to track task completion
      try {
        await storage.createJournalEntry({
          user_id: toObjectId(req.user.id),
          transcription: `TASK_COMPLETED: ${task.title}`,
          ai_response: {
            summary: `Congratulations! You completed the task: "${task.title}". This achievement has been recorded in your progress tracking.`,
            moodScore: 8,
            type: 'task_completion'
          },
          mood_score: 8,
          created_at: new Date()
        });
        console.log('Successfully created task completion tracking entry');
      } catch (journalError) {
        console.error('Error creating task completion entry:', journalError);
        // Don't fail the request, just log the error
      }
    }

    res.json(task);
  } catch (error) {
    console.error('Task update error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = toObjectId(req.user.id);
    
    console.log('Deleting task:', id, 'for user:', userId);

    const result = await storage.deleteTask({
      _id: id,
      user_id: userId
    });

    console.log('Delete result:', result);

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Task deletion error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Journal Routes
app.get('/api/journal', authenticateToken, async (req, res) => {
  try {
    const entries = await storage.findJournalEntries(
      { user_id: toObjectId(req.user.id) },
      { sort: { created_at: -1 } }
    );

    res.json(entries || []);
  } catch (error) {
    console.error('Journal fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch journal entries' });
  }
});

// Mood Analytics Route
app.get('/api/mood/analytics', authenticateToken, async (req, res) => {
  try {
    const { period = 'weekly' } = req.query;

    const entries = await storage.findJournalEntries({
      user_id: toObjectId(req.user.id),
      mood_score: { $ne: null }
    }, {
      sort: { created_at: 1 },
      select: 'mood_score created_at'
    });

    let moodData = [];

    if (period === 'weekly') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayEntries = entries?.filter(entry => 
          toISOString(entry.created_at).split('T')[0] === dateStr
        ) || [];
        
        const averageMood = dayEntries.length > 0
          ? dayEntries.reduce((sum, entry) => sum + entry.mood_score, 0) / dayEntries.length
          : null;

        moodData.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          fullDate: dateStr,
          mood: averageMood ? Math.round(averageMood * 10) / 10 : null,
          hasEntry: dayEntries.length > 0
        });
      }
    } else if (period === 'monthly') {
      // Last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayEntries = entries?.filter(entry => 
          toISOString(entry.created_at).split('T')[0] === dateStr
        ) || [];
        
        const averageMood = dayEntries.length > 0
          ? dayEntries.reduce((sum, entry) => sum + entry.mood_score, 0) / dayEntries.length
          : null;

        moodData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          fullDate: dateStr,
          mood: averageMood ? Math.round(averageMood * 10) / 10 : null,
          hasEntry: dayEntries.length > 0
        });
      }
    }

    // Calculate overall stats
    const allMoodScores = entries?.map(entry => entry.mood_score) || [];
    const averageMood = allMoodScores.length > 0 
      ? allMoodScores.reduce((sum, score) => sum + score, 0) / allMoodScores.length 
      : 0;

    const highestMood = Math.max(...allMoodScores, 0);
    const lowestMood = allMoodScores.length > 0 ? Math.min(...allMoodScores) : 0;

    res.json({
      period,
      data: moodData,
      stats: {
        average: Math.round(averageMood * 10) / 10,
        highest: highestMood,
        lowest: lowestMood,
        totalEntries: allMoodScores.length
      }
    });

  } catch (error) {
    console.error('Mood analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch mood analytics' });
  }
});

// Goals Routes
app.get('/api/goals', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    const query = { user_id: toObjectId(req.user.id) };
    if (status) query.status = status;

    const goals = await storage.findGoals(query, { sort: { created_at: -1 } });
    res.json(goals || []);
  } catch (error) {
    console.error('Goals fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

app.post('/api/goals', authenticateToken, async (req, res) => {
  try {
    const { title, description, category, target_date, milestones } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const goal = await storage.createGoal({
      user_id: toObjectId(req.user.id),
      title,
      description: description || '',
      category: category || 'personal',
      target_date: target_date || null,
      milestones: milestones || [],
      progress: 0,
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    });

    res.status(201).json(goal);
  } catch (error) {
    console.error('Goal creation error:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

app.put('/api/goals/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body, updated_at: new Date() };

    const goal = await storage.updateGoal(id, updates);
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json(goal);
  } catch (error) {
    console.error('Goal update error:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

app.delete('/api/goals/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await storage.deleteGoal({
      _id: id,
      user_id: toObjectId(req.user.id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Goal deletion error:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

// Habits Routes
app.get('/api/habits', authenticateToken, async (req, res) => {
  try {
    const { active } = req.query;
    const query = { user_id: toObjectId(req.user.id) };
    if (active !== undefined) query.active = active === 'true';

    const habits = await storage.findHabits(query, { sort: { created_at: -1 } });
    res.json(habits || []);
  } catch (error) {
    console.error('Habits fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
});

app.post('/api/habits', authenticateToken, async (req, res) => {
  try {
    const { name, description, frequency, target_days } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const habit = await storage.createHabit({
      user_id: toObjectId(req.user.id),
      name,
      description: description || '',
      frequency: frequency || 'daily',
      target_days: target_days || [],
      streak: { current: 0, longest: 0 },
      completions: [],
      active: true,
      created_at: new Date(),
      updated_at: new Date()
    });

    res.status(201).json(habit);
  } catch (error) {
    console.error('Habit creation error:', error);
    res.status(500).json({ error: 'Failed to create habit' });
  }
});

app.put('/api/habits/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body, updated_at: new Date() };

    const habit = await storage.updateHabit(id, updates);
    
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    res.json(habit);
  } catch (error) {
    console.error('Habit update error:', error);
    res.status(500).json({ error: 'Failed to update habit' });
  }
});

app.post('/api/habits/:id/complete', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    // Get current habit
    const habits = await storage.findHabits({ 
      _id: id, 
      user_id: toObjectId(req.user.id) 
    });
    
    if (!habits || habits.length === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    const habit = habits[0];
    const today = new Date().toISOString().split('T')[0];
    
    // Check if already completed today
    const alreadyCompleted = habit.completions?.some(c => 
      new Date(c.date).toISOString().split('T')[0] === today
    );

    if (alreadyCompleted) {
      return res.status(400).json({ error: 'Habit already completed today' });
    }

    // Add completion
    const completions = [...(habit.completions || []), { date: new Date(), notes }];
    
    // Calculate streak
    const sortedCompletions = completions
      .map(c => new Date(c.date).toISOString().split('T')[0])
      .sort()
      .reverse();
    
    let currentStreak = 1;
    for (let i = 1; i < sortedCompletions.length; i++) {
      const current = new Date(sortedCompletions[i-1]);
      const previous = new Date(sortedCompletions[i]);
      const diffDays = Math.floor((current - previous) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentStreak++;
      } else if (diffDays > 1) {
        break;
      }
    }

    const longestStreak = Math.max(currentStreak, habit.streak?.longest || 0);

    const updatedHabit = await storage.updateHabit(id, {
      completions,
      streak: { current: currentStreak, longest: longestStreak },
      updated_at: new Date()
    });

    res.json(updatedHabit);
  } catch (error) {
    console.error('Habit completion error:', error);
    res.status(500).json({ error: 'Failed to complete habit' });
  }
});

app.delete('/api/habits/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await storage.deleteHabit({
      _id: id,
      user_id: toObjectId(req.user.id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    res.json({ message: 'Habit deleted successfully' });
  } catch (error) {
    console.error('Habit deletion error:', error);
    res.status(500).json({ error: 'Failed to delete habit' });
  }
});

// Data Export Route
app.get('/api/export', authenticateToken, async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    const userId = toObjectId(req.user.id);

    // Fetch all user data
    const [journalEntries, tasks, goals, habits] = await Promise.all([
      storage.findJournalEntries({ user_id: userId }, { sort: { created_at: -1 } }),
      storage.findTasks({ user_id: userId }, { sort: { created_at: -1 } }),
      storage.findGoals({ user_id: userId }, { sort: { created_at: -1 } }),
      storage.findHabits({ user_id: userId }, { sort: { created_at: -1 } })
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      user_id: userId,
      journal_entries: journalEntries || [],
      tasks: tasks || [],
      goals: goals || [],
      habits: habits || []
    };

    if (format === 'csv') {
      // Simple CSV export for journal entries
      let csv = 'Date,Mood Score,Transcription\n';
      journalEntries?.forEach(entry => {
        const date = new Date(entry.created_at).toLocaleDateString();
        const mood = entry.mood_score || 'N/A';
        const text = (entry.transcription || '').replace(/"/g, '""');
        csv += `"${date}","${mood}","${text}"\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=wellness-data.csv');
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=wellness-data.json');
      res.json(exportData);
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});



// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`\n🚀 AI Friend Server is running!`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`🧠 AI: Gemini API configured`);
  console.log(`🔊 TTS: ElevenLabs API configured`);
  console.log(`💾 Database: MongoDB Atlas configured`);
  console.log(`\n✨ Ready to be your AI friend!\n`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('✅ Server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
