import { Platform } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import type { Auth, Persistence } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const { getAuth, initializeAuth } = FirebaseAuth;

// Según Expo, en React Native `getReactNativePersistence` se exporta en el
// entry de RN. Los tipos de `firebase/auth` apuntan al entry web, así que se
// declara aquí de forma explícita.
type FirebaseAuthWithRn = typeof FirebaseAuth & {
  getReactNativePersistence?: (storage: typeof AsyncStorage) => Persistence;
};

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

/**
 * La API key web de Firebase es un identificador público: la seguridad real
 * depende de las reglas de Auth, Firestore y Storage.
 */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.appId
);

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

  if (Platform.OS === 'web') {
    authInstance = getAuth(app);
  } else {
    try {
      const getRnPersistence = (FirebaseAuth as FirebaseAuthWithRn)
        .getReactNativePersistence;

      authInstance = getRnPersistence
        ? initializeAuth(app, {
            persistence: getRnPersistence(AsyncStorage),
          })
        : initializeAuth(app);
    } catch {
      // Fast Refresh puede reinicializar el módulo; reutilizamos la instancia.
      authInstance = getAuth(app);
    }
  }

  firestoreInstance = getFirestore(app);
  storageInstance = getStorage(app);
}

export const firebaseAuth = authInstance;
export const firestore = firestoreInstance;
export const cloudStorage = storageInstance;

export function requireFirebase() {
  if (!firebaseAuth || !firestore || !cloudStorage) {
    throw new Error(
      'Firebase no está configurado. Añade las variables EXPO_PUBLIC_FIREBASE_* en .env y reinicia Expo.'
    );
  }

  return {
    auth: firebaseAuth,
    db: firestore,
    storage: cloudStorage,
  };
}
