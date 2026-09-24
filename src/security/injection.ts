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

export interface InjectionScanResult {
  score: number
  signals: string[]
}

export function scanInjection(text: string | undefined | null): InjectionScanResult {
  const signals = new Set<string>()
  let score = 0
  for (const { pattern, name, weight } of SIGNALS) {
    if (pattern.test(text ?? '')) {
      signals.add(name)
      score += weight
    }
  }
  // multiple weak signals still escalate, capped at 1.0
  score = Math.min(score, 1.0)
  return { score: Math.round(score * 1000) / 1000, signals: [...signals].sort() }
}
