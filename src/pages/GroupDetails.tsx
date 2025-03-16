import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ExpenseList from "../components/expenses/ExpenseList";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useExpenses } from "../hooks/useExpenses";
import { useGroups } from "../hooks/useGroups";
import { Expense, UserBalance } from "../types/expense";
import { Group } from "../types/group";

export default function GroupDetails() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { getGroupById } = useGroups();
  const { getExpenses, calculateBalances } = useExpenses();
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<UserBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGroupData = useCallback(async () => {
    if (!groupId) return;

    try {
      setLoading(true);
      setError(null);

      const [groupData, groupExpenses, groupBalances] = await Promise.all([
        getGroupById(groupId),
        getExpenses(groupId),
        calculateBalances(groupId),
      ]);

      if (!groupData) {
        throw new Error("Group not found");
      }

      setGroup(groupData);
      setExpenses(groupExpenses);
      setBalances(groupBalances);
    } catch (err) {
      console.error("Error loading group data:", err);
      setError("Failed to load group data");
    } finally {
      setLoading(false);
    }
  }, [groupId, getGroupById, getExpenses, calculateBalances]);

  useEffect(() => {
    loadGroupData();
  }, [loadGroupData]);

  if (loading) {
    return (
      <div className="container px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="container px-4 py-8">
        <div className="text-center text-destructive">
          <p>{error || "Group not found"}</p>
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="mt-4"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center px-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mr-4"
          >
            ← Back
          </Button>
          <h1 className="text-lg font-semibold">{group.name}</h1>
          <div className="ml-auto flex items-center space-x-4">
            <Button
              onClick={() => navigate(`/groups/${groupId}/expense/new`)}
              className="bg-green-600 hover:bg-green-700"
            >
              Add Expense
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8">
        <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Group Summary</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Expenses
                  </p>
                  <p className="text-2xl font-bold">
                    ${totalExpenses.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Members</p>
                  <p className="text-2xl font-bold">{group.members.length}</p>
                </div>
              </div>
            </Card>

            <ExpenseList expenses={expenses} />
          </div>

          <div>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Balances</h3>
              <div className="space-y-3">
                {balances.map((balance) => (
                  <div
                    key={balance.userId}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm">
                      {balance.displayName || balance.email}
                    </span>
                    <span
                      className={`font-medium ${
                        balance.balance > 0
                          ? "text-green-600"
                          : balance.balance < 0
                          ? "text-red-600"
                          : ""
                      }`}
                    >
                      {balance.balance > 0
                        ? `Owes $${balance.balance.toFixed(2)}`
                        : balance.balance < 0
                        ? `Owed $${Math.abs(balance.balance).toFixed(2)}`
                        : "Settled"}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
