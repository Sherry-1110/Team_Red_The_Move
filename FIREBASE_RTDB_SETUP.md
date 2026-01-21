# Firebase Realtime Database Setup for Saved Moves

## Overview
The "Saved Moves" feature stores user-specific saved move IDs in Firebase Realtime Database under `users/{uid}/savedMoves/{moveId}`.

## Firebase Rules Configuration

You need to set up Firebase Realtime Database rules to allow users to read and write their own saved moves.

### Step 1: Access Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `teamred-themove`
3. Go to **Realtime Database** in the left menu
4. Click on the **Rules** tab

### Step 2: Add These Rules

Replace the existing rules with the following:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth.uid === $uid",
        ".write": "auth.uid === $uid",
        "savedMoves": {
          "$moveId": {
            ".validate": "newData.val() === true"
          }
        }
      }
    },
    ".read": false,
    ".write": false
  }
}
```

### Step 3: Publish Rules

Click the **Publish** button to save and deploy the rules.

## What These Rules Do

- **`.read: "auth.uid === $uid"`**: Users can only read their own data
- **`.write: "auth.uid === $uid"`**: Users can only write to their own data
- **`.validate: "newData.val() === true"`**: Only allows boolean `true` values to be stored as saved moves

## Testing with Mock User

For local development with a mock user, set this environment variable in `.env.local`:

```
VITE_USE_MOCK_USER=true
```

When using the mock user, you'll need either:
1. Rules that allow unauthenticated access, OR
2. Switch to real Firebase authentication for testing

## If Using Mock User with Unauthenticated Access

If you want to test with mock users without real Firebase auth, use these rules instead:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": true,
        ".write": true,
        "savedMoves": {
          "$moveId": {
            ".validate": "newData.val() === true"
          }
        }
      }
    }
  }
}
```

⚠️ **WARNING**: These rules allow anyone to read/write any user's data. Only use for development!

## Troubleshooting

### Console Errors: "Permission denied"
- Check that your Firebase rules are published
- Verify the user is authenticated (or using mock user if rules allow it)
- Check the Firebase console for rule violations

### Saved Moves Not Persisting
- Open browser DevTools (F12)
- Look at Console tab for error messages
- Check if "Setting up listener" log appears (indicating connection established)
- Verify Firebase rules are not blocking the write

### To Debug

Check browser console logs (F12 → Console tab):
- Look for "Setting up listener for user..." message
- Look for error messages like "Error toggling save..."
- Check for Firebase permission denied errors
