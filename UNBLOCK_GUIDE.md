# FlowMind AI - Windows Unblock Guide

## Problem

Windows Defender SmartScreen may block `.bat` files downloaded from the internet.
This is normal Windows behavior — not a virus.

## Solution 1: Use Python Scripts Instead

```bash
python install.py
python start.py
```

## Solution 2: Unblock the .bat Files

1. **Right-click** the `.bat` file
2. Select **Properties**
3. Check the **"Unblock"** checkbox at the bottom (under Security)
4. Click **Apply** then **OK**
5. Double-click the file again

## Solution 3: Run via PowerShell

```powershell
# Install
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\INSTALL.bat

# Start
.\START.bat
```

## Solution 4: Manual Commands

```bash
# Install dependencies
cd frontend && npm install --legacy-peer-deps

# Start dev server
npm run dev
```

## Why Does This Happen?

Windows marks files downloaded from the internet with a "Zone.Identifier" alternate data stream.
This triggers SmartScreen warnings for executable files like `.bat`, `.exe`, `.ps1`.

## Is This Safe?

**Yes.** FlowMind AI is an open-source project with MIT license.
All code is visible and auditable on GitHub.
The installer only runs `npm install` — nothing else.
