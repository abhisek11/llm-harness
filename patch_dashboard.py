import re

with open('dashboard/src/App.tsx', 'r') as f:
    content = f.read()

# Rebrand
content = content.replace("HEADROOM", "TOPI HARNESS")
content = content.replace("v0.37.0 (Topi Harness)", "v1.0.0")

# Default state
state_search = r"const \[metrics, setMetrics\] = useState\(\{.*?\}\);"
state_replace = """const [metrics, setMetrics] = useState({
    totalTokensIn: 0,
    totalTokensOut: 0,
    savedTokens: 0,
    requests: 0,
    compressionRate: 0,
    overheadMs: 0,
    ttfbMs: 0,
    failedRequests: 0,
    throughput: {
      input: 0,
      compression: 0,
      forward: 0,
      generation: 0
    },
    pipeline: [],
    performance: { overhead: '', ttfb: '', failed: 0 }
  });"""
content = re.sub(state_search, state_replace, content, flags=re.DOTALL)

# Dynamic text mapping
content = content.replace(">395.7k <", ">{metrics.savedTokens.toLocaleString()} <")
content = content.replace(">26 calls · realized<", ">{metrics.requests} calls · realized<")
content = content.replace(">642ms<", ">{metrics.overheadMs || 0}ms<")
content = content.replace("TTFB 6.46s avg", "TTFB {metrics.ttfbMs ? (metrics.ttfbMs / 1000).toFixed(2) : 0}s avg")
content = content.replace(">383.6 / 6532.7 tok/s<", ">{metrics.throughput?.input?.toFixed(1) || 0} tok/s<")
content = content.replace(">438.1 / 539334.8 tok/s<", ">{metrics.throughput?.compression?.toFixed(1) || 0} tok/s<")
content = content.replace(">6407.3 / 16353.5 tok/s<", ">{metrics.throughput?.forward?.toFixed(1) || 0} tok/s<")
content = content.replace(">78.5 / 108.2 tok/s<", ">{metrics.throughput?.generation?.toFixed(1) || 0} tok/s<")

with open('dashboard/src/App.tsx', 'w') as f:
    f.write(content)
