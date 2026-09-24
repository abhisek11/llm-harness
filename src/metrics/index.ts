import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

// Pricing per 1M tokens (USD). Providers not listed, or with isFree=true,
// are treated as $0 — this reflects real free-tier usage, not the vendor's
// list price for paid usage beyond the free quota.
const PROVIDER_PRICING: Record<string, { input: number; output: number }> = {
  openai: { input: 0.15, output: 0.6 },       // gpt-4o-mini
  anthropic: { input: 3, output: 15 },        // claude sonnet class
  deepseek: { input: 0.27, output: 1.1 },     // deepseek-chat
}

// What this request would have cost on a typical paid frontier model,
// had topi not routed it to a free/cheap provider. Configurable because
// "the model you'd otherwise use" varies per person.
const BASELINE_INPUT_PER_1M = Number(process.env.TOPI_BASELINE_INPUT_PER_1M ?? 3)
const BASELINE_OUTPUT_PER_1M = Number(process.env.TOPI_BASELINE_OUTPUT_PER_1M ?? 15)

function costUsd(provider: string, tokensIn: number, tokensOut: number): number {
  const p = PROVIDER_PRICING[provider]
  if (!p) return 0
  return (tokensIn / 1_000_000) * p.input + (tokensOut / 1_000_000) * p.output
}

function baselineCostUsd(tokensIn: number, tokensOut: number): number {
  return (tokensIn / 1_000_000) * BASELINE_INPUT_PER_1M + (tokensOut / 1_000_000) * BASELINE_OUTPUT_PER_1M
}

export interface SavingsEvent {
  v: 1
  ts: string
  provider: string
  model: string
  client: string
  tokensIn: number
  tokensOut: number
  baselineCostUsd: number
  actualCostUsd: number
  savedUsd: number
  ttfbMs: number | null
  blockedByMembra: boolean
  membraScore?: number
  membraSignals?: string[]
}

interface Bucket {
  requests: number
  failedRequests: number
  blockedByMembra: number
  tokensIn: number
  tokensOut: number
  baselineCostUsd: number
  actualCostUsd: number
  savedUsd: number
  byProvider: Record<string, { requests: number; tokensIn: number; tokensOut: number; savedUsd: number }>
  startedAt: string
  lastActivityAt: string | null
}

function emptyBucket(): Bucket {
  return {
    requests: 0,
    failedRequests: 0,
    blockedByMembra: 0,
    tokensIn: 0,
    tokensOut: 0,
    baselineCostUsd: 0,
    actualCostUsd: 0,
    savedUsd: 0,
    byProvider: {},
    startedAt: new Date().toISOString(),
    lastActivityAt: null,
  }
}

const DATA_DIR = process.env.TOPI_DATA_DIR ?? path.join(os.homedir(), '.topi')
const SAVINGS_FILE = path.join(DATA_DIR, 'proxy_savings.json')
const EVENTS_FILE = path.join(DATA_DIR, 'savings_events.jsonl')

const lifetime: Bucket = loadLifetime()
const session: Bucket = emptyBucket()
const recentEvents: SavingsEvent[] = []
const MAX_RECENT = 200

function loadLifetime(): Bucket {
  try {
    const raw = JSON.parse(fs.readFileSync(SAVINGS_FILE, 'utf8'))
    if (raw?.lifetime) return { ...emptyBucket(), ...raw.lifetime }
  } catch {
    // no prior file, or unreadable — start fresh
  }
  return emptyBucket()
}

function persist() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true })
    fs.writeFileSync(
      SAVINGS_FILE,
      JSON.stringify({ schema_version: 1, lifetime, session }, null, 2)
    )
  } catch (err) {
    console.error('[metrics] failed to persist proxy_savings.json:', (err as Error).message)
  }
}

function appendEvent(ev: SavingsEvent) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true })
    fs.appendFileSync(EVENTS_FILE, JSON.stringify(ev) + '\n')
  } catch (err) {
    console.error('[metrics] failed to append savings_events.jsonl:', (err as Error).message)
  }
  recentEvents.push(ev)
  if (recentEvents.length > MAX_RECENT) recentEvents.shift()
}

function applyToBucket(b: Bucket, ev: SavingsEvent) {
  b.requests += 1
  b.lastActivityAt = ev.ts
  b.tokensIn += ev.tokensIn
  b.tokensOut += ev.tokensOut
  b.baselineCostUsd += ev.baselineCostUsd
  b.actualCostUsd += ev.actualCostUsd
  b.savedUsd += ev.savedUsd
  const p = (b.byProvider[ev.provider] ??= { requests: 0, tokensIn: 0, tokensOut: 0, savedUsd: 0 })
  p.requests += 1
  p.tokensIn += ev.tokensIn
  p.tokensOut += ev.tokensOut
  p.savedUsd += ev.savedUsd
}

export function estimateTokens(text: string): number {
  // Rough char/4 heuristic — no tokenizer dependency. Good enough for
  // relative cost tracking, not exact billing reconciliation.
  return Math.ceil((text || '').length / 4)
}

export function recordMembraBlock(score: number, signals: string[]) {
  lifetime.blockedByMembra += 1
  session.blockedByMembra += 1
  const ev: SavingsEvent = {
    v: 1,
    ts: new Date().toISOString(),
    provider: 'none',
    model: 'blocked',
    client: 'unknown',
    tokensIn: 0,
    tokensOut: 0,
    baselineCostUsd: 0,
    actualCostUsd: 0,
    savedUsd: 0,
    ttfbMs: null,
    blockedByMembra: true,
    membraScore: score,
    membraSignals: signals,
  }
  appendEvent(ev)
  persist()
}

export function recordRequest(opts: {
  provider: string
  model: string
  client: string
  tokensIn: number
  tokensOut: number
  ttfbMs: number | null
  failed?: boolean
}) {
  const actual = costUsd(opts.provider, opts.tokensIn, opts.tokensOut)
  const baseline = baselineCostUsd(opts.tokensIn, opts.tokensOut)
  const ev: SavingsEvent = {
    v: 1,
    ts: new Date().toISOString(),
    provider: opts.provider,
    model: opts.model,
    client: opts.client,
    tokensIn: opts.tokensIn,
    tokensOut: opts.tokensOut,
    baselineCostUsd: baseline,
    actualCostUsd: actual,
    savedUsd: Math.max(0, baseline - actual),
    ttfbMs: opts.ttfbMs,
    blockedByMembra: false,
  }
  if (opts.failed) {
    lifetime.failedRequests += 1
    session.failedRequests += 1
  } else {
    applyToBucket(lifetime, ev)
    applyToBucket(session, ev)
  }
  appendEvent(ev)
  persist()
}

export function getMetrics() {
  const savingsPercent = (b: Bucket) => (b.baselineCostUsd > 0 ? (b.savedUsd / b.baselineCostUsd) * 100 : 0)
  return {
    lifetime: { ...lifetime, savingsPercent: savingsPercent(lifetime) },
    session: { ...session, savingsPercent: savingsPercent(session) },
    recentEvents: recentEvents.slice(-50).reverse(),
  }
}
