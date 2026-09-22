import { LLMProvider, Message, ChatOptions, parseSSEStream } from './base'

export class OpenAIProvider implements LLMProvider {
  name = 'openai'
  isFree = false
  priority = 90 // Low priority since it costs money
  isHealthy = true
  freeLimit = 'Paid (OpenAI API)'

  private baseUrl = 'https://api.openai.com/v1'

  async *chat(messages: Message[], options: ChatOptions = {}): AsyncGenerator<string> {
    const key = process.env.OPENAI_API_KEY
    if (!key) throw new Error('OPENAI_API_KEY not set')

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model && options.model !== 'auto' ? options.model : 'gpt-4o-mini',
        messages,
        stream: true,
        max_tokens: options.maxTokens ?? 4096,
        temperature: options.temperature ?? 0.7,
      }),
    })

    if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`)
    yield* parseSSEStream(res.body as unknown as NodeJS.ReadableStream)
  }

  async checkHealth(): Promise<boolean> {
    if (!process.env.OPENAI_API_KEY) return false
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
      })
      return (this.isHealthy = res.ok)
    } catch { return (this.isHealthy = false) }
  }
}
