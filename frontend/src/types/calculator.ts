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

export interface DalaliInput {
  billAmount: number;
  dalaliRate: number;
  deductTds?: boolean;
  tdsRate?: number;
}

export interface DalaliResult {
  billAmount: number;
  dalaliRate: number;
  grossDalaliAmount: number;
  deductTds: boolean;
  tdsRate: number;
  tdsAmount: number;
  netDalaliAmount: number;
}

export interface DalaliValidationResult {
  isValid: boolean;
  errors: {
    billAmount?: string;
    dalaliRate?: string;
  };
}

