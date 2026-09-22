import re

with open('src/router.ts', 'r') as f:
    content = f.read()

# Add imports
content = content.replace("import { QwenProvider } from './providers/qwen'", "import { QwenProvider } from './providers/qwen'\nimport { OpenAIProvider } from './providers/openai'\nimport { AnthropicProvider } from './providers/anthropic'")

# Add to list
content = content.replace("new QwenProvider(),", "new QwenProvider(),\n  new OpenAIProvider(),\n  new AnthropicProvider(),")

with open('src/router.ts', 'w') as f:
    f.write(content)

with open('src/cli.ts', 'r') as f:
    content = f.read()

# Add to inquirer choices
content = content.replace("{ name: 'LLM7 (Community)', value: 'llm7' }", "{ name: 'LLM7 (Community)', value: 'llm7' },\n              { name: 'OpenAI (GPT-4o / Mini)', value: 'openai' },\n              { name: 'Anthropic (Claude 3.5)', value: 'anthropic' }")

with open('src/cli.ts', 'w') as f:
    f.write(content)
