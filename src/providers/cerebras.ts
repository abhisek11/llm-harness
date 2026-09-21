import { LLMProvider, Message, ChatOptions, parseSSEStream } from './base'

// FREE: 1M tokens/day, 30 RPM on llama3.1-70b (fastest inference on planet)
// Sign up: https://inference.cerebras.ai — no credit card needed

export class CerebrasProvider implements LLMProvider {
  name = 'cerebras'
  isFree = true
  priority = 4
  isHealthy = true
  freeLimit = '1M tokens/day · 30 RPM (ultra-fast)'

  private model = 'llama3.1-70b'
  private baseUrl = 'https://api.cerebras.ai/v1'

  async *chat(messages: Message[], options: ChatOptions = {}): AsyncGenerator<string> {
    const key = process.env.CEREBRAS_API_KEY
    if (!key) throw new Error('CEREBRAS_API_KEY not set')

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: true,
        max_tokens: options.maxTokens ?? 8192,
        temperature: options.temperature ?? 0.7,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Cerebras error ${res.status}: ${err}`)
    }

    if (!res.body) throw new Error('No response body from Cerebras')
    yield* parseSSEStream(res.body as unknown as NodeJS.ReadableStream)
  }

  async checkHealth(): Promise<boolean> {
    const key = process.env.CEREBRAS_API_KEY
    if (!key) return false
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${key}` }
      })
      this.isHealthy = res.ok
      return res.ok
    } catch {
      this.isHealthy = false
      return false
    }
  }
}
