import { LLMProvider, Message, ChatOptions, parseSSEStream } from './base'

// FREE: Completely anonymous — no API key, no sign-up, no rate limits stated
// Endpoint: https://llm7.io — community-run, may be unstable
// Use as last-resort fallback when all other providers fail

export class LLM7Provider implements LLMProvider {
  name = 'llm7'
  isFree = true
  priority = 6
  isHealthy = true
  freeLimit = 'unlimited · no key needed (community-run)'

  private model = 'gpt-4o-mini'  // mapped internally by llm7
  private baseUrl = 'https://llm7.io/v1'

  async *chat(messages: Message[], options: ChatOptions = {}): AsyncGenerator<string> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // No auth needed
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: true,
        max_tokens: options.maxTokens ?? 2048,
        temperature: options.temperature ?? 0.7,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`LLM7 error ${res.status}: ${err}`)
    }

    if (!res.body) throw new Error('No response body from LLM7')
    yield* parseSSEStream(res.body as unknown as NodeJS.ReadableStream)
  }

  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/models`)
      this.isHealthy = res.ok
      return res.ok
    } catch {
      this.isHealthy = false
      return false
    }
  }
}
