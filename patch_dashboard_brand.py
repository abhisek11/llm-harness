import re

with open('dashboard/src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("TOPI HARNESS_OUTPUT_SHAPER", "TOPI_OUTPUT_SHAPER")
content = content.replace("headroom learn --verbosity --apply", "topi learn --verbosity --apply")

with open('dashboard/src/App.tsx', 'w') as f:
    f.write(content)

with open('dashboard/index.html', 'r') as f:
    html = f.read()
    
html = html.replace("<title>dashboard</title>", "<title>Topi Harness</title>")

with open('dashboard/index.html', 'w') as f:
    f.write(html)
