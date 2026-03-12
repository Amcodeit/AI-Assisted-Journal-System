const VALID_AMBIENCES = ['forest', 'ocean', 'mountain'];

function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  // Trim and remove any MongoDB operator characters ($) to prevent NoSQL injection
  return str.trim().replace(/^\$/, '');
}

function validateJournalEntry(req, res, next) {
  const { userId, ambience, text } = req.body;

  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    return res.status(400).json({ error: 'userId is required and must be a non-empty string' });
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(userId.trim())) {
    return res.status(400).json({ error: 'userId must contain only alphanumeric characters, hyphens, or underscores' });
  }

  if (!ambience || !VALID_AMBIENCES.includes(ambience)) {
    return res.status(400).json({ error: `ambience must be one of: ${VALID_AMBIENCES.join(', ')}` });
  }

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'text is required and must be a non-empty string' });
  }

  if (text.trim().length > 5000) {
    return res.status(400).json({ error: 'text must be at most 5000 characters' });
  }

  req.body.userId = sanitizeString(userId);
  req.body.ambience = sanitizeString(ambience);
  req.body.text = text.trim();

  next();
}

function validateAnalyzeInput(req, res, next) {
  const { text } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'text is required and must be a non-empty string' });
  }

  if (text.trim().length > 5000) {
    return res.status(400).json({ error: 'text must be at most 5000 characters' });
  }

  req.body.text = text.trim();
  next();
}

function validateUserIdParam(req, res, next) {
  const { userId } = req.params;

  if (!userId || !/^[a-zA-Z0-9_-]+$/.test(userId)) {
    return res.status(400).json({ error: 'userId must contain only alphanumeric characters, hyphens, or underscores' });
  }

  next();
}

module.exports = {
  validateJournalEntry,
  validateAnalyzeInput,
  validateUserIdParam
};
