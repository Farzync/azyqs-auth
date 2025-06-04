export const validationConfig = {
  password: {
    minLength: 8,
    regex: /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/,
    errorMsg:
      "Password has to be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
    requiredMsg: "Password is required",
    currentRequiredMsg: "Current password is required",
    deleteRequiredMsg: "Password is required to delete your account",
  },
  username: {
    minLength: 3,
    maxLength: 20,
    regex: /^[a-zA-Z0-9_]+$/,
    errorMsg:
      "Username must be 3-20 characters long and can only contain letters, numbers, and underscores.",
    requiredMsg: "Username is required",
  },
  email: {
    requiredMsg: "Email is required",
    invalidMsg: "Enter your valid email address",
  },
  name: {
    requiredMsg: "Your Full Name is required",
  },
  recaptcha: {
    requiredMsg: "Please complete the reCAPTCHA verification",
  },
  csrf: {
    requiredMsg: "CSRF token is required",
  },
  mfa: {
    length: 6,
    invalidMsg: "MFA code must be 6 digits",
    numberMsg: "MFA code must contain only numbers",
  },
  backupCode: {
    length: 8,
    regex: /^[A-Z0-9]{8}$/,
    invalidMsg: "Backup code must be 8 uppercase letters or numbers (A-Z, 0-9)",
  },
};
