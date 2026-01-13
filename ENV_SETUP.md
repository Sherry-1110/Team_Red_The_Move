# Environment Variables Setup

This app uses environment variables to securely store Firebase configuration credentials.

## Required Environment Variables

The following environment variables are required for the app to work:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Local Development Setup

1. **Create `.env.local` file** in the root directory:

```bash
touch .env.local
```

2. **Add your Firebase credentials** to `.env.local`:

Get your Firebase credentials from: **Firebase Console → Project Settings → General → Your apps**

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

3. **Restart your dev server** if it's already running:

```bash
npm run dev
```

**Note:** The `.env.local` file is already in `.gitignore` and will not be committed to git.

## Vercel Deployment Setup

See `DEPLOYMENT.md` for detailed instructions on setting environment variables in Vercel.

### Quick Reference

In Vercel Dashboard → Your Project → Settings → Environment Variables, add:

| Variable Name | Value (from Firebase Console) |
|--------------|------------------------------|
| `VITE_FIREBASE_API_KEY` | Your Firebase API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `your-project-id.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Your Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | `your-project-id.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Your Firebase App ID |

**Get these values from:** Firebase Console → Project Settings → General → Your apps

Make sure to select **all environments** (Production, Preview, Development) for each variable.

## Why Environment Variables?

- **Security**: Keeps credentials out of your source code
- **Flexibility**: Easy to use different configs for dev/staging/production
- **Best Practice**: Industry standard for managing sensitive configuration

## Troubleshooting

### "Missing required Firebase environment variables" Error

This means one or more environment variables are not set. Check:

1. **Local**: Ensure `.env.local` exists and has all 6 variables
2. **Vercel**: Go to Settings → Environment Variables and verify all are present
3. **Restart**: After adding variables, restart dev server or redeploy on Vercel

### Variables Not Loading

- Vite requires the `VITE_` prefix for environment variables to be exposed to the client
- Make sure variable names start with `VITE_`
- Restart the dev server after creating/updating `.env.local`


