import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import Toast from "@/components/Toast";
import { dbOperations, initDatabase, saveFile, User } from "@/lib/database";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateUUID } from "@/utils/common";

type AuthContextType = {
  session: { user: { id: string } } | null;
  userProfile: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  checkUser: () => Promise<boolean>;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<{ user: { id: string } } | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Initialize database
  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();
        const userId = await AsyncStorage.getItem("userId");
        if (userId) {
          const user = await dbOperations.getUser(userId);
          if (user) {
            setSession({ user: { id: userId } });
            setUserProfile(user);
          }
        }
      } catch (error) {
        console.error("Error initializing:", error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);

      // Check if user already exists
      const existingUser = await dbOperations.getUser(email);
      if (existingUser) {
        throw new Error("User already exists");
      }

      const userId = generateUUID();
      const newUser: User = {
        id: userId,
        email,
        password, // In a real app, you should hash the password
        name,
        created_at: new Date().toISOString(),
      };

      await dbOperations.createUser(newUser);
      await AsyncStorage.setItem("userId", userId);

      setSession({ user: { id: userId } });
      setUserProfile(newUser);

      router.replace("/(main)");
    } catch (error: any) {
      console.error("Signup error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      const user = await dbOperations.getUser(email);
      if (!user || user.password !== password) {
        // In a real app, you should compare hashed passwords
        throw new Error("Invalid email or password");
      }

      await AsyncStorage.setItem("userId", user.id);
      setSession({ user: { id: user.id } });
      setUserProfile(user);

      router.replace("/(main)");
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await AsyncStorage.removeItem("userId");
      setSession(null);
      setUserProfile(null);
      router.replace("/");
    } catch (error: any) {
      console.error("Sign out error:", error);
      Toast.show({
        type: "error",
        message: "An error occurred while signing out",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      if (!session?.user) throw new Error("No user logged in");

      if (updates.image) {
        const fileName = `${session.user.id}_${Date.now()}.jpg`;
        const fileUri = await saveFile(updates.image, fileName);
        updates.image = fileUri;
      }

      await dbOperations.updateUser(session.user.id, updates);
      setUserProfile((prev) => (prev ? { ...prev, ...updates } : null));
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  };

  const checkUser = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) return false;

      const user = await dbOperations.getUser(userId);
      if (!user) return false;

      setUserProfile(user);
      return true;
    } catch (error) {
      console.error("Error checking user:", error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        userProfile,
        loading,
        signUp,
        signIn,
        signOut,
        updateProfile,
        checkUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
