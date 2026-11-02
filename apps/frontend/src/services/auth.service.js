import { authApi } from "../api/auth";

/**
 * Authentication Client Service
 * -----------------------------
 * Encapsulates client authentication business logic, client-side validation,
 * normalization, error formatting, and credential transport.
 */

export const authService = {
  /**
   * Client-side validation for sign-up
   */
  validateSignUpData({ name, email, password, confirmPassword }) {
    if (!name || name.trim().length < 2) {
      return "Full name must be at least 2 characters long.";
    }
    if (name.trim().length > 100) {
      return "Full name must not exceed 100 characters.";
    }

    if (!email || !email.trim()) {
      return "Email address is required.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim().toLowerCase())) {
      return "Please enter a valid email address.";
    }

    if (!password || password.length < 8) {
      return "Password must be at least 8 characters long.";
    }
    if (password.length > 128) {
      return "Password must not exceed 128 characters.";
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return "Passwords do not match. Please verify and try again.";
    }

    return null;
  },

  /**
   * Client-side validation for sign-in
   */
  validateSignInData({ email, password }) {
    if (!email || !email.trim()) {
      return "Email address is required.";
    }
    if (!password) {
      return "Password is required.";
    }
    return null;
  },

  /**
   * Execute Sign Up request to backend
   */
  async signUp({ name, email, password, confirmPassword }) {
    const validationError = this.validateSignUpData({
      name,
      email,
      password,
      confirmPassword,
    });

    if (validationError) {
      throw new Error(validationError);
    }

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      confirmPassword,
    };

    return await authApi.signUp(payload);
  },

  /**
   * Execute Sign In request to backend
   */
  async signIn({ email, password }) {
    const validationError = this.validateSignInData({ email, password });

    if (validationError) {
      throw new Error(validationError);
    }

    const payload = {
      email: email.trim().toLowerCase(),
      password,
    };

    return await authApi.signIn(payload);
  },

  /**
   * Retrieve active session and user context from backend
   */
  async getCurrentUser() {
    return await authApi.me();
  },

  /**
   * Execute Logout request to revoke session
   */
  async signOut() {
    return await authApi.logout();
  },

  /**
   * Revoke all user sessions
   */
  async signOutAll() {
    return await authApi.logoutAll();
  },

  /**
   * Change user password
   */
  async changePassword(data) {
    return await authApi.changePassword(data);
  },
};

export default authService;
