import React, { useState } from 'react';
import { getEntries } from '../services/api';

export default function EntryList() {
  const [userId, setUserId] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadEntries = async () => {
    if (!userId.trim()) {
      setError('Enter a User ID');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getEntries(userId.trim());
      setEntries(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Previous Entries</h2>
      <div className="inline-form">
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="User ID"
        />
        <button onClick={loadEntries} disabled={loading}>
          {loading ? 'Loading...' : 'Load'}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      {entries.length === 0 && !loading && !error && (
        <p className="muted">No entries yet.</p>
      )}
      <ul className="entry-list">
        {entries.map((entry) => (
          <li key={entry._id} className="entry-item">
            <div className="entry-header">
              <span className="badge">{entry.ambience}</span>
              <span className="date">{new Date(entry.createdAt).toLocaleString()}</span>
            </div>
            <p>{entry.text}</p>
            {entry.emotion && (
              <div className="entry-meta">
                Emotion: <strong>{entry.emotion}</strong>
                {entry.keywords?.length > 0 && (
                  <span> &middot; Keywords: {entry.keywords.join(', ')}</span>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
