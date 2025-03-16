import { useEffect, useState } from "react";
import { useGroups } from "../../hooks/useGroups";
import { Group } from "../../types/group";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { GroupForm } from "./GroupForm";

export function GroupList() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState<string | null>(null); // groupId when inviting
  const { getUserGroups, inviteMember, loading, error } = useGroups();

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const userGroups = await getUserGroups();
      setGroups(userGroups);
    } catch (err) {
      console.error("Failed to load groups:", err);
    }
  };

  const handleInvite = async (groupId: string) => {
    if (!inviteEmail.trim()) return;

    setInviting(groupId);
    try {
      await inviteMember(groupId, inviteEmail.trim());
      setInviteEmail("");
    } catch (err) {
      console.error("Failed to invite member:", err);
    } finally {
      setInviting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Groups</h2>
        <Button onClick={() => setShowForm(true)}>Create New Group</Button>
      </div>

      {showForm && (
        <Card className="p-4">
          <GroupForm
            onSubmit={() => {
              setShowForm(false);
              loadGroups();
            }}
            onCancel={() => setShowForm(false)}
          />
        </Card>
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error.message}
        </p>
      )}

      <div className="grid gap-4">
        {groups.map((group) => (
          <Card key={group.id} className="p-4">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold">{group.name}</h3>
                <span className="text-sm text-gray-500">
                  {group.members.length} members
                </span>
              </div>

              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter email to invite"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={() => handleInvite(group.id)}
                  disabled={loading || inviting === group.id}
                >
                  {inviting === group.id ? "Inviting..." : "Invite"}
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {groups.length === 0 && !loading && (
          <p className="text-center text-gray-500">
            You haven't created or joined any groups yet.
          </p>
        )}
      </div>
    </div>
  );
}
