# 🦾 LLM Harness

> OmniRoute-inspired free LLM proxy — use **Groq, Gemini, GLM, Cerebras, OpenRouter** like Claude Code or Codex. **Zero credit card required.**

## What this does

- Runs a local OpenAI-compatible server (`/v1/chat/completions`)
- Routes requests to the best free LLM available
- Auto-fallback: if one provider fails or rate-limits, tries the next
- Works as a drop-in replacement for Claude Code, Codex CLI, Continue.dev, etc.

## Free Providers (no credit card)

| Provider | Free Limit | Model | Sign-up |
|---|---|---|---|
| **Groq** | 14,400 req/day, 500K tokens/day | Llama 3.3 70B | [console.groq.com](https://console.groq.com/keys) |
| **Gemini** | 1,500 req/day, 1M tokens/min | Gemini 2.0 Flash | [aistudio.google.com](https://aistudio.google.com) |
| **GLM** | 100 RPM, unlimited | GLM-4-Flash | [open.bigmodel.cn](https://open.bigmodel.cn) |
| **Cerebras** | 1M tokens/day | Llama3.1 70B | [inference.cerebras.ai](https://inference.cerebras.ai) |
| **OpenRouter** | Varies | Llama/Mistral/Qwen :free | [openrouter.ai](https://openrouter.ai/keys) |
| **LLM7.io** | Unlimited | GPT-4o-mini proxy | No key needed |

## Quick Start

```bash
# 1. Clone & install
cd llm-harness
npm install

# 2. Set your free API keys
cp .env.example .env
# Edit .env and fill in your keys (all free, no credit card)

# 3. Build
npm run build

# 4a. Interactive CLI (like Claude Code)
npm run cli

# 4b. Start the proxy server (for Claude Code / Codex wiring)
npm start
```

## Wire to Claude Code

```bash
# In your terminal (or add to ~/.bashrc)
export ANTHROPIC_BASE_URL=http://localhost:4141
export ANTHROPIC_API_KEY=dummy  # needed but not used

# Now use Claude Code normally — it'll hit your free providers!
claude "explain this function" --model auto
```

## Wire to OpenAI Codex CLI

```bash
export OPENAI_BASE_URL=http://localhost:4141/v1
export OPENAI_API_KEY=dummy

# Use codex normally
codex "write a binary search function in Python"
```

## Wire to Continue.dev (VS Code extension)

In `~/.continue/config.json`:
```json
{
  "models": [{
    "title": "LLM Harness (Free)",
    "provider": "openai",
    "model": "auto",
    "apiBase": "http://localhost:4141/v1",
    "apiKey": "dummy"
  }]
}
```

## Wire to Aider

```bash
export OPENAI_API_KEY=dummy
aider --openai-api-base http://localhost:4141/v1 --model auto
```

## CLI Commands

```
/help           Show help
/status         Show provider health + key status
/clear          Clear conversation history
/model groq     Pin to a specific provider
/model auto     Auto-select best available
/models         List all providers
/exit           Exit
```

## Pin a specific model

```
# In CLI:
/model groq       → Llama 3.3 70B (fastest)
/model gemini     → Gemini 2.0 Flash (smartest free)
/model cerebras   → Llama3.1 70B (lowest latency)
/model glm        → GLM-4-Flash
/model llm7       → No API key needed
/model auto       → Auto-route (default)

# Via API:
curl http://localhost:4141/v1/chat/completions \
  -d '{"model":"groq/llama-3.3-70b","messages":[{"role":"user","content":"hello"}]}'
```

## Check status

```bash
curl http://localhost:4141/status
```

## Project structure

```
llm-harness/
├── src/
│   ├── providers/
│   │   ├── base.ts        # Interface all providers implement
│   │   ├── groq.ts        # Groq (Llama 3.3 70B)
│   │   ├── gemini.ts      # Google Gemini 2.0 Flash
│   │   ├── glm.ts         # Zhipu GLM-4-Flash
│   │   ├── cerebras.ts    # Cerebras Llama3.1 70B
│   │   ├── openrouter.ts  # OpenRouter free models
│   │   └── llm7.ts        # Anonymous fallback
│   ├── router.ts          # Priority routing + fallback
│   ├── server.ts          # OpenAI-compatible proxy
│   └── cli.ts             # Interactive chat CLI
├── .env.example           # Free API key template
└── package.json
```

## Adding a new provider

```typescript
// src/providers/myprovider.ts
import { LLMProvider, Message, parseSSEStream } from './base'

export class MyProvider implements LLMProvider {
  name = 'myprovider'
  isFree = true
  priority = 7        // lower = higher priority
  isHealthy = true
  freeLimit = '1K req/day'

  async *chat(messages: Message[]) {
    // call your API, yield chunks
    const res = await fetch('https://api.example.com/v1/chat', { ... })
    yield* parseSSEStream(res.body)
  }

  async checkHealth() { return true }
}

// Add to src/router.ts providers array
```

## Integrated Topi-Harness Features
- **Headroom Dashboard**: React UI at `localhost:5173` showing real-time token compression and context tracking.
- **Kimi, DeepSeek & Qwen**: Added direct support for these providers via `DEEPSEEK_API_KEY`, `KIMI_API_KEY`, and `QWEN_API_KEY`.
