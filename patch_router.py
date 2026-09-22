import re

with open('src/router.ts', 'r') as f:
    content = f.read()

# Add import
content = content.replace("import { LLM7Provider } from './providers/llm7'", "import { LLM7Provider } from './providers/llm7'\nimport { OllamaProvider } from './providers/ollama'")

# Add to providers list
content = content.replace("new LLM7Provider(),", "new LLM7Provider(),\n    new OllamaProvider(),")

with open('src/router.ts', 'w') as f:
    f.write(content)
