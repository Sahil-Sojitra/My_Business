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
    errors.annualRate = 'Interest rate is required';
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
 * Calculates accrued interest on a bill amount based on elapsed days and a monthly interest rate.
 * Formula: Accrued = (Principal * MonthlyRate * DaysElapsed) / 3000
 * Daily Interest = (Principal * MonthlyRate) / 3000
 * Monthly Interest = (Principal * MonthlyRate) / 100
 */
export function calculateAccruedBillInterest(
  amount: number,
  monthlyRate: number,
  startDateStr: string,
  asOfDateStr?: string
): AccruedInterestResult {
  if (isNaN(amount) || amount <= 0 || isNaN(monthlyRate) || monthlyRate < 0) {
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
  const monthsElapsed = Math.round((daysElapsed / 30) * 10) / 10;

  // Monthly interest rate calculation (broker basis: 30-day month standard)
  const rawInterest = (amount * monthlyRate * daysElapsed) / 3000;
  const accruedInterest = Math.round(rawInterest * 100) / 100;
  const totalWithInterest = Math.round((amount + accruedInterest) * 100) / 100;

  const dailyInterest = Math.round(((amount * monthlyRate) / 3000) * 100) / 100;
  const monthlyInterest = Math.round(((amount * monthlyRate) / 100) * 100) / 100;

  return {
    daysElapsed,
    monthsElapsed,
    accruedInterest,
    totalWithInterest,
    dailyInterest,
    monthlyInterest,
  };
}

/**
 * Calculates interest for a specified credit duration on a monthly rate basis.
 */
export function calculateBillCreditInterest(
  amount: number,
  monthlyRate: number,
  duration: number,
  unit: 'months' | 'days'
): {
  interest: number;
  totalPayable: number;
  monthlyInterest: number;
  dailyInterest: number;
} {
  if (isNaN(amount) || amount <= 0 || isNaN(monthlyRate) || monthlyRate <= 0) {
    return {
      interest: 0,
      totalPayable: Math.max(0, amount || 0),
      monthlyInterest: 0,
      dailyInterest: 0,
    };
  }

  const monthlyInterest = Math.round(((amount * monthlyRate) / 100) * 100) / 100;
  const dailyInterest = Math.round(((amount * monthlyRate) / 3000) * 100) / 100;

  const rawInterest =
    unit === 'months'
      ? (amount * monthlyRate * duration) / 100
      : (amount * monthlyRate * duration) / 3000;

  const interest = Math.round(rawInterest * 100) / 100;
  const totalPayable = Math.round((amount + interest) * 100) / 100;

  return {
    interest,
    totalPayable,
    monthlyInterest,
    dailyInterest,
  };
}
