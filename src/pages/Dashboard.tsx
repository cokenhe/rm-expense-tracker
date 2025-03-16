import { useState } from "react";
import ExpenseForm from "../components/expenses/ExpenseForm";
import ExpenseSummary from "../components/expenses/ExpenseSummary";
import { GroupInvitations } from "../components/groups/GroupInvitations";
import { GroupList } from "../components/groups/GroupList";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useAuth } from "../contexts/AuthContext";

export default function Dashboard() {
  const { signOut } = useAuth();
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center px-4">
          <h1 className="text-lg font-semibold">Expense Tracker</h1>
          <div className="ml-auto flex items-center space-x-4">
            <Button
              onClick={() => setShowExpenseForm(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              Add Expense
            </Button>
            <Button variant="outline" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="container px-4 py-8">
        <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
          <div className="space-y-8">
            {showExpenseForm ? (
              <Card className="p-4">
                <ExpenseForm
                  onSuccess={() => setShowExpenseForm(false)}
                  onCancel={() => setShowExpenseForm(false)}
                />
              </Card>
            ) : (
              <ExpenseSummary />
            )}
          </div>

          <div className="space-y-8">
            <GroupInvitations />
            <GroupList />
          </div>
        </div>
      </main>
    </div>
  );
}
