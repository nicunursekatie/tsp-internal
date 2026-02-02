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
5. Copy the config object:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "tsp-ideas-hub.firebaseapp.com",
  projectId: "tsp-ideas-hub",
  storageBucket: "tsp-ideas-hub.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## Step 5: Add Config to App

1. Open `tsp-ideas-hub-firebase.html`
2. Find this section near the top:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  ...
};
```

3. Replace with YOUR values from Step 4
4. Save

---

## Step 6: Test It!

1. Open the HTML file in your browser
2. Create an account (pick Executive Director to test all features)
3. Submit an idea
4. Open in another browser → create 2nd user → second the idea
5. Watch real-time updates! ✨

---

## Step 7: Security Rules (Before Sharing)

Go to **Firestore Database → Rules** and paste:

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

## Optional: Host on Firebase (Free URL)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

You'll get: `https://tsp-ideas-hub.web.app`

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
