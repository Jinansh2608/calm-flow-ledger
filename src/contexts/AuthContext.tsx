import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AuthService } from "@/services/api";

interface AuthContextType {
  user: any;
  loading: boolean;
  isAuthenticated: boolean;
  login: (u: string, p: string) => Promise<void>;
  signup: (u: string, e: string, p: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      if (AuthService.isAuthenticated()) {
        try {
          const userData = await AuthService.getMe();
          setUser(userData);
        } catch (error) {
          console.warn("Failed to fetch user data from backend, but token exists. Using cached user:", error);
          // Don't logout - keep the user logged in with cached data
          // Try to use cached user if available
          const cachedUser = AuthService.getUser();
          if (cachedUser) {
            setUser(cachedUser);
          } else {
            // If no cached user, set minimal user object to keep authenticated
            setUser({ authenticated: true });
          }
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      // Only logout on actual authentication failures, not on network errors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    const data = await AuthService.login(username, password);
    if (data.user) {
      setUser(data.user);
    } else {
      await checkAuth(); // Fallback to getMe if user wasn't in login payload
    }
  };

  const signup = async (username: string, email: string, password: string) => {
    const data = await AuthService.signup(username, email, password);
    // Always set user data immediately - don't call checkAuth to avoid extra API call
    if (data.user) {
      setUser(data.user);
    } else if (data.access_token) {
      // If we have a token but no user, fetch user data
      await checkAuth();
    }
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      login,
      signup,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};
