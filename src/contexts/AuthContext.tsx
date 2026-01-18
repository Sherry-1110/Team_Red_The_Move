import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthChange } from '../utilities/auth';

type AuthContextType = {
  user: FirebaseUser | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

// Mock user for development
const mockFirebaseUser = {
  uid: 'user-1',
  displayName: 'Alec',
  email: 'alec@northwestern.edu',
} as unknown as FirebaseUser;

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const useMockUser = import.meta.env.VITE_USE_MOCK_USER === 'true';

  useEffect(() => {
    if (useMockUser) {
      // Use mock user in development
      setUser(mockFirebaseUser);
      setLoading(false);
    } else {
      // Use real Firebase auth
      const unsubscribe = onAuthChange((firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [useMockUser]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
