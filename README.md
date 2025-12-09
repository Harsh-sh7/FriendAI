# 🧠 AI Friend - Personal Wellness Companion

A comprehensive AI-powered wellness application that helps you track your mood, manage tasks, build habits, and achieve goals through intelligent journaling and analytics.

---

## 🌟 Features

### Core Features
- **🗣️ Daily AI Conversations** - Chat with your AI companion about your day
- **📊 Mood Tracking** - Automatic mood analysis with interactive charts
- **✅ Task Management** - Create, track, and manage tasks with priorities
- **🎯 Goal Setting** - Set long-term goals with milestones and progress tracking
- **⚡ Habit Tracker** - Build positive habits with streak counting
- **📈 Analytics Dashboard** - AI-powered insights and correlations
- **💾 Data Export** - Export all your data in JSON or CSV format
- **🌓 Dark/Light Mode** - Seamless theme switching
- **📱 Fully Responsive** - Works perfectly on all devices

### AI-Powered Intelligence
- Mood detection from journal entries
- Personalized insights and recommendations
- Pattern recognition across mood, tasks, and habits
- Smart task/goal/habit suggestions from conversations
- Correlation analysis (e.g., "Your mood is higher on days you exercise")

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js + Express.js
- **Database**: MongoDB with Mongoose (with in-memory fallback)
- **AI**: Google Gemini AI for intelligent conversations
- **Authentication**: JWT-based auth with bcrypt password hashing
- **Security**: Rate limiting, helmet, CORS, input validation

### Frontend
- **Framework**: React 18 with modern hooks
- **Styling**: TailwindCSS with custom design system
- **Routing**: React Router v6
- **Charts**: Recharts for mood visualizations
- **HTTP Client**: Axios with interceptors
- **Notifications**: React Hot Toast
- **Icons**: Lucide React

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB URI (optional - uses in-memory storage if not provided)
- Google Gemini API key

### 1. Clone Repository
```bash
git clone <repository-url>
cd PersonalFriendAI
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `.env` file:
```env
# Required
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=your_secret_key_here

# Optional (uses in-memory storage if not provided)
MONGODB_URI=mongodb://localhost:27017/ai-friend

# Optional Configuration
PORT=5002
NODE_ENV=development
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
```

Start backend:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5002

---

## 📁 Project Structure

```
PersonalFriendAI/
├── backend/
│   ├── middleware/
│   │   └── auth.js              # Authentication middleware
│   ├── routes/
│   │   └── auth.js              # Auth routes (modular)
│   ├── utils/
│   │   └── helpers.js           # Utility functions
│   ├── models.js                # MongoDB schemas
│   ├── storage.js               # Storage abstraction layer
│   ├── server.js                # Express app & routes
│   ├── .env                     # Environment variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx       # Navigation with hamburger menu
│   │   │   └── LoadingSpinner.jsx
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx  # Authentication state
│   │   │   └── ThemeContext.jsx # Theme management
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx    # Main dashboard
│   │   │   ├── Chat.jsx         # Conversational journal
│   │   │   ├── Tasks.jsx        # Task management
│   │   │   ├── Goals.jsx        # Goal tracking
│   │   │   ├── Habits.jsx       # Habit building
│   │   │   ├── Mood.jsx         # Mood analytics
│   │   │   ├── Login.jsx        # Authentication
│   │   │   └── Register.jsx
│   │   ├── utils/
│   │   │   └── api.js           # API helper functions
│   │   ├── App.jsx              # Main app component
│   │   └── index.css            # Global styles
│   └── package.json
│
└── README.md                    # This file
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register    # Create account
POST   /api/auth/login       # Sign in
GET    /api/auth/me          # Get current user
```

### AI Features
```
POST   /api/ai/analyze       # Analyze text and detect mood
POST   /api/ai/speak         # Text-to-speech (browser-based)
```

### Dashboard
```
GET    /api/dashboard        # Get dashboard data with AI insights
```

### Journal
```
GET    /api/journal          # Get journal entries
POST   /api/journal          # Create journal entry
```

### Tasks
```
GET    /api/tasks            # Get all tasks
POST   /api/tasks            # Create task
PUT    /api/tasks/:id        # Update task
DELETE /api/tasks/:id        # Delete task
```

### Goals
```
GET    /api/goals            # Get all goals (filter by status)
POST   /api/goals            # Create goal
PUT    /api/goals/:id        # Update goal (progress, milestones)
DELETE /api/goals/:id        # Delete goal
```

### Habits
```
GET    /api/habits           # Get all habits (filter by active)
POST   /api/habits           # Create habit
PUT    /api/habits/:id       # Update habit
POST   /api/habits/:id/complete  # Mark habit as completed
DELETE /api/habits/:id       # Delete habit
```

### Mood Analytics
```
GET    /api/mood/analytics   # Get mood data (weekly/monthly)
```

### Data Export
```
GET    /api/export?format=json  # Export all data as JSON
GET    /api/export?format=csv   # Export journal as CSV
```

---

## 🎨 Key Features Explained

### 1. Conversational Journaling
- Chat interface for daily reflections
- AI detects mood from your writing
- Suggests actionable tasks, goals, or habits
- One-click to add suggestions to your lists
- Persistent chat history (daily-based)
- Browser text-to-speech for AI responses

### 2. Smart Dashboard
- AI-generated insights based on your data
- Correlations (e.g., "High mood correlates with task completion")
- Quick stats: streak, mood, goals, habits
- Today's habits with completion tracking
- Active goals with progress bars
- Upcoming tasks with due dates
- Recent journal entries

### 3. Task Management
- Create tasks with title, description, due date, priority
- Smart task suggestions based on time of day
- One-click task completion
- Link tasks to goals (optional)
- Delete with completion confirmation

### 4. Goal Tracking
- Set goals with categories (Health, Career, Personal, etc.)
- Add milestones to break down goals
- Visual progress bars (0-100%)
- Track completion status
- Filter by active/completed/abandoned

### 5. Habit Building
- Create daily, weekly, or custom habits
- Automatic streak calculation
- Visual 7-day completion history
- Prevent duplicate completions
- Gamification with fire emoji for streaks

### 6. Mood Analytics
- Weekly and monthly mood charts
- Average mood calculation
- Trend analysis
- Correlation with habits and tasks

---

## 🔒 Security Features

- **Password Security**: bcrypt hashing with 12 rounds
- **Authentication**: JWT tokens with configurable expiration
- **Rate Limiting**: Separate limits for auth, AI, and general routes
- **Input Validation**: Server-side validation for all inputs
- **CORS**: Configured for frontend origin
- **Helmet**: Security headers
- **Data Isolation**: User-specific data filtering

---

## 💾 Data Storage

### MongoDB Mode (Production)
- Persistent data storage
- Scalable and reliable
- Automatic indexing for performance

### In-Memory Mode (Development)
- No MongoDB required
- Perfect for testing
- Data resets on server restart
- Automatically used if `MONGODB_URI` is not provided

---

## 🎯 Environment Variables

### Required
```env
GEMINI_API_KEY=<your-gemini-api-key>
JWT_SECRET=<random-secret-string>
```

### Optional
```env
MONGODB_URI=<mongodb-connection-string>  # Uses in-memory if not set
PORT=5002                                # Default: 5002
NODE_ENV=development                     # development | production
JWT_EXPIRES_IN=7d                        # Token expiration
BCRYPT_ROUNDS=12                         # Password hashing rounds
```

---

## 🚨 Important Notes

1. **Gemini API Required**: You need a Google Gemini API key for AI features
   - Get it from: https://makersuite.google.com/app/apikey

2. **MongoDB Optional**: App works without MongoDB using in-memory storage
   - Perfect for development and testing
   - Use MongoDB for production to persist data

3. **Browser Compatibility**: 
   - Speech recognition works best in Chrome/Edge
   - Text-to-speech uses browser's native synthesis

4. **Data Persistence**: 
   - In-memory mode: Data lost on restart
   - MongoDB mode: Data persists permanently

5. **Port Configuration**: 
   - Backend: 5002 (configurable)
   - Frontend: 3000 (Vite default)

---

## 📱 Mobile Responsiveness

- **Hamburger Menu**: Mobile navigation with slide-down menu
- **Touch-Friendly**: Optimized tap targets (44x44px minimum)
- **Responsive Text**: Scales from mobile to desktop
- **Adaptive Layouts**: 1-4 column grids based on screen size
- **No Horizontal Scroll**: Content fits all screen widths

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 5002 is in use
lsof -i :5002

# Kill process if needed
kill -9 <PID>

# Check environment variables
cat backend/.env
```

### Frontend won't connect to backend
```bash
# Verify backend is running
curl http://localhost:5002/api/auth/me

# Check CORS settings in server.js
# Ensure frontend URL is allowed
```

### MongoDB connection issues
```bash
# Test MongoDB connection
mongosh <your-mongodb-uri>

# Or use in-memory mode
# Remove MONGODB_URI from .env
```

### AI features not working
```bash
# Verify Gemini API key
echo $GEMINI_API_KEY

# Test API key
curl -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY"
```

---

## 🎓 Development Guide

### Adding a New Feature
1. Create database model in `models.js`
2. Add storage methods in `storage.js`
3. Create API routes in `server.js` (or new route file)
4. Add API helper in `frontend/src/utils/api.js`
5. Create frontend page/component
6. Add route in `App.jsx`
7. Update navigation in `Navbar.jsx`

### Code Style
- Use ES6+ features
- Async/await for promises
- Functional components with hooks
- TailwindCSS for styling
- Meaningful variable names
- Comments for complex logic

---

## 📄 License

This project is for personal use and learning purposes.

---

## 🙏 Acknowledgments

- **Google Gemini AI** - For intelligent conversation capabilities
- **MongoDB** - For reliable data storage
- **React** - For building the user interface
- **TailwindCSS** - For beautiful styling
- **Lucide React** - For clean, modern icons

---

## 📞 Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review the code comments
3. Check console logs for errors
4. Verify environment variables are set correctly

---

**Built with ❤️ for personal wellness and productivity**
