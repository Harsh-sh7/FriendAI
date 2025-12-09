// Storage abstraction layer - works with both MongoDB and in-memory storage
import mongoose from 'mongoose';

class StorageAdapter {
  constructor() {
    this.isMongoConnected = false;
    this.inMemory = {
      users: new Map(),
      journalEntries: new Map(),
      tasks: new Map(),
      goals: new Map(),
      habits: new Map(),
      idCounters: { users: 1, journalEntries: 1, tasks: 1, goals: 1, habits: 1 }
    };
  }

  setMongoStatus(status) {
    this.isMongoConnected = status;
  }

  generateId(type) {
    return `mem_${type}_${this.inMemory.idCounters[type]++}`;
  }

  // User operations
  async findUser(query) {
    if (this.isMongoConnected) {
      const { User } = await import('./models.js');
      return await User.findOne(query);
    }
    
    // In-memory fallback
    if (query.email) {
      for (const [id, user] of this.inMemory.users) {
        if (user.email === query.email) {
          return { ...user, _id: id };
        }
      }
    }
    if (query._id) {
      const user = this.inMemory.users.get(query._id);
      return user ? { ...user, _id: query._id } : null;
    }
    return null;
  }

  async createUser(userData) {
    if (this.isMongoConnected) {
      const { User } = await import('./models.js');
      return await User.create(userData);
    }
    
    // In-memory fallback
    const id = this.generateId('users');
    const user = { ...userData, _id: id };
    this.inMemory.users.set(id, user);
    return user;
  }

  async updateUser(id, updates) {
    if (this.isMongoConnected) {
      const { User } = await import('./models.js');
      return await User.findByIdAndUpdate(id, updates, { new: true });
    }
    
    // In-memory fallback
    const user = this.inMemory.users.get(id);
    if (user) {
      Object.assign(user, updates);
      this.inMemory.users.set(id, user);
      return { ...user, _id: id };
    }
    return null;
  }

  // Journal operations
  async findJournalEntries(query, options = {}) {
    if (this.isMongoConnected) {
      const { JournalEntry } = await import('./models.js');
      let q = JournalEntry.find(query);
      if (options.sort) q = q.sort(options.sort);
      if (options.select) q = q.select(options.select);
      return await q.lean();
    }
    
    // In-memory fallback
    let entries = Array.from(this.inMemory.journalEntries.entries())
      .map(([id, entry]) => ({ ...entry, _id: id, id: id }));
    
    if (query.user_id) {
      // Convert both to strings for comparison to handle ObjectId vs string
      const queryUserId = String(query.user_id);
      entries = entries.filter(e => String(e.user_id) === queryUserId);
    }
    if (query.transcription?.$regex) {
      const regex = new RegExp(query.transcription.$regex);
      entries = entries.filter(e => regex.test(e.transcription));
    }
    if (query.mood_score?.$ne !== undefined) {
      entries = entries.filter(e => e.mood_score !== query.mood_score.$ne);
    }
    
    if (options.sort) {
      const sortKey = Object.keys(options.sort)[0];
      const sortOrder = options.sort[sortKey];
      entries.sort((a, b) => {
        if (sortOrder === 1) return a[sortKey] > b[sortKey] ? 1 : -1;
        return a[sortKey] < b[sortKey] ? 1 : -1;
      });
    }
    
    return entries;
  }

  async createJournalEntry(entryData) {
    if (this.isMongoConnected) {
      const { JournalEntry } = await import('./models.js');
      return await JournalEntry.create(entryData);
    }
    
    // In-memory fallback
    const id = this.generateId('journalEntries');
    const entry = { ...entryData, _id: id, id: id };
    this.inMemory.journalEntries.set(id, entry);
    return entry;
  }

  // Task operations
  async findTasks(query, options = {}) {
    if (this.isMongoConnected) {
      const { Task } = await import('./models.js');
      let q = Task.find(query);
      if (options.sort) q = q.sort(options.sort);
      return await q.lean();
    }
    
    // In-memory fallback
    let tasks = Array.from(this.inMemory.tasks.entries())
      .map(([id, task]) => ({ ...task, _id: id, id: id }));
    
    if (query.user_id) {
      // Convert both to strings for comparison to handle ObjectId vs string
      const queryUserId = String(query.user_id);
      tasks = tasks.filter(t => String(t.user_id) === queryUserId);
    }
    
    if (options.sort) {
      const sortKey = Object.keys(options.sort)[0];
      const sortOrder = options.sort[sortKey];
      tasks.sort((a, b) => {
        if (sortOrder === 1) return a[sortKey] > b[sortKey] ? 1 : -1;
        return a[sortKey] < b[sortKey] ? 1 : -1;
      });
    }
    
    return tasks;
  }

  async findTask(query) {
    if (this.isMongoConnected) {
      const { Task } = await import('./models.js');
      return await Task.findOne(query);
    }
    
    // In-memory fallback
    if (query._id) {
      const task = this.inMemory.tasks.get(query._id);
      if (task && (!query.user_id || String(task.user_id) === String(query.user_id))) {
        return { ...task, _id: query._id, id: query._id, save: async function() { return this; } };
      }
    }
    return null;
  }

  async createTask(taskData) {
    if (this.isMongoConnected) {
      const { Task } = await import('./models.js');
      return await Task.create(taskData);
    }
    
    // In-memory fallback
    const id = this.generateId('tasks');
    const task = { ...taskData, _id: id, id: id };
    this.inMemory.tasks.set(id, task);
    return task;
  }

  async updateTask(id, updates) {
    if (this.isMongoConnected) {
      const { Task } = await import('./models.js');
      return await Task.findByIdAndUpdate(id, updates, { new: true });
    }
    
    // In-memory fallback
    const task = this.inMemory.tasks.get(id);
    if (task) {
      Object.assign(task, updates);
      this.inMemory.tasks.set(id, task);
      return { ...task, _id: id, id: id };
    }
    return null;
  }

  async deleteTask(query) {
    if (this.isMongoConnected) {
      const { Task } = await import('./models.js');
      return await Task.deleteOne(query);
    }
    
    // In-memory fallback
    if (query._id) {
      const task = this.inMemory.tasks.get(query._id);
      if (task && (!query.user_id || String(task.user_id) === String(query.user_id))) {
        this.inMemory.tasks.delete(query._id);
        return { deletedCount: 1 };
      }
    }
    return { deletedCount: 0 };
  }

  // Goal operations
  async findGoals(query, options = {}) {
    if (this.isMongoConnected) {
      const { Goal } = await import('./models.js');
      let q = Goal.find(query);
      if (options.sort) q = q.sort(options.sort);
      return await q.lean();
    }
    
    // In-memory fallback
    let goals = Array.from(this.inMemory.goals.entries())
      .map(([id, goal]) => ({ ...goal, _id: id, id: id }));
    
    if (query.user_id) {
      const queryUserId = String(query.user_id);
      goals = goals.filter(g => String(g.user_id) === queryUserId);
    }
    if (query.status) {
      goals = goals.filter(g => g.status === query.status);
    }
    
    if (options.sort) {
      const sortKey = Object.keys(options.sort)[0];
      const sortOrder = options.sort[sortKey];
      goals.sort((a, b) => {
        if (sortOrder === 1) return a[sortKey] > b[sortKey] ? 1 : -1;
        return a[sortKey] < b[sortKey] ? 1 : -1;
      });
    }
    
    return goals;
  }

  async createGoal(goalData) {
    if (this.isMongoConnected) {
      const { Goal } = await import('./models.js');
      return await Goal.create(goalData);
    }
    
    const id = this.generateId('goals');
    const goal = { ...goalData, _id: id, id: id };
    this.inMemory.goals.set(id, goal);
    return goal;
  }

  async updateGoal(id, updates) {
    if (this.isMongoConnected) {
      const { Goal } = await import('./models.js');
      return await Goal.findByIdAndUpdate(id, updates, { new: true });
    }
    
    const goal = this.inMemory.goals.get(id);
    if (goal) {
      Object.assign(goal, updates);
      this.inMemory.goals.set(id, goal);
      return { ...goal, _id: id, id: id };
    }
    return null;
  }

  async deleteGoal(query) {
    if (this.isMongoConnected) {
      const { Goal } = await import('./models.js');
      return await Goal.deleteOne(query);
    }
    
    if (query._id) {
      const goal = this.inMemory.goals.get(query._id);
      if (goal && (!query.user_id || String(goal.user_id) === String(query.user_id))) {
        this.inMemory.goals.delete(query._id);
        return { deletedCount: 1 };
      }
    }
    return { deletedCount: 0 };
  }

  // Habit operations
  async findHabits(query, options = {}) {
    if (this.isMongoConnected) {
      const { Habit } = await import('./models.js');
      let q = Habit.find(query);
      if (options.sort) q = q.sort(options.sort);
      return await q.lean();
    }
    
    // In-memory fallback
    let habits = Array.from(this.inMemory.habits.entries())
      .map(([id, habit]) => ({ ...habit, _id: id, id: id }));
    
    if (query.user_id) {
      const queryUserId = String(query.user_id);
      habits = habits.filter(h => String(h.user_id) === queryUserId);
    }
    if (query.active !== undefined) {
      habits = habits.filter(h => h.active === query.active);
    }
    
    if (options.sort) {
      const sortKey = Object.keys(options.sort)[0];
      const sortOrder = options.sort[sortKey];
      habits.sort((a, b) => {
        if (sortOrder === 1) return a[sortKey] > b[sortKey] ? 1 : -1;
        return a[sortKey] < b[sortKey] ? 1 : -1;
      });
    }
    
    return habits;
  }

  async createHabit(habitData) {
    if (this.isMongoConnected) {
      const { Habit } = await import('./models.js');
      return await Habit.create(habitData);
    }
    
    const id = this.generateId('habits');
    const habit = { ...habitData, _id: id, id: id };
    this.inMemory.habits.set(id, habit);
    return habit;
  }

  async updateHabit(id, updates) {
    if (this.isMongoConnected) {
      const { Habit } = await import('./models.js');
      return await Habit.findByIdAndUpdate(id, updates, { new: true });
    }
    
    const habit = this.inMemory.habits.get(id);
    if (habit) {
      Object.assign(habit, updates);
      this.inMemory.habits.set(id, habit);
      return { ...habit, _id: id, id: id };
    }
    return null;
  }

  async deleteHabit(query) {
    if (this.isMongoConnected) {
      const { Habit } = await import('./models.js');
      return await Habit.deleteOne(query);
    }
    
    if (query._id) {
      const habit = this.inMemory.habits.get(query._id);
      if (habit && (!query.user_id || String(habit.user_id) === String(query.user_id))) {
        this.inMemory.habits.delete(query._id);
        return { deletedCount: 1 };
      }
    }
    return { deletedCount: 0 };
  }
}

export const storage = new StorageAdapter();
