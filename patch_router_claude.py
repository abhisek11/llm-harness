import re

with open('src/router.ts', 'r') as f:
    content = f.read()

router_chat_search = r"async \*chat\(messages: Message\[\], options: ChatOptions & \{ model\?: string \} = \{\}\): AsyncGenerator<string> \{"
router_chat_replace = """async *chat(messages: Message[], options: ChatOptions & { model?: string } = {}): AsyncGenerator<string> {
    // Map Claude models to Topi models so the user can use Claude Code's internal dropdown
    let targetProvider = options.model;
    if (targetProvider?.includes('haiku')) {
      targetProvider = 'gemini'; // Fast
    } else if (targetProvider?.includes('sonnet')) {
      targetProvider = 'groq'; // Smart
    } else if (targetProvider?.includes('opus')) {
      targetProvider = 'kimi'; // Large context
    } else if (targetProvider?.includes('fable')) {
      targetProvider = 'qwen';
    } else if (targetProvider && !providers.some(p => p.name === targetProvider.split('/')[0])) {
      targetProvider = 'auto';
    }"""
content = content.replace(router_chat_search, router_chat_replace)

sorted_search = r"const sorted = options\.model && options\.model !== 'auto'\n      \? \[\n          \.\.\.providers\.filter\(p => p\.name === options\.model\?\.split\('/'\)\[0\]\),\n          \.\.\.providers\.filter\(p => p\.name !== options\.model\?\.split\('/'\)\[0\]\),\n        \]\n      : \[\.\.\.providers\]\.sort\(\(a, b\) => a\.priority - b\.priority\)"

sorted_replace = """const sorted = targetProvider && targetProvider !== 'auto'
      ? [
          ...providers.filter(p => p.name === targetProvider?.split('/')[0]),
          ...providers.filter(p => p.name !== targetProvider?.split('/')[0]),
        ]
      : [...providers].sort((a, b) => a.priority - b.priority)"""
content = content.replace(sorted_search, sorted_replace)

with open('src/router.ts', 'w') as f:
    f.write(content)
