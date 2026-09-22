import re

with open('src/providers/base.ts', 'r') as f:
    content = f.read()

content = content.replace("export interface ChatOptions {", "export interface ChatOptions {\n  model?: string;")

with open('src/providers/base.ts', 'w') as f:
    f.write(content)
