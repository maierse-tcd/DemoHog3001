import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

interface PostHogIdentificationContextType {
  isIdentified: boolean;
  isIdentifying: boolean;
}

const PostHogIdentificationContext = createContext<PostHogIdentificationContextType>({
  isIdentified: false,
  isIdentifying: false
});

export const usePostHogIdentification = () => useContext(PostHogIdentificationContext);

export const PostHogIdentificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [isIdentified, setIsIdentified] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (isLoggedIn && !isIdentified) {
      setIsIdentifying(true);
    } else if (!isLoggedIn) {
      setIsIdentified(false);
      setIsIdentifying(false);
    }
  }, [isLoggedIn, isIdentified]);

  // Method to mark identification as complete
  const markAsIdentified = () => {
    setIsIdentified(true);
    setIsIdentifying(false);
  };

  // Expose the markAsIdentified function globally for the auth integration
  useEffect(() => {
    (window as any).__postHogIdentified = markAsIdentified;
    return () => {
      delete (window as any).__postHogIdentified;
    };
  }, []);

  return (
    <PostHogIdentificationContext.Provider value={{ isIdentified, isIdentifying }}>
      {children}
    </PostHogIdentificationContext.Provider>
  );
};