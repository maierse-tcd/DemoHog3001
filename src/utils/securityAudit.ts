// Security audit and monitoring utilities

import { supabase } from '../integrations/supabase/client';

export interface SecurityEvent {
  action: string;
  tableName?: string;
  oldValues?: any;
  newValues?: any;
  metadata?: Record<string, any>;
}

export const logSecurityEvent = async (event: SecurityEvent) => {
  try {
    // Get basic client information
    const userAgent = navigator.userAgent;
    const timestamp = new Date().toISOString();
    
    // Attempt to log to security audit table if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { error } = await supabase
        .from('security_audit_log')
        .insert({
          user_id: user.id,
          action: event.action,
          table_name: event.tableName,
          old_values: event.oldValues,
          new_values: event.newValues,
          user_agent: userAgent.substring(0, 500), // Limit length
          created_at: timestamp
        });
      
      if (error) {
        console.error('Failed to log security event to database:', error);
      }
    }
    
    // Always log to console for debugging
    console.log('Security Event:', {
      ...event,
      timestamp,
      userId: user?.id,
      userAgent: userAgent.substring(0, 100)
    });
  } catch (error) {
    console.error('Security audit logging failed:', error);
  }
};

export const checkPasswordStrength = (password: string): {
  score: number;
  feedback: string[];
  isStrong: boolean;
} => {
  const feedback: string[] = [];
  let score = 0;
  
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Use at least 8 characters');
  }
  
  if (password.length >= 12) {
    score += 1;
  } else {
    feedback.push('Use 12 or more characters for better security');
  }
  
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include lowercase letters');
  }
  
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include uppercase letters');
  }
  
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include numbers');
  }
  
  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include special characters');
  }
  
  // Check for common patterns
  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    feedback.push('Avoid repeated characters');
  }
  
  if (/123|abc|qwerty|password/i.test(password)) {
    score -= 2;
    feedback.push('Avoid common patterns');
  }
  
  return {
    score: Math.max(0, score),
    feedback,
    isStrong: score >= 4
  };
};

export const detectSuspiciousActivity = (events: SecurityEvent[]): boolean => {
  // Check for rapid successive failed login attempts
  const failedLogins = events.filter(e => 
    e.action === 'login_failed' && 
    new Date().getTime() - new Date(e.metadata?.timestamp || 0).getTime() < 5 * 60 * 1000
  );
  
  if (failedLogins.length >= 5) {
    logSecurityEvent({
      action: 'suspicious_activity_detected',
      metadata: { 
        type: 'rapid_failed_logins', 
        count: failedLogins.length 
      }
    });
    return true;
  }
  
  // Check for unusual upload patterns
  const recentUploads = events.filter(e => 
    e.action === 'file_upload' && 
    new Date().getTime() - new Date(e.metadata?.timestamp || 0).getTime() < 60 * 1000
  );
  
  if (recentUploads.length >= 20) {
    logSecurityEvent({
      action: 'suspicious_activity_detected',
      metadata: { 
        type: 'rapid_file_uploads', 
        count: recentUploads.length 
      }
    });
    return true;
  }
  
  return false;
};

export const sanitizeUserInput = (input: string, maxLength: number = 1000): string => {
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=\s*['"]/gi, '') // Remove event handlers
    .replace(/data:text\/html/gi, '') // Remove data URLs
    .substring(0, maxLength) // Limit length
    .trim();
};

export const validateCSRFToken = (): boolean => {
  // Basic CSRF protection - check for custom header
  // In a real implementation, this would validate against a server-generated token
  return true; // Simplified for this demo
};

export const checkSessionSecurity = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return false;
    }
    
    // Check if session is close to expiring
    const expiresAt = session.expires_at;
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = expiresAt ? expiresAt - now : 0;
    
    if (timeUntilExpiry < 300) { // Less than 5 minutes
      logSecurityEvent({
        action: 'session_near_expiry',
        metadata: { timeUntilExpiry }
      });
    }
    
    return true;
  } catch (error) {
    logSecurityEvent({
      action: 'session_check_failed',
      metadata: { error: String(error) }
    });
    return false;
  }
};

export const securityHealthCheck = async (): Promise<{
  score: number;
  issues: string[];
  recommendations: string[];
}> => {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 100;
  
  // Check session security
  const sessionValid = await checkSessionSecurity();
  if (!sessionValid) {
    issues.push('Invalid or expired session');
    recommendations.push('Please log in again');
    score -= 50;
  }
  
  // Check localStorage for sensitive data
  const sensitiveKeys = Object.keys(localStorage).filter(key => 
    key.includes('password') || key.includes('token') || key.includes('secret')
  );
  
  if (sensitiveKeys.length > 0) {
    issues.push('Sensitive data found in localStorage');
    recommendations.push('Clear browser data and avoid storing sensitive information locally');
    score -= 20;
  }
  
  // Check for HTTPS
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    issues.push('Connection is not secure');
    recommendations.push('Use HTTPS for all communications');
    score -= 30;
  }
  
  return {
    score: Math.max(0, score),
    issues,
    recommendations
  };
};