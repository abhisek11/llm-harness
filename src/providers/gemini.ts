import { LLMProvider, Message, ChatOptions } from './base'

// FREE: 15 RPM, 1,500 RPD, 1M tokens/min on gemini-2.0-flash
// Sign up: https://aistudio.google.com — no credit card needed

export class GeminiProvider implements LLMProvider {
  name = 'gemini'
  isFree = true
  priority = 2
  isHealthy = true
  freeLimit = '15 RPM · 1.5K req/day · 1M tokens/min'

  private model = 'gemini-2.0-flash'

  async *chat(messages: Message[], options: ChatOptions = {}): AsyncGenerator<string> {
    const key = process.env.GEMINI_API_KEY
    if (!key) throw new Error('GEMINI_API_KEY not set')

    // Convert OpenAI format → Gemini format
    const systemMsg = messages.find(m => m.role === 'system')
    const chatMessages = messages.filter(m => m.role !== 'system')

    const geminiContents = chatMessages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    const body: Record<string, unknown> = {
      contents: geminiContents,
      generationConfig: {
        maxOutputTokens: options.maxTokens ?? 8192,
        temperature: options.temperature ?? 0.7,
      },
    }

    if (systemMsg) {
      body.systemInstruction = { parts: [{ text: systemMsg.content }] }
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:streamGenerateContent?alt=sse&key=${key}`

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Gemini error ${res.status}: ${err}`)
    }

    if (!res.body) throw new Error('No response body from Gemini')

    // Gemini SSE format: data: {"candidates":[{"content":{"parts":[{"text":"..."}]}}]}
    let buffer = ''
    for await (const chunk of res.body as unknown as AsyncIterable<Buffer>) {
      buffer += chunk.toString()
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data:')) continue
        const data = line.slice(5).trim()
        if (!data || data === '[DONE]') continue
        try {
          const json = JSON.parse(data)
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
          if (text) yield text
        } catch {}
      }
    }
  }

  async checkHealth(): Promise<boolean> {
    const key = process.env.GEMINI_API_KEY
    if (!key) return false
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
      )
      this.isHealthy = res.ok
      return res.ok
    } catch {
      this.isHealthy = false
      return false
    }
  }
}
