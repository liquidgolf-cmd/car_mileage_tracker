/**
 * Error handler to suppress non-critical console errors
 * that don't affect app functionality
 * 
 * These errors are typically from:
 * - Vercel Analytics/Monitoring services
 * - Browser extensions
 * - Third-party scripts
 */

const suppressedErrors = [
  // Vercel Analytics/Monitoring 404s (harmless - service not configured)
  '/api/v2/projects',
  '/api/v9/projects',
  'api/v2/projects',
  'api/v9/projects',
  // Sentry rate limiting (harmless - monitoring service)
  'ingest.sentry.io',
  '429',
  // Font CSP warnings (from Vercel's CSP, doesn't affect app)
  'font-src',
  'Content Security Policy',
  'violates the following Content Security Policy',
  // CoreLocation framework errors (harmless browser location warnings)
  'CoreLocation',
  'CoreLocationProvider',
  'kCLError',
  'kCLErrorLocationUnknown'
];

const suppressedWarnings = [
  // Zustand deprecation (non-critical, will update later)
  'createWithEqualityFn',
  'useStoreWithEqualityFn',
  'DEPRECATED] Use',
  // Performance warnings (informational only)
  'preload',
  'was preloaded using link preload but not used',
  'Deprecated API for given entry type'
];

/**
 * Check if an error should be suppressed
 */
export function shouldSuppressError(message: string, source?: string): boolean {
  const fullMessage = `${message} ${source || ''}`.toLowerCase();
  
  return suppressedErrors.some(pattern => 
    fullMessage.includes(pattern.toLowerCase())
  );
}

/**
 * Check if a warning should be suppressed
 */
export function shouldSuppressWarning(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  
  return suppressedWarnings.some(pattern => 
    lowerMessage.includes(pattern.toLowerCase())
  );
}

/**
 * Setup error suppression for non-critical errors
 */
export function setupErrorSuppression(): void {
  const originalError = console.error;
  const originalWarn = console.warn;

  // Override console.error to filter out non-critical errors
  console.error = (...args: any[]) => {
    const source = args[1]?.toString() || '';
    
    // Check all arguments for error patterns
    const allArgs = args.map(arg => 
      typeof arg === 'string' ? arg : 
      arg?.message || arg?.toString() || ''
    ).join(' ');
    
    if (!shouldSuppressError(allArgs, source)) {
      originalError.apply(console, args);
    }
  };

  // Override console.warn to filter out non-critical warnings
  console.warn = (...args: any[]) => {
    // Check all arguments for warning patterns
    const allArgs = args.map(arg => 
      typeof arg === 'string' ? arg : 
      arg?.toString() || ''
    ).join(' ');
    
    if (!shouldSuppressWarning(allArgs)) {
      originalWarn.apply(console, args);
    }
  };

  // Suppress unhandled promise rejections for known non-critical errors
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason?.toString() || '';
    const errorMessage = event.reason?.message || '';
    
    if (shouldSuppressError(reason + ' ' + errorMessage)) {
      event.preventDefault();
    }
  });
}
