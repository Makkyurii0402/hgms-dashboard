import { useState, useEffect, useRef } from "react";
import { ref, onValue, off } from "firebase/database";
import { db, isMockMode } from "../lib/firebase";

export interface SensorData {
  oxygen: number;
  co: number;
  h2s: number;
  methane: number;
  temperature: number;
  humidity: number;
  timestamp: number;
}

const MAX_HISTORY_POINTS = 50;

// Helper to generate realistic wandering mock data
const generateMockData = (prev: SensorData | null): SensorData => {
  const now = Date.now();
  if (!prev) {
    return {
      oxygen: 20.9,
      co: 0,
      h2s: 0,
      methane: 0,
      temperature: 22.5,
      humidity: 45.0,
      timestamp: now,
    };
  }

  // Drift variables slightly to simulate real sensors
  const drift = (val: number, maxDrift: number, min: number, max: number) => {
    const change = (Math.random() - 0.5) * maxDrift;
    let newVal = val + change;
    if (newVal < min) newVal = min;
    if (newVal > max) newVal = max;
    return newVal;
  };

  // Occasionally spike gases to trigger warnings
  const spikeChance = Math.random();
  const co = spikeChance > 0.95 ? drift(prev.co, 20, 0, 100) : drift(prev.co, 2, 0, 10);
  const h2s = spikeChance > 0.98 ? drift(prev.h2s, 5, 0, 15) : drift(prev.h2s, 0.5, 0, 2);

  return {
    oxygen: drift(prev.oxygen, 0.1, 17, 22),
    co: Math.max(0, co),
    h2s: Math.max(0, h2s),
    methane: drift(prev.methane, 0.1, 0, 3),
    temperature: drift(prev.temperature, 0.5, -10, 50),
    humidity: drift(prev.humidity, 1.0, 0, 100),
    timestamp: now,
  };
};

export function useSensorStream() {
  const [latest, setLatest] = useState<SensorData | null>(null);
  const [history, setHistory] = useState<SensorData[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  // Use a ref to keep track of the latest data for mock generation without triggering re-renders
  const latestRef = useRef<SensorData | null>(null);

  useEffect(() => {
    if (isMockMode || !db) {
      setIsConnected(true); // Mock is always "connected"
      
      const interval = setInterval(() => {
        const newData = generateMockData(latestRef.current);
        latestRef.current = newData;
        
        setLatest(newData);
        setHistory(prev => {
          const newHistory = [...prev, newData];
          if (newHistory.length > MAX_HISTORY_POINTS) {
            return newHistory.slice(newHistory.length - MAX_HISTORY_POINTS);
          }
          return newHistory;
        });
      }, 2000); // 2 second update rate
      
      return () => clearInterval(interval);
    }

    // Firebase Realtime connection
    const sensorsRef = ref(db, 'sensors/latest');
    
    // We can also listen to .info/connected to show connection status
    const connectedRef = ref(db, ".info/connected");
    const unsubConnected = onValue(connectedRef, (snap) => {
      setIsConnected(snap.val() === true);
    });

    const unsubSensors = onValue(sensorsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Ensure timestamp exists, fallback to local time if not provided by hardware
        const validData: SensorData = {
          ...data,
          timestamp: data.timestamp || Date.now()
        };
        
        setLatest(validData);
        setHistory(prev => {
          const newHistory = [...prev, validData];
          if (newHistory.length > MAX_HISTORY_POINTS) {
            return newHistory.slice(newHistory.length - MAX_HISTORY_POINTS);
          }
          return newHistory;
        });
      }
    }, (error) => {
      console.error("Firebase read error:", error);
      setIsConnected(false);
    });

    return () => {
      unsubConnected();
      unsubSensors();
    };
  }, []);

  return { latest, history, isMockMode, isConnected };
}
