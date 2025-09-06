# Personal Friend AI

A comprehensive personal AI companion for daily wellness tracking, mood monitoring, and life guidance.

## 🌟 Features

- **Daily AI Conversations**: Talk to your AI friend about your day using voice or text
- **Mood Tracking**: Automatic mood analysis with interactive charts (weekly/monthly)
- **Task Management**: Create, track, and reschedule tasks with AI suggestions
- **Speech-to-Text**: Record your thoughts and have them transcribed automatically
- **Text-to-Speech**: Listen to AI responses with ElevenLabs integration
- **Dark/Light Mode**: Monochrome theme with seamless theme switching
- **Secure Authentication**: JWT-based auth with Supabase integration

## 🛠️ Tech Stack

### Backend
- Node.js + Express.js
- Supabase (PostgreSQL) for data persistence
- Gemini AI for intelligent conversations
- ElevenLabs for text-to-speech
- JWT authentication
- Rate limiting and security features

### Frontend
- React 18 with modern hooks
- TailwindCSS for styling
- React Router for navigation
- Recharts for mood visualizations
- Framer Motion for animations
- Axios for API calls

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Gemini AI API key
- ElevenLabs API key

### 1. Backend Setup

```bash
cd backend
npm install
```

### 2. Environment Configuration

Create `.env` file in backend directory:
```env
# API Keys
ELEVENLABS_API_KEY=your_elevenlabs_api_key
GEMINI_API_KEY=your_gemini_api_key

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# Security
BCRYPT_ROUNDS=12
```

### 3. Database Setup

1. Create a new Supabase project
2. Go to SQL Editor in your dashboard
3. Run the SQL from `supabase-schema.sql`
4. Update your `.env` with Supabase credentials

### 4. Frontend Setup

```bash
cd frontend
npm install
```

### 5. Start Development Servers

Backend:
```bash
cd backend
npm run dev
```

Frontend (in new terminal):
```bash
cd frontend
npm run dev
```

The app will be available at `http://localhost:3000`

## 📝 Usage

1. **Sign Up**: Create an account with email and password
2. **Daily Check-in**: Use the Chat page to talk about your day
3. **Voice Input**: Click the microphone to record your thoughts
4. **AI Analysis**: Get personalized insights and mood scoring
5. **Task Management**: Create and track daily/weekly tasks
6. **Mood Trends**: View your mood patterns over time
7. **Theme Toggle**: Switch between light and dark modes

## 🎯 Core Workflows

### Daily Journal Flow
1. Navigate to Chat page
2. Click microphone or type your daily reflection
3. AI analyzes your input and provides:
   - Supportive summary
   - Actionable suggestions
   - Mood score (1-10)
   - Motivational message
4. Listen to AI response with text-to-speech
5. Data automatically saved for trend analysis

### Task Management Flow
1. Go to Tasks page
2. Create new tasks with priorities and due dates
3. AI suggests optimal scheduling
4. Mark tasks complete or reschedule
5. View productivity analytics

### Mood Analytics Flow
1. Visit Mood page
2. View weekly/monthly mood trends
3. Correlate mood with activities and tasks
4. Get AI insights on mood patterns

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in
- `GET /api/auth/me` - Get current user

### AI Features
- `POST /api/ai/transcribe` - Speech-to-text
- `POST /api/ai/analyze` - Text analysis with mood scoring
- `POST /api/ai/speak` - Text-to-speech

### Data Management
- `GET /api/dashboard` - Dashboard statistics
- `GET /api/tasks` - User tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `GET /api/journal` - Journal entries
- `GET /api/mood/analytics` - Mood data

## 🎨 Design System

- **Monochrome Theme**: Black and white color scheme
- **Clean Typography**: Inter font family
- **Minimalist Icons**: Lucide React icons
- **Smooth Animations**: Framer Motion transitions
- **Responsive Layout**: Mobile-first design
- **Accessibility**: ARIA labels and keyboard navigation

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting on API endpoints
- Row-level security in Supabase
- Input validation and sanitization
- CORS and helmet security headers

## 🚨 Important Notes

1. **Supabase Setup Required**: The app needs a configured Supabase project
2. **API Keys**: All API keys must be configured for full functionality
3. **Speech Recognition**: Uses browser's built-in speech recognition API
4. **Text-to-Speech**: Falls back to browser TTS if ElevenLabs unavailable
5. **Mock Data**: Some features use mock data for development

## 📱 Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers with WebRTC support

## 🤝 Contributing

This is a personal project, but feel free to fork and customize for your needs.

## 📄 License

MIT License - feel free to use this code for your personal projects.

---

Built with ❤️ for personal wellness and AI-powered self-reflection.
