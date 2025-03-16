export interface User {
  id: string;
  email: string;
}

export interface Split {
  userId: string;
  amount: number;
}

export interface Expense {
  id: string;
  payerId: string;
  amount: number;
  description: string;
  splits: Split[];
  createdAt: Date;
  updatedAt: Date;
  groupId?: string; // Optional group context
}

export type SplitType = "equal" | "custom";

export interface UserBalance {
  userId: string;
  email: string;
  displayName?: string | null;
  balance: number; // Positive means they owe you, negative means you owe them
}

export interface ExpenseFormData {
  description: string;
  amount: number;
  splitType: SplitType;
  splits: Split[];
  participants: string[]; // Array of user IDs
  groupId?: string; // Optional group context
  payerId: string; // ID of the user who paid for the expense
}
