import re

with open('src/cli.ts', 'r') as f:
    content = f.read()

content = content.replace("  qwen         DashScope API (Qwen)\n", "  qwen         DashScope API (Qwen)\n  ollama       Local models (100% Free & Private)\n")

with open('src/cli.ts', 'w') as f:
    f.write(content)
