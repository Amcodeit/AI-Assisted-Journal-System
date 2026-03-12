import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

export const createEntry = (userId, ambience, text) =>
  api.post('/journal', { userId, ambience, text });

export const getEntries = (userId, page = 1, limit = 20) =>
  api.get(`/journal/${encodeURIComponent(userId)}?page=${page}&limit=${limit}`);

export const analyzeText = (text) =>
  api.post('/journal/analyze', { text });

export const getInsights = (userId) =>
  api.get(`/journal/insights/${encodeURIComponent(userId)}`);

export const analyzeTextStream = async (text, onChunk) => {
  const response = await fetch(`${API_BASE}/journal/analyze/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const raw = decoder.decode(value);
    const lines = raw.split('\n').filter(l => l.startsWith('data: '));
    for (const line of lines) {
      try {
        const data = JSON.parse(line.slice(6));
        onChunk(data);
      } catch { /* skip malformed chunks */ }
    }
  }
};

export default api;
