import React, { useState } from 'react';
import { createEntry } from '../services/api';

export default function JournalForm({ userId }) {
  const [ambience, setAmbience] = useState('forest');
  const [text, setText] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId?.trim() || !text.trim()) {
      setStatus({ type: 'error', msg: 'User ID and text are required' });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      await createEntry(userId.trim(), ambience, text.trim());
      setStatus({ type: 'success', msg: 'Entry saved!' });
      setText('');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to save entry';
      setStatus({ type: 'error', msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Write Journal Entry</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Ambience
          <select value={ambience} onChange={(e) => setAmbience(e.target.value)}>
            <option value="forest">Forest</option>
            <option value="ocean">Ocean</option>
            <option value="mountain">Mountain</option>
          </select>
        </label>
        <label>
          Journal Entry
          <textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write about your session..."
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Entry'}
        </button>
      </form>
      {status && (
        <p className={status.type === 'error' ? 'error' : 'success'}>{status.msg}</p>
      )}
    </div>
  );
}
