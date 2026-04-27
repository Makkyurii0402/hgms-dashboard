import { useEffect, useRef, useCallback } from "react";
import { SensorData } from "./use-sensor-stream";
import { requestNotificationPermission, isNotificationSupported } from "../lib/firebase-messaging";

// Threshold values for hazardous gas levels
export interface AlertThresholds {
  oxygen: { min: number; max: number };
  co: { max: number };
  h2s: { max: number };
  methane: { max: number };
  temperature: { min: number; max: number };
  humidity: { min: number; max: number };
}

export const DEFAULT_THRESHOLDS: AlertThresholds = {
  oxygen: { min: 19.5, max: 23.5 }, // OSHA safe range
  co: { max: 35 }, // ppm
  h2s: { max: 10 }, // ppm
  methane: { max: 1000 }, // ppm (LEL)
  temperature: { min: -10, max: 50 }, // Celsius
  humidity: { min: 20, max: 80 }, // %
};

export interface Alert {
  sensor: string;
  value: number;
  threshold: number;
  type: "warning" | "critical";
  message: string;
}

export function useSensorAlerts(
  sensorData: SensorData | null,
  thresholds: AlertThresholds = DEFAULT_THRESHOLDS,
  onAlert?: (alert: Alert) => void
) {
  const lastAlertTime = useRef<Record<string, number>>({});
  const hasRequestedPermission = useRef(false);

  // Request notification permission on mount
  useEffect(() => {
    if (isNotificationSupported() && !hasRequestedPermission.current) {
      hasRequestedPermission.current = true;
      // Auto-request permission (optional - can be triggered by user action instead)
      // requestNotificationPermission();
    }
  }, []);

  const checkThresholds = useCallback((data: SensorData): Alert[] => {
    const alerts: Alert[] = [];
    const now = Date.now();
    const cooldownMs = 30000; // 30 seconds between same-type alerts

    // Check Oxygen
    if (data.oxygen < thresholds.oxygen.min) {
      const key = "oxygen_low";
      if (!lastAlertTime.current[key] || now - lastAlertTime.current[key] > cooldownMs) {
        alerts.push({
          sensor: "Oxygen",
          value: data.oxygen,
          threshold: thresholds.oxygen.min,
          type: "critical",
          message: `Oxygen level LOW: ${data.oxygen.toFixed(1)}% (min: ${thresholds.oxygen.min}%)`
        });
        lastAlertTime.current[key] = now;
      }
    } else if (data.oxygen > thresholds.oxygen.max) {
      const key = "oxygen_high";
      if (!lastAlertTime.current[key] || now - lastAlertTime.current[key] > cooldownMs) {
        alerts.push({
          sensor: "Oxygen",
          value: data.oxygen,
          threshold: thresholds.oxygen.max,
          type: "warning",
          message: `Oxygen level HIGH: ${data.oxygen.toFixed(1)}% (max: ${thresholds.oxygen.max}%)`
        });
        lastAlertTime.current[key] = now;
      }
    }

    // Check CO (Carbon Monoxide)
    if (data.co > thresholds.co.max) {
      const key = "co";
      if (!lastAlertTime.current[key] || now - lastAlertTime.current[key] > cooldownMs) {
        alerts.push({
          sensor: "CO",
          value: data.co,
          threshold: thresholds.co.max,
          type: data.co > thresholds.co.max * 2 ? "critical" : "warning",
          message: `Carbon Monoxide HIGH: ${data.co.toFixed(1)} ppm (max: ${thresholds.co.max} ppm)`
        });
        lastAlertTime.current[key] = now;
      }
    }

    // Check H2S (Hydrogen Sulfide)
    if (data.h2s > thresholds.h2s.max) {
      const key = "h2s";
      if (!lastAlertTime.current[key] || now - lastAlertTime.current[key] > cooldownMs) {
        alerts.push({
          sensor: "H2S",
          value: data.h2s,
          threshold: thresholds.h2s.max,
          type: "critical",
          message: `Hydrogen Sulfide HIGH: ${data.h2s.toFixed(1)} ppm (max: ${thresholds.h2s.max} ppm)`
        });
        lastAlertTime.current[key] = now;
      }
    }

    // Check Methane
    if (data.methane > thresholds.methane.max) {
      const key = "methane";
      if (!lastAlertTime.current[key] || now - lastAlertTime.current[key] > cooldownMs) {
        alerts.push({
          sensor: "Methane",
          value: data.methane,
          threshold: thresholds.methane.max,
          type: "critical",
          message: `Methane HIGH: ${data.methane.toFixed(1)} ppm (max: ${thresholds.methane.max} ppm)`
        });
        lastAlertTime.current[key] = now;
      }
    }

    // Check Temperature
    if (data.temperature < thresholds.temperature.min) {
      const key = "temp_low";
      if (!lastAlertTime.current[key] || now - lastAlertTime.current[key] > cooldownMs) {
        alerts.push({
          sensor: "Temperature",
          value: data.temperature,
          threshold: thresholds.temperature.min,
          type: "warning",
          message: `Temperature LOW: ${data.temperature.toFixed(1)}°C (min: ${thresholds.temperature.min}°C)`
        });
        lastAlertTime.current[key] = now;
      }
    } else if (data.temperature > thresholds.temperature.max) {
      const key = "temp_high";
      if (!lastAlertTime.current[key] || now - lastAlertTime.current[key] > cooldownMs) {
        alerts.push({
          sensor: "Temperature",
          value: data.temperature,
          threshold: thresholds.temperature.max,
          type: "critical",
          message: `Temperature HIGH: ${data.temperature.toFixed(1)}°C (max: ${thresholds.temperature.max}°C)`
        });
        lastAlertTime.current[key] = now;
      }
    }

    return alerts;
  }, [thresholds]);

  // Check thresholds whenever sensor data changes
  useEffect(() => {
    if (!sensorData) return;

    const alerts = checkThresholds(sensorData);
    
    alerts.forEach(alert => {
      // Call the callback if provided
      if (onAlert) {
        onAlert(alert);
      }

      // Show browser notification if permission granted
      if (Notification.permission === "granted") {
        new Notification(`⚠️ ${alert.sensor} Alert`, {
          body: alert.message,
          icon: "/favicon.ico",
          tag: alert.sensor,
          requireInteraction: alert.type === "critical"
        });
      }

      // Log to console
      if (alert.type === "critical") {
        console.error(`🚨 CRITICAL ALERT: ${alert.message}`);
      } else {
        console.warn(`⚠️ WARNING: ${alert.message}`);
      }
    });
  }, [sensorData, checkThresholds, onAlert]);

  return {
    checkThresholds,
    requestPermission: requestNotificationPermission,
    isSupported: isNotificationSupported()
  };
}