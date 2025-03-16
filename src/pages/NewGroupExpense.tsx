import { useNavigate, useParams } from "react-router-dom";
import ExpenseForm from "../components/expenses/ExpenseForm";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

export default function NewGroupExpense() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();

  const handleCancel = () => {
    navigate(`/groups/${groupId}`);
  };

  const handleSuccess = () => {
    navigate(`/groups/${groupId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center px-4">
          <Button variant="ghost" onClick={handleCancel} className="mr-4">
            ← Back
          </Button>
          <h1 className="text-lg font-semibold">New Expense</h1>
        </div>
      </header>

      <div className="container max-w-2xl mx-auto p-4">
        <Card className="p-4">
          <ExpenseForm
            groupId={groupId}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </Card>
      </div>
    </div>
  );
}
