import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiHelpers } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  MessageSquare, CheckSquare, Target, Zap, 
  TrendingUp, Calendar, ArrowRight, Flame,
  Brain, Heart, Sparkles, Award, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await apiHelpers.getDashboard();
        setDashboardData(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading your dashboard..." />;
  }

  const stats = dashboardData?.stats || {
    totalSessions: 0,
    currentStreak: 0,
    averageMood: 0,
    completedTasks: 0,
    activeGoals: 0,
    activeHabits: 0,
    habitsCompletedToday: 0,
    goalProgress: 0
  };

  const insights = dashboardData?.insights || [];
  const activeGoals = dashboardData?.activeGoals || [];
  const todayHabits = dashboardData?.todayHabits || [];
  const upcomingTasks = dashboardData?.upcomingTasks || [];
  const recentEntries = dashboardData?.recentEntries || [];

  const getInsightColor = (type) => {
    switch (type) {
      case 'positive':
      case 'achievement':
        return 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-700';
      case 'warning':
        return 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 dark:from-yellow-900/20 dark:to-orange-900/20 dark:border-yellow-700';
      case 'suggestion':
      case 'reminder':
        return 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300 dark:from-blue-900/20 dark:to-cyan-900/20 dark:border-blue-700';
      default:
        return 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300 dark:from-purple-900/20 dark:to-pink-900/20 dark:border-purple-700';
    }
  };

  const isHabitCompletedToday = (habit) => {
    if (!habit.completions || habit.completions.length === 0) return false;
    const today = new Date().toISOString().split('T')[0];
    return habit.completions.some(c => 
      new Date(c.date).toISOString().split('T')[0] === today
    );
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅 Good Morning';
    if (hour < 17) return '☀️ Good Afternoon';
    if (hour < 22) return '🌆 Good Evening';
    return '🌙 Good Night';
  };

  const getMotivationalQuote = () => {
    const quotes = [
      "Every day is a fresh start. Make it count! 💪",
      "Small progress is still progress. Keep going! 🌟",
      "You're doing better than you think! ✨",
      "Consistency beats perfection. Stay committed! 🎯",
      "Your future self will thank you! 🚀"
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  const hasData = stats.totalSessions > 0 || stats.activeGoals > 0 || stats.activeHabits > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Welcome Section */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">
            {getGreeting()}! 👋
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
            {getMotivationalQuote()}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
          <Link to="/chat" className="stat-card fade-in-up accent-dot hover:scale-105 active:scale-95 transition-all duration-300 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-orange-600 dark:text-orange-400" />
                {stats.currentStreak > 0 && <Flame className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-orange-500" />}
              </div>
              <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">Journal Streak</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                {stats.currentStreak}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500 mt-0.5 sm:mt-1">days</p>
            </div>
          </Link>

          <Link to="/mood" className="stat-card fade-in-up accent-dot hover:scale-105 active:scale-95 transition-all duration-300 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800" style={{animationDelay: '0.1s'}}>
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400" />
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-blue-500" />
              </div>
              <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">Avg Mood</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                {stats.averageMood.toFixed(1)}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500 mt-0.5 sm:mt-1">out of 10</p>
            </div>
          </Link>

          <Link to="/goals" className="stat-card fade-in-up accent-dot hover:scale-105 active:scale-95 transition-all duration-300 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800" style={{animationDelay: '0.2s'}}>
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-purple-600 dark:text-purple-400" />
                <Award className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-purple-500" />
              </div>
              <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">Goal Progress</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                {stats.goalProgress}%
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500 mt-0.5 sm:mt-1">{stats.activeGoals} active</p>
            </div>
          </Link>

          <Link to="/habits" className="stat-card fade-in-up accent-dot hover:scale-105 active:scale-95 transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800" style={{animationDelay: '0.3s'}}>
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600 dark:text-green-400" />
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-green-500" />
              </div>
              <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">Habits Today</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                {stats.habitsCompletedToday}/{stats.activeHabits}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500 mt-0.5 sm:mt-1">completed</p>
            </div>
          </Link>
        </div>

        {/* AI Insights Section */}
        {insights.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center space-x-2 mb-3 sm:mb-4">
              <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100">
                AI Insights
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-3 sm:p-4 md:p-5 rounded-xl border-2 ${getInsightColor(insight.type)} fade-in-up shadow-sm hover:shadow-md transition-all duration-300`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <span className="text-xl sm:text-2xl md:text-3xl flex-shrink-0">{insight.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5 sm:mb-1 text-xs sm:text-sm md:text-base">
                        {insight.title}
                      </h3>
                      <p className="text-[10px] sm:text-xs md:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {insight.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Grid - Always show if there's data */}
        {hasData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            {/* Today's Habits */}
            {todayHabits.length > 0 && (
              <div className="card accent-dot fade-in-up">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                    <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Today's Habits
                    </h3>
                  </div>
                  <Link to="/habits" className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex items-center transition-colors">
                    View all <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                  </Link>
                </div>
                <div className="space-y-2">
                  {todayHabits.map((habit) => {
                    const completed = isHabitCompletedToday(habit);
                    return (
                      <div
                        key={habit.id || habit._id}
                        className={`flex items-center justify-between p-2 sm:p-3 rounded-lg transition-all duration-200 ${
                          completed
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                            : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                          <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                            completed ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-600'
                          }`}>
                            {completed && <span className="text-[10px] sm:text-xs">✓</span>}
                          </div>
                          <span className={`text-xs sm:text-sm font-medium truncate ${
                            completed ? 'text-gray-700 dark:text-gray-300 line-through' : 'text-gray-900 dark:text-gray-100'
                          }`}>
                            {habit.name}
                          </span>
                        </div>
                        {habit.streak?.current > 0 && (
                          <div className="flex items-center text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 ml-2">
                            <Flame className="w-3 h-3 text-orange-500 mr-0.5 sm:mr-1" />
                            {habit.streak.current}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active Goals */}
            {activeGoals.length > 0 && (
              <div className="card accent-dot fade-in-up" style={{animationDelay: '0.1s'}}>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Active Goals
                    </h3>
                  </div>
                  <Link to="/goals" className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex items-center transition-colors">
                    View all <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                  </Link>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {activeGoals.map((goal) => (
                    <div key={goal.id || goal._id} className="p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-1 sm:mb-2">
                        <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate flex-1">
                          {goal.title}
                        </h4>
                        <span className="text-[10px] sm:text-xs font-semibold text-purple-600 dark:text-purple-400 ml-2">
                          {goal.progress || 0}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 sm:h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                          style={{ width: `${goal.progress || 0}%` }}
                        />
                      </div>
                      {goal.milestones && goal.milestones.length > 0 && (
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1 sm:mt-2">
                          {goal.milestones.filter(m => m.completed).length}/{goal.milestones.length} milestones
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Tasks */}
            {upcomingTasks.length > 0 && (
              <div className="card accent-dot fade-in-up" style={{animationDelay: '0.2s'}}>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center space-x-2">
                    <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Upcoming Tasks
                    </h3>
                  </div>
                  <Link to="/tasks" className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex items-center transition-colors">
                    View all <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                  </Link>
                </div>
                <div className="space-y-2">
                  {upcomingTasks.map((task) => (
                    <div
                      key={task.id || task._id}
                      className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                    >
                      <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                        <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 truncate">
                          {task.title}
                        </span>
                      </div>
                      {task.due_date && (
                        <div className="flex items-center text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 ml-2">
                          <Calendar className="w-3 h-3 mr-0.5 sm:mr-1" />
                          {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Journal Entries */}
            {recentEntries.length > 0 && (
              <div className="card accent-dot fade-in-up" style={{animationDelay: '0.3s'}}>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
                    <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Recent Thoughts
                    </h3>
                  </div>
                  <Link to="/chat" className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex items-center transition-colors">
                    New entry <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                  </Link>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {recentEntries.slice(0, 3).map((entry, index) => (
                    <div key={index} className="border-l-4 border-orange-300 dark:border-orange-600 pl-2 sm:pl-3 py-1 sm:py-2">
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 line-clamp-2 leading-relaxed">
                        {entry.transcription.substring(0, 100)}...
                      </p>
                      <div className="flex items-center mt-1 sm:mt-2">
                        <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                          Mood: {entry.mood_score}/10
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!hasData && (
          <div className="text-center py-8 sm:py-12 card accent-dot fade-in-up">
            <div className="max-w-md mx-auto px-4">
              <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-purple-500 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">
                Welcome to Your Wellness Journey! 🌟
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                Start by creating your first journal entry, setting a goal, or building a new habit.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 sm:gap-3">
                <Link to="/chat" className="btn-primary text-sm sm:text-base">
                  Start Journaling
                </Link>
                <Link to="/goals" className="btn-secondary text-sm sm:text-base">
                  Set a Goal
                </Link>
                <Link to="/habits" className="btn-secondary text-sm sm:text-base">
                  Build a Habit
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
