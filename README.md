# ⚡ Soka AI — Production-Ready Multi-Model AI Assistant & 24/7 WhatsApp Bot Hub

Soka AI is a futuristic, full-stack, mobile-first AI application built with **React**, **Express**, **TypeScript**, **Tailwind CSS**, and **Framer Motion**. It features a multi-model AI router, document scanning (PDF OCR), visual artwork generation, language translation, and a 24/7 automated WhatsApp bot integration for group mentions.

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your keys:
```bash
cp .env.example .env
```

Set `GEMINI_API_KEY` with your key from Google AI Studio:
```env
GEMINI_API_KEY="AIzaSy..."
ADMIN_EMAIL="aki.sokpah.link@gmail.com"
WHATSAPP_BOT_NUMBER="+231889792996"
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Deployment to Render (Step-by-Step Guide)

You can deploy **Soka AI** directly to [Render](https://render.com) using GitHub.

### Architecture Overview
```
GitHub Repository (soka-ai)
      │
      ▼
Render Web Service (Full-Stack Express + React)
 ├── Next/Express Backend API & Multi-Model Router
 ├── PWA & Offline Support
 ├── Admin Command Center
 └── WhatsApp Bot Engine (+231889792996)
```

### Step 1: Push Code to GitHub
1. Create a new repository on GitHub named `soka-ai`.
2. Commit and push all files:
   ```bash
   git init
   git add .
   git commit -m "Initial Soka AI release"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/soka-ai.git
   git push -u origin main
   ```

### Step 2: Create a New Web Service on Render
1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** -> **Web Service**.
3. Connect your `soka-ai` GitHub repository.
4. Configure the Web Service settings:
   - **Name**: `soka-ai-app`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free / Starter

### Step 3: Add Environment Variables in Render
In Render Web Service settings, go to **Environment** and add the following keys:

| Environment Variable | Value Example | Description |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | `AIzaSy...` | Required for Gemini 3.6 Flash & Image generation |
| `ADMIN_EMAIL` | `aki.sokpah.link@gmail.com` | Unlocks Admin Command Center upon sign in |
| `WHATSAPP_BOT_NUMBER` | `+231889792996` | Target phone number for WhatsApp bot |
| `NODE_ENV` | `production` | Enables production static bundle serving |

### Step 4: Deploy Service
Click **Create Web Service**. Render will build the app using `esbuild` and deploy the full-stack service automatically!

---

## 📱 WhatsApp 24/7 Bot Connection (+231889792996)

Soka AI includes an Admin Command Center designed to link phone number **+231889792996** to run 24/7 as an AI bot.

### How to Connect:
1. Log in to Soka AI as an Admin using email `aki.sokpah.link@gmail.com`.
2. Click **Admin Hub** in the top navigation bar.
3. Open WhatsApp on the phone with number **+231889792996**.
4. Go to **Settings > Linked Devices > Link a Device**.
5. Scan the live **QR Code** displayed on the Admin Command Center dashboard.
6. The bot status will automatically switch to **SERVER ONLINE**.

### Group Mention Usage:
In any WhatsApp group, users can mention the bot to get instant AI answers:
```text
/@Soka AI Hi, summarize the main points of quantum computing
```
or
```text
@Soka AI write a python script for web scraping
```
The server automatically intercepts the group mention and replies directly with Soka AI multi-model responses!

---

## 📱 Installing on Android & iOS (PWA Support)

Soka AI is built as a Progressive Web App (PWA) with a custom service worker (`sw.js`) and web app manifest (`manifest.json`).

### On Android (Chrome / Brave / Edge):
1. Open the app URL in Chrome.
2. Tap the **"Install App"** button in the header or Chrome menu `⋮` -> **"Add to Home Screen"**.
3. Launch Soka AI as a standalone app!

### On iOS (Safari):
1. Open the app URL in Safari.
2. Tap the **Share** button `⎋` -> **"Add to Home Screen"**.

---

## 🛡️ Security & Privacy

- All API keys remain strictly on the Node/Express server side (`server.ts`).
- User authentication data and chat histories are stored locally per device.
- Deleting site stored data via **Settings > Delete Stored Site Data** completely purges all local storage and resets the app session cleanly.
