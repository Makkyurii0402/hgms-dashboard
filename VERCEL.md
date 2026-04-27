# Vercel Deployment Guide

## Quick Deploy

Click the button below to deploy to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/sensor-dashboard)

Or use the CLI:

```bash
npm i -g vercel
vercel
```

## Environment Variables

In your Vercel project dashboard, add these environment variables:

| Variable | Description |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Your Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | e.g., `your-project.firebaseapp.com` |
| `VITE_FIREBASE_DATABASE_URL` | e.g., `https://your-project.firebaseio.com` |
| `VITE_FIREBASE_PROJECT_ID` | Your Firebase project ID |
| `VITE_FIREBASE_APP_ID` | Your Firebase app ID |

## How It Works

- **Frontend**: React app built with Vite, served as static files
- **Data**: Firebase Realtime Database (client connects directly)
- **No backend needed**: The app connects directly to Firebase from the browser

## Notes

- The app runs in "mock mode" if Firebase config is missing
- To use real sensor data, configure Firebase environment variables in Vercel