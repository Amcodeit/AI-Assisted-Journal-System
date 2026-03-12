# Architecture — AryavX Journal System

## System Overview

```
┌─────────────┐     HTTP      ┌──────────────────┐     Mongoose     ┌─────────┐
│  React SPA  │  ──────────>  │  Express API      │  ────────────>  │ MongoDB │
│  (port 3000)│  <──────────  │  (port 5000)      │  <────────────  │         │
└─────────────┘               │                    │                 └─────────┘
                              │  Rate Limiter      │
                              │  ┌──────────────┐  │
                              │  │ Cache Service │  │
                              │  └──────┬───────┘  │
                              │  POST /journal     │
                              │  GET  /journal/:id │
                              │  POST /analyze ────────> HuggingFace LLM API
                              │  POST /analyze/stream ──> (SSE streaming)
                              │  GET  /insights/:id│       (or fallback)
                              └──────────────────┘
```

**Data Flow:**
1. User writes a journal entry → `POST /api/journal` → rate limited (10/min) → stored in MongoDB.
2. User requests emotion analysis → `POST /api/journal/analyze` → rate limited (5/min) → cache checked → if miss, text sent to HuggingFace Mistral-7B → result cached → structured emotion/keywords/summary returned.
3. User requests streaming analysis → `POST /api/journal/analyze/stream` → same as above but response streamed via Server-Sent Events.
4. User views insights → `GET /api/journal/insights/:userId` → aggregated from stored entries.

### Implemented Bonus Features

| Feature | File(s) | Description |
|---|---|---|
| **Streaming LLM** | `services/llmService.js`, `routes/journal.js` | `analyzeEmotionStream()` method streams HuggingFace response via SSE. New `/analyze/stream` endpoint. Frontend toggles between standard and streaming. |
| **Analysis Caching** | `services/cacheService.js`, `routes/journal.js` | In-memory cache keyed on SHA-256 hash of normalized text. 24h TTL, 1000-entry cap. Both `/analyze` and `/analyze/stream` check cache before calling LLM. |
| **Rate Limiting** | `middleware/rateLimit.js`, `server.js` | Three tiers: general (100 req/min on all `/api/`), write (10/min on `POST /journal`), analyze (5/min on analyze endpoints). Uses `express-rate-limit`. |

---

## 1. How would you scale this to 100k users?

### Horizontal Scaling
- **Stateless API servers** behind a load balancer (e.g., NGINX, AWS ALB). Since the Express app holds no in-memory state, any instance can handle any request.
- **Auto-scaling group** that spins up additional API instances based on CPU/request metrics.

### Database Scaling
- **MongoDB replica set** for read availability — route read queries (GET entries, GET insights) to secondary replicas.
- **Sharding on `userId`** — distributes write and read load across shards. Journal queries are always scoped to a userId, making it a natural shard key.
- **Indexes** — compound index on `(userId, createdAt)` is already in place for efficient range queries.

### Async LLM Processing
- Introduce a **message queue** (e.g., RabbitMQ, AWS SQS) for analysis requests. The `/analyze` endpoint enqueues the request and returns a job ID. A pool of workers processes LLM calls asynchronously. Clients poll or use WebSockets for the result.
- This decouples API response times from LLM latency (which can be 5–30 seconds).

### Caching Layer
- **Redis** in front of MongoDB for frequently accessed data (user entries, insights).
- Cache invalidation on new entry creation.

### CDN
- Serve the React frontend from a CDN (CloudFront, Vercel) to eliminate frontend static asset load from the API servers.

---

## 2. How would you reduce LLM cost?

### Tiered Analysis Strategy
- **Keyword-based pre-filter**: Before calling the LLM, run the fallback keyword analyzer. If it produces a high-confidence match (multiple trigger words found), skip the LLM call entirely. Only escalate ambiguous texts to the LLM.
- **Smaller models for simple texts**: Use a lightweight classification model (e.g., `distilbert-base-uncased-finetuned-sst-2-english`) for basic sentiment, and only use the larger Mistral model for nuanced analysis.

### Batching
- Instead of calling the LLM per-request, accumulate multiple analysis requests and send them as a batch with a single prompt containing multiple entries. This amortizes per-request overhead.

### Model Optimization
- Fine-tune a small, task-specific model on labeled journal entries. A fine-tuned `distilbert` or `TinyLlama` is far cheaper to run than a general-purpose 7B model.
- Run inference locally with quantized models (GGUF format via llama.cpp) to eliminate per-call API costs entirely at scale.

### Smart Caching
- Cache analysis results to avoid re-analyzing identical or near-identical texts (see section 3).

### Rate Limiting
- Limit analysis requests per user per hour to prevent abuse and unnecessary LLM calls.

---

## 3. How would you cache repeated analysis?

### Content-Based Caching (Implemented)

The system already implements in-memory caching in `services/cacheService.js`:

```
┌──────────┐    cache hit     ┌─────────────────┐
│  /analyze ├──────────────>  │ In-Memory Cache  │ ──> return cached result
│  endpoint │    cache miss   │ (SHA-256 keyed)  │
│           ├──────────────>  │                   │
│           │                 └─────────────────┘
│           │                         │
│           │    call LLM             │ store result
│           ├──────────────>  HuggingFace
│           │<── result ────          │
│           ├── store ──────> Cache (24h TTL)
└──────────┘
```

**Current Implementation:**
1. **Normalize** the input text: lowercase, trim, collapse whitespace.
2. **Hash** the normalized text using SHA-256 to create a cache key.
3. **Check cache** for the key. If found and not expired, return immediately with `cached: true`.
4. If not found, call the LLM, store the result with a 24-hour TTL.
5. Cache is capped at 1000 entries with oldest-first eviction.

**Production Upgrade — Redis:**
- Replace the in-memory `Map` with Redis for shared cache across multiple API server instances.
- Use **SimHash** or **MinHash** to detect near-duplicate texts (>90% overlap) and return the cached result of the closest match.

**Benefits:**
- Eliminates redundant LLM calls for identical journal texts.
- Sub-millisecond response for cached results vs. 5–30 seconds for LLM.
- TTL ensures stale analyses are refreshed periodically.

### Additional Strategy: Pre-compute on Write
- When a journal entry is created via `POST /api/journal`, asynchronously trigger analysis and store the results directly on the entry document. This means the analysis is done once at write time, and subsequent reads never need to call the LLM again.

---

## 4. How would you protect sensitive journal data?

### Encryption

- **In transit**: Enforce HTTPS (TLS 1.3) for all client-server communication. Reject plaintext HTTP connections.
- **At rest**: Enable MongoDB's encrypted storage engine. For the most sensitive field (`text`), apply **field-level encryption** using MongoDB Client-Side Field Level Encryption (CSFLE), so journal content is encrypted before it even reaches the database server.
- **Backups**: Encrypt database backups with AES-256.

### Authentication & Authorization

- **JWT-based authentication**: Users authenticate and receive a signed JWT. Every API request includes the token; middleware verifies it and extracts the userId. Users can only access their own entries.
- **Password hashing**: bcrypt with salt rounds ≥ 12.
- **OAuth integration**: Support Google/Apple sign-in to avoid storing passwords.

### Input Validation & Injection Prevention

- Already implemented: **input validation middleware** that sanitizes all inputs, validates types, enforces length limits, and strips MongoDB operator characters (`$`) to prevent NoSQL injection.
- Use parameterized queries (Mongoose does this by default) — no raw string concatenation in queries.

### Rate Limiting & Abuse Prevention (Implemented)

- **Already implemented** with three tiers in `middleware/rateLimit.js`:
  - General: 100 requests/min per IP on all `/api/` routes
  - Write: 10 requests/min per IP on `POST /journal`
  - Analyze: 5 requests/min per IP on `POST /analyze` and `POST /analyze/stream`
- Uses `express-rate-limit` with standard rate-limit headers.

### Data Minimization & Access Control

- **Principle of least privilege**: The MongoDB user used by the application has read/write access only to the journal database — no admin privileges.
- **Audit logging**: Log all data access events (who accessed which entries, when) for compliance.
- **Data retention policy**: Allow users to delete their entries. Implement soft deletes with automatic hard deletion after a retention period.

### LLM Data Privacy

- When sending journal text to the HuggingFace API, be aware the text transits to a third party. For maximum privacy:
  - Self-host the LLM model on private infrastructure.
  - Use HuggingFace's **Inference Endpoints** (dedicated, private deployments).
  - Strip personally identifiable information (PII) from text before sending to the LLM.

### Infrastructure

- **Secrets management**: Store API keys and database credentials in environment variables or a secrets manager (AWS Secrets Manager, HashiCorp Vault) — never in code.
- **Network isolation**: Database servers in a private subnet, accessible only from the API servers. No public internet access to MongoDB.
- **Security headers**: Use `helmet.js` to set HTTP security headers (CSP, HSTS, X-Frame-Options).
