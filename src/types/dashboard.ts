export interface HealthMetrics {
  heartRate: number;
  steps: number;
  sleepHours: number;
  caloriesBurned: number;
  activeMinutes: number;
  hrv: number;
}

export interface DailyAdvice {
  title: string;
  description: string;
}

export interface ActivityTrend {
  label: string;
  value: number;
  change: number;
}
