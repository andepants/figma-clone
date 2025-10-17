# Quick Start Checklist - AI Canvas Agent

Complete these steps to get the AI Canvas Agent running.

---

## Prerequisites

- [ ] Node.js 18+ installed
- [ ] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] Firebase project created (figma-clone-d33e3)
- [ ] Git repository cloned

---

## 1. Get API Keys (15 minutes)

### OpenAI (Development)

- [ ] Go to https://platform.openai.com/
- [ ] Sign up / log in
- [ ] Add payment method
- [ ] Set spending limit: **$5-10**
- [ ] Create API key: "CollabCanvas Development"
- [ ] Copy key (starts with `sk-proj-...`)

### Anthropic (Production - Optional)

- [ ] Go to https://console.anthropic.com/
- [ ] Sign up / log in
- [ ] Add $10-20 credits
- [ ] Create API key: "CollabCanvas Production"
- [ ] Copy key (starts with `sk-ant-...`)

---

## 2. Configure Local Environment (2 minutes)

- [ ] Open `functions/.env.local`
- [ ] Replace `OPENAI_API_KEY=...` with your actual key
- [ ] Replace `ANTHROPIC_API_KEY=...` with your actual key (optional)
- [ ] Set `AI_PROVIDER=openai` for development
- [ ] Save file

**Example:**
```bash
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-abc123...
ANTHROPIC_API_KEY=sk-ant-xyz789...
```

---

## 3. Install Dependencies (5 minutes)

```bash
# Root dependencies
npm install

# Functions dependencies
cd functions
npm install
cd ..
```

---

## 4. Build & Test (2 minutes)

```bash
# Build functions
cd functions
npm run build
cd ..

# Should see: "No errors" ✅
```

---

## 5. Start Development (1 minute)

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Firebase Emulators (in new terminal)
firebase emulators:start
```

**Expected output:**
```
✔ functions: Loaded functions definitions from source
✔ functions: processAICommand: http://localhost:5001/figma-clone-d33e3/us-central1/processAICommand
```

---

## 6. Test Your First Command (1 minute)

1. [ ] Open http://localhost:5173 in browser
2. [ ] Create or open a canvas
3. [ ] Look for AI input (bottom center) or click sparkles icon
4. [ ] Type: `Create a blue rectangle`
5. [ ] Press Enter

**Expected result:**
- ✅ Blue rectangle appears on canvas
- ✅ Success message in command history
- ✅ Logs in Firebase emulator terminal

---

## 7. Try More Commands (5 minutes)

Test these commands to verify everything works:

### Basic Creation
- [ ] `Create a red circle at 200, 200`
- [ ] `Create a green rectangle 100 by 50`
- [ ] `Create text that says "Hello World"`

### Manipulation
- [ ] `Move that rectangle to 300, 300`
- [ ] `Make the circle twice as big`
- [ ] `Rotate the text 45 degrees`
- [ ] `Change the color to purple`

### Layout
- [ ] Create 3 shapes, then: `Arrange these in a row`
- [ ] `Arrange them in a column`
- [ ] Create 6 shapes, then: `Arrange in a 3x2 grid`

### Complex
- [ ] `Create a login form`
- [ ] `Create a button with text "Click Me"`

---

## 8. Check Analytics (2 minutes)

1. [ ] Open Firebase Console: https://console.firebase.google.com/
2. [ ] Select project: **figma-clone-d33e3**
3. [ ] Go to: Realtime Database → Data → `analytics/ai-usage`
4. [ ] Verify log entries exist with:
   - Token counts
   - Response times
   - Tools used

---

## 9. Monitor Costs (2 minutes)

### OpenAI
- [ ] Go to: https://platform.openai.com/usage
- [ ] Verify usage appears (after ~5 min delay)
- [ ] Check estimated cost

**Expected:** ~$0.003 per command (very cheap!)

### Anthropic (if used)
- [ ] Go to: https://console.anthropic.com/
- [ ] Check credit balance

---

## 10. Production Deployment (Optional)

When ready to deploy:

### Set Production Secrets

```bash
# Set secrets
firebase functions:secrets:set OPENAI_API_KEY
# Paste your key

firebase functions:secrets:set ANTHROPIC_API_KEY
# Paste your key

firebase functions:secrets:set AI_PROVIDER
# Enter: anthropic
```

### Deploy

```bash
# Build
cd functions
npm run build

# Deploy
firebase deploy --only functions
```

---

## Troubleshooting

### "OPENAI_API_KEY is not set"

- [ ] Check `functions/.env.local` exists
- [ ] Verify key has no extra spaces
- [ ] Restart Firebase emulators

### "Invalid API key"

- [ ] Verify key format: `sk-proj-...` (OpenAI) or `sk-ant-...` (Anthropic)
- [ ] Check key in API dashboard
- [ ] Generate new key if needed

### "Too many AI commands"

- [ ] Rate limit: 10 commands per minute
- [ ] Wait 60 seconds and try again

### No rectangle appears

- [ ] Check browser console for errors
- [ ] Check Firebase emulator logs
- [ ] Verify canvas is open (not dashboard)
- [ ] Check internet connection

### Slow response (>10s)

- [ ] First request is slow (cold start) - normal!
- [ ] Subsequent requests should be <3s
- [ ] Check Firebase emulator logs for errors

---

## Cost Breakdown

### Development (you, 100 test commands)
- **Cost:** ~$0.30 (OpenAI) or ~$0.12 (Anthropic)

### Production (100 users, 50 commands each/month)
- **OpenAI:** $15/month
- **Anthropic:** $6/month
- **Anthropic (optimized):** $1.20/month ✨

**Context optimization** is enabled by default (80% cost reduction)

---

## Next Steps

After completing this checklist:

1. ✅ Read user guide: `_docs/features/ai-canvas-agent.md`
2. ✅ Read architecture: `_docs/architecture/ai-system.md`
3. ✅ Experiment with commands
4. ✅ Check analytics regularly
5. ✅ Deploy to production when ready

---

## Success Metrics

You'll know it's working when:

- ✅ Commands execute in <3 seconds
- ✅ Objects appear on canvas in real-time
- ✅ Complex commands work (login form, etc.)
- ✅ Cost is <$0.01 per command
- ✅ No errors in logs
- ✅ Analytics show token usage

---

## Support

- **Full setup guide:** `_docs/setup/api-keys.md`
- **User guide:** `_docs/features/ai-canvas-agent.md`
- **Developer docs:** `_docs/architecture/ai-system.md`
- **Implementation summary:** `_docs/archive/completed-plans/IMPLEMENTATION_COMPLETE.md`

---

**Estimated total time:** 35 minutes to full deployment 🚀
