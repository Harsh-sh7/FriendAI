import React, { useState, useEffect } from 'react';
import { apiHelpers } from '../utils/api';
import { Target, Plus, Trash2, CheckCircle, Circle, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState('active');
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'personal',
    target_date: '',
    milestones: []
  });
  const [newMilestone, setNewMilestone] = useState('');

  useEffect(() => {
    fetchGoals();
  }, [filter]);

  const fetchGoals = async () => {
    try {
      const response = await apiHelpers.getGoals(filter === 'all' ? null : filter);
      setGoals(response.data || []);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!newGoal.title.trim()) {
      toast.error('Goal title is required');
      return;
    }

    try {
      await apiHelpers.createGoal(newGoal);
      toast.success('Goal created successfully');
      setNewGoal({ title: '', description: '', category: 'personal', target_date: '', milestones: [] });
      setShowAddForm(false);
      fetchGoals();
    } catch (error) {
      toast.error('Failed to create goal');
    }
  };

  const toggleMilestone = async (goalId, milestoneIndex) => {
    const goal = goals.find(g => g.id === goalId || g._id === goalId);
    if (!goal) return;

    const updatedMilestones = [...goal.milestones];
    updatedMilestones[milestoneIndex] = {
      ...updatedMilestones[milestoneIndex],
      completed: !updatedMilestones[milestoneIndex].completed,
      completed_at: !updatedMilestones[milestoneIndex].completed ? new Date() : null
    };

    const completedCount = updatedMilestones.filter(m => m.completed).length;
    const progress = Math.round((completedCount / updatedMilestones.length) * 100);

    try {
      await apiHelpers.updateGoal(goal.id || goal._id, { 
        milestones: updatedMilestones,
        progress
      });
      toast.success('Milestone updated');
      fetchGoals();
    } catch (error) {
      toast.error('Failed to update milestone');
    }
  };

  const completeGoal = async (goalId) => {
    try {
      await apiHelpers.updateGoal(goalId, { 
        status: 'completed',
        completed_at: new Date(),
        progress: 100
      });
      toast.success('🎉 Goal completed! Congratulations!');
      fetchGoals();
    } catch (error) {
      toast.error('Failed to complete goal');
    }
  };

  const deleteGoal = async (goalId, goalTitle) => {
    if (!window.confirm(`Delete goal "${goalTitle}"?`)) return;

    try {
      await apiHelpers.deleteGoal(goalId);
      toast.success('Goal deleted');
      fetchGoals();
    } catch (error) {
      toast.error('Failed to delete goal');
    }
  };

  const addMilestone = () => {
    if (!newMilestone.trim()) return;
    setNewGoal(prev => ({
      ...prev,
      milestones: [...prev.milestones, { title: newMilestone, completed: false }]
    }));
    setNewMilestone('');
  };

  const removeMilestone = (index) => {
    setNewGoal(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return <LoadingSpinner text="Loading your goals..." />;
  }

  const categories = [
    { value: 'health', label: '🏃 Health', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    { value: 'career', label: '💼 Career', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    { value: 'personal', label: '🌟 Personal', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
    { value: 'financial', label: '💰 Financial', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
    { value: 'relationships', label: '❤️ Relationships', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200' },
    { value: 'learning', label: '📚 Learning', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' },
    { value: 'other', label: '📌 Other', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Goals</h1>
          <p className="text-gray-600 dark:text-gray-400">Set and track your long-term objectives</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary flex items-center space-x-2 floating accent-dot"
        >
          <Plus className="w-4 h-4" />
          <span>Add Goal</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-6">
        {['active', 'completed', 'all'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Add Goal Form */}
      {showAddForm && (
        <div className="card mb-6 fade-in-up accent-dot">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Create New Goal</h3>
          <form onSubmit={handleAddGoal} className="space-y-4">
            <input
              type="text"
              placeholder="Goal title"
              value={newGoal.title}
              onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
              className="input-field"
            />
            <textarea
              placeholder="Description (optional)"
              value={newGoal.description}
              onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
              className="input-field h-20 resize-none"
            />
            <div className="grid grid-cols-2 gap-4">
              <select
                value={newGoal.category}
                onChange={(e) => setNewGoal(prev => ({ ...prev, category: e.target.value }))}
                className="input-field"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              <input
                type="date"
                value={newGoal.target_date}
                onChange={(e) => setNewGoal(prev => ({ ...prev, target_date: e.target.value }))}
                className="input-field"
              />
            </div>

            {/* Milestones */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Milestones (optional)
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  placeholder="Add a milestone"
                  value={newMilestone}
                  onChange={(e) => setNewMilestone(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMilestone())}
                  className="input-field flex-1"
                />
                <button
                  type="button"
                  onClick={addMilestone}
                  className="btn-secondary"
                >
                  Add
                </button>
              </div>
              {newGoal.milestones.length > 0 && (
                <ul className="space-y-1">
                  {newGoal.milestones.map((milestone, index) => (
                    <li key={index} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                      <span className="text-gray-700 dark:text-gray-300">{milestone.title}</span>
                      <button
                        type="button"
                        onClick={() => removeMilestone(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex space-x-3 pt-2">
              <button type="submit" className="btn-primary floating">Create Goal</button>
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

      {/* Goals List */}
      <div className="space-y-4">
        {goals.length === 0 ? (
          <div className="text-center py-12 card accent-dot fade-in-up">
            <Target className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4 gentle-float" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No goals yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Set your first goal and start working towards your dreams
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary floating"
            >
              Create Your First Goal
            </button>
          </div>
        ) : (
          goals.map((goal, index) => {
            const category = categories.find(c => c.value === goal.category);
            const completedMilestones = goal.milestones?.filter(m => m.completed).length || 0;
            const totalMilestones = goal.milestones?.length || 0;
            const progress = goal.progress || 0;

            return (
              <div
                key={goal.id || goal._id}
                className="card fade-in-up accent-dot hover:scale-[1.01] transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className={`text-lg font-semibold ${
                        goal.status === 'completed' 
                          ? 'line-through text-gray-500 dark:text-gray-400'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {goal.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${category?.color}`}>
                        {category?.label}
                      </span>
                      {goal.status === 'completed' && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          ✓ Completed
                        </span>
                      )}
                    </div>
                    {goal.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {goal.description}
                      </p>
                    )}
                    {goal.target_date && (
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
                        <Calendar className="w-4 h-4 mr-1.5" />
                        <span>Target: {new Date(goal.target_date).toLocaleDateString()}</span>
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Progress</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gray-900 dark:bg-gray-100 transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Milestones */}
                    {totalMilestones > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Milestones ({completedMilestones}/{totalMilestones})
                        </p>
                        <ul className="space-y-1">
                          {goal.milestones.map((milestone, mIndex) => (
                            <li
                              key={mIndex}
                              className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded transition-colors"
                              onClick={() => goal.status !== 'completed' && toggleMilestone(goal.id || goal._id, mIndex)}
                            >
                              {milestone.completed ? (
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                              ) : (
                                <Circle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              )}
                              <span className={`text-sm ${
                                milestone.completed
                                  ? 'line-through text-gray-500 dark:text-gray-400'
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}>
                                {milestone.title}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    {goal.status !== 'completed' && (
                      <button
                        onClick={() => completeGoal(goal.id || goal._id)}
                        className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-all"
                        title="Mark as completed"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteGoal(goal.id || goal._id, goal.title)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-all rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Delete goal"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
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

export default Goals;
