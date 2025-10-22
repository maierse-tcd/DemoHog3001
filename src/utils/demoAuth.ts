/**
 * Demo Mode Authentication Utilities
 * Provides mock authentication that bypasses Supabase entirely
 */

export interface DemoSession {
  user: {
    id: string;
    email: string;
    user_metadata: {
      name: string;
      is_kids_account: boolean;
      language: string;
      subscription_status: string;
      subscription_plan_id: string;
      demo_user: true;
    };
  };
  access_token: string;
  expires_at: number;
}

const DEMO_SESSION_KEY = 'hogflix_demo_session';
const DEMO_MODE_KEY = 'hogflix_demo_mode';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Check if demo mode is active
 * Checks both URL query parameter and localStorage flag
 */
export const isDemoMode = (): boolean => {
  // Check URL parameter first
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('demo')) {
      // Persist demo mode to localStorage
      localStorage.setItem(DEMO_MODE_KEY, 'true');
      return true;
    }
  }
  
  // Check localStorage flag
  return localStorage.getItem(DEMO_MODE_KEY) === 'true';
};

/**
 * Create a demo session and store it in localStorage
 */
export const createDemoSession = (
  email: string,
  userData: {
    name?: string;
    is_kids_account?: boolean;
    language?: string;
    subscription_status?: string;
    subscription_plan_id?: string;
  }
): DemoSession => {
  const session: DemoSession = {
    user: {
      id: `demo_${btoa(email)}`, // Consistent ID per email
      email,
      user_metadata: {
        name: userData.name || email.split('@')[0],
        is_kids_account: userData.is_kids_account || false,
        language: userData.language || 'English',
        subscription_status: userData.subscription_status || 'active',
        subscription_plan_id: userData.subscription_plan_id || 'premium',
        demo_user: true
      }
    },
    access_token: `demo_token_${Date.now()}`,
    expires_at: Date.now() + SESSION_DURATION
  };
  
  localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
  console.log(`🎭 [${new Date().toISOString()}] Demo session created for ${email}`);
  
  return session;
};

/**
 * Retrieve existing demo session from localStorage
 * Returns null if session is expired or doesn't exist
 */
export const getDemoSession = (): DemoSession | null => {
  const stored = localStorage.getItem(DEMO_SESSION_KEY);
  if (!stored) return null;
  
  try {
    const session: DemoSession = JSON.parse(stored);
    
    // Check if session is expired
    if (Date.now() > session.expires_at) {
      console.log(`🎭 [${new Date().toISOString()}] Demo session expired, clearing...`);
      localStorage.removeItem(DEMO_SESSION_KEY);
      return null;
    }
    
    console.log(`🎭 [${new Date().toISOString()}] Demo session retrieved for ${session.user.email}`);
    return session;
  } catch (error) {
    console.error('Error parsing demo session:', error);
    localStorage.removeItem(DEMO_SESSION_KEY);
    return null;
  }
};

/**
 * Clear demo session and exit demo mode
 */
export const clearDemoSession = (): void => {
  localStorage.removeItem(DEMO_SESSION_KEY);
  localStorage.removeItem(DEMO_MODE_KEY);
  console.log(`🎭 [${new Date().toISOString()}] Demo session cleared`);
};

/**
 * Enable demo mode
 */
export const enableDemoMode = (): void => {
  localStorage.setItem(DEMO_MODE_KEY, 'true');
};

/**
 * Disable demo mode
 */
export const disableDemoMode = (): void => {
  localStorage.removeItem(DEMO_MODE_KEY);
  clearDemoSession();
};
