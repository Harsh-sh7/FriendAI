import axios from 'axios';

// Create API instance
export const api = axios.create({
  baseURL: 'https://friendai-5ww9.onrender.com',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API helper functions
export const apiHelpers = {
  // Dashboard
  getDashboard: () => api.get('/api/dashboard'),
  
  // Journal/AI
  transcribeAudio: (audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');
    return api.post('/api/ai/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  analyzeText: (transcription, context = {}) => 
    api.post('/api/ai/analyze', { transcription, context }),
  
  textToSpeech: (text) => 
    api.post('/api/ai/speak', { text }, { responseType: 'blob' }),
  
  // Tasks
  getTasks: () => api.get('/api/tasks'),
  createTask: (task) => api.post('/api/tasks', task),
  updateTask: (id, updates) => api.put(`/api/tasks/${id}`, updates),
  deleteTask: (id) => api.delete(`/api/tasks/${id}`),
  
  // Journal
  getJournalEntries: () => api.get('/api/journal'),
  
  // Mood Analytics
  getMoodAnalytics: (period = 'weekly') => 
    api.get(`/api/mood/analytics?period=${period}`),
};

export default api;
