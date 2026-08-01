#!/usr/bin/env python3
import subprocess, os
fd = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend")
print("\nFlowMind AI v3 - http://localhost:5173\n")
subprocess.run("npx vite --host", shell=True, cwd=fd)
