import { LLMProvider, Message, ChatOptions, parseSSEStream } from './base'

// FREE: Many models with ":free" suffix — no credit card needed for free models
// Sign up: https://openrouter.ai — get key at https://openrouter.ai/keys
// Free models list: https://openrouter.ai/models?q=:free

export class OpenRouterProvider implements LLMProvider {
  name = 'openrouter'
  isFree = true
  priority = 5
  isHealthy = true
  freeLimit = 'varies per model (meta-llama, mistral, qwen free tiers)'

  // Best free models on OpenRouter (as of 2025):
  private models = [
    'meta-llama/llama-3.3-70b-instruct:free',
    'mistralai/mistral-7b-instruct:free',
    'qwen/qwen-2.5-72b-instruct:free',
    'google/gemma-2-9b-it:free',
  ]
  private currentModelIdx = 0

  private get model() { return this.models[this.currentModelIdx] }
  private baseUrl = 'https://openrouter.ai/api/v1'

  async *chat(messages: Message[], options: ChatOptions = {}): AsyncGenerator<string> {
    const key = process.env.OPENROUTER_API_KEY
    if (!key) throw new Error('OPENROUTER_API_KEY not set')

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/llm-harness',
        'X-Title': 'LLM Harness',
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
      // Try next free model
      this.currentModelIdx = (this.currentModelIdx + 1) % this.models.length
      throw new Error(`OpenRouter error ${res.status}: ${err}`)
    }

    if (!res.body) throw new Error('No response body from OpenRouter')
    yield* parseSSEStream(res.body as unknown as NodeJS.ReadableStream)
  }

  async checkHealth(): Promise<boolean> {
    const key = process.env.OPENROUTER_API_KEY
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
