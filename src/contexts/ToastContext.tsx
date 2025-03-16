import * as React from "react";
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
} from "../components/ui/toast";

interface Toast {
  id: string;
  title?: string;
  description: string;
  variant?: "default" | "destructive";
}

interface ToastContextType {
  toast: (props: Omit<Toast, "id">) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(
  undefined
);

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastContextProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback(
    ({ title, description, variant = "default" }: Omit<Toast, "id">) => {
      setToasts((currentToasts) => [
        ...currentToasts,
        { id: Math.random().toString(), title, description, variant },
      ]);
    },
    []
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id)
    );
  }, []);

  const value = React.useMemo(() => ({ toast: addToast }), [addToast]);

  return (
    <ToastContext.Provider value={value}>
      <ToastProvider>
        {children}
        {toasts.map(({ id, title, description, variant }) => (
          <Toast
            key={id}
            variant={variant}
            onOpenChange={(open) => {
              if (!open) removeToast(id);
            }}
          >
            {title && <ToastTitle>{title}</ToastTitle>}
            <ToastDescription>{description}</ToastDescription>
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
