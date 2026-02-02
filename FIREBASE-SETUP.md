# Firebase Setup for TSP Ideas Hub

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project**
3. Name it `tsp-ideas-hub`
4. Disable Google Analytics (not needed)
5. Click **Create project**

---

## Step 2: Enable Authentication

1. Go to **Build → Authentication**
2. Click **Get started**
3. Click **Email/Password**
4. Toggle **Enable** on
5. Click **Save**

---

## Step 3: Create Firestore Database

1. Go to **Build → Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode**
4. Select a location (e.g., `us-central`)
5. Click **Enable**

---

## Step 4: Get Your Config

1. Go to **Project Settings** (gear icon)
2. Scroll to **Your apps**
3. Click the **Web** icon (`</>`)
4. Register app as `tsp-web`
5. Copy the config object (replace placeholders with your values):

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "tsp-ideas-hub.firebaseapp.com",
  projectId: "tsp-ideas-hub",
  storageBucket: "tsp-ideas-hub.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

**Note:** Do not commit real API keys to the repo. The app uses the compat SDK; paste your values into `tsp-ideas-hub-firebase.html` and `public/index.html` (see Step 5).

---

## Step 5: Add Config to App

1. Open `tsp-ideas-hub-firebase.html` and `public/index.html` (both are the same app; the latter is what gets deployed).
2. Find the `firebaseConfig` object near the top of each file.
3. Replace placeholder values with YOUR values from Step 4.
4. Save both files (or copy from one to the other).

---

## Step 6: Test It!

1. Open the HTML file in your browser
2. Create an account (pick Executive Director to test all features)
3. Submit an idea
4. Open in another browser → create 2nd user → second the idea
5. Watch real-time updates! ✨

---

## Step 7: Deploy Firestore Rules (and Hosting)

From the project root, deploy rules and the app:

```bash
firebase deploy
```

This deploys Firestore rules from `firestore.rules`, Storage rules, and the web app from the `public` folder. Your app will be live at `https://tsp-ideas-hub.web.app` (or your project’s hosting URL).

To deploy only Firestore rules: `firebase deploy --only firestore`

---

## Step 8: Security Rules in Console (Alternative)

You can also manage rules in the Firebase Console. Go to **Firestore Database → Rules** and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /ideas/{ideaId} {
      allow read, write: if request.auth != null;
    }
    match /appeals/{appealId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Click **Publish**.

---

## Optional: First-time Firebase CLI

If you haven’t used Firebase CLI yet:

```bash
npm install -g firebase-tools
firebase login
```

Hosting is already configured in `firebase.json`; run `firebase deploy` to publish the app and rules. You’ll get: `https://tsp-ideas-hub.web.app`

---

## Quick Reference

| What | Where |
|------|-------|
| Firebase Console | console.firebase.google.com |
| Your config | Project Settings → Your apps |
| Auth settings | Build → Authentication |
| Database | Build → Firestore Database |
| Security rules | Firestore → Rules tab |

Takes ~5 minutes to set up!
