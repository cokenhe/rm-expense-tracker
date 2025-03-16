import { useState } from "react";
import { useToast } from "../../contexts/ToastContext";
import { useGroups } from "../../hooks/useGroups";
import { mapFirebaseError } from "../../lib/errorMapping";
import { CreateGroupData } from "../../types/group";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface GroupFormProps {
  onSubmit: () => void;
  onCancel: () => void;
}

const MAX_GROUP_NAME_LENGTH = 50;

export function GroupForm({ onSubmit, onCancel }: GroupFormProps) {
  const [name, setName] = useState("");
  const [localError, setLocalError] = useState("");
  const { createGroup, loading } = useGroups();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (!name.trim()) {
      setLocalError("Please enter a group name");
      return;
    }

    if (name.trim().length > MAX_GROUP_NAME_LENGTH) {
      setLocalError(
        `Group name cannot exceed ${MAX_GROUP_NAME_LENGTH} characters`
      );
      return;
    }

    const data: CreateGroupData = {
      name: name.trim(),
    };

    try {
      await createGroup(data);
      toast({
        title: "Success",
        description: "Group created successfully",
      });
      onSubmit();
    } catch (err) {
      console.error("Failed to create group:", err);
      const mappedError = mapFirebaseError(err);
      setLocalError(mappedError.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          Group Name
        </label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter group name (max 50 characters)"
          required
          maxLength={MAX_GROUP_NAME_LENGTH}
          className="mt-1"
        />
      </div>

      {localError && (
        <p className="text-sm text-destructive" role="alert">
          {localError}
        </p>
      )}

      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Group"}
        </Button>
      </div>
    </form>
  );
}
