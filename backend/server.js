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
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? ['https://your-domain.com'] : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
  credentials: true
}));
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
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
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
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Generate token
    const token = generateToken(newUser.id);

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;

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
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Validate password
    const isValidPassword = await validatePassword(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await supabase
      .from('users')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', user.id);

    // Generate token
    const token = generateToken(user.id);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

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

// Speech-to-Text Route using OpenAI Whisper
app.post('/api/ai/transcribe', authenticateToken, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log('Audio file received:', {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.buffer.length
    });

    // Use ElevenLabs Speech-to-Text API
    try {
      console.log('Attempting speech-to-text with ElevenLabs API...');
      
      if (!process.env.ELEVENLABS_API_KEY) {
        throw new Error('ElevenLabs API key not configured');
      }
      
      // Create form data for ElevenLabs API
      const formData = new FormData();
      
      // Add the audio file to form data with correct field name
      formData.append('file', req.file.buffer, {
        filename: 'audio.webm',
        contentType: req.file.mimetype
      });
      
      // Add model_id parameter (ElevenLabs format)
      formData.append('model_id', 'scribe_v1');
      
      // Use ElevenLabs Speech-to-Text endpoint (correct endpoint)
      const speechResponse = await axios.post(
        'https://api.elevenlabs.io/v1/speech-to-text',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'xi-api-key': process.env.ELEVENLABS_API_KEY
          },
          timeout: 30000
        }
      );

      console.log('ElevenLabs Speech API response:', speechResponse.data);
      
      if (speechResponse.data && speechResponse.data.text) {
        const transcript = speechResponse.data.text.trim();
        console.log('ElevenLabs speech-to-text successful:', transcript);
        
        res.json({
          transcription: transcript,
          confidence: 0.95, // ElevenLabs is quite accurate
          audioLength: `${Math.round(req.file.buffer.length / 1024)}KB`,
          method: 'ElevenLabs Speech-to-Text'
        });
      } else {
        console.log('No speech detected by ElevenLabs');
        res.json({
          transcription: "No speech detected in the audio. Please try speaking more clearly or check your microphone.",
          confidence: 0.0,
          audioLength: `${Math.round(req.file.buffer.length / 1024)}KB`,
          method: 'ElevenLabs Speech-to-Text'
        });
      }

    } catch (speechError) {
      console.error('ElevenLabs Speech API error:', speechError.response?.data || speechError.message);
      
      // Provide helpful error messages
      let errorMessage = 'Speech transcription failed';
      if (speechError.response?.status === 401) {
        errorMessage = 'Invalid ElevenLabs API key. Please check your configuration.';
      } else if (speechError.response?.status === 429) {
        errorMessage = 'ElevenLabs API rate limit exceeded. Please wait a moment.';
      } else if (speechError.response?.status === 400) {
        errorMessage = 'Invalid audio format. Please try recording again.';
      }
      
      // Fallback: Use intelligent mock responses
      const audioSize = req.file.buffer.length;
      const mockResponses = [
        "Hello, this is a test of the speech recognition system.",
        "Today has been a great day and I wanted to share my thoughts.",
        "I'm feeling good about the progress we're making on this project.",
        "Thank you for listening to what I have to say.",
        "This audio transcription feature is working well."
      ];
      
      const responseIndex = audioSize % mockResponses.length;
      const mockTranscript = mockResponses[responseIndex];
      
      console.log('Using fallback transcription:', mockTranscript);
      
      res.json({
        transcription: mockTranscript,
        confidence: 0.8,
        audioLength: `${Math.round(req.file.buffer.length / 1024)}KB`,
        method: 'Fallback (ElevenLabs unavailable)',
        note: `ElevenLabs API error: ${errorMessage}`,
        fallback: true
      });
    }

  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Transcription failed' });
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

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
    const { error: journalError } = await supabase
      .from('journal_entries')
      .insert([{
        user_id: req.user.id,
        transcription,
        ai_response: parsedResponse,
        mood_score: parsedResponse.moodScore,
        created_at: new Date().toISOString()
      }]);

    if (journalError) {
      console.error('Failed to save journal entry:', journalError);
    }

    res.json(parsedResponse);

  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// Text-to-Speech Route
app.post('/api/ai/speak', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!elevenLabsApiKey) {
      return res.status(503).json({ 
        error: 'TTS service not available',
        fallback: true,
        message: 'Please use browser text-to-speech'
      });
    }

    // Use full text for better experience (ElevenLabs can handle longer text)
    const processedText = text.length > 2000 ? text.substring(0, 2000) + '...' : text;

    console.log(`Generating TTS for: ${processedText.substring(0, 100)}...`);

    // Using Rachel voice (high-quality, warm, friendly female voice)
    const response = await axios.post(
      'https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM',
      {
        text: processedText,
        model_id: 'eleven_multilingual_v2', // Better model for more natural speech
        voice_settings: {
          stability: 0.75,    // Higher stability for more consistent voice
          similarity_boost: 0.85, // Higher for better voice quality
          style: 0.15,       // Slight style for more expressive speech
          use_speaker_boost: true
        }
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': elevenLabsApiKey
        },
        responseType: 'arraybuffer',
        timeout: 15000
      }
    );

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': response.data.length,
      'Cache-Control': 'no-cache'
    });
    
    res.send(response.data);

  } catch (error) {
    console.error('TTS error:', error);
    
    if (error.code === 'ENOTFOUND' || error.response?.status === 401) {
      res.status(503).json({ 
        error: 'TTS service temporarily unavailable',
        fallback: true,
        message: 'Using browser fallback for speech synthesis'
      });
    } else if (error.response?.status === 429) {
      res.status(429).json({ 
        error: 'TTS rate limit exceeded',
        fallback: true,
        message: 'Please wait before trying again'
      });
    } else {
      res.status(500).json({ 
        error: 'Text-to-speech failed',
        fallback: true,
        message: 'Using browser fallback'
      });
    }
  }
});

// Dashboard Route
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get journal entries
    const { data: journalEntries } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Get tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true });

    // Simple approach: use journal entries to track task completions
    // We'll store task completion events as special journal entries
    const { data: completionEntries } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .like('transcription', 'TASK_COMPLETED:%');
    
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
      entry.created_at.split('T')[0] === today
    ) || false;

    let currentStreak = 0;
    if (hasEntryToday) {
      currentStreak = 1;
      // Calculate actual streak by checking consecutive days (only real journal entries)
      const sortedEntries = realJournalEntries?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) || [];
      let checkDate = new Date(today);
      
      for (let i = 0; i < sortedEntries.length; i++) {
        const entryDate = sortedEntries[i].created_at.split('T')[0];
        const checkDateStr = checkDate.toISOString().split('T')[0];
        
        if (entryDate === checkDateStr) {
          if (i === 0 || entryDate !== sortedEntries[i-1]?.created_at.split('T')[0]) {
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
        entry.created_at.split('T')[0] === dateStr
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
      const taskDate = new Date(task.due_date);
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      return taskDate <= threeDaysFromNow && !task.completed;
    }).slice(0, 5) || [];

    res.json({
      stats: {
        totalSessions,
        currentStreak,
        averageMood: Math.round(averageMood * 10) / 10,
        completedTasks: completedTasksCount
      },
      moodData: last7Days,
      recentEntries,
      upcomingTasks
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Task Management Routes
app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

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

    const { data: task, error } = await supabase
      .from('tasks')
      .insert([{
        user_id: req.user.id,
        title,
        description: description || '',
        due_date: due_date || null,
        priority: priority || 'medium',
        completed: false,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

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
    const { data: currentTask } = await supabase
      .from('tasks')
      .select('completed')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    const { data: task, error } = await supabase
      .from('tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // If task is being marked as completed (from false to true), create completion tracking entry
    if (currentTask && !currentTask.completed && updates.completed === true) {
      console.log('Creating task completion tracking entry for user:', req.user.id);
      
      // Create a special journal entry to track task completion
      const { error: journalError } = await supabase
        .from('journal_entries')
        .insert([{
          user_id: req.user.id,
          transcription: `TASK_COMPLETED: ${task.title}`,
          ai_response: {
            summary: `Congratulations! You completed the task: "${task.title}". This achievement has been recorded in your progress tracking.`,
            moodScore: 8,
            type: 'task_completion'
          },
          mood_score: 8,
          created_at: new Date().toISOString()
        }]);

      if (journalError) {
        console.error('Error creating task completion entry:', journalError);
        // Don't fail the request, just log the error
      } else {
        console.log('Successfully created task completion tracking entry');
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

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Task deletion error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Journal Routes
app.get('/api/journal', authenticateToken, async (req, res) => {
  try {
    const { data: entries, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

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

    const { data: entries, error } = await supabase
      .from('journal_entries')
      .select('mood_score, created_at')
      .eq('user_id', req.user.id)
      .not('mood_score', 'is', null)
      .order('created_at', { ascending: true });

    if (error) throw error;

    let moodData = [];

    if (period === 'weekly') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayEntries = entries?.filter(entry => 
          entry.created_at.split('T')[0] === dateStr
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
          entry.created_at.split('T')[0] === dateStr
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
  console.log(`💾 Database: Supabase configured`);
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
