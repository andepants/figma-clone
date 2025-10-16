# API Keys Setup Guide

Complete guide to setting up OpenAI and Anthropic API keys for the AI Canvas Agent.

---

## Overview

The AI Canvas Agent supports two LLM providers:
- **OpenAI (GPT-4o-mini)** - Recommended for development ($0.003/command)
- **Anthropic (Claude 3.5 Haiku)** - Recommended for production ($0.0012/command)

You can switch between providers via environment variable.

---

## Step 1: Get OpenAI API Key

### Create Account & Get Key

1. **Visit:** https://platform.openai.com/
2. **Sign up or log in** to your OpenAI account
3. **Add payment method:**
   - Navigate to: Settings → Billing → Payment methods
   - Add a credit/debit card
4. **Set spending limit (IMPORTANT):**
   - Go to: Settings → Limits → Monthly budget
   - Set limit: `$5-10` (plenty for development)
   - This prevents unexpected charges
5. **Create API key:**
   - Navigate to: API keys → Create new secret key
   - Name: `CollabCanvas Development`
   - **Copy the key immediately** (starts with `sk-proj-...` or `sk-...`)
   - Save it securely - you won't see it again!

### Cost Tips

- **GPT-4o-mini pricing:** ~$0.15 / 1M input tokens, ~$0.60 / 1M output tokens
- **Estimated cost:** ~$0.003 per AI command
- **$5 budget:** ~1,600 test commands (enough for 1-2 weeks of development)
- **Monitor usage:** Check dashboard at https://platform.openai.com/usage

---

## Step 2: Get Anthropic API Key

### Create Account & Get Key

1. **Visit:** https://console.anthropic.com/
2. **Sign up or log in** to your Anthropic account
3. **Add credits:**
   - Navigate to: Settings → Billing
   - Add $10-20 in credits (no recurring charge)
4. **Create API key:**
   - Go to: API Keys → Create Key
   - Name: `CollabCanvas Production`
   - **Copy the key** (starts with `sk-ant-...`)
   - Save it securely

### Cost Tips

- **Claude 3.5 Haiku pricing:** ~$0.80 / 1M input tokens, ~$4.00 / 1M output tokens
- **Estimated cost:** ~$0.0012 per AI command (60% cheaper than OpenAI)
- **$10 budget:** ~8,300 commands
- **Monitor usage:** Check console at https://console.anthropic.com/

---

## Step 3: Local Development Setup

### Configure `.env.local`

The template already exists at `/functions/.env.local`:

```bash
# Open the file
code functions/.env.local

# Or use any text editor:
nano functions/.env.local
```

**Fill in your actual keys:**

```bash
# AI Provider Configuration
# Use 'openai' for development/testing, 'anthropic' for production
AI_PROVIDER=openai

# OpenAI API Key
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-your-actual-openai-key-here

# Anthropic API Key (Claude)
# Get from: https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-your-actual-anthropic-key-here

# Optional: Model overrides (uncomment if needed)
# OPENAI_MODEL=gpt-4o-mini
# ANTHROPIC_MODEL=claude-3-5-haiku-20241022
```

### Security Check

✅ `.env.local` is already protected by `.gitignore` (pattern: `*.local`)

Verify it won't be committed:

```bash
git check-ignore functions/.env.local
# Should output: functions/.env.local
```

---

## Step 4: Test Local Setup

### Start Development Environment

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Firebase Emulators
firebase emulators:start
```

### Run Your First AI Command

1. Open app: http://localhost:5173
2. Create or open a canvas
3. Look for AI input panel (bottom center) or click sparkles icon (⌘K)
4. Type a command:
   ```
   Create a blue rectangle at 100, 100
   ```
5. Press Enter or click "Generate"

### Expected Behavior

- ⏳ **Loading:** Spinner appears in input
- 🎯 **Success:** Rectangle appears on canvas
- ✅ **Confirmation:** Success message in command history
- 📊 **Logs:** Check Firebase emulator terminal for:
  ```
  ✓ Processing AI command
  ✓ Invoking AI chain (provider: openai, model: gpt-4o-mini)
  ✓ AI chain completed (responseTime: 1234ms)
  ```

### Troubleshooting

**Error: "OPENAI_API_KEY environment variable is not set"**
- Check `.env.local` exists in `/functions/` directory
- Verify key is correctly pasted (no extra spaces)
- Restart Firebase emulators

**Error: "Invalid API key"**
- Verify key starts with `sk-proj-` or `sk-` (OpenAI) or `sk-ant-` (Anthropic)
- Check key hasn't expired in API dashboard
- Generate new key if needed

**Slow responses (>10s)**
- Normal for first request (cold start)
- Subsequent requests should be <3s
- Check your internet connection

---

## Step 5: Production Deployment

### Option A: Environment Variables (Recommended for Cloud Run)

Set environment variables during Firebase Functions deployment:

```bash
cd functions

# Build first
npm run build

# Deploy with environment variables
firebase deploy --only functions \
  --set-env-vars \
  OPENAI_API_KEY=sk-proj-your-key,\
  ANTHROPIC_API_KEY=sk-ant-your-key,\
  AI_PROVIDER=anthropic
```

### Option B: Firebase Secrets (Most Secure)

Use Google Cloud Secret Manager for production:

```bash
# Set secrets (will prompt for values)
firebase functions:secrets:set OPENAI_API_KEY
# Paste your OpenAI key when prompted

firebase functions:secrets:set ANTHROPIC_API_KEY
# Paste your Anthropic key when prompted

firebase functions:secrets:set AI_PROVIDER
# Enter: anthropic

# List secrets
firebase functions:secrets:access

# Deploy
firebase deploy --only functions
```

**Note:** Secrets are already configured in the code (`functions/src/index.ts` lines 17-20).

---

## Step 6: Monitor Costs

### OpenAI Dashboard

1. Visit: https://platform.openai.com/usage
2. View: Daily token usage, costs by model
3. Set alerts: Settings → Limits → Email alerts

### Anthropic Console

1. Visit: https://console.anthropic.com/
2. View: Credit balance, usage by date
3. Top up when needed

### Firebase Analytics

Check AI usage logs in Firebase Console:

```
Database → analytics → ai-usage
```

Each log entry contains:
- Token counts (prompt, completion, total)
- Estimated cost
- Response time
- User ID, canvas ID
- Tools used
- Success/failure

---

## Provider Comparison

| Feature | OpenAI (GPT-4o-mini) | Anthropic (Claude 3.5 Haiku) |
|---------|---------------------|--------------------------|
| **Cost per command** | ~$0.003 | ~$0.0012 (60% cheaper) |
| **Speed** | ~1-2s | ~1-2s |
| **Tool calling** | Excellent | Excellent |
| **Recommended for** | Development | Production |
| **Rate limits** | 500 RPM | 1000 RPM |

---

## Switching Providers

### Local Development

Edit `functions/.env.local`:

```bash
# Use OpenAI
AI_PROVIDER=openai

# Use Anthropic
AI_PROVIDER=anthropic
```

Restart Firebase emulators for changes to take effect.

### Production

Update environment variable:

```bash
# If using environment variables
firebase deploy --only functions \
  --set-env-vars AI_PROVIDER=anthropic

# If using secrets
firebase functions:secrets:set AI_PROVIDER
# Enter: anthropic
firebase deploy --only functions
```

---

## Security Best Practices

### ✅ DO

- Store keys in `.env.local` (local) or Firebase Secrets (production)
- Set spending limits on API dashboards
- Monitor usage regularly
- Rotate keys every 3-6 months
- Use Anthropic for production (cheaper)

### ❌ DON'T

- Commit `.env.local` to git
- Share keys in Slack, Discord, etc.
- Hard-code keys in source files
- Use the same key for dev and production
- Expose keys in client-side code

---

## Estimated Costs

### Development (100 test commands)

- **OpenAI:** 100 × $0.003 = **$0.30**
- **Anthropic:** 100 × $0.0012 = **$0.12**

### Production (100 users, 50 commands/month each)

- **Total commands:** 5,000/month
- **OpenAI:** 5,000 × $0.003 = **$15/month**
- **Anthropic:** 5,000 × $0.0012 = **$6/month**

### With Context Optimization (Enabled)

- **Token reduction:** 80%
- **Cost reduction:** 80%
- **Anthropic (optimized):** **$1.20/month** for 5,000 commands

---

## Next Steps

After setup:

1. ✅ Test with simple commands ("Create a red circle")
2. ✅ Test with complex commands ("Create a login form")
3. ✅ Test with layout commands ("Arrange these in a row")
4. ✅ Monitor costs in API dashboards
5. ✅ Review analytics in Firebase Console

---

## Support

**OpenAI Issues:**
- Docs: https://platform.openai.com/docs
- Help: https://help.openai.com

**Anthropic Issues:**
- Docs: https://docs.anthropic.com
- Discord: https://discord.gg/anthropic

**Firebase Issues:**
- Docs: https://firebase.google.com/docs/functions
- Support: https://firebase.google.com/support
