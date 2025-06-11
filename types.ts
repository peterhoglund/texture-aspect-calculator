export enum StepMode {
  DIVISIBLE_BY = 'divisible',
  POWER_OF_2 = 'powerOf2',
}

export enum RoundingMode {
  NEAREST = 'nearest',
  DOWN = 'down',
  UP = 'up',
}

export interface AspectRatioInfo {
  name: string;
  value: string; // "W:H" format or "custom"
  width?: number; // Predefined width component
  height?: number; // Predefined height component
}

export interface CalculationResult {
  calculatedWidth: number | null;
  calculatedHeight: number | null;
  error: string | null;
}