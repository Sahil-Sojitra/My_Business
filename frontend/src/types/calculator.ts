export type TimeUnit = 'years' | 'months';

export interface InterestInput {
  principal: number;
  annualRate: number;
  time: number;
  unit: TimeUnit;
}

export interface InterestResult {
  principal: number;
  annualRate: number;
  timeInput: number;
  unit: TimeUnit;
  timeInYears: number;
  interest: number;
  totalPayable: number;
}

export interface CalculationValidationResult {
  isValid: boolean;
  errors: {
    principal?: string;
    annualRate?: string;
    time?: string;
  };
}
