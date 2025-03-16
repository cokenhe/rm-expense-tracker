import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Timestamp,
  query,
  where,
} from "firebase/firestore";
import { useState, useCallback } from "react";
import { db } from "../lib/firebase";
import { UserProfile, CreateUserProfileData } from "../types/user";

export function useUsers() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createUserProfile = useCallback(
    async (userId: string, data: CreateUserProfileData): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const now = Timestamp.now();
        await setDoc(doc(db, "users", userId), {
          ...data,
          id: userId,
          createdAt: now,
          updatedAt: now,
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error("Failed to create user profile")
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getUserProfile = useCallback(
    async (userId: string): Promise<UserProfile | null> => {
      try {
        setLoading(true);
        setError(null);

        const userDoc = await getDoc(doc(db, "users", userId));

        if (!userDoc.exists()) {
          return null;
        }

        const data = userDoc.data();
        return {
          ...data,
          id: userDoc.id,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as UserProfile;
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to get user profile")
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getAllUsers = useCallback(async (): Promise<UserProfile[]> => {
    try {
      setLoading(true);
      setError(null);

      const querySnapshot = await getDocs(collection(db, "users"));
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as UserProfile;
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to get users"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchUsers = useCallback(
    async (email: string): Promise<UserProfile[]> => {
      try {
        setLoading(true);
        setError(null);

        const q = query(
          collection(db, "users"),
          where("email", ">=", email),
          where("email", "<=", email + "\uf8ff")
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
          } as UserProfile;
        });
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to search users")
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    createUserProfile,
    getUserProfile,
    getAllUsers,
    searchUsers,
  };
}
