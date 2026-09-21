import { LLMProvider, Message, ChatOptions, parseSSEStream } from './base'

export class QwenProvider implements LLMProvider {
  name = 'qwen'
  isFree = true
  priority = 10
  isHealthy = true
  freeLimit = 'DashScope API'

  private model = 'qwen-turbo'
  private baseUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1'

  get hasKey() { return !!process.env.QWEN_API_KEY }

  async *chat(messages: Message[], options: ChatOptions = {}): AsyncGenerator<string> {
    const key = process.env.QWEN_API_KEY
    if (!key) throw new Error('QWEN_API_KEY not set')

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

    if (!res.ok) throw new Error(`Qwen error ${res.status}: ${await res.text()}`)
    yield* parseSSEStream(res.body as unknown as NodeJS.ReadableStream)
  }

  async checkHealth(): Promise<boolean> {
    if (!this.hasKey) return false
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${process.env.QWEN_API_KEY}` }
      })
      return (this.isHealthy = res.ok)
    } catch { return (this.isHealthy = false) }
  }
}
