import re

with open('src/server.ts', 'r') as f:
    content = f.read()

models_search = """app.get('/v1/models', (_req, res) => {
  const data = [
    { id: 'auto', object: 'model', created: 0, owned_by: 'llm-harness' },
    { id: 'groq/llama-3.3-70b-versatile', object: 'model', created: 0, owned_by: 'groq' },
    { id: 'gemini/gemini-2.0-flash', object: 'model', created: 0, owned_by: 'google' },
    { id: 'glm/glm-4-flash', object: 'model', created: 0, owned_by: 'zhipu' },
    { id: 'cerebras/llama3.1-70b', object: 'model', created: 0, owned_by: 'cerebras' },
    { id: 'openrouter/llama-3.3-70b:free', object: 'model', created: 0, owned_by: 'openrouter' },
    { id: 'llm7/gpt-4o-mini', object: 'model', created: 0, owned_by: 'llm7' },
  ]
  res.json({ object: 'list', data })
})"""

models_replace = """app.get('/v1/models', (_req, res) => {
  const data = [
    // Topi Providers (Compatible with both OpenAI and Anthropic format)
    { id: 'auto', type: 'model', object: 'model', display_name: 'Topi Auto-Cascade', created: 0, created_at: '2024-01-01T00:00:00Z', owned_by: 'topi' },
    { id: 'groq', type: 'model', object: 'model', display_name: 'Groq (Llama 3.3)', created: 0, created_at: '2024-01-01T00:00:00Z', owned_by: 'groq' },
    { id: 'gemini', type: 'model', object: 'model', display_name: 'Google Gemini (Flash)', created: 0, created_at: '2024-01-01T00:00:00Z', owned_by: 'google' },
    { id: 'ollama', type: 'model', object: 'model', display_name: 'Ollama (Local)', created: 0, created_at: '2024-01-01T00:00:00Z', owned_by: 'local' },
    { id: 'kimi', type: 'model', object: 'model', display_name: 'Kimi (Moonshot)', created: 0, created_at: '2024-01-01T00:00:00Z', owned_by: 'moonshot' },
    { id: 'qwen', type: 'model', object: 'model', display_name: 'Qwen (DashScope)', created: 0, created_at: '2024-01-01T00:00:00Z', owned_by: 'alibaba' },
    { id: 'deepseek', type: 'model', object: 'model', display_name: 'DeepSeek (Coder)', created: 0, created_at: '2024-01-01T00:00:00Z', owned_by: 'deepseek' },
    { id: 'huggingface', type: 'model', object: 'model', display_name: 'HuggingFace (Serverless)', created: 0, created_at: '2024-01-01T00:00:00Z', owned_by: 'hf' },
    { id: 'cerebras', type: 'model', object: 'model', display_name: 'Cerebras (Fast)', created: 0, created_at: '2024-01-01T00:00:00Z', owned_by: 'cerebras' },
    { id: 'glm', type: 'model', object: 'model', display_name: 'GLM (Zhipu)', created: 0, created_at: '2024-01-01T00:00:00Z', owned_by: 'zhipu' },
    
    // Fake the Claude models so they don't break if queried
    { id: 'claude-3-5-sonnet-20241022', type: 'model', object: 'model', display_name: 'Claude 3.5 Sonnet', created: 0, created_at: '2024-01-01T00:00:00Z', owned_by: 'anthropic' },
    { id: 'claude-3-5-haiku-20241022', type: 'model', object: 'model', display_name: 'Claude 3.5 Haiku', created: 0, created_at: '2024-01-01T00:00:00Z', owned_by: 'anthropic' },
    { id: 'claude-3-opus-20240229', type: 'model', object: 'model', display_name: 'Claude 3 Opus', created: 0, created_at: '2024-01-01T00:00:00Z', owned_by: 'anthropic' }
  ]
  res.json({ object: 'list', data, has_more: false })
})"""
content = content.replace(models_search, models_replace)

with open('src/server.ts', 'w') as f:
    f.write(content)
