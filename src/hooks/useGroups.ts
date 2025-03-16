import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useCallback, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../lib/firebase";
import { CreateGroupData, Group, GroupInvitation } from "../types/group";

export function useGroups() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const createGroup = useCallback(
    async (data: CreateGroupData): Promise<void> => {
      if (!user) throw new Error("User must be logged in");

      try {
        setLoading(true);
        setError(null);

        const groupRef = doc(collection(db, "groups"));
        const now = Timestamp.now();

        await setDoc(groupRef, {
          ...data,
          id: groupRef.id,
          ownerId: user.uid,
          members: [user.uid],
          createdAt: now,
          updatedAt: now,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to create group")
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const getGroupById = useCallback(
    async (groupId: string): Promise<Group | null> => {
      try {
        setLoading(true);
        setError(null);

        const groupDoc = await getDoc(doc(db, "groups", groupId));

        if (!groupDoc.exists()) {
          return null;
        }

        return {
          ...groupDoc.data(),
          id: groupDoc.id,
        } as Group;
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to get group"));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getUserGroups = useCallback(async (): Promise<Group[]> => {
    if (!user) throw new Error("User must be logged in");

    try {
      setLoading(true);
      setError(null);

      const q = query(
        collection(db, "groups"),
        where("members", "array-contains", user.uid),
        limit(100)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as Group[];
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to get user groups")
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const inviteMember = useCallback(
    async (groupId: string, email: string): Promise<void> => {
      if (!user) throw new Error("User must be logged in");

      try {
        setLoading(true);
        setError(null);

        // Find user by email
        const usersQuery = await getDocs(
          query(collection(db, "users"), where("email", "==", email))
        );

        if (usersQuery.empty) {
          throw new Error("User not found");
        }

        const inviteeId = usersQuery.docs[0].id;

        // Check if user is already a member
        const group = await getGroupById(groupId);
        if (group?.members.includes(inviteeId)) {
          throw new Error("User is already a member of this group");
        }

        // Check for existing invitation
        const invitationsQuery = await getDocs(
          query(
            collection(db, "groupInvitations"),
            where("groupId", "==", groupId),
            where("inviteeId", "==", inviteeId),
            where("status", "==", "pending")
          )
        );

        if (!invitationsQuery.empty) {
          throw new Error("User has already been invited to this group");
        }

        // Create invitation
        const invitationRef = doc(collection(db, "groupInvitations"));
        const now = Timestamp.now();

        await setDoc(invitationRef, {
          id: invitationRef.id,
          groupId,
          inviterId: user.uid,
          inviteeId,
          status: "pending",
          createdAt: now,
          updatedAt: now,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to invite member")
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user, getGroupById]
  );

  const getGroupInvitations = useCallback(async (): Promise<
    GroupInvitation[]
  > => {
    if (!user) throw new Error("User must be logged in");

    try {
      setLoading(true);
      setError(null);

      const q = query(
        collection(db, "groupInvitations"),
        where("inviteeId", "==", user.uid),
        where("status", "==", "pending")
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as GroupInvitation[];
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to get invitations")
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const respondToInvitation = useCallback(
    async (
      invitationId: string,
      status: "accepted" | "declined"
    ): Promise<void> => {
      if (!user) throw new Error("User must be logged in");

      try {
        setLoading(true);
        setError(null);

        const invitationRef = doc(db, "groupInvitations", invitationId);
        const invitationDoc = await getDoc(invitationRef);

        if (!invitationDoc.exists()) {
          throw new Error("Invitation not found");
        }

        const invitation = invitationDoc.data() as GroupInvitation;

        // Update invitation status
        await updateDoc(invitationRef, {
          status,
          updatedAt: Timestamp.now(),
        });

        // If accepted, add user to group members
        if (status === "accepted") {
          await updateDoc(doc(db, "groups", invitation.groupId), {
            members: arrayUnion(user.uid),
            updatedAt: Timestamp.now(),
          });
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error("Failed to respond to invitation")
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const removeGroupMember = useCallback(
    async (groupId: string, userId: string): Promise<void> => {
      if (!user) throw new Error("User must be logged in");

      try {
        setLoading(true);
        setError(null);

        const group = await getGroupById(groupId);

        if (!group) {
          throw new Error("Group not found");
        }

        // Only group owner can remove members
        if (group.ownerId !== user.uid) {
          throw new Error("Only the group owner can remove members");
        }

        // Owner cannot be removed
        if (userId === group.ownerId) {
          throw new Error("Cannot remove the group owner");
        }

        await updateDoc(doc(db, "groups", groupId), {
          members: arrayRemove(userId),
          updatedAt: Timestamp.now(),
        });
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to remove member")
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user, getGroupById]
  );

  return {
    loading,
    error,
    createGroup,
    getGroupById,
    getUserGroups,
    inviteMember,
    getGroupInvitations,
    respondToInvitation,
    removeGroupMember,
  };
}
