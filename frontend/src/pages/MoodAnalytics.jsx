import React, { useState, useEffect } from 'react';
import { apiHelpers } from '../utils/api';
import { BarChart3, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { useTheme } from '../contexts/ThemeContext';

const MoodAnalytics = () => {
  const { isDark } = useTheme();
  const [moodData, setMoodData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('weekly');

  useEffect(() => {
    fetchMoodData();
  }, [period]);

  const fetchMoodData = async () => {
    try {
      setLoading(true);
      const response = await apiHelpers.getMoodAnalytics(period);
      setMoodData(response.data);
    } catch (error) {
      console.error('Failed to fetch mood data:', error);
      toast.error('Failed to load mood analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading your mood analytics..." />;
  }

  const chartData = moodData?.data?.filter(d => d.mood !== null) || [];
  const stats = moodData?.stats || {
    average: 0,
    highest: 0,
    lowest: 0,
    totalEntries: 0
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Mood Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">Track your emotional wellness over time</p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setPeriod('weekly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === 'weekly'
                ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === 'monthly'
                ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Mood</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.average}/10
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-gray-500 dark:text-gray-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Highest</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.highest}/10
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Lowest</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.lowest}/10
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Entries</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalEntries}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-gray-500 dark:text-gray-400" />
          </div>
        </div>
      </div>

      {/* Mood Chart */}
      <div className="card mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Mood Trend - {period.charAt(0).toUpperCase() + period.slice(1)}
        </h3>
        
        {chartData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={isDark ? '#374151' : '#e5e7eb'}
                  className="opacity-30" 
                />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12, fill: isDark ? '#9ca3af' : '#6b7280' }}
                  axisLine={{ stroke: isDark ? '#4b5563' : '#d1d5db' }}
                  tickLine={{ stroke: isDark ? '#4b5563' : '#d1d5db' }}
                />
                <YAxis 
                  domain={[0, 10]}
                  tick={{ fontSize: 12, fill: isDark ? '#9ca3af' : '#6b7280' }}
                  axisLine={{ stroke: isDark ? '#4b5563' : '#d1d5db' }}
                  tickLine={{ stroke: isDark ? '#4b5563' : '#d1d5db' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1f2937' : 'white',
                    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: isDark ? '#f3f4f6' : '#111827'
                  }}
                  labelStyle={{ color: isDark ? '#f3f4f6' : '#111827' }}
                />
                <Line
                  type="monotone"
                  dataKey="mood"
                  stroke={isDark ? '#f3f4f6' : '#1f2937'}
                  strokeWidth={3}
                  dot={{ 
                    fill: isDark ? '#f3f4f6' : '#1f2937', 
                    strokeWidth: 2, 
                    r: 4,
                    stroke: isDark ? '#1f2937' : '#f3f4f6'
                  }}
                  activeDot={{ 
                    r: 6, 
                    fill: isDark ? '#f3f4f6' : '#1f2937',
                    stroke: isDark ? '#1f2937' : '#f3f4f6',
                    strokeWidth: 2
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No mood data yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Start journaling to track your mood trends over time
            </p>
          </div>
        )}
      </div>

      {/* Insights */}
      {chartData.length > 2 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Insights
          </h3>
          
          <div className="space-y-4">
            {stats.average > 7 && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-1">
                  🌟 Great Mood Trend!
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Your average mood score is {stats.average.toFixed(1)}/10. You've been maintaining excellent emotional wellness!
                </p>
              </div>
            )}
            
            {stats.average < 5 && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                  💛 Room for Improvement
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Your average mood has been {stats.average.toFixed(1)}/10. Consider talking to your AI friend more often for personalized suggestions.
                </p>
              </div>
            )}

            {stats.totalEntries >= 7 && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                  📈 Consistent Tracking
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  You've logged {stats.totalEntries} mood entries! Consistency is key to understanding your emotional patterns.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default MoodAnalytics;
