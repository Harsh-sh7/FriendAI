import React, { useState, useEffect } from 'react';
import { apiHelpers } from '../utils/api';
import { Zap, Plus, Trash2, Check, Flame } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const Habits = () => {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    frequency: 'daily',
    target_days: []
  });

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const response = await apiHelpers.getHabits(true);
      setHabits(response.data || []);
    } catch (error) {
      console.error('Failed to fetch habits:', error);
      toast.error('Failed to load habits');
    } finally {
      setLoading(false);
    }
  };

  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!newHabit.name.trim()) {
      toast.error('Habit name is required');
      return;
    }

    try {
      await apiHelpers.createHabit(newHabit);
      toast.success('Habit created successfully');
      setNewHabit({ name: '', description: '', frequency: 'daily', target_days: [] });
      setShowAddForm(false);
      fetchHabits();
    } catch (error) {
      toast.error('Failed to create habit');
    }
  };

  const completeHabit = async (habitId, habitName) => {
    try {
      await apiHelpers.completeHabit(habitId, '');
      toast.success(`✓ ${habitName} completed for today!`);
      fetchHabits();
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error('Already completed today');
      } else {
        toast.error('Failed to complete habit');
      }
    }
  };

  const deleteHabit = async (habitId, habitName) => {
    if (!window.confirm(`Delete habit "${habitName}"?`)) return;

    try {
      await apiHelpers.deleteHabit(habitId);
      toast.success('Habit deleted');
      fetchHabits();
    } catch (error) {
      toast.error('Failed to delete habit');
    }
  };

  const isCompletedToday = (habit) => {
    if (!habit.completions || habit.completions.length === 0) return false;
    const today = new Date().toISOString().split('T')[0];
    return habit.completions.some(c => 
      new Date(c.date).toISOString().split('T')[0] === today
    );
  };

  if (loading) {
    return <LoadingSpinner text="Loading your habits..." />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Habits</h1>
          <p className="text-gray-600 dark:text-gray-400">Build positive habits, one day at a time</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary flex items-center space-x-2 floating accent-dot"
        >
          <Plus className="w-4 h-4" />
          <span>Add Habit</span>
        </button>
      </div>

      {/* Add Habit Form */}
      {showAddForm && (
        <div className="card mb-6 fade-in-up accent-dot">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Create New Habit</h3>
          <form onSubmit={handleAddHabit} className="space-y-4">
            <input
              type="text"
              placeholder="Habit name (e.g., Morning meditation)"
              value={newHabit.name}
              onChange={(e) => setNewHabit(prev => ({ ...prev, name: e.target.value }))}
              className="input-field"
            />
            <textarea
              placeholder="Description (optional)"
              value={newHabit.description}
              onChange={(e) => setNewHabit(prev => ({ ...prev, description: e.target.value }))}
              className="input-field h-20 resize-none"
            />
            <select
              value={newHabit.frequency}
              onChange={(e) => setNewHabit(prev => ({ ...prev, frequency: e.target.value }))}
              className="input-field"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="custom">Custom</option>
            </select>

            <div className="flex space-x-3 pt-2">
              <button type="submit" className="btn-primary floating">Create Habit</button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn-secondary hover:scale-105 transition-transform duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Habits List */}
      <div className="space-y-4">
        {habits.length === 0 ? (
          <div className="text-center py-12 card accent-dot fade-in-up">
            <Zap className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4 gentle-float" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No habits yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start building positive habits to improve your daily routine
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary floating"
            >
              Create Your First Habit
            </button>
          </div>
        ) : (
          habits.map((habit, index) => {
            const completedToday = isCompletedToday(habit);
            const currentStreak = habit.streak?.current || 0;
            const longestStreak = habit.streak?.longest || 0;

            return (
              <div
                key={habit.id || habit._id}
                className="card fade-in-up accent-dot hover:scale-[1.01] transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    {/* Complete Button */}
                    <button
                      onClick={() => !completedToday && completeHabit(habit.id || habit._id, habit.name)}
                      disabled={completedToday}
                      className={`p-3 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 shadow-md hover:shadow-lg ${
                        completedToday
                          ? 'bg-green-500 text-white shadow-green-200 dark:shadow-green-800/30 cursor-default'
                          : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 cursor-pointer'
                      }`}
                    >
                      <Check className="w-5 h-5" />
                    </button>

                    {/* Habit Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {habit.name}
                        </h3>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {habit.frequency}
                        </span>
                        {completedToday && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            ✓ Done today
                          </span>
                        )}
                      </div>
                      {habit.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {habit.description}
                        </p>
                      )}

                      {/* Streak Info */}
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <Flame className={`w-4 h-4 ${currentStreak > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
                          <span className="text-gray-700 dark:text-gray-300">
                            <span className="font-semibold">{currentStreak}</span> day streak
                          </span>
                        </div>
                        {longestStreak > 0 && (
                          <div className="text-gray-500 dark:text-gray-400">
                            Best: <span className="font-semibold">{longestStreak}</span> days
                          </div>
                        )}
                        <div className="text-gray-500 dark:text-gray-400">
                          Total: <span className="font-semibold">{habit.completions?.length || 0}</span> times
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => deleteHabit(habit.id || habit._id, habit.name)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-all rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 hover:scale-110 active:scale-95"
                    title="Delete habit"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Completion History (Last 7 days) */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Last 7 days</p>
                  <div className="flex space-x-1">
                    {[...Array(7)].map((_, i) => {
                      const date = new Date();
                      date.setDate(date.getDate() - (6 - i));
                      const dateStr = date.toISOString().split('T')[0];
                      const completed = habit.completions?.some(c => 
                        new Date(c.date).toISOString().split('T')[0] === dateStr
                      );

                      return (
                        <div
                          key={i}
                          className={`flex-1 h-8 rounded transition-all ${
                            completed
                              ? 'bg-green-500 dark:bg-green-600'
                              : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                          title={`${date.toLocaleDateString()} - ${completed ? 'Completed' : 'Not completed'}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Habits;
