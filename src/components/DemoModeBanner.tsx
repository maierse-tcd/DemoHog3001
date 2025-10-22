/**
 * Demo Mode Banner Component
 * Displays a banner at the top of the page when demo mode is active
 */

import { useDemoMode } from '../hooks/useDemoMode';
import { Button } from './ui/button';

export const DemoModeBanner = () => {
  const { isDemoMode, disableDemoMode } = useDemoMode();
  
  if (!isDemoMode) return null;
  
  const handleExitDemoMode = () => {
    disableDemoMode();
    window.location.href = '/';
  };
  
  return (
    <div className="bg-yellow-500 text-black px-4 py-2 text-center text-sm font-medium shadow-lg">
      <span className="inline-flex items-center gap-2">
        🎭 Demo Mode Active - No real authentication required
        <Button 
          onClick={handleExitDemoMode}
          variant="ghost"
          size="sm"
          className="ml-4 underline text-black hover:text-black/80 h-auto py-0 px-2"
        >
          Exit Demo Mode
        </Button>
      </span>
    </div>
  );
};
