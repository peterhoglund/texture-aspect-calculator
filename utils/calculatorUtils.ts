import { StepMode, RoundingMode } from '../types';

export const gcd = (a: number, b: number): number => {
  a = Math.abs(a);
  b = Math.abs(b);
  if (b === 0) {
    return a;
  }
  return gcd(b, a % b);
};

export const lcm = (a: number, b: number): number => {
  if (a === 0 || b === 0) return 0;
  const val = Math.abs(a * b) / gcd(a, b);
  return val;
};

export const isPowerOfTwo = (n: number): boolean => {
  return n > 0 && (n & (n - 1)) === 0;
};

interface ParsedParams {
  parsedInputVal: number;
  sAspectW: number;
  sAspectH: number;
  parsedStepVal?: number;
  error?: string;
}

export const parseAndValidateParams = (
  inputValStr: string,
  aspectWStr: string,
  aspectHStr: string,
  stepMode: StepMode,
  stepValStr?: string
): ParsedParams => {
  const parsedInputVal = parseInt(inputValStr, 10);
  if (isNaN(parsedInputVal) || parsedInputVal < 0) {
    return { error: "Input dimension must be a non-negative integer.", parsedInputVal: 0, sAspectW:1, sAspectH:1 };
  }

  const numAspectW = parseInt(aspectWStr, 10);
  const numAspectH = parseInt(aspectHStr, 10);

  if (isNaN(numAspectW) || numAspectW <= 0 || isNaN(numAspectH) || numAspectH <= 0) {
    return { error: "Aspect ratio components must be positive integers.", parsedInputVal, sAspectW:1, sAspectH:1 };
  }
  const commonDivisor = gcd(numAspectW, numAspectH);
  const sAspectW = numAspectW / commonDivisor;
  const sAspectH = numAspectH / commonDivisor;

  if (stepMode === StepMode.DIVISIBLE_BY) {
    const parsedStepVal = parseInt(stepValStr || "1", 10);
    if (isNaN(parsedStepVal) || parsedStepVal <= 0) {
      return { error: "Step value must be a positive integer.", parsedInputVal, sAspectW, sAspectH };
    }
    return { parsedInputVal, sAspectW, sAspectH, parsedStepVal };
  }

  if (stepMode === StepMode.POWER_OF_2 && (!isPowerOfTwo(sAspectW) || !isPowerOfTwo(sAspectH))) {
     return { error: `For Power of 2 stepping with a fixed aspect ratio, both simplified aspect ratio components (currently ${sAspectW}:${sAspectH}) must themselves be powers of two. Consider 'None' aspect ratio for independent Power of 2 dimensions.`, parsedInputVal, sAspectW, sAspectH };
  }
  return { parsedInputVal, sAspectW, sAspectH };
};

export const calculateSingleDimension = (
  inputValue: number,
  stepMode: StepMode,
  roundingMode: RoundingMode,
  stepValueForDivisible?: number
): number => {
  if (inputValue < 0) return 0; // Should be caught by form validation
  if (inputValue === 0) return 0;

  let val_low: number;
  let val_high: number;

  if (stepMode === StepMode.DIVISIBLE_BY) {
    if (!stepValueForDivisible || stepValueForDivisible <= 0) {
      // This should be validated before calling. Fallback or error.
      return Math.round(inputValue); 
    }
    const L = stepValueForDivisible;
    const m_float = inputValue / L;
    val_low = Math.floor(m_float) * L;
    val_high = Math.ceil(m_float) * L;
    
    // If input is positive, ensure val_high is at least one step if it would otherwise be 0 from rounding up
    // e.g. input 1, step 4 -> m_float 0.25, val_low 0, val_high should be 4 (not 0*4)
    if (inputValue > 0 && val_high === 0 && L > 0 && Math.ceil(m_float) * L === 0) {
        val_high = L;
    }
     // If rounding down makes val_low 0, that's acceptable.
     // e.g. input 1, step 4. Round down = 0. Round nearest = 0. Round up = 4.

  } else { // POWER_OF_2
    // Smallest positive Power of 2 dimension is 1 (2^0)
    if (inputValue <= 0) { // Should be caught by initial check, but defensive
        val_low = 0; val_high = 0;
    } else {
        const p_low_float = Math.log2(inputValue);
        val_low = Math.pow(2, Math.floor(p_low_float));
        val_high = Math.pow(2, Math.ceil(p_low_float));

        // Ensure results are at least 1 if original input was positive and would result in <1 PoT.
        if (val_low < 1 && inputValue > 0) val_low = 1;
        if (val_high < 1 && inputValue > 0) val_high = 1;
    }
  }
  
  // This block ensures that if inputValue > 0, we don't end up with val_low=0 AND val_high=0
  // if a step exists. Primarily for edge cases or very small inputs.
  if (inputValue > 0 && val_low === 0 && val_high === 0) {
    if (stepMode === StepMode.POWER_OF_2) { 
      val_low = 1; val_high = 1; // Smallest PoT
    } else if (stepValueForDivisible && stepValueForDivisible > 0) {
      val_low = 0; // Can round down to 0
      val_high = stepValueForDivisible; // Smallest step up
    } else { // Should not be reached if stepValue is validated
        return Math.round(inputValue);
    }
  }


  let chosenVal: number;
  if (val_low === val_high) {
    chosenVal = val_low;
  } else {
    switch (roundingMode) {
      case RoundingMode.DOWN:
        chosenVal = val_low;
        break;
      case RoundingMode.UP:
        chosenVal = val_high;
        break;
      case RoundingMode.NEAREST:
      default:
        const dist_low = Math.abs(inputValue - val_low);
        const dist_high = Math.abs(inputValue - val_high);
        chosenVal = (dist_low <= dist_high) ? val_low : val_high; // Prefer lower on tie
        break;
    }
  }
  
  return Math.round(chosenVal); // Ensure integer result
};


export const calculateDimensions = (
  drivingValue: number,
  isDrivingWidth: boolean,
  sAspectW: number,
  sAspectH: number,
  stepMode: StepMode,
  roundingMode: RoundingMode,
  stepValueForDivisible?: number
): { width: number; height: number } | null => {

  if (drivingValue < 0) return { width: 0, height: 0 }; 
  if (sAspectW <= 0 || sAspectH <= 0) return null; 

  let N_low: number, N_high: number;
  // Target N (multiplier for simplified aspect ratio components)
  const targetN_val = drivingValue === 0 ? 0 : (isDrivingWidth ? (drivingValue / sAspectW) : (drivingValue / sAspectH));

  if (stepMode === StepMode.DIVISIBLE_BY) {
    if (!stepValueForDivisible || stepValueForDivisible <= 0) return null; 

    // N * sAspectW must be divisible by stepValue, and N * sAspectH by stepValue.
    // N * (sAspectW / gcd(sAspectW, step)) must be mult of (step / gcd(sAspectW, step))
    // N * sAspectW = k1 * step => N = k1 * step / sAspectW
    // N * sAspectH = k2 * step => N = k2 * step / sAspectH
    // So, N must be a multiple of lcm(step/gcd(sAspectW,step), step/gcd(sAspectH,step))
    // Let step_w = stepValue / gcd(sAspectW, stepValue)
    // Let step_h = stepValue / gcd(sAspectH, stepValue)
    // N must be a multiple of lcm(step_w, step_h) -> This is L_N, the "step for N"
    // However, this N is for sAspectW and sAspectH to be divisible by step.
    // It's simpler: N * sAspectW needs to be mult of step, and N * sAspectH needs to be mult of step.
    // So, N * sAspectW = k_w * stepValue  => N = k_w * stepValue / sAspectW
    // And N * sAspectH = k_h * stepValue => N = k_h * stepValue / sAspectH
    // N must be an integer multiple of L_N = lcm(stepValue / gcd(sAspectW, stepValue), stepValue / gcd(sAspectH, stepValue))
    // This is from a known formula for this problem structure.
    // L_N effectively makes N*sAspectW and N*sAspectH multiples of stepValue.
    const common_W = gcd(sAspectW, stepValueForDivisible);
    const common_H = gcd(sAspectH, stepValueForDivisible);

    // If sAspectW or sAspectH is 0, or stepValue is 0, gcd could be problematic or result in div by zero.
    // Guarded by sAspectW/H > 0 and stepValue > 0.
    if (common_W === 0 || common_H === 0) return { width: 0, height: 0}; // Should not happen with positive inputs

    const termW_for_lcm = stepValueForDivisible / common_W; // sAspectW must be multiplied by this to be divisible by stepValueForDivisible/common_W
    const termH_for_lcm = stepValueForDivisible / common_H;
    
    const L_N = lcm(termW_for_lcm, termH_for_lcm); // Smallest multiplier for N such that N*sAspectW and N*sAspectH are multiples of stepValueForDivisible
                                                  // This L_N is the "effective step" for the multiplier N.
    
    if (L_N === 0 && drivingValue > 0) return { width: 0, height: 0 }; 
    if (L_N === 0 && drivingValue === 0) { // e.g. step is 0 (invalid) or aspect terms are 0 (invalid)
        N_low = 0; N_high = 0;
    } else {
        const m_float = targetN_val / L_N; // How many "N-steps" are in the target N
        N_low = Math.floor(m_float) * L_N;
        N_high = Math.ceil(m_float) * L_N;

        if (drivingValue > 0 && N_high === 0 && L_N > 0) { 
            N_high = L_N; 
        }
    }
  } else { // POWER_OF_2
    // N * sAspectW = 2^a, N * sAspectH = 2^b.
    // Since sAspectW and sAspectH are already validated to be powers of two for this mode,
    // N itself must also be a power of two.
    if (targetN_val <= 0) {
        N_low = 0; N_high = 0;
    } else {
        const p_float = Math.log2(targetN_val);
        N_low = Math.pow(2, Math.floor(p_float));
        N_high = Math.pow(2, Math.ceil(p_float));
        
        // Smallest PoT N is 1 (2^0) if target was positive
        if (N_low < 1 && targetN_val > 0) N_low = 1;
        if (N_high < 1 && targetN_val > 0) N_high = 1; 
    }
  }
  
  if (drivingValue > 0 && N_low === 0 && N_high === 0) {
    // This case implies no valid N > 0 could be found.
    // E.g. drivingValue is small, aspect ratio components are large, step is large.
    // We need to find the smallest possible N > 0.
    if (stepMode === StepMode.POWER_OF_2) { 
      N_low = 1; N_high = 1; // Smallest PoT multiplier for N
    } else if (stepValueForDivisible) {
        const common_W_fb = gcd(sAspectW, stepValueForDivisible);
        const common_H_fb = gcd(sAspectH, stepValueForDivisible);
        if (common_W_fb === 0 || common_H_fb === 0) { return { width: 0, height: 0 }; }
        const L_N_fallback = lcm(stepValueForDivisible / common_W_fb, stepValueForDivisible / common_H_fb);
        if (L_N_fallback > 0) { 
          N_low = L_N_fallback; N_high = L_N_fallback; 
        } else { 
          return {width: 0, height: 0}; 
        }
    } else {
        return {width: 0, height: 0};
    }
  }

  let chosenN: number;

  if (N_low === N_high) {
    chosenN = N_low;
  } else {
    switch (roundingMode) {
      case RoundingMode.DOWN:
        chosenN = N_low;
        break;
      case RoundingMode.UP:
        chosenN = N_high;
        break;
      case RoundingMode.NEAREST:
      default:
        // Compare based on the dimension that was the driving input
        const val_low_cand = isDrivingWidth ? (N_low * sAspectW) : (N_low * sAspectH);
        const val_high_cand = isDrivingWidth ? (N_high * sAspectW) : (N_high * sAspectH);
        
        const dist_low = Math.abs(drivingValue - val_low_cand);
        const dist_high = Math.abs(drivingValue - val_high_cand);
        
        chosenN = (dist_low <= dist_high) ? N_low : N_high; // Prefer lower on tie
        break;
    }
  }
  
  const finalW = chosenN * sAspectW;
  const finalH = chosenN * sAspectH;
  
  return { width: Math.round(finalW), height: Math.round(finalH) };
};