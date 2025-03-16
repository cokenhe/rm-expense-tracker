import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { useCallback, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../lib/firebase";
import { Expense, ExpenseFormData, Split, UserBalance } from "../types/expense";
import { UserProfile } from "../types/user";
import { useUsers } from "./useUsers";

export function useExpenses() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const { getUserProfile } = useUsers();

  const createExpense = useCallback(
    async (data: ExpenseFormData): Promise<void> => {
      if (!user) throw new Error("User must be authenticated");

      try {
        setLoading(true);
        setError(null);

        // Verify group membership if creating a group expense
        if (data.groupId) {
          const groupDoc = await getDoc(doc(db, "groups", data.groupId));
          if (!groupDoc.exists()) {
            throw new Error("Group not found");
          }
          const groupData = groupDoc.data();
          if (!groupData.members.includes(user.uid)) {
            throw new Error("You are not a member of this group");
          }
        }

        const now = Timestamp.now();
        const expenseData = {
          payerId: user.uid,
          amount: data.amount,
          description: data.description,
          splits: data.splits,
          participants: data.participants,
          splitType: data.splitType,
          groupId: data.groupId,
          createdAt: now,
          updatedAt: now,
        };

        await addDoc(collection(db, "expenses"), expenseData);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to create expense")
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const getExpenses = useCallback(
    async (groupId?: string): Promise<Expense[]> => {
      if (!user) throw new Error("User must be authenticated");

      try {
        setLoading(true);
        setError(null);

        // Build the query based on groupId
        let expensesQuery;
        if (groupId) {
          expensesQuery = query(
            collection(db, "expenses"),
            where("groupId", "==", groupId),
            orderBy("createdAt", "desc")
          );
        } else {
          expensesQuery = query(
            collection(db, "expenses"),
            where("participants", "array-contains", user.uid),
            orderBy("createdAt", "desc")
          );
        }

        const snapshot = await getDocs(expensesQuery);
        // Get all expenses first
        const expenseDocs = snapshot.docs;

        // Fetch payer info for all expenses
        const payerProfiles = await Promise.all(
          [...new Set(expenseDocs.map((doc) => doc.data().payerId))].map(
            (payerId) => getUserProfile(payerId)
          )
        );

        // Create a map of payer profiles for quick lookup
        const payerMap = new Map(
          payerProfiles.map((profile) => [profile?.id, profile])
        );

        let expenses = expenseDocs.map((doc) => {
          const data = doc.data();
          const payerProfile = payerMap.get(data.payerId);
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
            payerName: payerProfile
              ? payerProfile.displayName || payerProfile.email
              : "Unknown User",
          };
        }) as Expense[];

        // If groupId is provided, filter for that group
        if (groupId) {
          // First verify user is a member of the group
          const groupDoc = await getDoc(doc(db, "groups", groupId));
          if (!groupDoc.exists()) {
            throw new Error("Group not found");
          }
          const groupData = groupDoc.data();
          if (!groupData.members.includes(user.uid)) {
            throw new Error("You are not a member of this group");
          }

          expenses = expenses.filter((expense) => expense.groupId === groupId);
        }

        console.log("Fetching expenses for user:", user.uid);

        console.log("Fetched expenses:", expenses);
        return expenses;
      } catch (err) {
        console.error("Error fetching expenses:", err);
        setError(
          err instanceof Error ? err : new Error("Failed to fetch expenses")
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const calculateBalances = useCallback(
    async (groupId?: string): Promise<UserBalance[]> => {
      if (!user) throw new Error("User must be authenticated");

      try {
        setLoading(true);
        const expenses = await getExpenses(groupId);
        const balanceMap = new Map<string, number>();
        const userProfiles = new Map<string, UserProfile>();
        const relevantExpenses = groupId
          ? expenses.filter((expense) => expense.groupId === groupId)
          : expenses.filter((expense) => !expense.groupId);

        // First, collect all unique user IDs
        const userIds = new Set<string>();
        relevantExpenses.forEach((expense) => {
          userIds.add(expense.payerId);
          expense.splits.forEach((split) => userIds.add(split.userId));
        });

        // Initialize balance map for all users
        userIds.forEach((id) => {
          if (id !== user.uid) {
            balanceMap.set(id, 0);
          }
        });

        // Fetch all user profiles
        await Promise.all(
          Array.from(userIds).map(async (userId) => {
            const profile = await getUserProfile(userId);
            if (profile) {
              userProfiles.set(userId, profile);
            }
          })
        );

        // Calculate balances
        relevantExpenses.forEach((expense) => {
          if (expense.payerId === user.uid) {
            // Current user paid
            expense.splits.forEach((split) => {
              if (split.userId !== user.uid) {
                const currentBalance = balanceMap.get(split.userId) || 0;
                balanceMap.set(split.userId, currentBalance + split.amount);
              }
            });
          } else if (
            expense.splits.some((split) => split.userId === user.uid)
          ) {
            // Current user owes
            const userSplit = expense.splits.find(
              (split) => split.userId === user.uid
            );
            if (userSplit) {
              const currentBalance = balanceMap.get(expense.payerId) || 0;
              balanceMap.set(
                expense.payerId,
                currentBalance - userSplit.amount
              );
            }
          }
        });

        // Convert to array of UserBalance objects
        const balances = Array.from(balanceMap.entries())
          .map(([userId, balance]): UserBalance | null => {
            const profile = userProfiles.get(userId);
            return profile
              ? {
                  userId,
                  email: profile.email,
                  displayName: profile.displayName || null,
                  balance,
                }
              : null;
          })
          .filter((balance): balance is UserBalance => balance !== null);

        return balances;
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to calculate balances")
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user, getExpenses, getUserProfile]
  );

  const calculateSplitAmounts = useCallback(
    (total: number, participants: string[]): Split[] => {
      const splitAmount = total / participants.length;
      return participants.map((userId) => ({
        userId,
        amount: splitAmount,
      }));
    },
    []
  );

  return {
    loading,
    error,
    createExpense,
    getExpenses,
    calculateBalances,
    calculateSplitAmounts,
  };
}
