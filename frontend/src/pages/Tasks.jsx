import React, { useState, useEffect } from 'react';
import { apiHelpers } from '../utils/api';
import { CheckSquare, Plus, Calendar, Trash2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium'
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await apiHelpers.getTasks();
      setTasks(response.data || []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    try {
      await apiHelpers.createTask(newTask);
      toast.success('Task created successfully');
      setNewTask({ title: '', description: '', due_date: '', priority: 'medium' });
      setShowAddForm(false);
      fetchTasks();
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const toggleTask = async (task, completed) => {
    try {
      // Use _id or id field from task object
      const id = task._id || task.id;
      if (!id) {
        console.error('Task has no ID:', task);
        toast.error('Invalid task ID');
        return;
      }
      await apiHelpers.updateTask(id, { completed: !completed });
      toast.success(completed ? 'Task unmarked' : '✓ Task completed!');
      fetchTasks();
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error('Failed to update task');
    }
  };

  const deleteTask = async (task, taskTitle) => {
    // Create a custom confirmation dialog
    const isCompleted = window.confirm(
      `🎉 Did you complete "${taskTitle}"?\n\n` +
      `✅ Click "OK" if you COMPLETED this task\n` +
      `   (This will count towards your achievements!)\n\n` +
      `❌ Click "Cancel" if you want to remove it WITHOUT marking as completed`
    );
    
    // If user clicked Cancel on the first dialog, ask if they want to delete anyway
    if (!isCompleted) {
      const shouldDelete = window.confirm(
        `🗑️ Delete "${taskTitle}" without completing it?\n\n` +
        `This will permanently remove the task.\n\n` +
        `Click "OK" to delete, "Cancel" to keep the task.`
      );
      if (!shouldDelete) return; // User doesn't want to delete at all
    }
    
    try {
      // Use _id or id field from task object
      const id = task._id || task.id;
      if (!id) {
        console.error('Task has no ID:', task);
        toast.error('Invalid task ID');
        return;
      }
      
      // If task is being marked as completed, update it first
      if (isCompleted) {
        await apiHelpers.updateTask(id, { 
          completed: true,
          completed_at: new Date().toISOString()
        });
        toast.success('🎉 Task completed! Great job!');
        // Small delay to show the completion message
        setTimeout(async () => {
          await apiHelpers.deleteTask(id);
          toast.success('Task archived successfully');
          fetchTasks();
        }, 1000);
      } else {
        // Just delete without marking as completed
        await apiHelpers.deleteTask(id);
        toast.success('Task deleted');
        fetchTasks();
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
    }
  };

  // Smart task suggestions based on time of day
  const getTaskSuggestions = () => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      // Morning suggestions
      return [
        { title: 'Morning meditation or stretching', priority: 'medium' },
        { title: 'Review today\'s priorities', priority: 'high' },
        { title: 'Healthy breakfast', priority: 'medium' },
        { title: 'Check and respond to important emails', priority: 'high' }
      ];
    } else if (hour >= 12 && hour < 17) {
      // Afternoon suggestions
      return [
        { title: 'Complete most important task of the day', priority: 'high' },
        { title: 'Take a short break and walk', priority: 'medium' },
        { title: 'Review progress on current projects', priority: 'medium' },
        { title: 'Schedule tomorrow\'s priorities', priority: 'low' }
      ];
    } else if (hour >= 17 && hour < 22) {
      // Evening suggestions
      return [
        { title: 'Wrap up work for the day', priority: 'medium' },
        { title: 'Plan tomorrow\'s tasks', priority: 'high' },
        { title: 'Exercise or physical activity', priority: 'medium' },
        { title: 'Quality time with family/friends', priority: 'high' }
      ];
    } else {
      // Night/Late suggestions
      return [
        { title: 'Prepare for tomorrow', priority: 'medium' },
        { title: 'Evening wind-down routine', priority: 'high' },
        { title: 'Read or journal', priority: 'low' },
        { title: 'Get 7-8 hours of sleep', priority: 'high' }
      ];
    }
  };

  const addSuggestedTask = async (suggestion) => {
    try {
      await apiHelpers.createTask(suggestion);
      toast.success('✓ Task added!');
      fetchTasks();
    } catch (error) {
      toast.error('Failed to add task');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading your tasks..." />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Tasks</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your daily tasks and goals</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary flex items-center space-x-2 floating accent-dot"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Add Task Form */}
      {showAddForm && (
        <div className="card mb-6 fade-in-up accent-dot">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Create New Task</h3>
          <form onSubmit={handleAddTask} className="space-y-4">
            <input
              type="text"
              placeholder="Task title"
              value={newTask.title}
              onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
              className="input-field"
            />
            <textarea
              placeholder="Description (optional)"
              value={newTask.description}
              onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
              className="input-field h-20 resize-none"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                value={newTask.due_date}
                onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
                className="input-field"
              />
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
                className="input-field"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
            <div className="flex space-x-3 pt-2">
              <button type="submit" className="btn-primary floating">Create Task</button>
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

      {/* Smart Task Suggestions */}
      {!showAddForm && tasks.length < 10 && (
        <div className="card mb-6 fade-in-up accent-dot bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-2 mb-4">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Suggested Tasks for {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : new Date().getHours() < 22 ? 'Evening' : 'Tonight'}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {getTaskSuggestions().map((suggestion, index) => (
              <button
                key={index}
                onClick={() => addSuggestedTask(suggestion)}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md text-left"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {suggestion.title}
                  </p>
                  <p className={`text-xs mt-1 font-medium ${
                    suggestion.priority === 'high' ? 'text-red-600 dark:text-red-400' :
                    suggestion.priority === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-green-600 dark:text-green-400'
                  }`}>
                    {suggestion.priority} priority
                  </p>
                </div>
                <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 ml-2" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tasks List */}
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="text-center py-12 card accent-dot fade-in-up">
            <CheckSquare className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4 gentle-float" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No tasks yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first task to get started with productivity tracking
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary floating"
            >
              Add Your First Task
            </button>
          </div>
        ) : (
          tasks.map((task, index) => (
            <div 
              key={task.id || `task-${index}`} 
              className="card fade-in-up accent-dot hover:scale-[1.02] transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => toggleTask(task, task.completed)}
                  className={`p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 shadow-md hover:shadow-lg ${
                    task.completed
                      ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-200 dark:shadow-green-800/30'
                      : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                </button>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <h3 className={`font-medium transition-all duration-200 ${
                      task.completed 
                        ? 'line-through text-gray-500 dark:text-gray-400'
                        : 'text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}>
                      {task.title}
                    </h3>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 ${
                      task.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800' :
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800'
                    }`}>
                      {task.priority}
                    </div>
                  </div>
                  {task.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {task.description}
                    </p>
                  )}
                  {task.due_date && (
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-2 py-1 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/50">
                      <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
                      <span className="font-medium">{new Date(task.due_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => deleteTask(task, task.title)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-all duration-200 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 hover:scale-110 active:scale-95 hover:shadow-md"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Tasks;
