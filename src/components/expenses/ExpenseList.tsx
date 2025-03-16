import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useUsers } from "../../hooks/useUsers";
import { Expense } from "../../types/expense";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";

interface ExpenseListProps {
  expenses: Expense[];
}

export default function ExpenseList({ expenses }: ExpenseListProps) {
  const { user } = useAuth();
  const { getUserProfile } = useUsers();
  const [showInvolvedOnly, setShowInvolvedOnly] = useState(false);
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadUserNames = async () => {
      const userIds = new Set<string>();
      expenses.forEach((expense) => {
        userIds.add(expense.payerId);
        expense.splits.forEach((split) => userIds.add(split.userId));
      });

      const names: Record<string, string> = {};
      await Promise.all(
        Array.from(userIds).map(async (userId) => {
          const profile = await getUserProfile(userId);
          if (profile) {
            names[userId] = profile.displayName || profile.email;
          }
        })
      );
      console.log("User names:", names);
      setUserNames(names);
    };

    loadUserNames();
  }, [expenses, getUserProfile]);

  const filteredAndGroupedExpenses = useMemo(() => {
    // Filter expenses if showInvolvedOnly is true
    const filtered = showInvolvedOnly
      ? expenses.filter(
          (expense) =>
            expense.payerId === user?.uid ||
            expense.splits.some((split) => split.userId === user?.uid)
        )
      : expenses;

    const sorted = [...filtered].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    const groups = new Map<string, Expense[]>();
    sorted.forEach((expense) => {
      const month = expense.createdAt.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
      if (!groups.has(month)) {
        groups.set(month, []);
      }
      groups.get(month)?.push(expense);
    });

    return Array.from(groups.entries());
  }, [expenses, showInvolvedOnly, user?.uid]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Expenses</CardTitle>
        <div className="flex items-center space-x-2">
          <Switch
            id="show-involved"
            checked={showInvolvedOnly}
            onCheckedChange={setShowInvolvedOnly}
          />
          <Label htmlFor="show-involved">Show involved only</Label>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {filteredAndGroupedExpenses.map(([month, monthExpenses]) => (
            <div key={month} className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground px-4">
                {month}
              </h3>
              {monthExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card text-card-foreground shadow-sm"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{expense.description}</p>
                    <div className="flex gap-2 text-sm text-muted-foreground">
                      <span>
                        {expense.createdAt.toLocaleDateString()} at{" "}
                        {expense.createdAt.toLocaleTimeString()}
                      </span>
                      <span>•</span>
                      <span>${expense.amount.toFixed(2)}</span>
                      {(expense.payerId === user?.uid ||
                        expense.splits.some(
                          (split) => split.userId === user?.uid
                        )) && (
                        <>
                          <span>•</span>
                          {expense.payerId === user?.uid ? (
                            <span className="text-green-600">
                              You lent $
                              {expense.splits
                                .filter((split) => split.userId !== user.uid)
                                .reduce((sum, split) => sum + split.amount, 0)
                                .toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-red-600">
                              You borrowed $
                              {expense.splits
                                .find((split) => split.userId === user?.uid)
                                ?.amount.toFixed(2) || 0}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Paid by:</span>{" "}
                      {user?.uid === expense.payerId ? (
                        <span className="text-blue-600">You</span>
                      ) : (
                        userNames[expense.payerId] || "Loading..."
                      )}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Split with: </span>
                      {expense.splits.map((split, index) => (
                        <React.Fragment key={split.userId}>
                          {index > 0 && ", "}
                          {split.userId === user?.uid ? (
                            <span className="text-blue-600">You</span>
                          ) : (
                            userNames[split.userId] || "Loading..."
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                  {(expense.payerId === user?.uid ||
                    expense.splits.some(
                      (split) => split.userId === user?.uid
                    )) && (
                    <div className="ml-4">
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        Involved
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
          {filteredAndGroupedExpenses.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              No expenses found
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
