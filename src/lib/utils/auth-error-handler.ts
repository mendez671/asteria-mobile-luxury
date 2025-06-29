// ===============================
// PHASE 3: ENHANCED ERROR HANDLING SERVICE
// Comprehensive authentication error management and recovery
// ===============================

export interface AuthError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  recoverable: boolean;
  userMessage: string;
}

export interface AuthAttempt {
  method: 'cross_domain_check' | 'postmessage' | 'redirect' | 'token_validation';
  timestamp: Date;
  success: boolean;
  error?: AuthError;
  duration?: number;
}

class AuthErrorHandler {
  private attempts: AuthAttempt[] = [];
  private maxAttempts = 3;
  private retryDelay = 1000; // 1 second base delay

  // Log authentication attempt
  logAttempt(attempt: AuthAttempt): void {
    this.attempts.push(attempt);
    
    // Keep only last 10 attempts to prevent memory issues
    if (this.attempts.length > 10) {
      this.attempts = this.attempts.slice(-10);
    }

    const status = attempt.success ? '✅' : '❌';
    const duration = attempt.duration ? ` (${attempt.duration}ms)` : '';
    console.log(`${status} Auth attempt [${attempt.method}]${duration}:`, 
                attempt.error?.message || 'Success');
  }

  // Create standardized error objects
  createError(
    code: string, 
    message: string, 
    details?: any, 
    recoverable: boolean = true
  ): AuthError {
    const userMessages: Record<string, string> = {
      'CROSS_DOMAIN_FAILED': 'Unable to verify existing authentication. Please sign in.',
      'POSTMESSAGE_TIMEOUT': 'Authentication check timed out. Redirecting to sign in.',
      'TOKEN_VALIDATION_FAILED': 'Authentication token invalid. Please sign in again.',
      'NETWORK_ERROR': 'Network connection issue. Please check your connection and try again.',
      'FIREBASE_ERROR': 'Authentication service unavailable. Please try again.',
      'UNKNOWN_ERROR': 'An unexpected error occurred. Please try again.'
    };

    return {
      code,
      message,
      details,
      timestamp: new Date(),
      recoverable,
      userMessage: userMessages[code] || userMessages['UNKNOWN_ERROR']
    };
  }

  // Handle cross-domain authentication errors
  handleCrossDomainError(error: any): AuthError {
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      return this.createError(
        'NETWORK_ERROR',
        'Cross-domain request blocked or network error',
        error,
        true
      );
    }

    if (error.status === 401) {
      return this.createError(
        'UNAUTHORIZED',
        'Authentication required on main domain',
        error,
        true
      );
    }

    if (error.status === 404) {
      return this.createError(
        'ENDPOINT_MISSING',
        'Authentication endpoint not available on main domain',
        error,
        false
      );
    }

    return this.createError(
      'CROSS_DOMAIN_FAILED',
      'Cross-domain authentication check failed',
      error,
      true
    );
  }

  // Handle postMessage communication errors
  handlePostMessageError(error: any): AuthError {
    if (error.code === 'TIMEOUT') {
      return this.createError(
        'POSTMESSAGE_TIMEOUT',
        'PostMessage authentication request timed out',
        error,
        true
      );
    }

    return this.createError(
      'POSTMESSAGE_FAILED',
      'PostMessage communication failed',
      error,
      true
    );
  }

  // Handle Firebase authentication errors
  handleFirebaseError(error: any): AuthError {
    const firebaseErrorMap: Record<string, { message: string; recoverable: boolean }> = {
      'auth/invalid-custom-token': {
        message: 'Authentication token is invalid or expired',
        recoverable: true
      },
      'auth/custom-token-mismatch': {
        message: 'Authentication token does not match the expected format',
        recoverable: true
      },
      'auth/network-request-failed': {
        message: 'Network error during authentication',
        recoverable: true
      },
      'auth/too-many-requests': {
        message: 'Too many authentication attempts. Please wait and try again.',
        recoverable: true
      },
      'auth/user-disabled': {
        message: 'Your account has been disabled. Please contact support.',
        recoverable: false
      }
    };

    const errorInfo = firebaseErrorMap[error.code] || {
      message: 'Firebase authentication error',
      recoverable: true
    };

    return this.createError(
      error.code || 'FIREBASE_ERROR',
      errorInfo.message,
      error,
      errorInfo.recoverable
    );
  }

  // Determine if should retry authentication
  shouldRetry(method: string): boolean {
    const recentAttempts = this.attempts
      .filter(a => a.method === method && !a.success)
      .filter(a => Date.now() - a.timestamp.getTime() < 5 * 60 * 1000); // Last 5 minutes

    return recentAttempts.length < this.maxAttempts;
  }

  // Calculate retry delay with exponential backoff
  getRetryDelay(method: string): number {
    const recentFailures = this.attempts
      .filter(a => a.method === method && !a.success)
      .length;

    return this.retryDelay * Math.pow(2, Math.min(recentFailures, 4));
  }

  // Get authentication summary for debugging
  getAuthSummary(): {
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    lastError?: AuthError;
    recommendedAction: string;
  } {
    const successful = this.attempts.filter(a => a.success).length;
    const failed = this.attempts.filter(a => !a.success).length;
    const lastError = this.attempts
      .filter(a => !a.success)
      .map(a => a.error)
      .filter(Boolean)
      .pop();

    let recommendedAction = 'Continue with normal authentication flow';
    
    if (failed > 0 && successful === 0) {
      if (failed >= this.maxAttempts) {
        recommendedAction = 'All authentication methods failed. Check network connection and try refreshing.';
      } else {
        recommendedAction = 'Some authentication methods failed. Trying alternative methods.';
      }
    }

    return {
      totalAttempts: this.attempts.length,
      successfulAttempts: successful,
      failedAttempts: failed,
      lastError,
      recommendedAction
    };
  }

  // Clear attempt history
  clearHistory(): void {
    this.attempts = [];
  }

  // Export attempts for debugging
  exportAttempts(): AuthAttempt[] {
    return [...this.attempts];
  }
}

// Singleton instance
export const authErrorHandler = new AuthErrorHandler();

// Utility functions for common error scenarios
export const handleAuthError = (error: any, method: string): AuthError => {
  let authError: AuthError;

  switch (method) {
    case 'cross_domain_check':
      authError = authErrorHandler.handleCrossDomainError(error);
      break;
    case 'postmessage':
      authError = authErrorHandler.handlePostMessageError(error);
      break;
    case 'token_validation':
      authError = authErrorHandler.handleFirebaseError(error);
      break;
    default:
      authError = authErrorHandler.createError(
        'UNKNOWN_ERROR',
        'Unknown authentication error',
        error,
        true
      );
  }

  authErrorHandler.logAttempt({
    method: method as any,
    timestamp: new Date(),
    success: false,
    error: authError
  });

  return authError;
};

export const logAuthSuccess = (method: string, duration?: number): void => {
  authErrorHandler.logAttempt({
    method: method as any,
    timestamp: new Date(),
    success: true,
    duration
  });
}; 