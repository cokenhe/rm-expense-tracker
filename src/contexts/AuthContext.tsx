import { onAuthStateChanged } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { useUsers } from "../hooks/useUsers";
import { signInWithEmail, signOutUser, signUpWithEmail } from "../lib/auth";
import { auth } from "../lib/firebase";
import { AuthContextType, AuthProviderProps } from "../types/auth";
import { UserProfile } from "../types/user";

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { getUserProfile } = useUsers();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log(
        "Auth state changed:",
        firebaseUser ? "User logged in" : "No user"
      );

      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          if (profile) {
            setUser({ ...profile, uid: profile.id });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setError(error as Error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [getUserProfile]);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      await signInWithEmail(auth, email, password);
    } catch (error) {
      console.error("Sign in error:", error);
      setError(error as Error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setError(null);
      await signUpWithEmail(auth, email, password, name);
    } catch (error) {
      console.error("Sign up error:", error);
      setError(error as Error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await signOutUser(auth);
    } catch (error) {
      console.error("Sign out error:", error);
      setError(error as Error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
