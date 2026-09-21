export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatOptions {
  maxTokens?: number
  temperature?: number
  stream?: boolean
}

export interface LLMProvider {
  name: string
  isFree: boolean
  priority: number
  isHealthy: boolean
  hasKey?: boolean
  freeLimit: string  // human-readable free tier info
  chat(messages: Message[], options?: ChatOptions): AsyncGenerator<string>
  checkHealth(): Promise<boolean>
}

export function parseSSEStream(stream: NodeJS.ReadableStream): AsyncGenerator<string> {
  return (async function* () {
    let buffer = ''
    for await (const chunk of stream) {
      buffer += chunk.toString()
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const data = trimmed.slice(5).trim()
        if (data === '[DONE]') return
        try {
          const json = JSON.parse(data)
          const content = json.choices?.[0]?.delta?.content ?? json.choices?.[0]?.text ?? ''
          if (content) yield content
        } catch {}
      }
    }
  })()
}
