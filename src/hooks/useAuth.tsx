import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Set up auth state listener FIRST - wrapped in try-catch to prevent crashes
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!isMounted) return;

          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            // Use setTimeout to avoid Supabase auth deadlock
            setTimeout(async () => {
              if (!isMounted) return;
              try {
                const { data } = await supabase.rpc('is_admin', { _user_id: session.user.id });
                if (isMounted) setIsAdmin(!!data);
              } catch {
                if (isMounted) setIsAdmin(false);
              }
              if (isMounted) setLoading(false);
            }, 0);
          } else {
            setIsAdmin(false);
            setLoading(false);
          }
        }
      );

      // THEN check for existing session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!isMounted) return;
        if (session) {
          setSession(session);
          setUser(session.user);
        }
        // Don't set loading false here - let onAuthStateChange handle it
      }).catch(() => {
        // Handle session fetch error silently
        if (isMounted) setLoading(false);
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    } catch (error) {
      // If Supabase fails (e.g., rate limit), still allow app to load
      logger.warn('Auth initialization failed:', error);
      if (isMounted) setLoading(false);
    }
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin === 'http://localhost:8080' 
            ? 'http://localhost:8080/auth'
            : 'https://go-nepal.vercel.app/auth',
          data: {
            full_name: fullName || '',
            role: 'Tourist',
          },
        },
      });

      logger.log('Signup response:', { data, error });

      return { error };
    } catch (error) {
      logger.error('Signup error:', error);
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
