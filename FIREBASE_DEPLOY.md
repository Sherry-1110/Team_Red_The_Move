# Firebase Hosting Deployment Guide

## Current Status
✅ Configuration files are set up correctly:
- `firebase.json` - Points to `dist` directory
- `.firebaserc` - Project ID: `teamred-themove`
- `dist/` folder - Contains built files

## Issue: "Site Not Found"
This error means Firebase Hosting hasn't been initialized or the deployment didn't complete.

## Solution: Initialize and Deploy

### Step 1: Login to Firebase (if not already)
```bash
firebase login
```

### Step 2: Initialize Firebase Hosting
```bash
firebase init hosting
```

**When prompted, answer:**
1. **"What do you want to use as your public directory?"** → Type: `dist` (press Enter)
2. **"Configure as a single-page app (rewrite all urls to /index.html)?"** → Type: `Yes` (or `y`)
3. **"Set up automatic builds and deploys with GitHub?"** → Type: `No` (or `n`)
4. **"File dist/index.html already exists. Overwrite?"** → Type: `No` (or `n`)

### Step 3: Verify Build
```bash
npm run build
```

Verify the `dist` folder has files:
```bash
ls -la dist/
```

You should see:
- `index.html`
- `assets/` folder with CSS and JS files
- `robots.txt`

### Step 4: Deploy
```bash
firebase deploy --only hosting
```

**Expected output:**
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/teamred-themove/overview
Hosting URL: https://teamred-themove.web.app
```

### Step 5: Verify Deployment
Visit the Hosting URL provided in the output, or check:
- `https://teamred-themove.web.app`
- `https://teamred-themove.firebaseapp.com`

## Troubleshooting

### If `firebase init hosting` fails:
- Make sure you're logged in: `firebase login`
- Check your project ID: `firebase projects:list`
- Verify project access: `firebase use teamred-themove`

### If deployment fails:
- Check build output: `npm run build`
- Verify `dist` folder exists and has files
- Check Firebase Console → Hosting for errors

### If site still shows "Site Not Found":
1. Wait 1-2 minutes (deployment can take time to propagate)
2. Check Firebase Console → Hosting → Deployments
3. Verify the latest deployment shows files were uploaded
4. Try hard refresh (Ctrl+F5 or Cmd+Shift+R)

## Quick Deploy Command
Once initialized, you can deploy anytime with:
```bash
npm run build && firebase deploy --only hosting
```




