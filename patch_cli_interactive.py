import re

with open('src/cli.ts', 'r') as f:
    content = f.read()

# Add import for inquirer
content = content.replace("import * as readline from 'readline'", "import * as readline from 'readline'\nimport { select } from '@inquirer/prompts'")

# Replace the /model command handling
model_search = r"case '/model':\n\s*if \(args\[0\]\) \{[\s\S]*?return true"
model_replace = """case '/model':
        if (args[0]) {
          options.model = args[0]
          console.log(`Switched to ${args[0]}`)
        } else {
          // Pause readline to allow inquirer to take over
          rl.pause();
          const answer = await select({
            message: 'Select a model provider:',
            choices: [
              { name: 'Auto (Cascade fallbacks)', value: 'auto' },
              { name: 'Groq (Llama 3)', value: 'groq' },
              { name: 'Gemini (Flash)', value: 'gemini' },
              { name: 'Ollama (Local Models)', value: 'ollama' },
              { name: 'HuggingFace (Llama 3 8B)', value: 'huggingface' },
              { name: 'Kimi (Moonshot)', value: 'kimi' },
              { name: 'Qwen (DashScope)', value: 'qwen' },
              { name: 'DeepSeek (Coder)', value: 'deepseek' },
              { name: 'Cerebras (Fast)', value: 'cerebras' },
              { name: 'GLM (Zhipu)', value: 'glm' },
              { name: 'LLM7 (Community)', value: 'llm7' }
            ]
          });
          options.model = answer;
          console.log(`\\n✓ Switched to ${answer}\\n`);
          rl.resume();
        }
        return true"""
content = re.sub(model_search, model_replace, content)

# Remove the massive dump of models from /help
help_search = r"Providers:[\s\S]*?community-run\)"
help_replace = "Tip: Type /model to open the interactive provider menu!"
content = re.sub(help_search, help_replace, content)

# Add a simple spinner for generation
# Find the fetching part:
fetch_search = r"const res = await fetch\('http://localhost:4141/v1/chat/completions', \{"
fetch_replace = """
      let spinnerTimer: NodeJS.Timeout;
      let spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
      let spinnerIdx = 0;
      process.stdout.write('\\x1B[?25l'); // hide cursor
      spinnerTimer = setInterval(() => {
        process.stdout.write(`\\r\\x1b[36m${spinnerFrames[spinnerIdx++ % spinnerFrames.length]}\\x1b[0m Thinking...`);
      }, 80);

      const res = await fetch('http://localhost:4141/v1/chat/completions', {"""
content = content.replace(fetch_search, fetch_replace)

# Stop spinner when first token arrives
first_token_search = r"if \(token\) process\.stdout\.write\(token\)"
first_token_replace = """if (token) {
                  if (spinnerTimer) {
                    clearInterval(spinnerTimer);
                    spinnerTimer = null as any;
                    process.stdout.write('\\r\\x1b[K'); // clear spinner line
                    process.stdout.write('\\x1B[?25h'); // show cursor
                  }
                  process.stdout.write(token)
                }"""
content = content.replace(first_token_search, first_token_replace)

# Handle errors stopping spinner
catch_search = r"\} catch \(err\) \{"
catch_replace = """} catch (err) {
      if (typeof spinnerTimer !== 'undefined' && spinnerTimer) {
        clearInterval(spinnerTimer);
        process.stdout.write('\\r\\x1b[K\\x1B[?25h');
      }"""
content = content.replace(catch_search, catch_replace)

with open('src/cli.ts', 'w') as f:
    f.write(content)
