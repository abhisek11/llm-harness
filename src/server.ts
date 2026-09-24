import * as dotenv from 'dotenv';
dotenv.config({ override: true });
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { router, providers } from './router'
import { scanInjection } from './security/injection'
import { estimateTokens, recordRequest, recordMembraBlock, getMetrics } from './metrics'

const app = express()
app.set("etag", false)
app.use(cors())
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))

app.get('/api/metrics', (_req, res) => {
  res.json(getMetrics())
})


const PORT = process.env.PORT ?? 4141

// ── /v1/chat/completions ─────────────────────────────────────────────────────
app.post('/v1/chat/completions', async (req, res) => {
  const { messages, model, stream = false, max_tokens, temperature } = req.body

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' })
  }

  // ── membra: inbound prompt-injection / jailbreak screening ────────────────
  if ((process.env.MEMBRA_ENABLED ?? 'true') !== 'false') {
    const userText = messages
      .filter((m: { role: string }) => m.role === 'user')
      .map((m: { content: string }) => m.content)
      .join('\n')
    const scan = scanInjection(userText)
    const blockThreshold = Number(process.env.MEMBRA_BLOCK_THRESHOLD ?? 0.5)
    res.set('X-Membra-Risk-Score', String(scan.score))
    if (scan.signals.length) res.set('X-Membra-Signals', scan.signals.join(','))
    if (scan.score >= blockThreshold) {
      console.error(`[membra] blocked request — score ${scan.score} signals [${scan.signals.join(', ')}]`)
      recordMembraBlock(scan.score, scan.signals)
      return res.status(403).json({
        error: {
          message: 'Request blocked by membra: prompt-injection risk score exceeded threshold',
          type: 'membra_blocked',
          score: scan.score,
          signals: scan.signals,
        },
      })
    }
  }

  const client = (req.headers['x-client-name'] ?? req.headers['user-agent'] ?? 'unknown').toString().split('/')[0]
  const tokensIn = estimateTokens(JSON.stringify(messages))

  const options = {
    model: model ?? 'auto',
    maxTokens: max_tokens,
    temperature,
  }

  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')

    const id = `chatcmpl-${Date.now()}`
    let providerUsed = 'unknown'
    const requestStartTime = Date.now()
    let ttfbMs: number | null = null
    let outputChars = 0

    try {
      for await (const chunk of router.chat(messages, options, name => { providerUsed = name })) {
        if (ttfbMs === null) ttfbMs = Date.now() - requestStartTime
        outputChars += chunk.length

        const data = {
          id,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: model ?? 'auto',
          choices: [{
            index: 0,
            delta: { content: chunk },
            finish_reason: null,
          }],
        }
        res.write(`data: ${JSON.stringify(data)}\n\n`)
      }

      // Final chunk with finish_reason
      res.write(`data: ${JSON.stringify({
        id, object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model: model ?? 'auto',
        choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
      })}\n\n`)
      res.write('data: [DONE]\n\n')
      res.end()
      recordRequest({
        provider: providerUsed,
        model: model ?? 'auto',
        client,
        tokensIn,
        tokensOut: estimateTokens('x'.repeat(outputChars)),
        ttfbMs,
      })
    } catch (err) {
      const msg = (err as Error).message
      recordRequest({ provider: providerUsed, model: model ?? 'auto', client, tokensIn, tokensOut: 0, ttfbMs, failed: true })
      res.write(`data: ${JSON.stringify({ error: { message: msg } })}\n\n`)
      res.end()
    }
  } else {
    // Non-streaming: collect all chunks
    let providerUsed = 'unknown'
    try {
      let content = ''
      const requestStartTime = Date.now()
      let ttfbMs: number | null = null
      for await (const chunk of router.chat(messages, options, name => { providerUsed = name })) {
        if (ttfbMs === null) ttfbMs = Date.now() - requestStartTime
        content += chunk
      }

      const tokensOut = estimateTokens(content)
      recordRequest({ provider: providerUsed, model: model ?? 'auto', client, tokensIn, tokensOut, ttfbMs })

      res.json({
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: model ?? 'auto',
        choices: [{
          index: 0,
          message: { role: 'assistant', content },
          finish_reason: 'stop',
        }],
        usage: { prompt_tokens: tokensIn, completion_tokens: tokensOut, total_tokens: tokensIn + tokensOut },
      })
    } catch (err) {
      recordRequest({ provider: providerUsed, model: model ?? 'auto', client, tokensIn, tokensOut: 0, ttfbMs: null, failed: true })
      res.status(500).json({ error: { message: (err as Error).message } })
    }
  }
})

// ── /v1/models ───────────────────────────────────────────────────────────────
app.get('/v1/models', (_req, res) => {
  const data = [
    // Topi Providers (Compatible with both OpenAI and Anthropic format)
    { id: 'auto', type: 'model', object: 'model', display_name: 'Topi Auto-Cascade', created: 0, created_at: '2024-01-01T00:00:00Z', owned_by: 'topi' },
    { id: 'groq', type: 'model', object: 'model', display_name: 'Groq (Llama 3.3)', created: 0, created_at: '2024-01-01T00:00:00Z', owned_by: 'groq' },
    { id: 'gemini', type: 'model', object: 'model', display_name: 'Google Gemini (Flash)', created: 0, created_at: '2024-01-01T00:00:00Z', owned_by: 'google' },
    { id: 'ollama', type: 'model', object: 'model', display_name: 'Ollama (Local)', created: 0, created_at: '2024-01-01T00:00:00Z', owned_by: 'local' },
    { id: 'kimi', type: 'model', object: 'model', display_name: 'Kimi (Moonshot)', created: 0, created_at: '2024-01-01T00:00:00Z', owned_by: 'moonshot' },
    { id: 'qwen', type: 'model', object: 'model', display_name: 'Qwen (DashScope)', created: 0, created_at: '2024-01-01T00:00:00Z', owned_by: 'alibaba' },
    { id: 'deepseek', type: 'model', object: 'model', display_name: 'DeepSeek (Coder)', created: 0, created_at: '2024-01-01T00:00:00Z', owned_by: 'deepseek' },
    { id: 'huggingface', type: 'model', object: 'model', display_name: 'HuggingFace (Serverless)', created: 0, created_at: '2024-01-01T00:00:00Z', owned_by: 'hf' },
    { id: 'cerebras', type: 'model', object: 'model', display_name: 'Cerebras (Fast)', created: 0, created_at: '2024-01-01T00:00:00Z', owned_by: 'cerebras' },
    { id: 'glm', type: 'model', object: 'model', display_name: 'GLM (Zhipu)', created: 0, created_at: '2024-01-01T00:00:00Z', owned_by: 'zhipu' },
    
    // Fake the Claude models so they don't break if queried
    { id: 'claude-3-5-sonnet-20241022', type: 'model', object: 'model', display_name: 'Claude 3.5 Sonnet', created: 0, created_at: '2024-01-01T00:00:00Z', owned_by: 'anthropic' },
    { id: 'claude-3-5-haiku-20241022', type: 'model', object: 'model', display_name: 'Claude 3.5 Haiku', created: 0, created_at: '2024-01-01T00:00:00Z', owned_by: 'anthropic' },
    { id: 'claude-3-opus-20240229', type: 'model', object: 'model', display_name: 'Claude 3 Opus', created: 0, created_at: '2024-01-01T00:00:00Z', owned_by: 'anthropic' }
  ]
  res.json({ object: 'list', data, has_more: false })
})

// ── /status — provider health dashboard ──────────────────────────────────────
app.get('/status', (_req, res) => {
  res.json({
    status: 'ok',
    providers: router.listProviders(),
  })
})

// ── /v1/completions — legacy endpoint alias ───────────────────────────────────
app.post('/v1/completions', async (req, res) => {
  // Convert legacy prompt format to messages
  const messages = [{ role: 'user' as const, content: req.body.prompt ?? '' }]
  req.body = { ...req.body, messages }
  // Re-route to chat completions logic (simplified)
  const tokensIn = estimateTokens(req.body.prompt ?? '')
  let providerUsed = 'unknown'
  try {
    let content = ''
    for await (const chunk of router.chat(messages, { model: req.body.model }, name => { providerUsed = name })) {
      content += chunk
    }
    recordRequest({ provider: providerUsed, model: req.body.model ?? 'auto', client: 'legacy', tokensIn, tokensOut: estimateTokens(content), ttfbMs: null })
    res.json({
      id: `cmpl-${Date.now()}`,
      object: 'text_completion',
      choices: [{ text: content, index: 0, finish_reason: 'stop' }],
    })
  } catch (err) {
    recordRequest({ provider: providerUsed, model: req.body.model ?? 'auto', client: 'legacy', tokensIn, tokensOut: 0, ttfbMs: null, failed: true })
    res.status(500).json({ error: { message: (err as Error).message } })
  }
})

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 LLM Harness running on http://localhost:${PORT}`)
  console.log('\nProvider status:')
  for (const p of router.listProviders()) {
    const keyStatus = p.hasKey ? '✅' : '❌ no key'
    console.log(`  ${p.healthy ? '🟢' : '🔴'} ${p.name.padEnd(12)} ${keyStatus}  ${p.freeLimit}`)
  }
  console.log(`\nWire up Claude Code:`)
  console.log(`  export ANTHROPIC_BASE_URL=http://localhost:${PORT}`)
  console.log(`  export ANTHROPIC_API_KEY=dummy`)
  console.log(`\nWire up Codex CLI:`)
  console.log(`  export OPENAI_BASE_URL=http://localhost:${PORT}/v1`)
  console.log(`  export OPENAI_API_KEY=dummy\n`)
})
