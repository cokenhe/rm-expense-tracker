import { Timestamp } from "firebase/firestore";

export interface Group {
  id: string;
  name: string;
  ownerId: string;
  members: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface GroupInvitation {
  id: string;
  groupId: string;
  inviterId: string;
  inviteeId: string;
  status: "pending" | "accepted" | "declined";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateGroupData {
  name: string;
}
