# Focus Commitment

A soft-lock productivity tool that holds you in the void until your work is done.

## The Concept

Name your commitment. Set your threshold. Enter the void. The UI fades as you write, leaving nothing but your words floating in darkness. When you've done what you came to do, a subtle green glow acknowledges your achievement—but doesn't interrupt your flow.

## Features

- **Word-driven UI fade**: 5% opacity reduction per word written
- **Invisible writing container**: Your words float in pure void
- **Soft lock**: Cmd+Q, Cmd+W, and Escape are intercepted. Restart is your only escape hatch.
- **Flow-friendly completion**: Hit your threshold and keep going. The app won't interrupt.
- **Bonus tracking**: See how far you went beyond your goal
- **Easy export**: Copy your work with one click

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deploy to Vercel

### Option 1: Via Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Deploy
vercel
```

### Option 2: Via GitHub

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel auto-detects Vite—just click Deploy

### Option 3: Via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Drag and drop the project folder
3. Done

## Configuration

The app works out of the box. No environment variables needed.

## Tech Stack

- React 18
- Vite 5
- Vanilla CSS-in-JS (no external styling libraries)

## Philosophy

> "The void holds you until it's done."

This tool is a commitment device, not a prison. You opt in with intention. The app just holds you accountable to the decision you already made.

---

Built with focus.
