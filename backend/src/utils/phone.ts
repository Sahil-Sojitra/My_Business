/**
 * Utility functions for mobile number normalization and validation.
 */

/**
 * Normalizes an Indian/international mobile number to a clean 10-digit number.
 * Removes spaces, dashes, parentheses, and leading +91 / 91 / 0 country codes.
 */
export function normalizeMobileNumber(raw: string): string {
  if (!raw) return '';
  // Strip all non-digit characters
  let digits = raw.replace(/\D/g, '');

  // If prefixed with 91 (India) and is 12 digits long, strip the 91
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }

  // If prefixed with 0 (STD) and is 11 digits long, strip the 0
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  return digits;
}

/**
 * Checks whether the normalized mobile number is a valid 10-digit number.
 */
export function isValidMobileNumber(normalized: string): boolean {
  return /^[6-9]\d{9}$/.test(normalized);
}
