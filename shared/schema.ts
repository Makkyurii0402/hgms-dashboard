import { z } from "zod";

export const sensorDataSchema = z.object({
  oxygen: z.number(),
  co: z.number(),
  h2s: z.number(),
  methane: z.number(),
  temperature: z.number(),
  humidity: z.number(),
  timestamp: z.number(),
});

export type SensorData = z.infer<typeof sensorDataSchema>;
