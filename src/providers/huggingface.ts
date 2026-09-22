import { LLMProvider, Message, ChatOptions, parseSSEStream } from './base'

export class HuggingFaceProvider implements LLMProvider {
  name = 'huggingface'
  isFree = true
  priority = 8
  isHealthy = true
  freeLimit = 'Free Serverless Inference API'

  async *chat(messages: Message[], options: ChatOptions = {}): AsyncGenerator<string> {
    const key = process.env.HUGGINGFACE_API_KEY
    if (!key) throw new Error('HUGGINGFACE_API_KEY not set')

    // Default to Llama 3 8B Instruct if not specified
    const hfModel = options.model && options.model !== 'auto' 
      ? options.model 
      : 'meta-llama/Meta-Llama-3-8B-Instruct'
      
    const url = `https://api-inference.huggingface.co/models/${hfModel}/v1/chat/completions`

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: hfModel,
        messages,
        stream: true,
        max_tokens: options.maxTokens ?? 2048,
        temperature: options.temperature ?? 0.7,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`HuggingFace error ${res.status}: ${err}`)
    }

    if (!res.body) throw new Error('No response body from HuggingFace')
    yield* parseSSEStream(res.body as unknown as NodeJS.ReadableStream)
  }

  async checkHealth(): Promise<boolean> {
    const key = process.env.HUGGINGFACE_API_KEY
    if (!key) return false
    return true // HF doesn't have a simple generic ping without a model, so assume true if key exists
  }
}
