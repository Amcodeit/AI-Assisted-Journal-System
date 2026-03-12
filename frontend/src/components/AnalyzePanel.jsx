import React, { useState } from 'react';
import { analyzeText, analyzeTextStream } from '../services/api';

export default function AnalyzePanel() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [streamChunks, setStreamChunks] = useState('');
  const [useStreaming, setUseStreaming] = useState(false);

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError('Enter some text to analyze');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setStreamChunks('');

    try {
      if (useStreaming) {
        await analyzeTextStream(text.trim(), (data) => {
          if (data.done) {
            setResult(data);
            setLoading(false);
          } else if (data.chunk) {
            setStreamChunks(prev => prev + data.chunk);
          }
        });
      } else {
        const res = await analyzeText(text.trim());
        setResult(res.data);
        setLoading(false);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Analysis failed');
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
      <div className="analyze-controls">
        <button onClick={handleAnalyze} disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={useStreaming}
            onChange={(e) => setUseStreaming(e.target.checked)}
          />
          Stream response
        </label>
      </div>
      {error && <p className="error">{error}</p>}
      {loading && useStreaming && streamChunks && (
        <div className="analysis-result streaming">
          <p className="muted">Streaming...</p>
          <pre>{streamChunks}</pre>
        </div>
      )}
      {result && (
        <div className="analysis-result">
          <p><strong>Emotion:</strong> {result.emotion}</p>
          <p><strong>Keywords:</strong> {result.keywords?.join(', ')}</p>
          <p><strong>Summary:</strong> {result.summary}</p>
          {result.cached && <p className="muted">⚡ Served from cache</p>}
        </div>
      )}
    </div>
  );
}
