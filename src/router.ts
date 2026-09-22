import { LLMProvider, Message, ChatOptions } from './providers/base'
import { GroqProvider } from './providers/groq'
import { GeminiProvider } from './providers/gemini'
import { GLMProvider } from './providers/glm'
import { CerebrasProvider } from './providers/cerebras'
import { OpenRouterProvider } from './providers/openrouter'
import { LLM7Provider } from './providers/llm7'
import { OllamaProvider } from './providers/ollama'
import { HuggingFaceProvider } from './providers/huggingface'
import { KimiProvider } from './providers/kimi'
import { DeepSeekProvider } from './providers/deepseek'
import { QwenProvider } from './providers/qwen'


// Provider pool — sorted by priority (lower = preferred)
export const providers: LLMProvider[] = [
  new GroqProvider(),       // 1 — Llama 3.3 70B, 14.4K RPD free
  new GeminiProvider(),     // 2 — Gemini 2.0 Flash, 1.5K RPD free
  new GLMProvider(),        // 3 — GLM-4-Flash, unlimited free
  new CerebrasProvider(),   // 4 — Llama3.1 70B, 1M tokens/day
  new OpenRouterProvider(), // 5 — Multiple free models
  new LLM7Provider(),
    new OllamaProvider(),
    new HuggingFaceProvider(),       // 6 — Anonymous, no key needed
  new DeepSeekProvider(),
  new KimiProvider(),
  new QwenProvider(),
]

export class Router {
  private unhealthy = new Map<string, number>()  // name → timestamp
  private cooldownMs = 60_000  // 1 minute cooldown after marking unhealthy

  private isUnhealthy(name: string): boolean {
    const ts = this.unhealthy.get(name)
    if (!ts) return false
    if (Date.now() - ts > this.cooldownMs) {
      this.unhealthy.delete(name)
      return false
    }
    return true
  }

  markUnhealthy(name: string) {
    this.unhealthy.set(name, Date.now())
    console.error(`[router] ${name} marked unhealthy for ${this.cooldownMs / 1000}s`)
  }

  /**
   * Pick a provider. If model hint is given (e.g. "groq/llama-3.3-70b"),
   * try that provider first. Otherwise round-robin by priority.
   */
  async pick(modelHint?: string): Promise<LLMProvider> {
    // If specific provider requested
    if (modelHint && modelHint !== 'auto') {
      const providerName = modelHint.split('/')[0]
      const specific = providers.find(p => p.name === providerName)
      if (specific && !this.isUnhealthy(specific.name)) {
        return specific
      }
    }

    // Pick by priority, skip unhealthy ones
    const healthy = providers
      .filter(p => !this.isUnhealthy(p.name))
      .sort((a, b) => a.priority - b.priority)

    if (healthy.length > 0) return healthy[0]

    // All unhealthy — reset and try again
    console.error('[router] All providers unhealthy — resetting cooldowns')
    this.unhealthy.clear()
    return providers.sort((a, b) => a.priority - b.priority)[0]
  }

  /**
   * Chat with automatic fallback across providers
   */
  async *chat(messages: Message[], options: ChatOptions & { model?: string } = {}): AsyncGenerator<string> {
    const sorted = options.model && options.model !== 'auto'
      ? [
          ...providers.filter(p => p.name === options.model?.split('/')[0]),
          ...providers.filter(p => p.name !== options.model?.split('/')[0]),
        ]
      : [...providers].sort((a, b) => a.priority - b.priority)

    let lastError: Error | undefined

    for (const provider of sorted) {
      if (this.isUnhealthy(provider.name)) continue

      try {
        console.error(`[router] using ${provider.name} (${provider.freeLimit})`)
        let hadOutput = false
        for await (const chunk of provider.chat(messages, options)) {
          hadOutput = true
          yield chunk
        }
        if (hadOutput) return  // success
      } catch (err) {
        lastError = err as Error
        console.error(`[router] ${provider.name} failed: ${lastError.message}`)
        this.markUnhealthy(provider.name)
      }
    }

    throw new Error(`All providers failed. Last error: ${lastError?.message}`)
  }

  listProviders() {
    return providers.map(p => ({
      name: p.name,
      freeLimit: p.freeLimit,
      priority: p.priority,
      healthy: !this.isUnhealthy(p.name),
      hasKey: this.hasKey(p.name),
    }))
  }

  private hasKey(name: string): boolean {
    const keyMap: Record<string, string> = {
      groq: 'GROQ_API_KEY',
      gemini: 'GEMINI_API_KEY',
      glm: 'GLM_API_KEY',
      cerebras: 'CEREBRAS_API_KEY',
      openrouter: 'OPENROUTER_API_KEY',
      llm7: '(none needed)',
      deepseek: 'DEEPSEEK_API_KEY',
      kimi: 'KIMI_API_KEY',
      qwen: 'QWEN_API_KEY',
    }
    const envKey = keyMap[name]
    if (envKey === '(none needed)') return true
    return !!process.env[envKey]
  }
}

export const router = new Router()
