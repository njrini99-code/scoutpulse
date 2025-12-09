# Quick Start Guide

## Step 1: Install Dependencies

First, make sure you have Node.js installed (version 18 or higher). Then run:

```bash
npm install
```

This will install all the required packages. It may take a few minutes.

## Step 2: Start the Development Server

Once dependencies are installed, run:

```bash
npm run dev
```

You should see output like:
```
▲ Next.js 14.2.5
- Local:        http://localhost:3000
- ready started server on 0.0.0.0:3000
```

## Step 3: Open Your Browser

Visit: **http://localhost:3000**

## Step 4: Test Database Connection

Visit: **http://localhost:3000/test-db**

This will verify your database is connected and working.

## Common Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type check (verify TypeScript)
npm run typecheck

# Lint code
npm run lint
```

## Troubleshooting

### "command not found: npm"
- Install Node.js from https://nodejs.org (version 18+)
- Or use `nvm` to manage Node versions

### "Cannot find module"
- Run `npm install` again
- Delete `node_modules` and `.next` folders, then reinstall

### Port 3000 already in use
- Kill the process using port 3000
- Or run: `npm run dev -- -p 3001` to use a different port

### Environment variables not working
- Make sure `.env.local` exists in the project root
- Restart the dev server after changing `.env.local`

