import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useExpenses } from "../../hooks/useExpenses";
import { useGroups } from "../../hooks/useGroups";
import { useUsers } from "../../hooks/useUsers";
import { mapFirebaseError } from "../../lib/errorMapping";
import { ExpenseFormData, Split, SplitType } from "../../types/expense";
import { Group } from "../../types/group";
import { UserProfile } from "../../types/user";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface ExpenseFormProps {
  groupId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ExpenseForm({
  groupId,
  onSuccess,
  onCancel,
}: ExpenseFormProps) {
  const { user } = useAuth();
  const { createExpense, loading } = useExpenses();
  const { getAllUsers } = useUsers();
  const { getUserGroups } = useGroups();
  const { toast } = useToast();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [participants, setParticipants] = useState<string[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    groupId || "none"
  );
  const [payer, setPayer] = useState<string>("");
  const [participatingMembers, setParticipatingMembers] = useState<string[]>(
    []
  );
  const [customShares, setCustomShares] = useState<{ [key: string]: number }>(
    {}
  );
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingUsers(true);
        const [allUsers, userGroups] = await Promise.all([
          getAllUsers(),
          getUserGroups(),
        ]);
        setUsers(allUsers.filter((u) => u.id !== user?.uid));
        setGroups(userGroups);
      } catch (err) {
        console.error("Failed to load data:", err);
        toast({
          title: "Error",
          description: "Failed to load users and groups",
          variant: "destructive",
        });
      } finally {
        setLoadingUsers(false);
      }
    };

    loadData();
  }, [getAllUsers, getUserGroups, user?.uid, toast]);

  // Set initial payer to current user
  useEffect(() => {
    if (user?.uid) {
      setPayer(user.uid);
    }
  }, [user?.uid]);

  // Update participants when group selection changes
  useEffect(() => {
    if (selectedGroupId && selectedGroupId !== "none") {
      const group = groups.find((g) => g.id === selectedGroupId);
      if (group) {
        setParticipants(group.members);
        setParticipatingMembers(group.members);
        setCustomShares({});
      }
    } else {
      setParticipants([]);
      setParticipatingMembers([]);
    }
  }, [selectedGroupId, groups]);

  const validateForm = (): string | undefined => {
    if (!description.trim()) {
      return "Please enter a description";
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return "Please enter a valid amount";
    }

    if (participatingMembers.length === 0) {
      return "Please select at least one participant";
    }

    if (splitType === "custom") {
      const totalShares = Object.values(customShares).reduce(
        (a, b) => a + b,
        0
      );
      if (totalShares === 0) {
        return "Total shares must be greater than 0";
      }
    }

    return undefined;
  };

  const calculateSplits = (): Split[] => {
    const numAmount = parseFloat(amount);

    if (splitType === "equal") {
      const activeParticipants = participatingMembers.length;
      if (activeParticipants === 0) return [];
      const splitAmount = numAmount / activeParticipants;
      return participatingMembers.map((userId) => ({
        userId,
        amount: splitAmount,
      }));
    } else {
      const totalShares = Object.values(customShares).reduce(
        (a, b) => a + b,
        0
      );
      if (totalShares === 0) return [];
      const amountPerShare = numAmount / totalShares;
      return Object.entries(customShares).map(([userId, shares]) => ({
        userId,
        amount: shares * amountPerShare,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const validationError = validateForm();
      if (validationError) {
        toast({
          title: "Validation Error",
          description: validationError,
          variant: "destructive",
        });
        return;
      }

      const numAmount = parseFloat(amount);
      const splits = calculateSplits();

      const expenseData: ExpenseFormData = {
        description: description.trim(),
        amount: numAmount,
        splitType,
        splits,
        participants: participatingMembers,
        groupId: selectedGroupId === "none" ? undefined : selectedGroupId,
        payerId: payer,
      };

      await createExpense(expenseData);
      toast({
        title: "Success",
        description: "Expense created successfully",
      });
      onSuccess?.();

      // Reset form
      setDescription("");
      setAmount("");
      setSplitType("equal");
      setParticipants([]);
      setParticipatingMembers([]);
      setCustomShares({});
      setSelectedGroupId("none");
      if (user?.uid) {
        setPayer(user.uid);
      }
    } catch (err) {
      console.error("Failed to create expense:", err);
      const mappedError = mapFirebaseError(err);
      toast({
        title: "Error",
        description: mappedError.message,
        variant: "destructive",
      });
    }
  };

  if (loadingUsers) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-muted-foreground">Loading users...</div>
      </div>
    );
  }

  const getUserDisplayName = (userId: string) => {
    if (userId === user?.uid)
      return user.displayName + " - " + user.email + " (You)";
    const foundUser = users.find((u) => u.id === userId);
    return foundUser
      ? foundUser.displayName + " - " + foundUser.email
      : "Unknown User";
  };

  const totalShares = Object.values(customShares).reduce((a, b) => a + b, 0);
  const amountPerShare = totalShares > 0 ? parseFloat(amount) / totalShares : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Expense</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            {!groupId && (
              <>
                <label className="text-sm font-medium">Group</label>
                <Select
                  value={selectedGroupId}
                  onValueChange={setSelectedGroupId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No group</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Payer</label>
            <Select value={payer} onValueChange={setPayer}>
              <SelectTrigger>
                <SelectValue placeholder="Select payer" />
              </SelectTrigger>
              <SelectContent>
                {selectedGroupId === "none" ? (
                  <>
                    <SelectItem value={user?.uid || ""}>
                      {user?.displayName + " - " + user?.email} (You)
                    </SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u?.displayName + " - " + u.email}
                      </SelectItem>
                    ))}
                  </>
                ) : (
                  <>
                    {user &&
                      groups
                        .find((g) => g.id === selectedGroupId)
                        ?.members.includes(user.uid) && (
                        <SelectItem value={user.uid}>
                          {user.displayName + " - " + user.email} (You)
                        </SelectItem>
                      )}
                    {users
                      .filter((u) =>
                        groups
                          .find((g) => g.id === selectedGroupId)
                          ?.members.includes(u.id)
                      )
                      .map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u?.displayName + " - " + u.email}
                        </SelectItem>
                      ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium mb-2">Split Type</div>
            <RadioGroup
              value={splitType}
              onValueChange={(value: SplitType) => {
                setSplitType(value);
                setCustomShares({});
              }}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="equal" id="equal" />
                <label htmlFor="equal" className="text-sm">
                  Split Equally
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <label htmlFor="custom" className="text-sm">
                  Custom Split
                </label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <div className="text-sm font-medium">
              {splitType === "equal"
                ? "Participating Members"
                : "Custom Split Shares"}
            </div>
            {participants.map((participantId) => (
              <div key={participantId} className="flex items-center space-x-2">
                <span className="text-sm w-50 truncate">
                  {getUserDisplayName(participantId)}
                </span>
                {splitType === "equal" ? (
                  <input
                    type="checkbox"
                    checked={participatingMembers.includes(participantId)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setParticipatingMembers([
                          ...participatingMembers,
                          participantId,
                        ]);
                      } else {
                        setParticipatingMembers(
                          participatingMembers.filter(
                            (id) => id !== participantId
                          )
                        );
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                ) : (
                  <div className="flex items-center space-x-2 flex-1">
                    <Input
                      type="number"
                      placeholder="Shares"
                      value={customShares[participantId] || ""}
                      onChange={(e) => {
                        const shares = parseInt(e.target.value) || 0;
                        setCustomShares({
                          ...customShares,
                          [participantId]: shares,
                        });
                      }}
                      min="0"
                      step="1"
                      className="w-24"
                    />
                    {amountPerShare > 0 && customShares[participantId] > 0 && (
                      <span className="text-sm text-muted-foreground">
                        ($
                        {(
                          amountPerShare * (customShares[participantId] || 0)
                        ).toFixed(2)}
                        )
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
            {splitType === "custom" && (
              <div className="text-sm text-muted-foreground">
                Total shares: {totalShares} (${amountPerShare.toFixed(2)} per
                share)
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Expense"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
