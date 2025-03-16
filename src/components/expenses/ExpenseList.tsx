import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useUsers } from "../../hooks/useUsers";
import { Expense } from "../../types/expense";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import ExpenseForm from "./ExpenseForm";

interface ExpenseListProps {
  expenses: Expense[];
  groupId?: string;
}

export default function ExpenseList({ expenses, groupId }: ExpenseListProps) {
  const { user } = useAuth();
  const { getUserProfile } = useUsers();
  const [showInvolvedOnly, setShowInvolvedOnly] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
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
      setUserNames(names);
    };

    loadUserNames();
  }, [expenses, getUserProfile]);

  const filteredAndGroupedExpenses = useMemo(() => {
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

  const getExpenseAmount = (expense: Expense) => {
    if (expense.payerId === user?.uid) {
      // Amount user will receive from others
      return expense.splits
        .filter((split) => split.userId !== user.uid)
        .reduce((sum, split) => sum + split.amount, 0);
    } else {
      // Amount user owes
      return (
        expense.splits.find((split) => split.userId === user?.uid)?.amount || 0
      );
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Expenses</CardTitle>
        <div className="flex items-center space-x-2">
          <div className="flex items-center gap-2">
            <Switch
              id="show-involved"
              checked={showInvolvedOnly}
              onCheckedChange={setShowInvolvedOnly}
              aria-label="Toggle show involved expenses only"
            />
            <Label htmlFor="show-involved">Show involved only</Label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {filteredAndGroupedExpenses.map(([month, monthExpenses]) => (
            <div key={month} className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground px-4">
                {month}
              </h3>
              {monthExpenses.map((expense) => {
                const isUserInvolved =
                  expense.payerId === user?.uid ||
                  expense.splits.some((split) => split.userId === user?.uid);
                const amount = getExpenseAmount(expense);
                const isUserPayer = expense.payerId === user?.uid;

                return (
                  <div
                    key={expense.id}
                    onClick={() => setEditingExpense(expense)}
                    className={`flex flex-col p-4 rounded-lg border ${
                      isUserInvolved
                        ? "bg-blue-50/50 border-blue-100"
                        : "bg-card"
                    } text-card-foreground shadow-sm cursor-pointer transition-colors hover:bg-blue-50/80`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setEditingExpense(expense);
                      }
                    }}
                    aria-label={`Edit expense: ${expense.description}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{expense.description}</p>
                          {isUserInvolved && (
                            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                              Involved
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {expense.createdAt.toLocaleString("default", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          Total: ${expense.amount.toFixed(2)}
                        </p>
                        {isUserInvolved && (
                          <p
                            className={`text-sm ${
                              isUserPayer ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {isUserPayer ? "You lent" : "You borrowed"}: $
                            {amount.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 text-sm">
                      <span className="font-medium">Paid by:</span>{" "}
                      {isUserPayer ? (
                        <span className="text-green-600">You</span>
                      ) : (
                        userNames[expense.payerId] || "Unknown"
                      )}
                    </div>
                    <div className="mt-1 text-sm">
                      <span className="font-medium">Split with: </span>
                      {expense.splits.map((split, index) => (
                        <React.Fragment key={split.userId}>
                          {index > 0 && ", "}
                          {split.userId === user?.uid ? (
                            <span className="text-blue-600">
                              You (${split.amount.toFixed(2)})
                            </span>
                          ) : (
                            <span>
                              {userNames[split.userId] || "Unknown"} ($
                              {split.amount.toFixed(2)})
                            </span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          {filteredAndGroupedExpenses.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              No expenses found
            </p>
          )}
        </div>
      </CardContent>
      {editingExpense && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setEditingExpense(null)}
        >
          <div
            className="bg-background rounded-lg w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <ExpenseForm
              groupId={groupId}
              expenseToEdit={editingExpense}
              onSuccess={() => {
                setEditingExpense(null);
              }}
              onCancel={() => setEditingExpense(null)}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
