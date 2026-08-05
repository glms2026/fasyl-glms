export interface PasswordStrength {
  score: number;
  label: string;
  checks: {
    minLength: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

export function getPasswordStrength(password: string): PasswordStrength {
  const checks = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;

  let label = "Very Weak";

  if (score === 2) label = "Weak";
  if (score === 3) label = "Fair";
  if (score === 4) label = "Strong";
  if (score === 5) label = "Very Strong";

  return {
    score,
    label,
    checks,
  };
}
