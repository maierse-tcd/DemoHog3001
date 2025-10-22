/**
 * React hook for demo mode detection and management
 */

import { useState, useEffect } from 'react';
import { useFeatureFlag } from './useFeatureFlag';
import { isDemoMode as checkDemoMode, enableDemoMode as enable, disableDemoMode as disable } from '../utils/demoAuth';

export const useDemoMode = () => {
  const [isDemoModeActive, setIsDemoModeActive] = useState(false);
  const demoModeFeatureFlag = useFeatureFlag('demo_mode');
  
  useEffect(() => {
    // Check if demo mode is active via query param or localStorage
    const queryParamDemo = checkDemoMode();
    
    // Demo mode is active if either feature flag is on OR query param is present
    const isActive = demoModeFeatureFlag || queryParamDemo;
    setIsDemoModeActive(isActive);
    
    console.log(`🎭 [${new Date().toISOString()}] Demo mode status: ${isActive ? 'ACTIVE' : 'INACTIVE'} (flag: ${demoModeFeatureFlag}, query: ${queryParamDemo})`);
  }, [demoModeFeatureFlag]);
  
  return {
    isDemoMode: isDemoModeActive,
    enableDemoMode: enable,
    disableDemoMode: disable
  };
};
