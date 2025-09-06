import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiHelpers } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { MessageSquare, CheckSquare, BarChart3, Calendar, User, TrendingUp } from 'lucide-react';
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
    completedTasks: 0
  };

  const quickActions = [
    {
      title: 'Daily Check-in',
      description: 'Share your thoughts and feelings',
      icon: MessageSquare,
      href: '/chat',
      color: 'bg-gray-900 dark:bg-gray-100'
    },
    {
      title: 'View Tasks',
      description: 'Manage your daily tasks',
      icon: CheckSquare,
      href: '/tasks',
      color: 'bg-gray-800 dark:bg-gray-200'
    },
    {
      title: 'Mood Analytics',
      description: 'Track your emotional trends',
      icon: BarChart3,
      href: '/mood',
      color: 'bg-gray-700 dark:bg-gray-300'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Welcome back! 👋
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Here's how you're doing on your wellness journey
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stat-card fade-in-up accent-dot">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Sessions
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalSessions}
              </p>
            </div>
            <MessageSquare className="w-8 h-8 text-gray-500 dark:text-gray-400" />
          </div>
        </div>

        <div className="stat-card fade-in-up accent-dot" style={{animationDelay: '0.1s'}}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Current Streak
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.currentStreak} days
              </p>
            </div>
            <Calendar className="w-8 h-8 text-gray-500 dark:text-gray-400" />
          </div>
        </div>

        <div className="stat-card fade-in-up accent-dot" style={{animationDelay: '0.2s'}}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Average Mood
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.averageMood.toFixed(1)}/10
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-gray-500 dark:text-gray-400" />
          </div>
        </div>

        <div className="stat-card fade-in-up accent-dot" style={{animationDelay: '0.3s'}}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Completed Tasks
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.completedTasks}
              </p>
            </div>
            <CheckSquare className="w-8 h-8 text-gray-500 dark:text-gray-400" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={index}
                to={action.href}
                className="group relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700 dark:hover:to-gray-800 transition-all duration-300 transform hover:scale-105 floating accent-dot"
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${action.color}`}>
                    <Icon className="w-6 h-6 text-white dark:text-gray-900" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-gray-800 dark:group-hover:text-gray-200">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Journal Entries */}
        <div className="card accent-dot fade-in-up">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Recent Thoughts
          </h3>
          {dashboardData?.recentEntries?.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.recentEntries.slice(0, 3).map((entry, index) => (
                <div key={index} className="border-l-4 border-gray-300 dark:border-gray-600 pl-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-gray-900 dark:text-gray-100 line-clamp-2">
                    {entry.transcription.substring(0, 120)}...
                  </p>
                  <div className="flex items-center mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Mood: {entry.mood_score}/10
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <MessageSquare className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No journal entries yet
              </p>
              <Link
                to="/chat"
                className="btn-primary"
              >
                Start your first check-in
              </Link>
            </div>
          )}
        </div>

        {/* Upcoming Tasks */}
        <div className="card accent-dot fade-in-up" style={{animationDelay: '0.2s'}}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Upcoming Tasks
          </h3>
          {dashboardData?.upcomingTasks?.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.upcomingTasks.slice(0, 4).map((task, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full ${
                      task.priority === 'high' ? 'bg-red-400' :
                      task.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {task.title}
                    </p>
                    {task.due_date && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <CheckSquare className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No upcoming tasks
              </p>
              <Link
                to="/tasks"
                className="btn-primary"
              >
                Create your first task
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
