# Deploying "The Move" to Vercel

This guide walks you through deploying your React + Vite app to Vercel with Firebase integration.

> **📝 Environment Variables**: This app uses environment variables for Firebase configuration. See `ENV_SETUP.md` for detailed setup instructions.

## Prerequisites

1. **GitHub Account**: Your code should be in a GitHub repository
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com) (free tier available)
3. **Node.js**: Ensure you have Node 22+ installed locally
4. **Firebase Project**: Your Firebase project should be set up with the config from `docs/app-vision.md`

## Step 1: Prepare Your Code

### 1.1 Ensure Firebase is Set Up

Make sure you have:
- `src/firebase.ts` with Firebase initialization (already created)
- Firebase SDK installed: `npm install firebase` (already installed)

### 1.1.1 Set Up Local Environment Variables

For local development, create a `.env.local` file in the root directory:

```bash
# Copy the example file
cp .env.example .env.local
```

Then edit `.env.local` with your Firebase credentials from `docs/app-vision.md`:

```env
VITE_FIREBASE_API_KEY=AIzaSyARVoyxlPtP5ls5N6oSndCFLNQb89gkQ_g
VITE_FIREBASE_AUTH_DOMAIN=teamred-themove.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=teamred-themove
VITE_FIREBASE_STORAGE_BUCKET=teamred-themove.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=457325441176
VITE_FIREBASE_APP_ID=1:457325441176:web:cafffe17a364ab28aa60ed
```

**Note:** `.env.local` is already in `.gitignore` and will not be committed to git.

### 1.2 Test Build Locally

Before deploying, ensure your app builds successfully:

```bash
npm run build
```

This should create a `dist` folder with your production build. If there are any errors, fix them first.

### 1.3 Commit and Push to GitHub

Make sure all your changes are committed and pushed to GitHub:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

## Step 2: Deploy to Vercel

You have two options: **GitHub Integration** (recommended) or **Vercel CLI**.

### Option A: GitHub Integration (Recommended)

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with your GitHub account

2. **Import Your Project**
   - Click "Add New..." → "Project"
   - Select your GitHub repository (`Team_Red_The_Move`)
   - Click "Import"

3. **Configure Project Settings**
   Vercel should auto-detect your Vite project, but verify:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Environment Variables** ⚠️ **REQUIRED**
   
   **Before deploying, you MUST add Firebase environment variables:**
   
   - Click on "Environment Variables" section
   - Add the following 6 variables (one at a time):
   
   | Variable Name | Value |
   |--------------|-------|
   | `VITE_FIREBASE_API_KEY` | `AIzaSyARVoyxlPtP5ls5N6oSndCFLNQb89gkQ_g` |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `teamred-themove.firebaseapp.com` |
   | `VITE_FIREBASE_PROJECT_ID` | `teamred-themove` |
   | `VITE_FIREBASE_STORAGE_BUCKET` | `teamred-themove.firebasestorage.app` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | `457325441176` |
   | `VITE_FIREBASE_APP_ID` | `1:457325441176:web:cafffe17a364ab28aa60ed` |
   
   - For each variable, select **all environments** (Production, Preview, Development)
   - Click "Save" after adding each variable

5. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete (usually 1-2 minutes)

6. **Access Your App**
   - Once deployed, Vercel will provide you with a URL like: `https://team-red-the-move.vercel.app`
   - Your app is now live!

### Option B: Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Set Environment Variables (CLI)**
   
   Before deploying, set environment variables using one of these methods:
   
   **Option 1: Interactive setup**
   ```bash
   vercel env add VITE_FIREBASE_API_KEY
   # Enter: AIzaSyARVoyxlPtP5ls5N6oSndCFLNQb89gkQ_g
   # Select: Production, Preview, Development (all)
   
   vercel env add VITE_FIREBASE_AUTH_DOMAIN
   # Enter: teamred-themove.firebaseapp.com
   
   vercel env add VITE_FIREBASE_PROJECT_ID
   # Enter: teamred-themove
   
   vercel env add VITE_FIREBASE_STORAGE_BUCKET
   # Enter: teamred-themove.firebasestorage.app
   
   vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
   # Enter: 457325441176
   
   vercel env add VITE_FIREBASE_APP_ID
   # Enter: 1:457325441176:web:cafffe17a364ab28aa60ed
   ```
   
   **Option 2: Use .env file** (recommended for first-time setup)
   - Create `.env.local` with your Firebase config (see Step 1.1.1)
   - Vercel CLI will prompt to link these during deployment

4. **Deploy**
   ```bash
   vercel
   ```
   - Follow the prompts:
     - Set up and deploy? **Yes**
     - Which scope? (select your account)
     - Link to existing project? **No** (first time) or **Yes** (subsequent deploys)
     - Project name? (press Enter for default)
     - Directory? `./` (press Enter)
     - Override settings? **No**
     - If prompted about environment variables, select **Yes** to link them

4. **Production Deploy**
   For production deployment:
   ```bash
   vercel --prod
   ```

## Step 3: Configure Custom Domain (Optional)

1. In Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

## Step 4: Set Up Automatic Deployments

With GitHub integration, Vercel automatically:
- Deploys on every push to `main` branch
- Creates preview deployments for pull requests
- Updates production on merge to `main`

## Step 5: Verify Firebase Configuration

After deployment, verify that:

1. **Firebase Config is Correct**
   - Check browser console for any Firebase errors
   - Ensure Firestore rules allow read/write operations

2. **Firestore Security Rules**
   Make sure your Firestore rules are configured. Example rules for development:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /moves/{moveId} {
         allow read: if true;
         allow write: if request.auth != null; // or adjust based on your auth needs
       }
     }
   }
   ```

3. **CORS Configuration**
   - Firebase should work out of the box with Vercel
   - If you encounter CORS issues, check Firebase console settings

## Troubleshooting

### Build Fails

- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify Node version (Vercel uses Node 20.x by default, but you can specify in `package.json`)

### Firebase Not Working

- Check browser console for errors
- Verify Firebase config matches `app-vision.md`
- Ensure Firestore is enabled in Firebase Console
- Check Firestore security rules

### Environment Variables

**If Firebase is not working after deployment:**

1. **Verify Environment Variables in Vercel:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Ensure all 6 Firebase variables are present:
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`
   - Make sure they're set for **all environments** (Production, Preview, Development)

2. **Redeploy after adding variables:**
   - After adding/updating environment variables, you must redeploy
   - Go to Deployments tab → Click "..." on latest deployment → "Redeploy"
   - Or push a new commit to trigger automatic redeploy

3. **Check build logs:**
   - If build fails with "Missing required Firebase environment variables", the variables weren't set correctly
   - Verify variable names match exactly (case-sensitive)

## Useful Commands

```bash
# Local development
npm run dev

# Build locally
npm run build

# Preview production build
npm run preview

# Deploy to Vercel (CLI)
vercel

# Deploy to production (CLI)
vercel --prod

# View deployment logs
vercel logs
```

## Next Steps

- Set up Firebase Authentication if needed
- Configure Firestore security rules for production
- Set up monitoring and analytics
- Configure custom domain
- Set up CI/CD workflows

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)

