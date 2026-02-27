## Packages
firebase | Required for Realtime Database connection
recharts | Required for sensor history visualization charts
date-fns | Required for timestamp formatting
lucide-react | Required for sensor icons

## Notes
- Firebase configuration relies on VITE_FIREBASE_* environment variables.
- If these variables are not present, the application will automatically fall back to a Mock Mode generating realistic localized data.
- The UI follows a high-contrast industrial dark theme designed for operations monitoring.
