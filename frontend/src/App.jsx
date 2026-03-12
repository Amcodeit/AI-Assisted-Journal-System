import React from 'react';
import JournalForm from './components/JournalForm';
import EntryList from './components/EntryList';
import AnalyzePanel from './components/AnalyzePanel';
import InsightsPanel from './components/InsightsPanel';
import './App.css';

export default function App() {
  return (
    <div className="app">
      <header>
        <h1>AryavX Journal</h1>
        <p>AI-powered journal for immersive nature sessions</p>
      </header>
      <main>
        <div className="grid">
          <JournalForm />
          <EntryList />
          <AnalyzePanel />
          <InsightsPanel />
        </div>
      </main>
    </div>
  );
}
