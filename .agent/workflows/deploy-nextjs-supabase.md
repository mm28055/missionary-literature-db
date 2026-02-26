---
description: Full workflow to build and deploy a Next.js + Supabase site to Vercel
---

# Next.js + Supabase + Vercel — Full Setup Guide

## Overview

This is the complete step-by-step process we used to go from zero to a live website.

**Tech Stack**: Next.js (frontend) + Supabase (database + auth) + Vercel (hosting)
**Cost**: Free tier for all three services
**Time**: ~30 minutes total

---

## Phase 1: Project Scaffolding (~5 min)

### 1.1 Initialize Git

```bash
cd your-project-folder
git init
```

### 1.2 Scaffold Next.js

```bash
npx -y create-next-app@latest ./ --js --app --src-dir --eslint --use-npm --no-tailwind --import-alias "@/*" --disable-git
```

> **Note**: If npm complains about the folder name (capitals, spaces), scaffold into a temp folder and move files:
> ```bash
> npx -y create-next-app@latest ./temp-scaffold --js --app --src-dir --eslint --use-npm --no-tailwind --import-alias "@/*" --disable-git
> # Then move contents from temp-scaffold to project root
> ```

### 1.3 Install Supabase

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### 1.4 Create `.gitignore`

Standard Next.js entries:
```
node_modules/
.next/
.env.local
.env*.local
```

### 1.5 Create `.env.local.example`

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## Phase 2: Supabase Setup (~5 min)

### 2.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → Sign in
2. **Create a FREE organization** (not a Pro one — to avoid $10/month per project)
3. Click **"New Project"** under the free org
4. Fill in:
   - **Name**: your project name
   - **Password**: strong password (save it!)
   - **Region**: closest to you (e.g., South Asia Mumbai)
5. Wait for green "Healthy" status (~2 min)

### 2.2 Run Your SQL Migration

1. In Supabase left sidebar → **SQL Editor**
2. Click **"New query"**
3. Paste your SQL schema (tables, indexes, RLS policies, seed data)
4. Click **"Run"** → should say "Success"

### 2.3 Create Admin User

1. Left sidebar → **Authentication**
2. Click **"Add user"** → **"Create new user"**
3. Fill in email + password
4. ✅ Check **"Auto Confirm User"**
5. Click **"Create user"**

### 2.4 Get API Keys

1. Left sidebar → **Settings** (gear icon) → **API**
2. Copy two values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJ...` (long string)

### 2.5 Create `.env.local` in Your Project

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-full-key...
```

### 2.6 Test Locally

```bash
npm run dev
# Open http://localhost:3000
# Test login, admin panel, data entry
```

---

## Phase 3: GitHub Setup (~2 min)

### 3.1 Create GitHub Repository

1. Go to [github.com/new](https://github.com/new) (or under your org)
2. **Name**: your project name
3. **Private** ✅
4. **Don't** check any boxes (no README, .gitignore, license)
5. Click **"Create repository"**

### 3.2 Push Code

```bash
git add -A
git commit -m "Initial project setup"
git remote add origin https://github.com/YOUR-ORG/your-repo.git
git push -u origin master
```

> **Note**: If Git asks for identity:
> ```bash
> git config user.email "your@email.com"
> git config user.name "Your Name"
> ```

---

## Phase 4: Vercel Deployment (~3 min)

### 4.1 Connect to Vercel

1. Go to [vercel.com](https://vercel.com) → Sign in with GitHub
2. Click **"Add New Project"**
3. Select your repository from the list
4. Vercel auto-detects Next.js — keep defaults

> **If repo not found**: Go to GitHub → Settings → Applications → Vercel → Configure → add the repo to "Repository access"

### 4.2 Add Environment Variables

Before clicking Deploy, expand **"Environment Variables"** and add:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon key |

### 4.3 Deploy

Click **"Deploy"** → wait ~60 seconds → you get a live URL like `your-project.vercel.app`

🎉 **Site is live!**

---

## Daily Workflow (After Setup)

```
1. Tell the AI what to change
         ↓
2. Refresh localhost:3000 to see changes
         ↓
3. Happy? → AI runs: git add -A
                      git commit -m "description"
                      git push
         ↓
4. Vercel auto-deploys in ~60 seconds
         ↓
5. Live site is updated ✅
```

### Key Rules

- **Saving a file** → only affects `localhost` (instant, auto-refreshes)
- **git commit** → saves snapshot locally (nothing goes live)
- **git push** → sends to GitHub → Vercel deploys → live site updates
- **Database changes** (adding data via admin) → shared between local and live (same Supabase DB)

---

## Cost Summary

| Service | Free Tier Includes |
|---------|-------------------|
| **Supabase** | 500MB database, 50K monthly users, unlimited API |
| **Vercel** | 100GB bandwidth, unlimited deploys, SSL included |
| **GitHub** | Unlimited private repos |

---

## Troubleshooting

| Problem | Solution |
|---------|---------|
| `Port 3000 in use` | Kill the other process or use port 3001 |
| Hydration error in browser | Usually a browser extension — test in Incognito |
| `Could not access repository` in Vercel | GitHub → Settings → Applications → Vercel → Configure → add repo |
| Supabase "not configured" error | Check `.env.local` has correct URL and key |
| Build fails on `useSearchParams` | Wrap component in `<Suspense>` boundary |
