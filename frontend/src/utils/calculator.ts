import {
  CalculationValidationResult,
  InterestInput,
  InterestResult,
} from '../types/calculator';

/**
 * Validates the input values for simple interest calculation.
 */
export function validateInterestInput(
  input: Partial<InterestInput>
): CalculationValidationResult {
  const errors: CalculationValidationResult['errors'] = {};

  if (input.principal === undefined || isNaN(input.principal)) {
    errors.principal = 'Principal amount is required';
  } else if (input.principal <= 0) {
    errors.principal = 'Principal amount must be greater than zero';
  }

  if (input.annualRate === undefined || isNaN(input.annualRate)) {
    errors.annualRate = 'Annual interest rate is required';
  } else if (input.annualRate < 0) {
    errors.annualRate = 'Interest rate cannot be negative';
  }

  if (input.time === undefined || isNaN(input.time)) {
    errors.time = 'Time period is required';
  } else if (input.time <= 0) {
    errors.time = 'Time period must be greater than zero';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Calculates Simple Interest:
 * Interest = (Principal * Annual Rate * TimeInYears) / 100
 * Total Payable = Principal + Interest
 *
 * If unit is 'months', time is converted to years: time / 12.
 */
export function calculateSimpleInterest(input: InterestInput): InterestResult {
  const validation = validateInterestInput(input);
  if (!validation.isValid) {
    const firstError =
      validation.errors.principal ||
      validation.errors.annualRate ||
      validation.errors.time ||
      'Invalid interest calculation parameters';
    throw new Error(firstError);
  }

  const { principal, annualRate, time, unit } = input;
  const timeInYears = unit === 'months' ? time / 12 : time;

  const rawInterest = (principal * annualRate * timeInYears) / 100;
  // Round to 2 decimal places to prevent floating point inaccuracies
  const interest = Math.round(rawInterest * 100) / 100;
  const totalPayable = Math.round((principal + interest) * 100) / 100;

  return {
    principal,
    annualRate,
    timeInput: time,
    unit,
    timeInYears: Math.round(timeInYears * 1000) / 1000,
    interest,
    totalPayable,
  };
}

export interface AccruedInterestResult {
  daysElapsed: number;
  monthsElapsed: number;
  accruedInterest: number;
  totalWithInterest: number;
  dailyInterest: number;
  monthlyInterest: number;
}

/**
 * Calculates accrued interest on a bill amount based on elapsed days.
 * Simple interest formula: Principal * (Annual Rate / 100) * (Days / 365)
 */
export function calculateAccruedBillInterest(
  amount: number,
  annualRate: number,
  startDateStr: string,
  asOfDateStr?: string
): AccruedInterestResult {
  if (isNaN(amount) || amount <= 0 || isNaN(annualRate) || annualRate < 0) {
    return {
      daysElapsed: 0,
      monthsElapsed: 0,
      accruedInterest: 0,
      totalWithInterest: Math.max(0, amount || 0),
      dailyInterest: 0,
      monthlyInterest: 0,
    };
  }

  const start = new Date(startDateStr);
  const end = asOfDateStr ? new Date(asOfDateStr) : new Date();

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return {
      daysElapsed: 0,
      monthsElapsed: 0,
      accruedInterest: 0,
      totalWithInterest: amount,
      dailyInterest: 0,
      monthlyInterest: 0,
    };
  }

  const diffMs = Math.max(0, end.getTime() - start.getTime());
  const daysElapsed = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const monthsElapsed = Math.round((daysElapsed / 30.416) * 10) / 10;

  const rawInterest = (amount * annualRate * (daysElapsed / 365)) / 100;
  const accruedInterest = Math.round(rawInterest * 100) / 100;
  const totalWithInterest = Math.round((amount + accruedInterest) * 100) / 100;

  const dailyInterest = Math.round(((amount * annualRate) / 36500) * 100) / 100;
  const monthlyInterest = Math.round(((amount * annualRate) / 1200) * 100) / 100;

  return {
    daysElapsed,
    monthsElapsed,
    accruedInterest,
    totalWithInterest,
    dailyInterest,
    monthlyInterest,
  };
}
