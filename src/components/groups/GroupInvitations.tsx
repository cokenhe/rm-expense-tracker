import { useEffect, useState } from "react";
import { useGroups } from "../../hooks/useGroups";
import { GroupInvitation } from "../../types/group";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

export function GroupInvitations() {
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const { getGroupInvitations, respondToInvitation, loading, error } =
    useGroups();
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      const groupInvitations = await getGroupInvitations();
      setInvitations(groupInvitations);
    } catch (err) {
      console.error("Failed to load invitations:", err);
    }
  };

  const handleResponse = async (invitationId: string, accept: boolean) => {
    setResponding(invitationId);
    try {
      await respondToInvitation(invitationId, accept ? "accepted" : "declined");
      // Remove the invitation from the list
      setInvitations((prev) =>
        prev.filter((invitation) => invitation.id !== invitationId)
      );
    } catch (err) {
      console.error("Failed to respond to invitation:", err);
    } finally {
      setResponding(null);
    }
  };

  if (invitations.length === 0 && !loading) {
    return null; // Don't render anything if there are no invitations
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Group Invitations</h2>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error.message}
        </p>
      )}

      <div className="grid gap-3">
        {invitations.map((invitation) => (
          <Card key={invitation.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">
                  You've been invited to join a group
                </p>
                <p className="text-sm text-gray-500">
                  Invitation sent{" "}
                  {new Date(invitation.createdAt.toDate()).toLocaleDateString()}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleResponse(invitation.id, false)}
                  disabled={loading || responding === invitation.id}
                >
                  {responding === invitation.id ? "Declining..." : "Decline"}
                </Button>
                <Button
                  onClick={() => handleResponse(invitation.id, true)}
                  disabled={loading || responding === invitation.id}
                >
                  {responding === invitation.id ? "Accepting..." : "Accept"}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
