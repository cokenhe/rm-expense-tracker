import { useCallback, useEffect, useState } from "react";
import { GroupInvitations } from "../components/groups/GroupInvitations";
import { GroupSummaryCard } from "../components/groups/GroupSummaryCard";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useAuth } from "../contexts/AuthContext";
import { useExpenses } from "../hooks/useExpenses";
import { useGroups } from "../hooks/useGroups";
import { Group } from "../types/group";

interface GroupSummary extends Group {
  totalAmount: number;
  recentExpenseCount: number;
}

export default function Dashboard() {
  const { signOut } = useAuth();
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const { getUserGroups } = useGroups();
  const { getExpenses } = useExpenses();

  const loadGroupSummaries = useCallback(async () => {
    try {
      setLoading(true);
      const userGroups = await getUserGroups();

      // Get expenses for each group
      const groupsWithSummary = await Promise.all(
        userGroups.map(async (group) => {
          const groupExpenses = await getExpenses(group.id);
          const totalAmount = groupExpenses.reduce(
            (sum, exp) => sum + exp.amount,
            0
          );

          // Count expenses in last 30 days
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const recentExpenseCount = groupExpenses.filter(
            (exp) => new Date(exp.createdAt) > thirtyDaysAgo
          ).length;

          return {
            ...group,
            totalAmount,
            recentExpenseCount,
          };
        })
      );

      setGroups(groupsWithSummary);
    } catch (err) {
      console.error("Failed to load groups:", err);
    } finally {
      setLoading(false);
    }
  }, [getUserGroups, getExpenses]);

  useEffect(() => {
    loadGroupSummaries();
  }, [loadGroupSummaries]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center px-4">
          <h1 className="text-lg font-semibold">Expense Tracker</h1>
          <div className="ml-auto flex items-center space-x-4">
            <Button variant="outline" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8">
        <div className="grid gap-8">
          <GroupInvitations />

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Your Groups</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {loading ? (
                <>
                  <Card className="animate-pulse">
                    <div className="h-48" />
                  </Card>
                  <Card className="animate-pulse">
                    <div className="h-48" />
                  </Card>
                </>
              ) : groups.length > 0 ? (
                groups.map((group) => (
                  <GroupSummaryCard
                    key={group.id}
                    group={group}
                    totalAmount={group.totalAmount}
                    recentExpenseCount={group.recentExpenseCount}
                  />
                ))
              ) : (
                <div className="col-span-2 text-center py-8">
                  <p className="text-muted-foreground">
                    You haven't created or joined any groups yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
