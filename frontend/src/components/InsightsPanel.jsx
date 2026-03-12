import React, { useState } from 'react';
import { getInsights } from '../services/api';

export default function InsightsPanel() {
  const [userId, setUserId] = useState('');
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadInsights = async () => {
    if (!userId.trim()) {
      setError('Enter a User ID');
      return;
    }
    setLoading(true);
    setError(null);
    setInsights(null);
    try {
      const res = await getInsights(userId.trim());
      setInsights(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Insights</h2>
      <div className="inline-form">
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="User ID"
        />
        <button onClick={loadInsights} disabled={loading}>
          {loading ? 'Loading...' : 'Load Insights'}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      {insights && (
        <div className="insights-result">
          {insights.totalEntries === 0 ? (
            <p className="muted">No entries found for this user.</p>
          ) : (
            <>
              <p><strong>Total Entries:</strong> {insights.totalEntries}</p>
              <p><strong>Top Emotion:</strong> {insights.topEmotion || 'N/A'}</p>
              <p><strong>Most Used Ambience:</strong> {insights.mostUsedAmbience || 'N/A'}</p>
              <p>
                <strong>Recent Keywords:</strong>{' '}
                {insights.recentKeywords?.length > 0
                  ? insights.recentKeywords.join(', ')
                  : 'None yet'}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
