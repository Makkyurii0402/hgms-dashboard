import { initializeApp, FirebaseApp } from "firebase/app";
import { getDatabase, Database } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if we have the minimum required config to connect to RTDB
export const isMockMode = !firebaseConfig.databaseURL;

export let app: FirebaseApp | null = null;
export let db: Database | null = null;

console.log("Firebase Config:", firebaseConfig);
console.log("Is Mock Mode:", isMockMode);

if (!isMockMode) {
  console.log(firebaseConfig)
  try {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    console.log("Firebase initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Firebase, falling back to mock mode:", error);
  }
} else {
  console.log("Running in Mock Mode (Firebase environment variables missing)");
  console.log(firebaseConfig);
}
