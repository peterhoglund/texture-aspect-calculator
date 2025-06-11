import { AspectRatioInfo, StepMode, RoundingMode } from './types';

export const ASPECT_RATIO_PRESETS: AspectRatioInfo[] = [
  { name: 'Square (1:1)', value: '1:1', width: 1, height: 1 },
  { name: 'Landscape (2:1)', value: '2:1', width: 2, height: 1 },
  { name: 'Portrait (1:2)', value: '1:2', width: 1, height: 2 },
  { name: 'Landscape (3:2)', value: '3:2', width: 3, height: 2 },
  { name: 'Portrait (2:3)', value: '2:3', width: 2, height: 3 }, // User example
  { name: 'Landscape (4:3)', value: '4:3', width: 4, height: 3 },
  { name: 'Portrait (3:4)', value: '3:4', width: 3, height: 4 },
  { name: 'Widescreen (16:9)', value: '16:9', width: 16, height: 9 },
  { name: 'Tallscreen (9:16)', value: '9:16', width: 9, height: 16 },
  { name: 'Cinematic (2.35:1)', value: '235:100', width: 235, height: 100 },
  { name: 'Custom Aspect Ratio', value: 'custom' },
  { name: 'None (Independent W/H)', value: 'none' },
];

export const DEFAULT_INPUT_WIDTH: string = '111';
export const DEFAULT_INPUT_HEIGHT: string = '';
export const DEFAULT_ASPECT_RATIO_VALUE: string = '2:3'; // Matches user example aspect
export const DEFAULT_CUSTOM_ASPECT_WIDTH: string = '1';
export const DEFAULT_CUSTOM_ASPECT_HEIGHT: string = '1';
export const DEFAULT_STEP_MODE: StepMode = StepMode.DIVISIBLE_BY;
export const DEFAULT_STEP_VALUE: string = '4'; // Matches user example step
export const DEFAULT_DRIVING_INPUT: 'width' | 'height' = 'width';
export const DEFAULT_ROUNDING_MODE: RoundingMode = RoundingMode.NEAREST;