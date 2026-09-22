import re

with open('src/cli.ts', 'r') as f:
    content = f.read()

content = content.replace("  kimi         Moonshot API (Kimi)\n", "  kimi         Moonshot API (supports k3, k2.6)\n")
content = content.replace("  ollama       Local models (100% Free & Private)\n", "  ollama       Local models (100% Free & Private)\n  huggingface  HF Serverless (Llama 3, Mistral)\n")

with open('src/cli.ts', 'w') as f:
    f.write(content)
