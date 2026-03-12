import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

export const createEntry = (userId, ambience, text) =>
  api.post('/journal', { userId, ambience, text });

export const getEntries = (userId) =>
  api.get(`/journal/${encodeURIComponent(userId)}`);

export const analyzeText = (text) =>
  api.post('/journal/analyze', { text });

export const getInsights = (userId) =>
  api.get(`/journal/insights/${encodeURIComponent(userId)}`);

export default api;
