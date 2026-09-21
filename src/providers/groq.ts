import { LLMProvider, Message, ChatOptions, parseSSEStream } from './base'

// FREE: 6,000 tokens/min, 14,400 RPD, 500K tokens/day on llama-3.3-70b
// Sign up: https://console.groq.com/keys — no credit card needed

export class GroqProvider implements LLMProvider {
  name = 'groq'
  isFree = true
  priority = 1
  isHealthy = true
  freeLimit = '6K tokens/min · 14.4K req/day'

  private model = 'llama-3.3-70b-versatile'
  private baseUrl = 'https://api.groq.com/openai/v1'

  async *chat(messages: Message[], options: ChatOptions = {}): AsyncGenerator<string> {
    const key = process.env.GROQ_API_KEY
    if (!key) throw new Error('GROQ_API_KEY not set')

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
        max_tokens: options.maxTokens ?? 4096,
        temperature: options.temperature ?? 0.7,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Groq error ${res.status}: ${err}`)
    }

    if (!res.body) throw new Error('No response body from Groq')
    yield* parseSSEStream(res.body as unknown as NodeJS.ReadableStream)
  }

  async checkHealth(): Promise<boolean> {
    const key = process.env.GROQ_API_KEY
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
