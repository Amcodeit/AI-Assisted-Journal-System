import React, { useState } from 'react';
import { analyzeText } from '../services/api';

export default function AnalyzePanel() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError('Enter some text to analyze');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await analyzeText(text.trim());
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Analyze Emotion</h2>
      <textarea
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste or type journal text to analyze..."
      />
      <button onClick={handleAnalyze} disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze'}
      </button>
      {error && <p className="error">{error}</p>}
      {result && (
        <div className="analysis-result">
          <p><strong>Emotion:</strong> {result.emotion}</p>
          <p><strong>Keywords:</strong> {result.keywords?.join(', ')}</p>
          <p><strong>Summary:</strong> {result.summary}</p>
        </div>
      )}
    </div>
  );
}
