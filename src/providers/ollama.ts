import { LLMProvider, Message, ChatOptions, parseSSEStream } from './base'

export class OllamaProvider implements LLMProvider {
  name = 'ollama'
  isFree = true
  priority = 6
  isHealthy = true
  freeLimit = 'Unlimited (Local execution)'

  async *chat(messages: Message[], options: ChatOptions = {}): AsyncGenerator<string> {
    const model = 'llama3.2' // Default local model
    
    const res = await fetch('http://localhost:11434/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        max_tokens: options.maxTokens,
        temperature: options.temperature,
      }),
    })

    if (!res.ok) {
      throw new Error(`Ollama error ${res.status}: Is Ollama running locally?`)
    }

    if (!res.body) throw new Error('No response body from Ollama')
    yield* parseSSEStream(res.body as unknown as NodeJS.ReadableStream)
  }

  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch('http://localhost:11434/api/tags')
      this.isHealthy = res.ok
      return res.ok
    } catch {
      this.isHealthy = false
      return false
    }
  }
}
