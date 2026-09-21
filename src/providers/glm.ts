import { LLMProvider, Message, ChatOptions, parseSSEStream } from './base'

// FREE: glm-4-flash is free (100 RPM, no daily limit stated)
// Sign up: https://open.bigmodel.cn — no credit card needed for free tier

export class GLMProvider implements LLMProvider {
  name = 'glm'
  isFree = true
  priority = 3
  isHealthy = true
  freeLimit = '100 RPM · unlimited (glm-4-flash)'

  private model = 'glm-4-flash'
  private baseUrl = 'https://open.bigmodel.cn/api/paas/v4'

  async *chat(messages: Message[], options: ChatOptions = {}): AsyncGenerator<string> {
    const key = process.env.GLM_API_KEY
    if (!key) throw new Error('GLM_API_KEY not set')

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
      throw new Error(`GLM error ${res.status}: ${err}`)
    }

    if (!res.body) throw new Error('No response body from GLM')
    yield* parseSSEStream(res.body as unknown as NodeJS.ReadableStream)
  }

  async checkHealth(): Promise<boolean> {
    const key = process.env.GLM_API_KEY
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
