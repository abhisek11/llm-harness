#!/usr/bin/env node
import 'dotenv/config'
import * as readline from 'readline'
import { router } from './router'
import { Message } from './providers/base'

// ── ANSI color helpers ────────────────────────────────────────────────────────
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
}

const banner = `
${c.cyan}${c.bold}╔══════════════════════════════════════════╗
║          🦾 LLM Harness CLI              ║
║   Free models · OmniRoute-inspired       ║
╚══════════════════════════════════════════╝${c.reset}

${c.dim}Commands: /help /status /clear /model <name> /exit${c.reset}
`

function printStatus() {
  console.log(`\n${c.bold}Provider Status:${c.reset}`)
  for (const p of router.listProviders()) {
    const icon = p.healthy ? (p.hasKey ? '🟢' : '🟡') : '🔴'
    const keyInfo = p.name === 'llm7' ? '(no key needed)' : p.hasKey ? '(key set)' : '(NO KEY — set in .env)'
    console.log(`  ${icon} ${c.bold}${p.name.padEnd(12)}${c.reset} priority:${p.priority}  ${p.freeLimit}  ${c.dim}${keyInfo}${c.reset}`)
  }
  console.log()
}

function printHelp() {
  console.log(`
${c.bold}Commands:${c.reset}
  ${c.cyan}/help${c.reset}           Show this help
  ${c.cyan}/status${c.reset}         Show provider health & API keys
  ${c.cyan}/clear${c.reset}          Clear conversation history
  ${c.cyan}/model <name>${c.reset}   Pin to a provider (groq, gemini, glm, cerebras, openrouter, llm7, auto)
  ${c.cyan}/models${c.reset}         List available models
  ${c.cyan}/exit${c.reset}           Exit the CLI

${c.bold}Model hints (use in /model):${c.reset}
  auto         Auto-select best available provider
  groq         Groq · Llama 3.3 70B (fast + smart)
  gemini       Google Gemini 2.0 Flash (multimodal)
  glm          Zhipu GLM-4-Flash (Chinese + English)
  cerebras     Cerebras · Llama3.1 70B (fastest inference)
  openrouter   OpenRouter free tier models
  llm7         Anonymous, no key needed (fallback)
  deepseek     DeepSeek · Pay-as-you-go (very cheap)
  kimi         Moonshot API (Kimi)
  qwen         DashScope API (Qwen)
`)
}

async function main() {
  console.log(banner)
  printStatus()

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  })

  const history: Message[] = []
  let currentModel = 'auto'

  // System prompt for coding assistant mode
  history.push({
    role: 'system',
    content: `You are an expert coding assistant and software engineer.
Help the user write, debug, review, and explain code.
Be concise but thorough. Show code in markdown code blocks with language tags.
For complex problems, think step by step before writing code.`,
  })

  const prompt = () => {
    const modelLabel = currentModel === 'auto' ? `${c.dim}auto${c.reset}` : `${c.cyan}${currentModel}${c.reset}`
    return `\n${c.green}you${c.reset} ${c.dim}[${c.reset}${modelLabel}${c.dim}]${c.reset} > `
  }

  const ask = () => {
    rl.question(prompt(), async (input) => {
      const line = input.trim()

      if (!line) { ask(); return }

      // ── Commands ───────────────────────────────────────────────────────────
      if (line === '/exit' || line === '/quit') {
        console.log(`\n${c.dim}Bye!${c.reset}\n`)
        rl.close()
        process.exit(0)
      }

      if (line === '/help') { printHelp(); ask(); return }
      if (line === '/status') { printStatus(); ask(); return }
      if (line === '/clear') {
        history.length = 1  // keep system prompt
        console.log(`${c.dim}History cleared.${c.reset}`)
        ask(); return
      }

      if (line === '/models') {
        console.log(`\n${c.bold}Available models:${c.reset}`)
        for (const p of router.listProviders()) {
          console.log(`  ${p.name}`)
        }
        console.log()
        ask(); return
      }

      if (line.startsWith('/model ')) {
        const name = line.slice(7).trim()
        const valid = [...router.listProviders().map(p => p.name), 'auto']
        if (valid.includes(name)) {
          currentModel = name
          console.log(`${c.dim}Switched to: ${name}${c.reset}`)
        } else {
          console.log(`${c.red}Unknown provider. Use: ${valid.join(', ')}${c.reset}`)
        }
        ask(); return
      }

      // ── Chat ──────────────────────────────────────────────────────────────
      history.push({ role: 'user', content: line })

      process.stdout.write(`\n${c.magenta}${c.bold}assistant${c.reset} `)
      if (currentModel !== 'auto') {
        process.stdout.write(`${c.dim}[${currentModel}]${c.reset} `)
      }
      process.stdout.write('\n')

      let fullResponse = ''
      try {
        for await (const chunk of router.chat(history, { model: currentModel })) {
          process.stdout.write(chunk)
          fullResponse += chunk
        }
        process.stdout.write('\n')
        history.push({ role: 'assistant', content: fullResponse })
      } catch (err) {
        console.error(`\n${c.red}Error: ${(err as Error).message}${c.reset}`)
        history.pop()  // remove the failed user message
      }

      ask()
    })
  }

  rl.on('close', () => process.exit(0))
  ask()
}

main().catch(console.error)
