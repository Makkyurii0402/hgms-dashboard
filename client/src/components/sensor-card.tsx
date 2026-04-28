import { ReactNode, useEffect, useRef } from "react";
import { AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import { toast } from "../hooks/use-toast";

const isBrowserNotificationSupported = () =>
  typeof window !== "undefined" && "Notification" in window;

const requestBrowserNotificationPermission = async () => {
  if (!isBrowserNotificationSupported()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  const permission = await Notification.requestPermission();
  return permission === "granted";
};

const sendDangerNotification = async (
  title: string,
  value: number,
  unit: string
) => {
  if (!isBrowserNotificationSupported()) return;

  const granted =
    Notification.permission === "granted" ||
    (await requestBrowserNotificationPermission());

  if (!granted) return;

  new Notification(`${title} Danger Alert`, {
    body: `${title} is at ${value}${unit}, which has entered the DANGER ZONE.`,
    silent: false,
  });
};

export type SensorStatus = "safe" | "warning" | "danger";

interface Thresholds {
  safe: (val: number) => boolean;
  warning: (val: number) => boolean;
  danger?: (val: number) => boolean;
  // If not safe or warning, it's danger
}

interface SensorCardProps {
  title: string;
  value: number;
  unit: string;
  icon: ReactNode;
  thresholds: Thresholds;
  decimals?: number;
}

export function SensorCard({ title, value, unit, icon, thresholds, decimals = 1 }: SensorCardProps) {
  const getStatus = (): SensorStatus => {
    if (thresholds.safe(value)) return "safe";
    if (thresholds.warning(value)) return "warning";
    return "danger";
  };

  const status = getStatus();

  const previousStatus = useRef<SensorStatus | null>(null);
  const alarmRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!alarmRef.current) {
      alarmRef.current = new Audio("/alarm.mp3");
      alarmRef.current.volume = 1.0; // adjust volume
    }

    // Only trigger when switching INTO danger
    if (previousStatus.current !== "danger" && status === "danger") {
      alarmRef.current.play().catch(() => {});

      toast({
        title: `${title} danger detected`,
        description: `${title} is now ${value}${unit} and has entered the DANGER ZONE.`,
        variant: "destructive",
      });

      void sendDangerNotification(title, value, unit);
    }

    previousStatus.current = status;
  }, [status, title, value, unit]);

  // Status styling maps
  const statusStyles = {
    safe: {
      border: "border-[#22c55e]/30",
      bg: "bg-[#22c55e]/10",
      text: "text-[#22c55e]",
      glowText: "text-glow-safe",
      glowBox: "glow-safe",
      icon: <CheckCircle2 className="w-4 h-4 mr-1.5" />,
      label: "SAFE"
    },
    warning: {
      border: "border-[#eab308]/50",
      bg: "bg-[#eab308]/10",
      text: "text-[#eab308]",
      glowText: "text-glow-warning",
      glowBox: "glow-warning",
      icon: <AlertCircle className="w-4 h-4 mr-1.5" />,
      label: "WARNING"
    },
    danger: {
      border: "border-[#e11d48]/70",
      bg: "bg-[#e11d48]/20",
      text: "text-[#e11d48]",
      glowText: "text-glow-danger",
      glowBox: "glow-danger",
      icon: <ShieldAlert className="w-4 h-4 mr-1.5" />,
      label: "DANGER"
    }
  };

  const style = statusStyles[status];

  return (
    <div className={`
      relative overflow-hidden
      bg-card border ${style.border} rounded-lg p-5
      transition-all duration-500 ease-in-out
      hover:shadow-lg hover:border-opacity-100 hover:-translate-y-0.5
    `}>
      
      {/* Background ambient glow based on status */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[50px] opacity-20 ${style.bg} pointer-events-none`} />

      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center text-muted-foreground">
          <div className="p-2 bg-secondary rounded-md mr-3 text-primary border border-border">
            {icon}
          </div>
          <h3 className="font-medium tracking-wide text-sm uppercase">{title}</h3>
        </div>
        
        {/* Status Pill */}
        <div className={`
          flex items-center px-2.5 py-1 rounded-full text-xs font-bold tracking-wider
          border ${style.border} ${style.bg} ${style.text} ${style.glowBox}
          transition-colors duration-300
        `}>
          {style.icon}
          {style.label}
        </div>
      </div>

      <div className="flex items-baseline mt-2">
        <span className={`font-display text-5xl font-bold tracking-tight text-foreground ${status === 'danger' ? style.glowText : ''}`}>
          {value}
        </span>
        <span className="ml-2 text-muted-foreground font-medium text-lg">
          {unit}
        </span>
      </div>
      
      {/* Decorative tech bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary">
        <div 
          className={`h-full ${style.bg.replace('/10', '').replace('/20', '')} transition-all duration-1000 ease-out`} 
          style={{ width: status === 'safe' ? '100%' : status === 'warning' ? '60%' : '30%' }}
        />
      </div>
    </div>
  );
}
