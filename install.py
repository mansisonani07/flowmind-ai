#!/usr/bin/env python3
import subprocess, sys, os
def run(cmd, cwd=None):
    print(f"  Running: {cmd}")
    r = subprocess.run(cmd, shell=True, cwd=cwd)
    if r.returncode != 0: sys.exit(1)
    return r
def main():
    print("\nFlowMind AI v3 - Python Installer")
    try: run("node --version")
    except: print("ERROR: Node.js not found!"); sys.exit(1)
    fd = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend")
    run("npm install --legacy-peer-deps", cwd=fd)
    print("\nDone! Run: python start.py")
if __name__ == "__main__": main()
