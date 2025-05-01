
import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithPopup,
  signInAnonymously,
  updateProfile,
  UserCredential
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, googleProvider, facebookProvider, db } from "@/lib/firebase";
import { toast } from "sonner";

// Define the user type that includes Firestore data
export interface DungeonKeeperUser extends User {
  // We don't need to redefine properties that are already in User
  // Just add any additional properties we need
  customMetadata?: {
    lastLogin: Date;
    characterLevel: number;
  };
}

interface AuthContextType {
  currentUser: DungeonKeeperUser | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<UserCredential>;
  logIn: (email: string, password: string) => Promise<UserCredential>;
  logOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
  googleSignIn: () => Promise<UserCredential>;
  facebookSignIn: () => Promise<UserCredential>;
  anonymousSignIn: () => Promise<UserCredential>;
  verifyEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Notification messages
const messages = {
  loginSuccess: (name: string) => `🔥 Tochas Acesas! Bem-vindo, ${name || 'Aventureiro'}!`,
  loginError: "🧙 Magia Falhou! Credenciais incorretas.",
  signupSuccess: "🛡️ Bem-vindo à Guilda! Verifique seu email.",
  signupError: "🪶 Pergaminho Danificado! Não foi possível criar conta.",
  accountLocked: "🛡️ Portal Bloqueado! Muitas tentativas.",
  resetPassword: "🔮 Feitiço Enviado! Verifique seu email.",
  logoutSuccess: "🌙 As tochas foram apagadas! Até a próxima aventura!",
  verifyEmail: "📜 Pergaminho enviado! Verifique seu email.",
  genericError: "🧝‍♂️ Por elfos! Algo deu errado."
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<DungeonKeeperUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function createUserDocument(user: User) {
    if (!user?.uid) return;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      try {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
          customMetadata: {
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            characterLevel: 1
          }
        });
      } catch (error) {
        console.error("Error creating user document:", error);
      }
    } else {
      try {
        await updateDoc(userRef, {
          "customMetadata.lastLogin": serverTimestamp()
        });
      } catch (error) {
        console.error("Error updating last login:", error);
      }
    }
  }

  async function signUp(email: string, password: string) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(result.user);
    toast(messages.signupSuccess);
    return result;
  }

  async function logIn(email: string, password: string) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      toast(messages.loginSuccess(result.user.displayName || ''));
      return result;
    } catch (error) {
      toast.error(messages.loginError);
      throw error;
    }
  }

  async function logOut() {
    toast(messages.logoutSuccess);
    return signOut(auth);
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
    toast(messages.resetPassword);
  }

  async function updateUserProfile(displayName: string) {
    if (!auth.currentUser) return;
    await updateProfile(auth.currentUser, { displayName });
    
    // Update the user document in Firestore
    const userRef = doc(db, "users", auth.currentUser.uid);
    await updateDoc(userRef, { displayName });
    
    // Update local state
    setCurrentUser(prev => prev ? { ...prev, displayName } : null);
  }

  async function googleSignIn() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      toast(messages.loginSuccess(result.user.displayName || ''));
      return result;
    } catch (error) {
      toast.error(messages.genericError);
      throw error;
    }
  }

  async function facebookSignIn() {
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      toast(messages.loginSuccess(result.user.displayName || ''));
      return result;
    } catch (error) {
      toast.error(messages.genericError);
      throw error;
    }
  }

  async function anonymousSignIn() {
    try {
      const result = await signInAnonymously(auth);
      toast(messages.loginSuccess("Aventureiro Anônimo"));
      return result;
    } catch (error) {
      toast.error(messages.genericError);
      throw error;
    }
  }

  async function verifyEmail() {
    if (!auth.currentUser) return;
    await sendEmailVerification(auth.currentUser);
    toast(messages.verifyEmail);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await createUserDocument(user);
        setCurrentUser(user as DungeonKeeperUser);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    loading,
    signUp,
    logIn,
    logOut,
    resetPassword,
    updateUserProfile,
    googleSignIn,
    facebookSignIn,
    anonymousSignIn,
    verifyEmail
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
