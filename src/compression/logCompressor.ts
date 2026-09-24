/**
 * A small, original compressor for noisy log/tool-output text — inspired by
 * (but not a port of) headroom-ai's log_compressor.py technique. Handles the
 * two biggest, safest wins:
 *   1. Consecutive duplicate lines collapse to one + a repeat count.
 *   2. Long stack traces truncate to head + tail frames with a marker.
 *   3. The whole result is capped to a max line count (head + tail kept).
 *
 * Deliberately conservative: only applied to large, log-shaped text so it
 * never touches ordinary conversational messages.
 */

export interface CompressionResult {
  compressed: string
  applied: boolean
  linesBefore: number
  linesAfter: number
  charsBefore: number
  charsAfter: number
}

export interface LogCompressorConfig {
  minCharsToConsider: number
  maxTotalLines: number
  headLines: number
  tailLines: number
  stackTraceMaxLines: number
  stackTraceHeadFrames: number
  stackTraceTailFrames: number
}

export const DEFAULT_CONFIG: LogCompressorConfig = {
  minCharsToConsider: 3000,
  maxTotalLines: 150,
  headLines: 60,
  tailLines: 60,
  stackTraceMaxLines: 20,
  stackTraceHeadFrames: 5,
  stackTraceTailFrames: 3,
}

const STACK_FRAME = /^\s*(at\s+\S|File "|.*\.(js|ts|py|rb|go|java):\d+:|^\s*#\d+\s)/

function looksLogLike(text: string): boolean {
  const lines = text.split('\n')
  if (lines.length < 30) return false
  const frameLines = lines.filter(l => STACK_FRAME.test(l)).length
  const dupRatio = 1 - new Set(lines).size / lines.length
  return frameLines / lines.length > 0.15 || dupRatio > 0.2
}

function collapseDuplicateLines(lines: string[]): string[] {
  const out: string[] = []
  let i = 0
  while (i < lines.length) {
    let j = i + 1
    while (j < lines.length && lines[j] === lines[i]) j++
    const runLength = j - i
    if (runLength >= 3) {
      out.push(lines[i])
      out.push(`[... previous line repeated ${runLength - 1} more times]`)
    } else {
      for (let k = i; k < j; k++) out.push(lines[k])
    }
    i = j
  }
  return out
}

function collapseStackTraces(lines: string[], cfg: LogCompressorConfig): string[] {
  const out: string[] = []
  let i = 0
  while (i < lines.length) {
    if (!STACK_FRAME.test(lines[i])) {
      out.push(lines[i])
      i++
      continue
    }
    let j = i
    while (j < lines.length && STACK_FRAME.test(lines[j])) j++
    const frames = lines.slice(i, j)
    if (frames.length > cfg.stackTraceMaxLines) {
      out.push(...frames.slice(0, cfg.stackTraceHeadFrames))
      const collapsed = frames.length - cfg.stackTraceHeadFrames - cfg.stackTraceTailFrames
      out.push(`[... ${collapsed} stack frames collapsed]`)
      out.push(...frames.slice(frames.length - cfg.stackTraceTailFrames))
    } else {
      out.push(...frames)
    }
    i = j
  }
  return out
}

function capTotalLines(lines: string[], cfg: LogCompressorConfig): string[] {
  if (lines.length <= cfg.maxTotalLines) return lines
  const head = lines.slice(0, cfg.headLines)
  const tail = lines.slice(lines.length - cfg.tailLines)
  const collapsed = lines.length - cfg.headLines - cfg.tailLines
  return [...head, `[... ${collapsed} lines collapsed ...]`, ...tail]
}

export function compressLogText(text: string, cfg: LogCompressorConfig = DEFAULT_CONFIG): CompressionResult {
  const charsBefore = text.length
  const linesBefore = text.split('\n').length

  if (charsBefore < cfg.minCharsToConsider || !looksLogLike(text)) {
    return { compressed: text, applied: false, linesBefore, linesAfter: linesBefore, charsBefore, charsAfter: charsBefore }
  }

  let lines = text.split('\n')
  lines = collapseDuplicateLines(lines)
  lines = collapseStackTraces(lines, cfg)
  lines = capTotalLines(lines, cfg)

  const compressed = lines.join('\n')
  return {
    compressed,
    applied: compressed.length < charsBefore,
    linesBefore,
    linesAfter: lines.length,
    charsBefore,
    charsAfter: compressed.length,
  }
}
