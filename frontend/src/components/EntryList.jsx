import React, { useState } from 'react';
import { getEntries } from '../services/api';

export default function EntryList({ userId }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadEntries = async (targetPage = 1) => {
    if (!userId?.trim()) {
      setError('Enter a User ID above');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getEntries(userId.trim(), targetPage, 20);
      setEntries(res.data.entries);
      setPage(res.data.page);
      setTotalPages(res.data.totalPages);
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
        <button onClick={() => loadEntries(1)} disabled={loading}>
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
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => loadEntries(page - 1)}
            disabled={page <= 1 || loading}
          >
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            onClick={() => loadEntries(page + 1)}
            disabled={page >= totalPages || loading}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
