import re
import os

# Kimi
with open('src/providers/kimi.ts', 'r') as f:
    content = f.read()
content = content.replace("process.env.KIMI_API_KEY", "(process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY)")
with open('src/providers/kimi.ts', 'w') as f:
    f.write(content)

# Qwen
with open('src/providers/qwen.ts', 'r') as f:
    content = f.read()
content = content.replace("process.env.QWEN_API_KEY", "(process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY)")
with open('src/providers/qwen.ts', 'w') as f:
    f.write(content)

# Router
with open('src/router.ts', 'r') as f:
    content = f.read()
content = content.replace("kimi: 'KIMI_API_KEY',", "kimi: 'MOONSHOT_API_KEY', // or KIMI_API_KEY")
content = content.replace("qwen: 'QWEN_API_KEY',", "qwen: 'DASHSCOPE_API_KEY', // or QWEN_API_KEY")
# Also update the hasKey logic to support fallback
haskey_search = """    const envKey = keyMap[name]
    if (envKey === '(none needed)') return true
    return !!process.env[envKey]"""
haskey_replace = """    if (name === 'llm7' || name === 'ollama') return true
    if (name === 'kimi') return !!(process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY)
    if (name === 'qwen') return !!(process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY)
    if (name === 'openai') return !!process.env.OPENAI_API_KEY
    if (name === 'anthropic') return !!process.env.ANTHROPIC_API_KEY
    const envKey = keyMap[name]
    return !!process.env[envKey]"""
content = content.replace(haskey_search, haskey_replace)
with open('src/router.ts', 'w') as f:
    f.write(content)
