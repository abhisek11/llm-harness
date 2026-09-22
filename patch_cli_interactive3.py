with open('src/cli.ts', 'r') as f:
    content = f.read()

# Make /model interactive if no name is provided
model_cmd_search = """      if (line.startsWith('/model ')) {
        const name = line.slice(7).trim()
        const valid = [...router.listProviders().map(p => p.name), 'auto']
        if (valid.includes(name)) {
          currentModel = name
          console.log(`${c.dim}Switched to: ${name}${c.reset}`)
        } else {
          console.log(`${c.red}Unknown provider. Use: ${valid.join(', ')}${c.reset}`)
        }
        ask(); return
      }"""

model_cmd_replace = """      if (line.startsWith('/model')) {
        const name = line.slice(7).trim()
        if (name) {
          const valid = [...router.listProviders().map(p => p.name), 'auto']
          if (valid.includes(name)) {
            currentModel = name
            console.log(`${c.dim}Switched to: ${name}${c.reset}`)
          } else {
            console.log(`${c.red}Unknown provider. Use: ${valid.join(', ')}${c.reset}`)
          }
          ask(); return
        } else {
          rl.pause();
          select({
            message: 'Select a model provider:',
            choices: [
              { name: 'Auto (Cascade fallbacks)', value: 'auto' },
              { name: 'Groq (Llama 3)', value: 'groq' },
              { name: 'Gemini (Flash)', value: 'gemini' },
              { name: 'Ollama (Local Models)', value: 'ollama' },
              { name: 'HuggingFace (Llama 3 8B)', value: 'huggingface' },
              { name: 'Kimi (Moonshot k3 / v3)', value: 'kimi' },
              { name: 'Qwen (DashScope)', value: 'qwen' },
              { name: 'DeepSeek (Coder)', value: 'deepseek' },
              { name: 'Cerebras (Fast)', value: 'cerebras' },
              { name: 'GLM (Zhipu)', value: 'glm' },
              { name: 'LLM7 (Community)', value: 'llm7' }
            ]
          }).then((answer) => {
            currentModel = answer;
            console.log(`\\n${c.green}✓ Switched to ${answer}${c.reset}\\n`);
            rl.resume();
            ask();
          }).catch(() => {
            rl.resume();
            ask();
          });
          return;
        }
      }"""
content = content.replace(model_cmd_search, model_cmd_replace)

# Add spinner for chat
chat_search = """      try {
        for await (const chunk of router.chat(history, { model: currentModel })) {"""
chat_replace = """      try {
        let spinnerTimer: NodeJS.Timeout | undefined;
        let spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        let spinnerIdx = 0;
        process.stdout.write('\\x1B[?25l');
        spinnerTimer = setInterval(() => {
          process.stdout.write(`\\r\\x1b[36m${spinnerFrames[spinnerIdx++ % spinnerFrames.length]}\\x1b[0m Thinking...`);
        }, 80);

        let firstToken = true;
        for await (const chunk of router.chat(history, { model: currentModel })) {
          if (firstToken) {
            if (spinnerTimer) {
              clearInterval(spinnerTimer);
              spinnerTimer = undefined;
              process.stdout.write('\\r\\x1b[K\\x1B[?25h');
            }
            firstToken = false;
          }"""
content = content.replace(chat_search, chat_replace)

err_search = """      } catch (err) {"""
err_replace = """      } catch (err) {
        process.stdout.write('\\r\\x1b[K\\x1B[?25h');"""
content = content.replace(err_search, err_replace)

# Update Kimi help text
content = content.replace("kimi         Moonshot API (supports k3, k2.6)", "kimi         Moonshot API (uses k3 by default)")

with open('src/cli.ts', 'w') as f:
    f.write(content)
