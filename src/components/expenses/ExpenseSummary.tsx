import { useCallback, useEffect, useState } from "react";
import { useExpenses } from "../../hooks/useExpenses";
import { useGroups } from "../../hooks/useGroups";
import { Expense, UserBalance } from "../../types/expense";
import { Group } from "../../types/group";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import ExpenseList from "./ExpenseList";

export default function ExpenseSummary() {
  const {
    getExpenses,
    calculateBalances,
    loading: hookLoading,
  } = useExpenses();
  const { getUserGroups } = useGroups();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<UserBalance[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGroups = useCallback(async () => {
    try {
      const userGroups = await getUserGroups();
      setGroups(userGroups);
    } catch (err) {
      console.error("Error loading groups:", err);
      setError("Failed to load groups");
    }
  }, [getUserGroups]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Loading expenses and balances...");
      const fetchedExpenses = await getExpenses(
        selectedGroupId === "all" ? undefined : selectedGroupId
      );
      const calculatedBalances = await calculateBalances(
        selectedGroupId === "all" ? undefined : selectedGroupId
      );

      console.log("Fetched expenses:", fetchedExpenses);
      console.log("Calculated balances:", calculatedBalances);

      setExpenses(fetchedExpenses);
      setBalances(calculatedBalances);
    } catch (err) {
      console.error("Error loading summary:", err);
      setError("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [getExpenses, calculateBalances, selectedGroupId]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPaid = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  if (loading || hookLoading) {
    return (
      <div className="grid gap-4">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 w-24 bg-muted rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-4 w-16 bg-muted rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium block mb-2">
          Filter by Group
        </label>
        <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
          <SelectTrigger>
            <SelectValue placeholder="All expenses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All expenses</SelectItem>
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedGroupId !== "all"
                ? `Total Paid in ${
                    groups.find((g) => g.id === selectedGroupId)?.name
                  }`
                : "Total Paid"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${totalPaid.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {selectedGroupId !== "all"
                ? `Balances in ${
                    groups.find((g) => g.id === selectedGroupId)?.name
                  }`
                : "Balances"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
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
                      ? `Owes you $${balance.balance.toFixed(2)}`
                      : balance.balance < 0
                      ? `You owe $${Math.abs(balance.balance).toFixed(2)}`
                      : "Settled"}
                  </span>
                </div>
              ))}
              {balances.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No active balances
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <ExpenseList expenses={expenses} />
    </div>
  );
}
