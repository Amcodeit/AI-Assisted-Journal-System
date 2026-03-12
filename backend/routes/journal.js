const express = require('express');
const router = express.Router();
const Journal = require('../models/Journal');
const llmService = require('../services/llmService');
const cacheService = require('../services/cacheService');
const {
  validateJournalEntry,
  validateAnalyzeInput,
  validateUserIdParam
} = require('../middleware/validate');
const { writeLimiter, analyzeLimiter } = require('../middleware/rateLimit');

// POST /api/journal — Create a new journal entry
router.post('/', writeLimiter, validateJournalEntry, async (req, res) => {
  try {
    const { userId, ambience, text } = req.body;

    const entry = await Journal.create({ userId, ambience, text });

    res.status(201).json(entry);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error creating journal entry:', error);
    res.status(500).json({ error: 'Failed to create journal entry' });
  }
});

// GET /api/journal/:userId — Get all entries for a user
router.get('/:userId', validateUserIdParam, async (req, res) => {
  try {
    const entries = await Journal.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json(entries);
  } catch (error) {
    console.error('Error fetching entries:', error);
    res.status(500).json({ error: 'Failed to fetch journal entries' });
  }
});

// POST /api/journal/analyze — Analyze emotion in text using LLM (with caching)
router.post('/analyze', analyzeLimiter, validateAnalyzeInput, async (req, res) => {
  try {
    const { text } = req.body;

    // Check cache first
    const cached = cacheService.get(text);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const analysis = await llmService.analyzeEmotion(text);

    // Store in cache
    cacheService.set(text, analysis);

    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing text:', error);
    res.status(500).json({ error: 'Failed to analyze text' });
  }
});

// POST /api/journal/analyze/stream — Streaming LLM analysis via SSE
router.post('/analyze/stream', analyzeLimiter, validateAnalyzeInput, async (req, res) => {
  try {
    const { text } = req.body;

    // Check cache first — return immediately as SSE
    const cached = cacheService.get(text);
    if (cached) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.write(`data: ${JSON.stringify({ ...cached, cached: true, done: true })}\n\n`);
      res.end();
      return;
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    await llmService.analyzeEmotionStream(text, (chunk, isDone) => {
      if (isDone) {
        try {
          const parsed = JSON.parse(chunk);
          cacheService.set(text, parsed);
          res.write(`data: ${JSON.stringify({ ...parsed, done: true })}\n\n`);
        } catch {
          res.write(`data: ${JSON.stringify({ chunk, done: true })}\n\n`);
        }
        res.end();
      } else {
        res.write(`data: ${JSON.stringify({ chunk, done: false })}\n\n`);
      }
    });
  } catch (error) {
    console.error('Error in streaming analysis:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to analyze text' });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Stream failed', done: true })}\n\n`);
      res.end();
    }
  }
});

// GET /api/journal/insights/:userId — Aggregated insights for a user
router.get('/insights/:userId', validateUserIdParam, async (req, res) => {
  try {
    const { userId } = req.params;

    const entries = await Journal.find({ userId }).lean();

    if (entries.length === 0) {
      return res.json({
        totalEntries: 0,
        topEmotion: null,
        mostUsedAmbience: null,
        recentKeywords: []
      });
    }

    // Top emotion — most frequent non-null emotion
    const emotionCounts = {};
    for (const e of entries) {
      if (e.emotion) {
        emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1;
      }
    }
    const topEmotion = Object.keys(emotionCounts).length > 0
      ? Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0][0]
      : null;

    // Most used ambience
    const ambienceCounts = {};
    for (const e of entries) {
      ambienceCounts[e.ambience] = (ambienceCounts[e.ambience] || 0) + 1;
    }
    const mostUsedAmbience = Object.entries(ambienceCounts)
      .sort((a, b) => b[1] - a[1])[0][0];

    // Recent keywords — from last 5 entries, deduplicated
    const sortedByDate = [...entries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const recentEntries = sortedByDate.slice(0, 5);
    const keywordsSet = new Set();
    for (const e of recentEntries) {
      if (e.keywords) {
        e.keywords.forEach(k => keywordsSet.add(k));
      }
    }

    res.json({
      totalEntries: entries.length,
      topEmotion,
      mostUsedAmbience,
      recentKeywords: [...keywordsSet].slice(0, 10)
    });
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

module.exports = router;
