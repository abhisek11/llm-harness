import re

with open('src/router.ts', 'r') as f:
    content = f.read()

# Add import
content = content.replace("import { OllamaProvider } from './providers/ollama'", "import { OllamaProvider } from './providers/ollama'\nimport { HuggingFaceProvider } from './providers/huggingface'")

# Add to providers list
content = content.replace("new OllamaProvider(),", "new OllamaProvider(),\n    new HuggingFaceProvider(),")

with open('src/router.ts', 'w') as f:
    f.write(content)
