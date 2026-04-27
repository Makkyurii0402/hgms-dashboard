import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";
import { app, isMockMode } from "./firebase";

let messaging: Messaging | null = null;

// Initialize messaging (only works with valid VAPID key)
export const initMessaging = (): Messaging | null => {
  if (isMockMode || !app) {
    console.log("FCM: Running in mock mode, messaging not initialized");
    return null;
  }

  try {
    messaging = getMessaging(app);
    console.log("FCM: Messaging initialized successfully");
    return messaging;
  } catch (error) {
    console.error("FCM: Failed to initialize messaging:", error);
    return null;
  }
};

// Request notification permission and get FCM token
export const requestNotificationPermission = async (): Promise<string | null> => {
  if (isMockMode) {
    console.log("FCM: Skipping permission request in mock mode");
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    
    if (permission !== "granted") {
      console.log("FCM: Notification permission denied");
      return null;
    }

    // Get VAPID key from environment
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    
    if (!vapidKey) {
      console.warn("FCM: VAPID key not configured. Set VITE_FIREBASE_VAPID_KEY in .env");
      return null;
    }

    if (!messaging) {
      messaging = initMessaging();
    }

    if (!messaging) {
      console.error("FCM: Messaging not available");
      return null;
    }

    const token = await getToken(messaging, { vapidKey });
    console.log("FCM: Got token:", token.substring(0, 20) + "...");
    return token;
  } catch (error) {
    console.error("FCM: Error getting notification permission:", error);
    return null;
  }
};

// Listen for foreground messages (when app is open)
export const onForegroundMessage = (callback: (payload: any) => void): (() => void) => {
  if (!messaging) {
    console.warn("FCM: Messaging not initialized, cannot listen for messages");
    return () => {};
  }

  const unsubscribe = onMessage(messaging, (payload) => {
    console.log("FCM: Foreground message received:", payload);
    callback(payload);
  });

  return unsubscribe;
};

// Check if notifications are supported
export const isNotificationSupported = (): boolean => {
  return "Notification" in window && "serviceWorker" in navigator;
};