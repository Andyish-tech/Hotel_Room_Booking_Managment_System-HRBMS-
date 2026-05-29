/**
 * Form Validation Utility
 * Reusable validation functions for all forms in the HRBMS application.
 */

/**
 * Check if a value is not empty/undefined/null/whitespace-only
 */
export const isRequired = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string' && value.trim().length === 0) return false;
  return value !== '';
};

/**
 * Validate a person's full name.
 * Rules: Only letters (including accented), spaces, hyphens, apostrophes.
 * No numbers or special characters allowed.
 * Minimum 2 characters.
 */
export const isValidName = (name) => {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (trimmed.length < 2) return false;
  // Allow letters (incl. accented), spaces, hyphens, apostrophes, periods
  return /^[A-Za-zÀ-ÖØ-öø-ÿŒœŠšŽž\s\-'.]+$/.test(trimmed);
};

/**
 * Validate a phone number.
 * Accepts formats: +250 78X XXX XXX, 078X XXX XXX, etc.
 */
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  const trimmed = phone.trim();
  // Allow: +, digits, spaces, dashes, parentheses, and minimum length
  if (!/^[\d\s\-+()]+$/.test(trimmed)) return false;
  // Extract only digits to check length
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15;
};

/**
 * Validate an email address.
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length === 0) return true; // Email is optional
  // Standard email regex
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
};

/**
 * Validate a username.
 * Rules: Alphanumeric, underscores, hyphens, min 3 chars, max 30 chars.
 */
export const isValidUsername = (username) => {
  if (!username || typeof username !== 'string') return false;
  const trimmed = username.trim();
  if (trimmed.length < 3 || trimmed.length > 30) return false;
  return /^[A-Za-z0-9_\-]+$/.test(trimmed);
};

/**
 * Validate a password.
 * Rules: Minimum 6 characters.
 */
export const isValidPassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 6;
};

/**
 * Check if a value is a valid positive number (for amounts, counts, etc.)
 */
export const isValidPositiveNumber = (value) => {
  if (value === undefined || value === null || value === '') return false;
  const num = parseFloat(value);
  return !isNaN(num) && num >= 0;
};

/**
 * Check minimum length for a string value.
 */
export const isMinLength = (value, min) => {
  if (!value || typeof value !== 'string') return false;
  return value.trim().length >= min;
};

/**
 * Validate a date string is a valid date.
 */
export const isValidDate = (dateStr) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
};

/**
 * Check if date1 is before date2.
 */
export const isDateBefore = (date1, date2) => {
  if (!date1 || !date2) return false;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return !isNaN(d1.getTime()) && !isNaN(d2.getTime()) && d1 < d2;
};

/**
 * Check if two values match (for password confirmation).
 */
export const matches = (value1, value2) => {
  return value1 === value2;
};

/**
 * Check if a date string is today or a future date (not in the past).
 * Strips time for date-only comparison.
 */
export const isTodayOrFuture = (dateStr) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;

  // Get today at midnight (start of day)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Set the given date to midnight for comparison
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  return checkDate >= today;
};

/**
 * Validate a complete form against a set of rules.
 *
 * @param {Object} rules - Validation rules { fieldName: [rule1, rule2, ...] }
 *   Each rule is an object: { validate: function(value, data) => boolean, message: string }
 * @param {Object} data - The form data object { fieldName: value }
 * @returns {Object} errors - { fieldName: "error message" }
 *
 * Example:
 * const rules = {
 *   FullName: [
 *     { validate: (v) => isRequired(v), message: 'Full name is required' },
 *     { validate: (v) => isValidName(v), message: 'Name cannot contain numbers' },
 *   ]
 * };
 * const errors = validate(rules, data);
 */
export const validate = (rules, data) => {
  const errors = {};

  for (const [field, fieldRules] of Object.entries(rules)) {
    for (const rule of fieldRules) {
      const value = data[field];
      if (!rule.validate(value, data)) {
        errors[field] = rule.message;
        break; // Only show the first error for each field
      }
    }
  }

  return errors;
};

/**
 * Check if an errors object has any errors.
 */
export const hasErrors = (errors) => {
  return Object.keys(errors).length > 0;
};

/**
 * Get a specific field error message.
 */
export const getError = (errors, field) => {
  return errors[field] || null;
};
