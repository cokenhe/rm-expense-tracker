import { FirebaseError } from "firebase/app";

export type ErrorType = "auth" | "database" | "network" | "unknown";

export interface MappedError {
  type: ErrorType;
  message: string;
  code?: string;
}

const authErrorMessages: Record<string, string> = {
  "auth/invalid-email": "The email address is not valid.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/user-not-found": "No account found with this email.",
  "auth/wrong-password": "Incorrect password.",
  "auth/email-already-in-use": "An account already exists with this email.",
  "auth/weak-password": "Password should be at least 6 characters long.",
  "auth/operation-not-allowed": "This operation is not allowed.",
  "auth/network-request-failed":
    "A network error occurred. Please check your connection.",
  "auth/popup-closed-by-user": "Sign in was cancelled.",
  "auth/unauthorized-domain": "This domain is not authorized.",
  "auth/timeout": "The operation has timed out.",
};

const databaseErrorMessages: Record<string, string> = {
  "permission-denied": "You don't have permission to perform this action.",
  unavailable: "The service is currently unavailable.",
  "data-loss": "Unrecoverable data loss or corruption.",
  "invalid-argument": "Invalid data provided.",
};

export function mapFirebaseError(error: unknown): MappedError {
  if (error instanceof FirebaseError) {
    // Auth errors
    if (error.code.startsWith("auth/")) {
      return {
        type: "auth",
        message: authErrorMessages[error.code] || "Authentication failed.",
        code: error.code,
      };
    }

    // Database errors
    if (error.code in databaseErrorMessages) {
      return {
        type: "database",
        message: databaseErrorMessages[error.code],
        code: error.code,
      };
    }

    // Network errors
    if (error.code === "network-request-failed") {
      return {
        type: "network",
        message: "A network error occurred. Please check your connection.",
        code: error.code,
      };
    }
  }

  // Handle non-Firebase errors or unknown error types
  const message =
    error instanceof Error ? error.message : "An unexpected error occurred.";
  return {
    type: "unknown",
    message,
    code: "unknown",
  };
}
