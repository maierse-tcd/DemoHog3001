// Comprehensive cleanup function for all auth-related data
export const cleanupAllAuthData = () => {
  try {
    console.log('Starting comprehensive auth data cleanup...');
    
    // Get all localStorage keys to clean up
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('supabase.auth.') ||
        key.includes('sb-') ||
        key.startsWith('posthog_') ||
        key === 'ph_last_auth_check' ||
        key === 'posthog_email_cache' ||
        key === 'posthog_last_identified_user' ||
        key === 'posthog_last_groups'
      )) {
        keysToRemove.push(key);
      }
    }
    
    // Remove all auth-related keys
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`Removed localStorage key: ${key}`);
    });
    
    // Also clear sessionStorage if used
    const sessionKeysToRemove = [];
    if (typeof sessionStorage !== 'undefined') {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (
          key.startsWith('supabase.auth.') ||
          key.includes('sb-') ||
          key.startsWith('posthog_')
        )) {
          sessionKeysToRemove.push(key);
        }
      }
      sessionKeysToRemove.forEach(key => {
        sessionStorage.removeItem(key);
        console.log(`Removed sessionStorage key: ${key}`);
      });
    }
    
    console.log('Auth data cleanup completed');
  } catch (error) {
    console.error('Error during auth data cleanup:', error);
  }
};