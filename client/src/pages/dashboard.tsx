import { Wind, Flame, Droplets, Thermometer, Droplet, Skull, Bell, BellOff } from "lucide-react";
import { format } from "date-fns";
import { useSensorStream } from "../hooks/use-sensor-stream";
import { useSensorAlerts, DEFAULT_THRESHOLDS, type Alert } from "../hooks/use-sensor-alerts";
import { requestNotificationPermission } from "../lib/firebase-messaging";
import { SensorCard } from "../components/sensor-card";
import { HistoryChart } from "../components/history-chart";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const { latest, history, isMockMode, isConnected } = useSensorStream();
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Set up sensor alerts
  useSensorAlerts(latest, DEFAULT_THRESHOLDS, (alert) => {
    setAlerts(prev => [alert, ...prev].slice(0, 1)); // Keep last 1 alert
  });

  // Auto-dismiss alerts after 10 seconds
  useEffect(() => {
    if (alerts.length === 0) return;
    
    const timer = setTimeout(() => {
      setAlerts(prev => prev.slice(1));
    }, 10000);

    return () => clearTimeout(timer);
  }, [alerts]);

  const handleEnableNotifications = async () => {
    await requestNotificationPermission();
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Top Warning Banner for Mock Mode */}
      {isMockMode && (
        <div className="bg-warning/10 border-b border-warning/20 text-warning px-4 py-2 text-center text-sm font-medium tracking-wide">
          <span className="inline-block w-2 h-2 rounded-full bg-warning mr-2 animate-pulse" />
          This mocked mode
        </div>
      )}

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight text-foreground flex items-center">
              <div className="p-1.5 bg-primary/10 rounded border border-primary/20 mr-3">
                <Wind className="w-5 h-5 text-primary" />
              </div>
              HAZARDOUS GAS MONITORING SYSTEM
            </h1>
            <p className="text-sm text-muted-foreground mt-1 font-mono tracking-wider">
              FACILITY_ALPHA_01 // SECURE_LINK
            </p>
          </div>
          
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Link Status</span>
              <div className={`px-2.5 py-1 rounded border text-xs font-bold uppercase tracking-wider flex items-center ${
                isConnected 
                  ? 'border-[#22c55e]/30 bg-[#22c55e]/10 text-[#22c55e] glow-safe' 
                  : 'border-[#e11d48]/50 bg-[#e11d48]/20 text-[#e11d48] glow-danger'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full mr-2 ${isConnected ? 'bg-[#22c55e]' : 'bg-[#e11d48]'}`} />
                {isConnected ? 'ONLINE' : 'OFFLINE'}
              </div>
            </div>
            {latest && (
              <p className="text-xs text-muted-foreground mt-1.5 font-mono">
                LAST_SYNC: {format(latest.timestamp, 'HH:mm:ss.SSS')}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-4 h-4 text-destructive" />
            <span className="font-semibold text-destructive">Active Alerts</span>
          </div>
          <div className="space-y-1">
            {alerts.map((alert, idx) => (
              <div key={idx} className={`text-sm ${alert.type === 'critical' ? 'text-destructive font-bold' : 'text-warning'}`}>
                {alert.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enable Notifications Button */}
      {Notification.permission === "default" && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellOff className="w-4 h-4 text-primary" />
            <span className="text-sm">Enable push notifications for alerts</span>
          </div>
          <button
            onClick={handleEnableNotifications}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
          >
            Enable Notifications
          </button>
        </div>
      )}

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-4">
        
        {/* Sensor Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <SensorCard
            title="Oxygen (O₂)"
            value={latest?.oxygen ?? 0}
            unit="%"
            icon={<Wind className="w-5 h-5" />}
            thresholds={{
              safe: (v) => v >= 20.6 && v <= 22.0,
              warning: (v) => (v >= 18 && v < 19.5) || (v > 23.5 && v <= 24),
            }}
          />
          <SensorCard
            title="Carbon Monoxide (CO)"
            value={latest?.co ?? 0}
            unit="ppm"
            decimals={0}
            icon={<Skull className="w-5 h-5" />}
            thresholds={{
              safe: (v) => v < 30,
              warning: (v) => v >= 30 && v <= 49,
            }}
          />
          <SensorCard
            title="Hydrogen Sulfide (H₂S)"
            value={latest?.h2s ?? 0}
            unit="%"
            decimals={1}
            icon={<Droplets className="w-5 h-5" />}
            thresholds={{
              safe: (v) => v < 15,
              warning: (v) => v >= 15 && v <= 29,
            }}
          />
          <SensorCard
            title="Combustible Gas"
            value={latest?.methane ?? 0}
            unit="%"
            decimals={2}
            icon={<Flame className="w-5 h-5" />}
            thresholds={{
              safe: (v) => v < 10,
              warning: (v) => v >= 10 && v <= 19,
            }}
          />
          <SensorCard
            title="Temperature"
            value={latest?.temperature ?? 0}
            unit="°C"
            decimals={1}
            icon={<Thermometer className="w-5 h-5" />}
            thresholds={{
              safe: (v) => v < 35,
              warning: (v) => v >= 35 && v <= 45,
            }}
          />
          <SensorCard
            title="Relative Humidity"
            value={latest?.humidity ?? 0}
            unit="%"
            decimals={1}
            icon={<Droplet className="w-5 h-5" />}
            thresholds={{
              safe: (v) => v < 100,
              warning: (v) => v >= 100,
            }}
          />
          
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <HistoryChart 
            title="Gas Concentrations telemetry"
            data={history}
            config={[
              { dataKey: 'oxygen', name: 'O₂ Level', color: '#0ea5e9', unit: '%' },
              { dataKey: 'co', name: 'CO Level', color: '#8b5cf6', unit: 'ppm' },
              { dataKey: 'h2s', name: 'H₂S Level', color: '#d946ef', unit: 'ppm' },
              { dataKey: 'methane', name: 'CH₄ Level', color: '#f97316', unit: '%' }
            ]}
          />
          
          <HistoryChart 
            title="Environmental telemetry"
            data={history}
            config={[
              { dataKey: 'temperature', name: 'Temperature', color: '#ef4444', unit: '°C' },
              { dataKey: 'humidity', name: 'Humidity', color: '#3b82f6', unit: '%' }
            ]}
          />
        </div>
      </main>
    </div>
  );
}
