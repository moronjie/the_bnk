import Decimal from 'decimal.js';
import mongoose from 'mongoose';

/**
 * Configure Decimal.js for financial calculations
 * Set precision and rounding mode for banking operations
 */
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -9e15,
  toExpPos: 9e15,
  minE: -9e15,
  maxE: 9e15,
});

/**
 * Create a Decimal instance from various input types
 */
export function decimal(value: number | string | Decimal): Decimal {
  return new Decimal(value);
}

/**
 * Add two decimal values
 */
export function add(a: number | string | Decimal, b: number | string | Decimal): Decimal {
  return decimal(a).plus(decimal(b));
}

/**
 * Subtract two decimal values
 */
export function subtract(a: number | string | Decimal, b: number | string | Decimal): Decimal {
  return decimal(a).minus(decimal(b));
}

/**
 * Multiply two decimal values
 */
export function multiply(a: number | string | Decimal, b: number | string | Decimal): Decimal {
  return decimal(a).times(decimal(b));
}

/**
 * Divide two decimal values
 */
export function divide(a: number | string | Decimal, b: number | string | Decimal): Decimal {
  if (decimal(b).equals(0)) {
    throw new Error('Division by zero');
  }
  return decimal(a).dividedBy(decimal(b));
}

/**
 * Compare two decimal values
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b
 */
export function compare(a: number | string | Decimal, b: number | string | Decimal): number {
  return decimal(a).comparedTo(decimal(b));
}

/**
 * Check if value is greater than another
 */
export function isGreaterThan(a: number | string | Decimal, b: number | string | Decimal): boolean {
  return decimal(a).greaterThan(decimal(b));
}

/**
 * Check if value is less than another
 */
export function isLessThan(a: number | string | Decimal, b: number | string | Decimal): boolean {
  return decimal(a).lessThan(decimal(b));
}

/**
 * Check if value is greater than or equal to another
 */
export function isGreaterThanOrEqual(a: number | string | Decimal, b: number | string | Decimal): boolean {
  return decimal(a).greaterThanOrEqualTo(decimal(b));
}

/**
 * Check if value is less than or equal to another
 */
export function isLessThanOrEqual(a: number | string | Decimal, b: number | string | Decimal): boolean {
  return decimal(a).lessThanOrEqualTo(decimal(b));
}

/**
 * Check if two values are equal
 */
export function isEqual(a: number | string | Decimal, b: number | string | Decimal): boolean {
  return decimal(a).equals(decimal(b));
}

/**
 * Round to specified decimal places (default 2 for currency)
 */
export function round(value: number | string | Decimal, decimalPlaces: number = 2): Decimal {
  return decimal(value).toDecimalPlaces(decimalPlaces);
}

/**
 * Format as currency string
 */
export function formatCurrency(value: number | string | Decimal, currency: string = 'USD'): string {
  const amount = decimal(value).toFixed(2);
  
  switch (currency) {
    case 'USD':
      return `$${amount}`;
    case 'EUR':
      return `€${amount}`;
    case 'GBP':
      return `£${amount}`;
    default:
      return `${currency} ${amount}`;
  }
}

/**
 * Convert to number (use carefully, only for display purposes)
 */
export function toNumber(value: Decimal): number {
  return value.toNumber();
}

/**
 * Convert to string
 */
export function toString(value: Decimal): string {
  return value.toString();
}

/**
 * Convert Mongoose Decimal128 to Decimal
 */
export function fromDecimal128(value: mongoose.Types.Decimal128): Decimal {
  return decimal(value.toString());
}

/**
 * Convert Decimal to Mongoose Decimal128
 */
export function toDecimal128(value: number | string | Decimal): mongoose.Types.Decimal128 {
  return mongoose.Types.Decimal128.fromString(decimal(value).toString());
}

/**
 * Calculate percentage
 */
export function percentage(value: number | string | Decimal, percent: number | string | Decimal): Decimal {
  return multiply(value, divide(percent, 100));
}

/**
 * Calculate interest
 * principal: initial amount
 * rate: annual interest rate (e.g., 5 for 5%)
 * time: time period in years
 */
export function calculateSimpleInterest(
  principal: number | string | Decimal,
  rate: number | string | Decimal,
  time: number | string | Decimal,
): Decimal {
  return multiply(multiply(principal, rate), divide(time, 100));
}

/**
 * Calculate compound interest
 * principal: initial amount
 * rate: annual interest rate (e.g., 5 for 5%)
 * time: time period in years
 * compoundingFrequency: number of times interest is compounded per year
 */
export function calculateCompoundInterest(
  principal: number | string | Decimal,
  rate: number | string | Decimal,
  time: number | string | Decimal,
  compoundingFrequency: number = 12,
): Decimal {
  const p = decimal(principal);
  const r = divide(rate, multiply(100, compoundingFrequency));
  const n = multiply(compoundingFrequency, time);
  
  // A = P(1 + r/n)^(nt)
  const base = add(1, r);
  const amount = multiply(p, base.pow(toNumber(n)));
  
  return subtract(amount, p); // Return only the interest
}

/**
 * Sum an array of decimal values
 */
export function sum(values: (number | string | Decimal)[]): Decimal {
  let result = decimal(0);
  for (const val of values) {
    result = add(result, val);
  }
  return result;
}

/**
 * Get absolute value
 */
export function abs(value: number | string | Decimal): Decimal {
  return decimal(value).abs();
}

/**
 * Get minimum value from array
 */
export function min(...values: (number | string | Decimal)[]): Decimal {
  return Decimal.min(...values.map(v => decimal(v)));
}

/**
 * Get maximum value from array
 */
export function max(...values: (number | string | Decimal)[]): Decimal {
  return Decimal.max(...values.map(v => decimal(v)));
}
