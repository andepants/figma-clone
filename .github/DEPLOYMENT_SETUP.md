# GitHub Actions Deployment Setup

This guide explains how to set up automated deployments to Firebase Hosting using GitHub Actions.

## Overview

Two workflows have been configured:

1. **deploy.yml** - Deploys to production (live) when code is pushed to `main` branch
2. **preview.yml** - Creates temporary preview channels for pull requests (expires in 7 days)

## Required Configuration

### 1. Create Firebase Service Account

You need to create a Firebase service account and add it as a GitHub secret:

```bash
# Login to Firebase (if not already logged in)
firebase login

# Create a service account key
firebase init hosting:github
```

This command will:
- Prompt you to authorize GitHub access
- Generate a Firebase service account
- Automatically create the `FIREBASE_SERVICE_ACCOUNT_COLLABCANVAS` secret in your GitHub repository

### 2. Manual Setup (Alternative)

If you prefer to set up manually:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (collabcanvas)
3. Go to Project Settings → Service Accounts
4. Click "Generate New Private Key"
5. Save the JSON file securely

Then add it to GitHub:

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `FIREBASE_SERVICE_ACCOUNT_COLLABCANVAS`
5. Value: Paste the entire JSON content
6. Click "Add secret"

### 3. Verify Configuration

The workflows expect:
- **Project ID**: `collabcanvas` (configured in deploy.yml and preview.yml)
- **Build output**: `dist` directory (configured in firebase.json)
- **Node version**: 20 (configured in both workflows)

## How It Works

### Production Deployment (deploy.yml)

Triggered when:
- Code is pushed to `main` branch
- Manually triggered via GitHub Actions UI

Steps:
1. Checks out code
2. Sets up Node.js 20
3. Installs dependencies (`npm ci`)
4. Builds project (`npm run build`)
5. Deploys to Firebase Hosting (live channel)

### Preview Deployment (preview.yml)

Triggered when:
- A pull request is opened, reopened, or updated
- Only for PRs from the same repository (not forks)

Steps:
1. Same build steps as production
2. Deploys to a temporary preview channel
3. Adds a comment to the PR with preview URL
4. Preview expires after 7 days

## Testing the Setup

### Test Production Deployment

1. Make a small change to the codebase
2. Commit and push to `main` branch
3. Go to GitHub Actions tab to watch the deployment
4. Verify the live site is updated

### Test Preview Deployment

1. Create a new branch
2. Make a small change
3. Open a pull request
4. GitHub Actions will deploy a preview and comment with the URL
5. Verify the preview works

## Troubleshooting

### Build Fails

- Check Node.js version matches (20)
- Verify all dependencies are in package.json
- Test build locally: `npm run build`

### Deployment Fails

- Verify Firebase service account secret is correctly configured
- Check project ID matches: `collabcanvas`
- Ensure Firebase Hosting is enabled for your project

### Preview Not Created

- Verify the PR is from the same repository (not a fork)
- Check if the workflow has permission to create comments
- Review the GitHub Actions logs for errors

## Manual Deployment

If you need to deploy manually:

```bash
npm run deploy
```

This will build and deploy to Firebase Hosting using your local Firebase CLI credentials.

## Security Notes

- Never commit the Firebase service account JSON file
- The `GITHUB_TOKEN` is automatically provided by GitHub Actions
- Preview channels are automatically deleted after 7 days
- Only maintainers with write access can trigger deployments
