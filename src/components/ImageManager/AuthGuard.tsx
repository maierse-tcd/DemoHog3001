import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { useAuth } from '../../hooks/useAuth';
import { LoadingState } from './LoadingState';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const isAdmin = useFeatureFlagEnabled('is_admin');
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  
  // Check authentication status and redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      console.log("User not logged in, redirecting from ImageManager");
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);
  
  // If user is not logged in, redirect to login
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  // If user is logged in but not admin (feature flag is explicitly false), redirect to home
  if (isLoggedIn && isAdmin === false) {
    console.log("User is logged in but isAdmin feature flag is false, redirecting to home");
    return <Navigate to="/" replace />;
  }
  
  // If feature flags are still loading, show a loading state
  if (isAdmin === undefined) {
    return <LoadingState message="Loading admin access..." />;
  }
  
  return <>{children}</>;
};