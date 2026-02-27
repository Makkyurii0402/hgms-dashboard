import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { format } from 'date-fns';
import { SensorData } from '../hooks/use-sensor-stream';

interface HistoryChartProps {
  data: SensorData[];
  title: string;
  config: {
    dataKey: keyof SensorData;
    name: string;
    color: string;
    unit: string;
  }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-sm border border-border p-3 rounded-md shadow-xl">
        <p className="text-muted-foreground text-xs mb-2 font-medium border-b border-border/50 pb-2">
          {format(new Date(label), 'HH:mm:ss.SSS')}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 py-1">
            <span className="flex items-center text-sm font-medium" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="font-display font-bold text-foreground">
              {Number(entry.value).toFixed(2)} <span className="text-xs text-muted-foreground ml-0.5">{entry.payload[`${entry.dataKey}_unit`] || ''}</span>
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function HistoryChart({ data, title, config }: HistoryChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center bg-card border border-border rounded-lg">
        <div className="flex flex-col items-center text-muted-foreground">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-3" />
          <p className="font-mono text-sm tracking-widest">AWAITING_TELEMETRY</p>
        </div>
      </div>
    );
  }

  // Inject units into data for tooltip
  const enhancedData = data.map(d => {
    const item: any = { ...d };
    config.forEach(c => {
      item[`${c.dataKey}_unit`] = c.unit;
    });
    return item;
  });

  return (
    <div className="bg-card border border-border rounded-lg p-5 hover:border-border/80 transition-colors">
      <h3 className="text-sm font-medium tracking-widest text-muted-foreground uppercase mb-6 flex items-center">
        <div className="w-2 h-2 bg-primary rounded-sm mr-2 animate-pulse" />
        {title}
      </h3>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={enhancedData}
            margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={(tick) => format(new Date(tick), 'HH:mm:ss')}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickMargin={10}
              minTickGap={30}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={(val) => val.toFixed(0)}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
              iconType="circle"
            />
            {config.map((c) => (
              <Line
                key={c.dataKey}
                type="monotone"
                dataKey={c.dataKey}
                name={c.name}
                stroke={c.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0, fill: c.color }}
                isAnimationActive={false} // Disable animation for performance on streaming data
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
