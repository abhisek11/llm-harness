import { LLMProvider, Message, ChatOptions } from './base'

export class AnthropicProvider implements LLMProvider {
  name = 'anthropic'
  isFree = false
  priority = 91 // Low priority since it costs money
  isHealthy = true
  freeLimit = 'Paid (Anthropic API)'

  private baseUrl = 'https://api.anthropic.com/v1'

  async *chat(messages: Message[], options: ChatOptions = {}): AsyncGenerator<string> {
    const key = process.env.ANTHROPIC_API_KEY
    if (!key) throw new Error('ANTHROPIC_API_KEY not set')

    // Convert messages to Anthropic format
    let system = ''
    const anthropicMessages = messages.filter(m => {
      if (m.role === 'system') { system = m.content; return false }
      return true
    })

    const res = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model && options.model !== 'auto' ? options.model : 'claude-3-5-haiku-20241022',
        system: system || undefined,
        messages: anthropicMessages,
        stream: true,
        max_tokens: options.maxTokens ?? 4096,
        temperature: options.temperature ?? 0.7,
      }),
    })

    if (!res.ok) throw new Error(`Anthropic error ${res.status}: ${await res.text()}`)

    const reader = res.body?.getReader()
    if (!reader) throw new Error('No body')
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              yield parsed.delta.text
            }
          } catch (e) {}
        }
      }
    }
  }

  async checkHealth(): Promise<boolean> {
    return !!process.env.ANTHROPIC_API_KEY
  }
}
