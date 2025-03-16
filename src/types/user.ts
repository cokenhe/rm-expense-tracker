export interface UserProfile {
  id: string;
  uid: string;
  email: string;
  displayName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserProfileData {
  email: string;
  displayName?: string;
}
