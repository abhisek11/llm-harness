import { LLMProvider, Message, ChatOptions, parseSSEStream } from './base'

export class KimiProvider implements LLMProvider {
  name = 'kimi'
  isFree = true
  priority = 9
  isHealthy = true
  freeLimit = 'Moonshot API (k3 / k2.6)'

  private baseUrl = 'https://api.moonshot.cn/v1'

  get hasKey() { return !!process.env.KIMI_API_KEY }

  async *chat(messages: Message[], options: ChatOptions = {}): AsyncGenerator<string> {
    const key = process.env.KIMI_API_KEY
    if (!key) throw new Error('KIMI_API_KEY not set')

    // Support Kimi k3 and k2.6 based on user preference, default to k3
    let resolvedModel = 'moonshot-v3' // generic alias for k3
    if (options.model === 'k2.6' || options.model === 'moonshot-v2.6') {
       resolvedModel = 'moonshot-v2.6'
    } else if (options.model === 'k3' || options.model === 'moonshot-v3') {
       resolvedModel = 'moonshot-v3'
    } else if (options.model && options.model !== 'auto') {
       resolvedModel = options.model
    }

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: resolvedModel,
        messages,
        stream: true,
        max_tokens: options.maxTokens ?? 4096,
        temperature: options.temperature ?? 0.7,
      }),
    })

    if (!res.ok) throw new Error(`Kimi error ${res.status}: ${await res.text()}`)
    yield* parseSSEStream(res.body as unknown as NodeJS.ReadableStream)
  }

  async checkHealth(): Promise<boolean> {
    if (!this.hasKey) return false
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${process.env.KIMI_API_KEY}` }
      })
      return (this.isHealthy = res.ok)
    } catch { return (this.isHealthy = false) }
  }
}
