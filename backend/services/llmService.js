const axios = require('axios');

class LLMService {
  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY;
    this.modelUrl = 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3';
  }

  /**
   * Analyze emotion from journal text using HuggingFace LLM.
   * Falls back to keyword-based analysis if the API is unavailable.
   */
  async analyzeEmotion(text) {
    // Skip LLM call if no valid API key is configured
    if (!this.apiKey || this.apiKey === 'your_huggingface_api_key_here') {
      console.log('No HuggingFace API key configured — using fallback analysis');
      return this.fallbackAnalysis(text);
    }

    try {
      const prompt = `<s>[INST] Analyze the following journal entry. Respond ONLY in this exact format, nothing else:
Emotion: <one word from: calm, happy, anxious, sad, peaceful, stressed, energized, reflective>
Keywords: <comma-separated list of 3-5 keywords>
Summary: <one sentence summary>

Journal entry: "${text}" [/INST]`;

      const response = await axios.post(
        this.modelUrl,
        {
          inputs: prompt,
          parameters: {
            max_new_tokens: 150,
            temperature: 0.3,
            return_full_text: false
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const generatedText = response.data?.[0]?.generated_text || '';
      return this.parseResponse(generatedText, text);
    } catch (error) {
      console.error('LLM API error:', error.message);
      return this.fallbackAnalysis(text);
    }
  }

  parseResponse(generatedText, originalText) {
    const emotionMatch = generatedText.match(/Emotion:\s*(\w+)/i);
    const keywordsMatch = generatedText.match(/Keywords:\s*(.*?)(?:\n|$)/i);
    const summaryMatch = generatedText.match(/Summary:\s*(.*?)(?:\n|$)/i);

    const validEmotions = ['calm', 'happy', 'anxious', 'sad', 'peaceful', 'stressed', 'energized', 'reflective'];

    let emotion = emotionMatch ? emotionMatch[1].toLowerCase() : null;
    if (!emotion || !validEmotions.includes(emotion)) {
      return this.fallbackAnalysis(originalText);
    }

    let keywords = [];
    if (keywordsMatch) {
      keywords = keywordsMatch[1]
        .split(',')
        .map(k => k.trim().replace(/["\[\]]/g, ''))
        .filter(k => k.length > 0 && k.length < 30)
        .slice(0, 5);
    }
    if (keywords.length === 0) {
      keywords = this.extractKeywords(originalText);
    }

    const summary = summaryMatch ? summaryMatch[1].trim() : `User expressed ${emotion} feelings in their journal entry`;

    return { emotion, keywords, summary };
  }

  /**
   * Keyword-based fallback when LLM is unavailable.
   */
  fallbackAnalysis(text) {
    const lower = text.toLowerCase();

    const emotionMap = {
      calm: ['calm', 'peaceful', 'serene', 'relaxed', 'tranquil', 'quiet', 'still'],
      happy: ['happy', 'joy', 'cheerful', 'delighted', 'excited', 'wonderful', 'great', 'amazing'],
      anxious: ['anxious', 'worried', 'nervous', 'stressed', 'overwhelmed', 'tense', 'uneasy'],
      sad: ['sad', 'lonely', 'depressed', 'melancholy', 'down', 'blue', 'upset', 'grief'],
      peaceful: ['peace', 'harmony', 'balanced', 'centered', 'grounded', 'content', 'soothing'],
      energized: ['energized', 'motivated', 'inspired', 'alive', 'vigorous', 'strong', 'powerful'],
      reflective: ['reflect', 'thinking', 'contemplat', 'ponder', 'consider', 'thought', 'realize']
    };

    let detected = 'neutral';
    let maxScore = 0;

    for (const [emotion, triggers] of Object.entries(emotionMap)) {
      const score = triggers.filter(t => lower.includes(t)).length;
      if (score > maxScore) {
        maxScore = score;
        detected = emotion;
      }
    }

    const keywords = this.extractKeywords(text);

    return {
      emotion: detected,
      keywords,
      summary: `User experienced ${detected} feelings during their session`
    };
  }

  extractKeywords(text) {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'is', 'was', 'were', 'been', 'be', 'are', 'am',
      'i', 'my', 'me', 'mine', 'we', 'our', 'you', 'your', 'he', 'she', 'it',
      'they', 'them', 'this', 'that', 'these', 'those',
      'felt', 'feel', 'feeling', 'today', 'after', 'before', 'during',
      'very', 'really', 'just', 'also', 'then', 'than', 'when', 'while',
      'about', 'from', 'into', 'have', 'had', 'has', 'not', 'been', 'would',
      'could', 'should', 'will', 'can', 'did', 'does', 'done'
    ]);

    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));

    const unique = [...new Set(words)];
    return unique.slice(0, 5);
  }
}

module.exports = new LLMService();
