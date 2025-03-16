import {
  collection,
  doc,
  getDoc,
  getDocFromCache,
  getDocs,
  getDocsFromCache,
  query,
  setDoc,
  Timestamp,
  where,
} from "firebase/firestore";
import { useCallback, useState } from "react";
import { db } from "../lib/firebase";
import { CreateUserProfileData, UserProfile } from "../types/user";

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

        const userRef = doc(db, "users", userId);

        // Try to get from cache first
        try {
          const userDoc = await getDocFromCache(userRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            return {
              ...data,
              id: userDoc.id,
              createdAt: data.createdAt.toDate(),
              updatedAt: data.updatedAt.toDate(),
            } as UserProfile;
          }
        } catch (cacheErr) {
          // Cache miss, will fetch from server
          console.log(
            "Cache miss for user profile, fetching from server:",
            cacheErr
          );
        }

        // Fallback to server
        const userDoc = await getDoc(userRef);
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

      const usersQuery = query(collection(db, "users"));

      // Try cache first
      try {
        const cachedSnapshot = await getDocsFromCache(usersQuery);
        if (!cachedSnapshot.empty) {
          return cachedSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              createdAt: data.createdAt.toDate(),
              updatedAt: data.updatedAt.toDate(),
            } as UserProfile;
          });
        }
      } catch (cacheErr) {
        console.log(
          "Cache miss for all users, fetching from server:",
          cacheErr
        );
      }

      // Fallback to server
      const querySnapshot = await getDocs(usersQuery);
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

        // Try cache first
        try {
          const cachedSnapshot = await getDocsFromCache(q);
          if (!cachedSnapshot.empty) {
            return cachedSnapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                ...data,
                id: doc.id,
                createdAt: data.createdAt.toDate(),
                updatedAt: data.updatedAt.toDate(),
              } as UserProfile;
            });
          }
        } catch (cacheErr) {
          console.log(
            "Cache miss for user search, fetching from server:",
            cacheErr
          );
        }

        // Fallback to server
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
