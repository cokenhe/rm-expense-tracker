import { useState } from "react";
import { CreateGroupData } from "../../types/group";
import { useGroups } from "../../hooks/useGroups";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface GroupFormProps {
  onSubmit: () => void;
  onCancel: () => void;
}

export function GroupForm({ onSubmit, onCancel }: GroupFormProps) {
  const [name, setName] = useState("");
  const { createGroup, loading, error } = useGroups();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const data: CreateGroupData = {
      name: name.trim(),
    };

    try {
      await createGroup(data);
      onSubmit();
    } catch (err) {
      // Error state is handled by useGroups
      console.error("Failed to create group:", err);
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
          placeholder="Enter group name"
          required
          className="mt-1"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error.message}
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
