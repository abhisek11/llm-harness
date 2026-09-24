/**
 * Inbound defense: prompt-injection & jailbreak detection.
 * Ported from membra's detection core (membra/src/membra/detectors/injection.py).
 * Weighted signal patterns → 0..1 risk score. Swap in a classifier later
 * without changing the call shape.
 */

interface Signal {
  pattern: RegExp
  name: string
  weight: number
}

const SIGNALS: Signal[] = [
  { pattern: /ignore (all |the |your )?(previous|prior|above)\s+(instructions|prompt|rules)/i, name: 'instruction_override', weight: 0.6 },
  { pattern: /disregard (the |your |all )?(system prompt|rules|guidelines|instructions)/i, name: 'instruction_override', weight: 0.6 },
  { pattern: /you are now (in )?(developer|dan|jailbreak|god|sudo|root)\s*mode/i, name: 'role_hijack', weight: 0.6 },
  { pattern: /pretend (you are|to be)|act as (an? )?(unrestricted|uncensored|evil)/i, name: 'role_hijack', weight: 0.5 },
  { pattern: /reveal (your )?(system prompt|initial prompt|instructions|the prompt)/i, name: 'prompt_extraction', weight: 0.5 },
  { pattern: /repeat (everything|the text|all text) (above|before)/i, name: 'prompt_extraction', weight: 0.4 },
  { pattern: /print (your )?(system|initial) (prompt|message)/i, name: 'prompt_extraction', weight: 0.5 },
  { pattern: /do anything now|no (restrictions|limitations|filters|rules)/i, name: 'guardrail_removal', weight: 0.5 },
  { pattern: /\bbase64\b.*(decode|execute)|decode the following/i, name: 'obfuscation', weight: 0.3 },
  { pattern: /<\/?(system|assistant|user)>|\[INST\]|<\|im_start\|>/i, name: 'delimiter_injection', weight: 0.5 },
]

export const SIGNAL_DESCRIPTIONS: Record<string, string> = {
  instruction_override: 'Attempts to make the model discard its system prompt or prior instructions.',
  role_hijack: 'Attempts to reassign the model to an unrestricted or alternate persona (jailbreak framing).',
  prompt_extraction: 'Attempts to make the model reveal or repeat its system prompt / hidden instructions.',
  guardrail_removal: 'Explicitly asks the model to ignore its safety limits or restrictions.',
  obfuscation: 'Uses encoding (e.g. base64) to smuggle instructions past naive text filters.',
  delimiter_injection: 'Injects role/chat-template delimiters to try to fake a new conversation turn.',
}

export interface SignalMatch {
  name: string
  weight: number
  description: string
  matchedText: string
}

export interface InjectionScanResult {
  score: number
  signals: string[]
  matches: SignalMatch[]
}

function truncate(s: string, n = 80): string {
  return s.length > n ? s.slice(0, n) + '…' : s
}

export function scanInjection(text: string | undefined | null): InjectionScanResult {
  const input = text ?? ''
  const matches: SignalMatch[] = []
  const seenNames = new Set<string>()
  let score = 0
  for (const { pattern, name, weight } of SIGNALS) {
    const m = pattern.exec(input)
    if (m) {
      score += weight
      matches.push({ name, weight, description: SIGNAL_DESCRIPTIONS[name] ?? '', matchedText: truncate(m[0]) })
      seenNames.add(name)
    }
  }
  // multiple weak signals still escalate, capped at 1.0
  score = Math.min(score, 1.0)
  return { score: Math.round(score * 1000) / 1000, signals: [...seenNames].sort(), matches }
}
