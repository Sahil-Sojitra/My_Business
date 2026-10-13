import {
  calculateAccruedBillInterest,
  calculateSimpleInterest,
  validateInterestInput,
} from '../src/utils/calculator';

describe('Interest Calculator Utility', () => {
  describe('calculateSimpleInterest - Normal cases', () => {
    it('calculates simple interest correctly for 1 year', () => {
      // Principal: 100,000, Rate: 12%, Time: 1 year
      // Interest = (100000 * 12 * 1) / 100 = 12000
      // Total = 112000
      const result = calculateSimpleInterest({
        principal: 100000,
        annualRate: 12,
        time: 1,
        unit: 'years',
      });

      expect(result.interest).toBe(12000);
      expect(result.totalPayable).toBe(112000);
      expect(result.timeInYears).toBe(1);
    });

    it('calculates simple interest correctly for multi-year duration', () => {
      // Principal: 50,000, Rate: 8.5%, Time: 3 years
      // Interest = (50000 * 8.5 * 3) / 100 = 12750
      // Total = 62750
      const result = calculateSimpleInterest({
        principal: 50000,
        annualRate: 8.5,
        time: 3,
        unit: 'years',
      });

      expect(result.interest).toBe(12750);
      expect(result.totalPayable).toBe(62750);
      expect(result.timeInYears).toBe(3);
    });

    it('converts months to years correctly', () => {
      // Principal: 60,000, Rate: 10%, Time: 6 months (0.5 years)
      // Interest = (60000 * 10 * 0.5) / 100 = 3000
      // Total = 63000
      const result = calculateSimpleInterest({
        principal: 60000,
        annualRate: 10,
        time: 6,
        unit: 'months',
      });

      expect(result.interest).toBe(3000);
      expect(result.totalPayable).toBe(63000);
      expect(result.timeInYears).toBe(0.5);
    });

    it('handles fractional months (e.g. 18 months = 1.5 years)', () => {
      const result = calculateSimpleInterest({
        principal: 20000,
        annualRate: 12,
        time: 18,
        unit: 'months',
      });

      expect(result.interest).toBe(3600);
      expect(result.totalPayable).toBe(23600);
      expect(result.timeInYears).toBe(1.5);
    });
  });

  describe('calculateSimpleInterest - Zero interest case', () => {
    it('returns zero interest and total equal to principal when rate is 0%', () => {
      const result = calculateSimpleInterest({
        principal: 25000,
        annualRate: 0,
        time: 2,
        unit: 'years',
      });

      expect(result.interest).toBe(0);
      expect(result.totalPayable).toBe(25000);
    });
  });

  describe('calculateSimpleInterest - Invalid input cases', () => {
    it('throws error when principal is negative', () => {
      expect(() =>
        calculateSimpleInterest({
          principal: -5000,
          annualRate: 10,
          time: 1,
          unit: 'years',
        })
      ).toThrow('Principal amount must be greater than zero');
    });

    it('throws error when principal is zero', () => {
      expect(() =>
        calculateSimpleInterest({
          principal: 0,
          annualRate: 10,
          time: 1,
          unit: 'years',
        })
      ).toThrow('Principal amount must be greater than zero');
    });

    it('throws error when annual rate is negative', () => {
      expect(() =>
        calculateSimpleInterest({
          principal: 10000,
          annualRate: -5,
          time: 1,
          unit: 'years',
        })
      ).toThrow('Interest rate cannot be negative');
    });

    it('throws error when time is zero or negative', () => {
      expect(() =>
        calculateSimpleInterest({
          principal: 10000,
          annualRate: 5,
          time: 0,
          unit: 'years',
        })
      ).toThrow('Time period must be greater than zero');

      expect(() =>
        calculateSimpleInterest({
          principal: 10000,
          annualRate: 5,
          time: -2,
          unit: 'months',
        })
      ).toThrow('Time period must be greater than zero');
    });
  });

  describe('validateInterestInput helper', () => {
    it('reports missing or NaN fields', () => {
      const val = validateInterestInput({
        principal: NaN,
        annualRate: undefined,
        time: 0,
      });

      expect(val.isValid).toBe(false);
      expect(val.errors.principal).toBeDefined();
      expect(val.errors.annualRate).toBeDefined();
      expect(val.errors.time).toBeDefined();
    });

    it('passes for valid numbers', () => {
      const val = validateInterestInput({
        principal: 1000,
        annualRate: 5,
        time: 1,
      });

      expect(val.isValid).toBe(true);
      expect(Object.keys(val.errors).length).toBe(0);
    });
  });

  describe('calculateAccruedBillInterest helper', () => {
    it('calculates accrued interest for 365 days correctly', () => {
      // 100,000 at 12% for 365 days = 12,000
      const start = '2025-01-01';
      const asOf = '2026-01-01'; // 365 days
      const result = calculateAccruedBillInterest(100000, 12, start, asOf);

      expect(result.daysElapsed).toBe(365);
      expect(result.accruedInterest).toBe(12000);
      expect(result.totalWithInterest).toBe(112000);
      expect(result.monthlyInterest).toBe(1000);
    });

    it('calculates accrued interest for 30 days', () => {
      const start = '2026-09-01';
      const asOf = '2026-10-01'; // 30 days
      const result = calculateAccruedBillInterest(50000, 18, start, asOf);

      expect(result.daysElapsed).toBe(30);
      // (50000 * 18 * (30 / 365)) / 100 = 739.73
      expect(result.accruedInterest).toBeCloseTo(739.73, 1);
      expect(result.totalWithInterest).toBeCloseTo(50739.73, 1);
    });

    it('returns zero accrued interest when start date equals as-of date', () => {
      const date = '2026-10-13';
      const result = calculateAccruedBillInterest(100000, 12, date, date);

      expect(result.daysElapsed).toBe(0);
      expect(result.accruedInterest).toBe(0);
      expect(result.totalWithInterest).toBe(100000);
    });
  });
});
