import re

with open('src/cli.ts', 'r') as f:
    content = f.read()
content = content.replace("import 'dotenv/config'", "import * as dotenv from 'dotenv';\ndotenv.config({ override: true });")
with open('src/cli.ts', 'w') as f:
    f.write(content)

with open('src/server.ts', 'r') as f:
    content = f.read()
content = content.replace("import 'dotenv/config'", "import * as dotenv from 'dotenv';\ndotenv.config({ override: true });")
with open('src/server.ts', 'w') as f:
    f.write(content)
