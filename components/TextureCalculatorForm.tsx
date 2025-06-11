
import React, { useState, useEffect, useCallback } from 'react';
import { StepMode, AspectRatioInfo, CalculationResult, RoundingMode } from '../types';
import { ASPECT_RATIO_PRESETS, DEFAULT_INPUT_WIDTH, DEFAULT_INPUT_HEIGHT, DEFAULT_ASPECT_RATIO_VALUE, DEFAULT_CUSTOM_ASPECT_WIDTH, DEFAULT_CUSTOM_ASPECT_HEIGHT, DEFAULT_STEP_MODE, DEFAULT_STEP_VALUE, DEFAULT_DRIVING_INPUT, DEFAULT_ROUNDING_MODE } from '../constants';
import { parseAndValidateParams, calculateDimensions, calculateSingleDimension } from '../utils/calculatorUtils';

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  min?: string;
  className?: string;
  step?: string; // For number inputs
}

const InputField: React.FC<InputFieldProps> = ({label, value, onChange, placeholder, type="number", min="0", className="", step }) => (
  <div className={`mb-4 ${className}`}>
    <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
    <input
      type={type}
      min={min}
      step={step}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-gray-700 border border-gray-600 text-gray-200 rounded-md p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400 shadow-sm transition-colors"
      aria-label={label}
    />
  </div>
);

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: {value: string, name: string}[];
   className?: string;
}

const SelectField: React.FC<SelectFieldProps> = ({label, value, onChange, options, className=""}) => (
  <div className={`mb-4 ${className}`}>
    <label className="block text-sm font-medium text-gray-300 mb-1.5" id={`${label.toLowerCase().replace(/\s+/g, '-')}-label`}>{label}</label>
    <div className="relative">
      <select 
        value={value} 
        onChange={onChange}
        className="w-full bg-gray-700 border border-gray-600 text-gray-200 rounded-md p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm appearance-none pr-10 transition-colors"
        aria-labelledby={`${label.toLowerCase().replace(/\s+/g, '-')}-label`}
      >
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.name}</option>)}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>
    </div>
  </div>
);


const TextureCalculatorForm: React.FC = () => {
  const [inputWidth, setInputWidth] = useState<string>(DEFAULT_INPUT_WIDTH);
  const [inputHeight, setInputHeight] = useState<string>(DEFAULT_INPUT_HEIGHT);
  
  const [aspectRatioPreset, setAspectRatioPreset] = useState<string>(DEFAULT_ASPECT_RATIO_VALUE);
  const [customAspectWidth, setCustomAspectWidth] = useState<string>(DEFAULT_CUSTOM_ASPECT_WIDTH);
  const [customAspectHeight, setCustomAspectHeight] = useState<string>(DEFAULT_CUSTOM_ASPECT_HEIGHT);
  
  const [stepMode, setStepMode] = useState<StepMode>(DEFAULT_STEP_MODE);
  const [stepValue, setStepValue] = useState<string>(DEFAULT_STEP_VALUE);
  const [roundingMode, setRoundingMode] = useState<RoundingMode>(DEFAULT_ROUNDING_MODE);
  
  const [drivingInput, setDrivingInput] = useState<'width' | 'height'>(DEFAULT_DRIVING_INPUT);
  
  const [result, setResult] = useState<CalculationResult>({ calculatedWidth: null, calculatedHeight: null, error: null });

  const performCalculation = useCallback(() => {
    if (aspectRatioPreset === 'none') {
      const wStr = inputWidth.trim();
      const hStr = inputHeight.trim();

      if (wStr === '' && hStr === '') {
        setResult({ calculatedWidth: null, calculatedHeight: null, error: "Please enter at least one dimension." });
        return;
      }

      let tempCalcW: number | null = null;
      let tempCalcH: number | null = null;
      const errors: string[] = [];

      const stepValNum = parseInt(stepValue, 10);
      let isStepValid = true;
      if (stepMode === StepMode.DIVISIBLE_BY) {
        if (isNaN(stepValNum) || stepValNum <= 0) {
          errors.push("Step value must be a positive integer.");
          isStepValid = false;
        }
      }

      if (wStr !== '') {
        const wVal = parseInt(wStr, 10);
        if (isNaN(wVal) || wVal < 0) {
          errors.push("Input width must be a non-negative integer.");
        } else if (isStepValid) {
          tempCalcW = calculateSingleDimension(wVal, stepMode, roundingMode, stepMode === StepMode.DIVISIBLE_BY ? stepValNum : undefined);
        }
      }

      if (hStr !== '') {
        const hVal = parseInt(hStr, 10);
        if (isNaN(hVal) || hVal < 0) {
          errors.push("Input height must be a non-negative integer.");
        } else if (isStepValid) {
          tempCalcH = calculateSingleDimension(hVal, stepMode, roundingMode, stepMode === StepMode.DIVISIBLE_BY ? stepValNum : undefined);
        }
      }
      
      // Ensure that if a dimension input is empty, its calculated value is null, not 0 from an initial tempCalc value
      if (wStr === '' && tempCalcW === 0) tempCalcW = null;
      if (hStr === '' && tempCalcH === 0) tempCalcH = null;


      setResult({
        calculatedWidth: tempCalcW,
        calculatedHeight: tempCalcH,
        error: errors.length > 0 ? errors.join(' ') : null,
      });
      return;
    }

    // Existing logic for when aspect ratio is NOT 'none'
    const isCustomAspect = aspectRatioPreset === 'custom';
    const currentAspectWStr = isCustomAspect ? customAspectWidth : aspectRatioPreset.split(':')[0];
    const currentAspectHStr = isCustomAspect ? customAspectHeight : aspectRatioPreset.split(':')[1];

    const drivingValStrFromState = drivingInput === 'width' ? inputWidth : inputHeight;
    
    if (drivingValStrFromState.trim() === '' && (drivingInput === 'width' ? inputHeight.trim() === '' : inputWidth.trim() === '')) {
        setResult({ calculatedWidth: null, calculatedHeight: null, error: "Please enter at least one dimension." });
        return;
    }
    
    let actualDrivingValStr = drivingValStrFromState;
    let actualDrivingInput = drivingInput;

    if (drivingValStrFromState.trim() === '') {
        if (drivingInput === 'width' && inputHeight.trim() !== '') {
            actualDrivingInput = 'height';
            actualDrivingValStr = inputHeight;
        } else if (drivingInput === 'height' && inputWidth.trim() !== '') {
            actualDrivingInput = 'width';
            actualDrivingValStr = inputWidth;
        } else {
             setResult({ calculatedWidth: null, calculatedHeight: null, error: "Please enter a dimension to calculate from." });
             return;
        }
    }


    const validation = parseAndValidateParams(
      actualDrivingValStr,
      currentAspectWStr,
      currentAspectHStr,
      stepMode,
      stepMode === StepMode.DIVISIBLE_BY ? stepValue : undefined
    );

    if (validation.error) {
      setResult({ calculatedWidth: null, calculatedHeight: null, error: validation.error });
      return;
    }
    
    const { parsedInputVal, sAspectW, sAspectH, parsedStepVal } = validation;

    const dimensions = calculateDimensions(
      parsedInputVal,
      actualDrivingInput === 'width',
      sAspectW,
      sAspectH,
      stepMode,
      roundingMode,
      parsedStepVal
    );

    if (dimensions) {
      setResult({ calculatedWidth: dimensions.width, calculatedHeight: dimensions.height, error: null });
    } else {
      setResult({ calculatedWidth: null, calculatedHeight: null, error: "Calculation failed. Check parameters."});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputWidth, inputHeight, aspectRatioPreset, customAspectWidth, customAspectHeight, stepMode, stepValue, drivingInput, roundingMode]);

  useEffect(() => {
    performCalculation();
  }, [performCalculation]);

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>, driverFlag?: 'width' | 'height') => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    // Only set driving input if an aspect ratio is active, or if it's the first input being typed into.
    // If aspect ratio is 'none', drivingInput is less critical but doesn't harm.
    // The main purpose of drivingInput is to resolve which dimension to use if both are filled and an aspect ratio is set.
    if (driverFlag) {
       setDrivingInput(driverFlag);
    }
  };
  
  const handleSelectChange = (setter: React.Dispatch<React.SetStateAction<any>>) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setter(e.target.value);
  };
  
  return (
    <div className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-lg space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-center text-indigo-400">Texture Dimension Calculator</h1>

      <div>
        <h2 className="text-lg font-semibold text-indigo-300 mb-3 border-b border-gray-700 pb-2">Input Dimensions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <InputField label="Input Width" value={inputWidth} onChange={handleInputChange(setInputWidth, 'width')} placeholder="e.g., 111" />
          <InputField label="Input Height" value={inputHeight} onChange={handleInputChange(setInputHeight, 'height')} placeholder="e.g., 150" />
        </div>
      </div>
      
      <div>
        <h2 className="text-lg font-semibold text-indigo-300 mb-3 border-b border-gray-700 pb-2">Constraints</h2>
        <SelectField 
          label="Aspect Ratio"
          value={aspectRatioPreset}
          onChange={handleSelectChange(setAspectRatioPreset)}
          options={ASPECT_RATIO_PRESETS.map(ar => ({ value: ar.value, name: ar.name }))}
          className="mb-4"
        />

        {aspectRatioPreset === 'custom' && (
          <div className="grid grid-cols-2 gap-x-4 mt-1 mb-4 p-4 border border-gray-700 rounded-md bg-gray-700/30">
            <InputField label="Aspect W" value={customAspectWidth} onChange={handleInputChange(setCustomAspectWidth)} placeholder="e.g., 2" className="mb-0" min="1" step="1"/>
            <InputField label="Aspect H" value={customAspectHeight} onChange={handleInputChange(setCustomAspectHeight)} placeholder="e.g., 3" className="mb-0" min="1" step="1"/>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <SelectField
            label="Step Mode"
            value={stepMode}
            onChange={handleSelectChange(setStepMode)}
            options={[
              { value: StepMode.DIVISIBLE_BY, name: 'Divisible By' },
              { value: StepMode.POWER_OF_2, name: 'Power of 2' },
            ]}
            className="mb-4"
          />
          {stepMode === StepMode.DIVISIBLE_BY && (
            <InputField label="Step Value" value={stepValue} onChange={handleInputChange(setStepValue)} placeholder="e.g., 4" min="1" step="1" className="mb-4"/>
          )}
        </div>
         <SelectField
            label="Rounding Direction"
            value={roundingMode}
            onChange={handleSelectChange(setRoundingMode)}
            options={[
              { value: RoundingMode.NEAREST, name: 'Nearest' },
              { value: RoundingMode.DOWN, name: 'Round Down' },
              { value: RoundingMode.UP, name: 'Round Up' },
            ]}
            className="mb-4"
          />
      </div>


      {result.error && (
        <div role="alert" aria-live="assertive" className="mt-2 p-3 bg-red-900/50 border border-red-700 rounded-md text-red-300 text-sm">
          <strong>Error:</strong> {result.error}
        </div>
      )}

      {/* Result Display: show if no error OR if there's an error but some values might be calculated */}
      {(result.calculatedWidth !== null || result.calculatedHeight !== null || result.error) && (result.calculatedWidth !== null || result.calculatedHeight !== null) && (
         <div className="pt-4">
          <h2 className="text-lg font-semibold text-indigo-300 mb-3 text-center">Calculated Dimensions</h2>
          <div className="p-6 bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border border-indigo-500 rounded-lg text-center shadow-xl" aria-live="polite">
            <span className="text-3xl sm:text-4xl font-bold text-green-400 tabular-nums tracking-tight">
              {result.calculatedWidth ?? '---'}
            </span>
            <span className="text-2xl sm:text-3xl text-gray-400 mx-2 sm:mx-3">x</span>
            <span className="text-3xl sm:text-4xl font-bold text-green-400 tabular-nums tracking-tight">
              {result.calculatedHeight ?? '---'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextureCalculatorForm;
