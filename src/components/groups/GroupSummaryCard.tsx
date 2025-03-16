import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../contexts/ToastContext";
import { useGroups } from "../../hooks/useGroups";
import { Group } from "../../types/group";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";

interface GroupSummaryProps {
  group: Group;
  totalAmount: number;
  recentExpenseCount: number;
}

export function GroupSummaryCard({
  group,
  totalAmount,
  recentExpenseCount,
}: GroupSummaryProps) {
  const navigate = useNavigate();
  const { inviteMember } = useGroups();
  const { toast } = useToast();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;

    try {
      setInviting(true);
      await inviteMember(group.id, inviteEmail.trim());
      toast({
        title: "Success",
        description: "Invitation sent successfully",
      });
      setInviteEmail("");
      setShowInvite(false);
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{group.name}</span>
          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/groups/${group.id}`)}
            >
              View Details
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-2xl font-bold">${totalAmount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Members</p>
            <p className="text-2xl font-bold">{group.members.length}</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm text-muted-foreground">Recent Activity</p>
          <p className="text-sm">
            {recentExpenseCount > 0
              ? `${recentExpenseCount} expense${
                  recentExpenseCount === 1 ? "" : "s"
                } in the last 30 days`
              : "No recent expenses"}
          </p>
        </div>

        <div className="mt-4 space-y-4">
          {showInvite && (
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter email to invite"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={inviting}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleInvite}
                disabled={inviting}
              >
                {inviting ? "Inviting..." : "Send"}
              </Button>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowInvite(!showInvite)}
            >
              {showInvite ? "Cancel" : "Invite Member"}
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => navigate(`/groups/${group.id}/expense/new`)}
            >
              Add Expense
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
