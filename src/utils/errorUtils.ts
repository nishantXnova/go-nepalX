/**
 * Utility to sanitize error messages before showing them to users.
 * Returns a generic safe version of sensitive error messages.
 */
export const getSafeErrorMessage = (error: string | any): string => {
  const message = typeof error === 'string' ? error : (error?.message || String(error));
  const lowerMessage = message.toLowerCase();

  // Handle common Supabase/Network errors with user-friendly messages
  if (lowerMessage.includes('invalid login credentials')) {
    return 'Invalid email or password. Please try again.';
  }
  if (lowerMessage.includes('user already exists')) {
    return 'An account with this email already exists.';
  }
  if (lowerMessage.includes('rate limit')) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  if (lowerMessage.includes('network error') || lowerMessage.includes('failed to fetch')) {
    return 'Network connection issue. Please check your internet and try again.';
  }
  if (lowerMessage.includes('email not confirmed')) {
    return 'Please confirm your email address before signing in.';
  }
  if (lowerMessage.includes('jwt expired')) {
    return 'Your session has expired. Please log in again.';
  }

  // Fallback for generic server errors
  if (lowerMessage.includes('internal server error') || lowerMessage.includes('500')) {
    return 'A server error occurred. Our team has been notified. Please try later.';
  }

  // If it's a known non-sensitive message, return it, otherwise generic help
  const isGenericHelp = lowerMessage.length > 100 || 
                        lowerMessage.includes('sql') || 
                        lowerMessage.includes('database') ||
                        lowerMessage.includes('exception');

  return isGenericHelp ? 'An unexpected error occurred. Please try again later.' : message;
};
