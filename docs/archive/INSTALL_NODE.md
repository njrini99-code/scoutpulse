# Installing Node.js for macOS 11.6 (Big Sur)

You're running macOS 11.6, but the Node.js you downloaded was built for a newer macOS version. Here's how to fix it:

## Option 1: Use NVM (Recommended - Best Solution)

NVM (Node Version Manager) lets you install and switch between Node.js versions easily.

### Install NVM:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

Then restart your terminal or run:
```bash
source ~/.zshrc
```

### Install Node.js with NVM:

```bash
# Install Node.js 18 (LTS version)
nvm install 18

# Use it
nvm use 18

# Verify
node --version
npm --version
```

## Option 2: Download Compatible Node.js

1. Go to: https://nodejs.org/en/download/
2. Download the **macOS Installer (.pkg)** for **macOS 64-bit**
3. Make sure to download a version that supports macOS 11.6
4. Install the .pkg file
5. Restart your terminal

## Option 3: Use Homebrew (if you have it)

```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node@18

# Link it
brew link node@18
```

## Verify Installation

After installing, verify it works:

```bash
node --version
npm --version
```

You should see version numbers (like `v18.x.x` and `9.x.x`).

## Then Continue Setup

Once Node.js is working:

```bash
# Navigate to your project
cd /Users/ricknini/scoutpulse

# Install dependencies
npm install

# Start dev server
npm run dev
```

## Troubleshooting

### "command not found: nvm"
- Make sure you ran `source ~/.zshrc` after installing nvm
- Or restart your terminal

### Still getting errors
- Try restarting your computer
- Make sure you completely uninstalled the old Node.js first

