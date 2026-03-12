import React, { useState } from 'react';
import JournalForm from './components/JournalForm';
import EntryList from './components/EntryList';
import AnalyzePanel from './components/AnalyzePanel';
import InsightsPanel from './components/InsightsPanel';
import './App.css';

export default function App() {
  const [userId, setUserId] = useState('');

  return (
    <div className="app">
      <header>
        <h1>AI-Assisted Journal System</h1>
        <p>AI-powered journal for immersive nature sessions</p>
      </header>
      <main>
        <div className="user-id-bar">
          <label>
            User ID
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g. 123"
            />
          </label>
        </div>
        <div className="grid">
          <JournalForm userId={userId} />
          <EntryList userId={userId} />
          <AnalyzePanel />
          <InsightsPanel userId={userId} />
        </div>
      </main>
    </div>
  );
}
