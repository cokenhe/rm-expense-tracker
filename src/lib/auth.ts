import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "./firebase";

export async function signUpWithEmail(
  auth: Auth,
  email: string,
  password: string,
  name?: string
) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  // Create user profile in Firestore
  const now = Timestamp.now();
  const userId = userCredential.user.uid;
  const userData = {
    id: userId,
    uid: userId,
    email: userCredential.user.email || "",
    createdAt: now,
    updatedAt: now,
    displayName: name || null,
  };

  await setDoc(doc(db, "users", userId), userData);

  return userCredential;
}

export async function signInWithEmail(
  auth: Auth,
  email: string,
  password: string
) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signOutUser(auth: Auth) {
  return signOut(auth);
}
