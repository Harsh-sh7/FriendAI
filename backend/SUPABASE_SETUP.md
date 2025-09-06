# Supabase Setup for Personal Friend AI

## Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in/create an account
2. Click "New Project"
3. Choose your organization
4. Set project name: "Personal Friend AI"
5. Set database password (save this!)
6. Choose region closest to you
7. Click "Create new project"

## Step 2: Configure Database
1. Wait for project to be created (takes 2-3 minutes)
2. Go to SQL Editor in your Supabase dashboard
3. Copy and paste the content from `supabase-schema.sql`
4. Run the SQL to create all tables, indexes, and security policies

## Step 3: Get API Keys
1. Go to Settings > API in your Supabase dashboard
2. Copy the following values:
   - Project URL
   - Anon (public) key
   - Service role key (keep this secret!)

## Step 4: Update Environment Variables
Update your `.env` file with the values:

```env
SUPABASE_URL=your_project_url_here
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Step 5: Test Connection
Run the server and test the health endpoint:
```bash
npm run dev
curl http://localhost:5000/api/health
```

## Database Schema Overview

### Tables Created:
- **users**: User accounts with authentication
- **journal_entries**: Daily journal entries with AI analysis
- **tasks**: Task management and scheduling
- **mood_entries**: Detailed mood tracking
- **user_preferences**: User settings and preferences

### Key Features:
- Row Level Security (RLS) for data isolation
- Automatic timestamps with triggers
- Mood analytics functions
- Streak calculation
- Comprehensive indexing for performance

### Security Features:
- Each user can only access their own data
- Password hashing handled by application
- JWT token-based authentication
- Secure database policies

## Troubleshooting

### Common Issues:
1. **Connection Failed**: Check your SUPABASE_URL and keys
2. **RLS Errors**: Make sure you're using the correct API key
3. **Schema Errors**: Ensure the SQL was run completely

### Testing Database:
You can test your database connection using the Supabase dashboard:
1. Go to Table Editor
2. Check if all tables are created
3. Try inserting test data manually

## Next Steps:
After setting up Supabase:
1. Test user registration
2. Test journal entry creation
3. Test task management
4. Test mood analytics

The backend server will automatically connect to Supabase when you start it!
