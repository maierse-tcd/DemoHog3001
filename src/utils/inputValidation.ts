// Input validation and sanitization utilities

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const sanitizeInput = (input: string): string => {
  // Remove potentially dangerous characters
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=\s*['"]/gi, '')
    .trim();
};

export const sanitizeFileName = (fileName: string): string => {
  // Only allow alphanumeric characters, dots, hyphens, and underscores
  return fileName.replace(/[^a-zA-Z0-9.-_]/g, '').substring(0, 255);
};

export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

export const validateFileSize = (file: File, maxSizeInMB: number): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
};

export const rateLimitCheck = (key: string, limit: number, windowMs: number, adminOverride?: { limit?: number; windowMs?: number }): boolean => {
  const now = Date.now();
  
  // Use admin override values if provided
  const effectiveLimit = adminOverride?.limit ?? limit;
  const effectiveWindowMs = adminOverride?.windowMs ?? windowMs;
  const windowStart = now - effectiveWindowMs;
  
  // Get existing requests from localStorage
  const storedData = localStorage.getItem(`rateLimit_${key}`);
  let requests: number[] = storedData ? JSON.parse(storedData) : [];
  
  // Filter out old requests outside the time window
  requests = requests.filter(timestamp => timestamp > windowStart);
  
  // Check if we're at the limit
  if (requests.length >= effectiveLimit) {
    return false;
  }
  
  // Add current request
  requests.push(now);
  localStorage.setItem(`rateLimit_${key}`, JSON.stringify(requests));
  
  return true;
};

export const auditLog = async (action: string, tableName?: string, oldValues?: any, newValues?: any) => {
  try {
    // Get user IP and user agent (basic client info)
    const userAgent = navigator.userAgent;
    
    // Note: We can't get real IP on client side, but we can log the action
    console.log('Security Audit:', {
      action,
      tableName,
      timestamp: new Date().toISOString(),
      userAgent: userAgent.substring(0, 500) // Limit length
    });
    
    // In a real implementation, this would send to the audit log table
    // For now, we just log to console for debugging
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
};