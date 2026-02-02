import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../firebase';

const googleProvider = new GoogleAuthProvider();

const EDU_DOMAIN_SUFFIX = '.edu';

function isEduEmail(email: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith(EDU_DOMAIN_SUFFIX);
}

export const signInWithGoogle = async (): Promise<FirebaseUser> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    if (!isEduEmail(user.email)) {
      await firebaseSignOut(auth);
      throw new Error(
        'Access Restricted: Please sign in with your Northwestern or other .edu school email.',
      );
    }

    return user;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Access Restricted')) {
      throw error;
    }
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const onAuthChange = (
  callback: (user: FirebaseUser | null) => void,
): (() => void) => {
  return onAuthStateChanged(auth, callback);
};
