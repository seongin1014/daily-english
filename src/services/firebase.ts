import { initializeApp, getApps } from 'firebase/app';
import {
  initializeAuth,
  onAuthStateChanged,
  signInWithCredential,
  OAuthProvider,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  type User,
  // @ts-ignore — getReactNativePersistence exists in firebase/auth/react-native
} from 'firebase/auth';
// @ts-ignore
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Replace with your Firebase project config
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT.firebasestorage.app',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

// Initialize Firebase (singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Auth with AsyncStorage persistence (tokens survive app restart)
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
export const storage = getStorage(app);

export { auth, onAuthStateChanged, type User };

// --- Auth helpers ---

export async function signInWithApple(identityToken: string, nonce: string): Promise<User> {
  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({ idToken: identityToken, rawNonce: nonce });
  const result = await signInWithCredential(auth, credential);
  await ensureUserDocument(result.user);
  return result.user;
}

export async function signInWithGoogle(idToken: string): Promise<User> {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  await ensureUserDocument(result.user);
  return result.user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function getIdToken(forceRefresh = false): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.getIdToken(forceRefresh);
}

// --- Firestore helpers ---

async function ensureUserDocument(user: User): Promise<void> {
  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) {
    await setDoc(userRef, {
      email: user.email ?? '',
      displayName: user.displayName ?? '',
      createdAt: new Date().toISOString(),
      subscription: 'free',
    });
  }
}

export async function getMonthlyUsage(uid: string): Promise<{ recordingCount: number; limit: number }> {
  const monthKey = new Date().toISOString().slice(0, 7); // YYYY-MM
  const usageRef = doc(db, 'users', uid, 'usage', monthKey);
  const usageDoc = await getDoc(usageRef);

  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);
  const subscription = userDoc.data()?.subscription ?? 'free';
  const limit = subscription === 'pro' ? 999999 : 5;

  return {
    recordingCount: usageDoc.exists() ? (usageDoc.data()?.recordingCount ?? 0) : 0,
    limit,
  };
}
