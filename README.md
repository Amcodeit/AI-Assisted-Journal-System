# AryavX Journal — AI-Assisted Journal System

An AI-powered journal system for immersive nature sessions. Users write entries after forest, ocean, or mountain sessions. The system stores entries, analyzes emotions using an LLM, and provides mental-state insights over time.

## Prerequisites

- **Node.js** v18+
- **MongoDB** running locally (default: `mongodb://localhost:XXXX`)
- **HuggingFace API Key** (optional — the app works in fallback mode without one)

## Project Structure

```
aryavX/
├── backend/
│   ├── config/database.js        # MongoDB connection
│   ├── models/Journal.js         # Mongoose schema
│   ├── routes/journal.js         # All API endpoints
│   ├── services/llmService.js    # LLM integration + fallback
│   ├── middleware/validate.js    # Input validation & sanitization
│   ├── server.js                 # Express entry point
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/           # React UI components
│   │   ├── services/api.js       # Axios API wrapper
│   │   ├── App.jsx               # Main layout
│   │   └── App.css               # Styles
│   └── package.json
├── README.md
└── ARCHITECTURE.md
```

## Setup & Run

### 1. Backend

```bash
cd backend

# Copy env file and edit as needed
cp .env

# Install dependencies
npm install

# Start the server (requires MongoDB running)
npm start
```

The server starts on `http://localhost:XXXX`.

**Environment Variables** (`.env`):

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Server port |
| `MONGODB_URI` | `mongodb://localhost:XXXX/aryavax-journal` | MongoDB connection string |
| `HUGGINGFACE_API_KEY` | — | HuggingFace API token (optional) |

> **Note:** Without a HuggingFace API key, the `/analyze` endpoint uses a built-in keyword-based emotion detector. To enable LLM-powered analysis, sign up at [huggingface.co](https://huggingface.co), create an access token, and paste it in `.env`.

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the React dev server
npm start
```

The frontend opens at `http://localhost:XXXX`.

## API Documentation

### POST `/api/journal` — Create Journal Entry

**Request:**
```json
{
  "userId": "123",
  "ambience": "forest",
  "text": "I felt calm today after listening to the rain."
}
```

**Response (201):**
```json
{
  "_id": "...",
  "userId": "123",
  "ambience": "forest",
  "text": "I felt calm today after listening to the rain.",
  "emotion": null,
  "keywords": [],
  "summary": null,
  "createdAt": "2026-03-12T10:00:00.000Z"
}
```

### GET `/api/journal/:userId` — Get All Entries

**Response (200):**
```json
[
  {
    "_id": "...",
    "userId": "123",
    "ambience": "forest",
    "text": "I felt calm today...",
    "emotion": null,
    "keywords": [],
    "summary": null,
    "createdAt": "2026-03-12T10:00:00.000Z"
  }
]
```

### POST `/api/journal/analyze` — Analyze Emotion

**Request:**
```json
{
  "text": "I felt calm today after listening to the rain"
}
```

**Response (200):**
```json
{
  "emotion": "calm",
  "keywords": ["rain", "nature", "peace"],
  "summary": "User experienced relaxation during the forest session"
}
```

### GET `/api/journal/insights/:userId` — User Insights

**Response (200):**
```json
{
  "totalEntries": 8,
  "topEmotion": "calm",
  "mostUsedAmbience": "forest",
  "recentKeywords": ["focus", "nature", "rain"]
}
```

### GET `/api/health` — Health Check

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2026-03-12T10:00:00.000Z"
}
```

## Frontend Usage

The single-page UI provides four panels:

1. **Write Journal Entry** — Enter User ID, select ambience (forest/ocean/mountain), write text, and save.
2. **Previous Entries** — Enter User ID and load all past entries.
3. **Analyze Emotion** — Paste text and click Analyze to get emotion, keywords, and summary.
4. **Insights** — Enter User ID and view aggregated stats: total entries, top emotion, most used ambience, and recent keywords.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| LLM | HuggingFace Inference API (Mistral-7B-Instruct) |
| Frontend | React |
