import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';

import { firebaseAuth, isFirebaseConfigured } from '../services/firebase';

export type AuthUser = {
  uid: string;
  email: string | null;
};

type AuthContextType = {
  firebaseReady: boolean;
  authReady: boolean;
  user: AuthUser | null;
  authError: string | null;
  clearAuthError: () => void;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function toAuthUser(user: User | null): AuthUser | null {
  if (!user) return null;

  return { uid: user.uid, email: user.email };
}

function describeAuthError(error: unknown): string {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';

  switch (code) {
    case 'auth/email-already-in-use':
      return 'Ese correo ya tiene una cuenta. Prueba a iniciar sesión.';
    case 'auth/invalid-email':
      return 'El correo no tiene un formato válido.';
    case 'auth/weak-password':
      return 'La contraseña es demasiado corta. Usa al menos 6 caracteres.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Correo o contraseña incorrectos.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Espera un momento antes de volver a probar.';
    case 'auth/network-request-failed':
      return 'No hay conexión con Firebase. Revisa tu red.';
    default:
      return error instanceof Error
        ? error.message
        : 'No pudimos completar la operación.';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authReady, setAuthReady] = useState(!isFirebaseConfigured);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseAuth) {
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, (nextUser) => {
      setUser(toAuthUser(nextUser));
      setAuthReady(true);
    });

    return unsubscribe;
  }, []);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!firebaseAuth) {
      throw new Error('Firebase no está configurado.');
    }

    setAuthError(null);

    try {
      await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
    } catch (error) {
      const message = describeAuthError(error);
      setAuthError(message);
      throw new Error(message);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!firebaseAuth) {
      throw new Error('Firebase no está configurado.');
    }

    setAuthError(null);

    try {
      await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
    } catch (error) {
      const message = describeAuthError(error);
      setAuthError(message);
      throw new Error(message);
    }
  }, []);

  const signOutUser = useCallback(async () => {
    if (!firebaseAuth) return;

    await signOut(firebaseAuth);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      firebaseReady: isFirebaseConfigured,
      authReady,
      user,
      authError,
      clearAuthError,
      signUp,
      signIn,
      signOutUser,
    }),
    [
      authReady,
      user,
      authError,
      clearAuthError,
      signUp,
      signIn,
      signOutUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de AuthProvider');
  }

  return context;
}
