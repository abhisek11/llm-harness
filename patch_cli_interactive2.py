import re

with open('src/cli.ts', 'r') as f:
    content = f.read()

# Make /model interactive if no name is provided
model_cmd_search = r"if \(line\.startsWith\('/model '\)\) \{[\s\S]*?ask\(\); return\n      \}"
model_cmd_replace = """if (line.startsWith('/model')) {
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
          // Interactive selection
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
content = re.sub(model_cmd_search, model_cmd_replace, content)

# Add spinner for chat
chat_search = r"try \{\n\s*for await \(const chunk of router\.chat\(history, \{ model: currentModel \}\)\) \{"
chat_replace = """try {
        let spinnerTimer: NodeJS.Timeout | undefined;
        let spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        let spinnerIdx = 0;
        process.stdout.write('\\x1B[?25l'); // hide cursor
        spinnerTimer = setInterval(() => {
          process.stdout.write(`\\r\\x1b[36m${spinnerFrames[spinnerIdx++ % spinnerFrames.length]}\\x1b[0m Thinking...`);
        }, 80);

        let firstToken = true;

        for await (const chunk of router.chat(history, { model: currentModel })) {
          if (firstToken) {
            if (spinnerTimer) {
              clearInterval(spinnerTimer);
              spinnerTimer = undefined;
              process.stdout.write('\\r\\x1b[K\\x1B[?25h'); // clear line & show cursor
            }
            firstToken = false;
          }
"""
content = re.sub(chat_search, chat_replace, content)

# handle error stop spinner
err_search = r"\} catch \(err\) \{"
err_replace = """} catch (err) {
        process.stdout.write('\\r\\x1b[K\\x1B[?25h'); // clear line & show cursor"""
content = re.sub(err_search, err_replace, content)

# Update Kimi help text
content = content.replace("kimi         Moonshot API (supports k3, k2.6)", "kimi         Moonshot API (uses k3 by default)")

with open('src/cli.ts', 'w') as f:
    f.write(content)
