"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";
import Icon from "@/components/Icon";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // If no context, fallback to console (for safety)
    return {
      showToast: (type: ToastType, message: string) => {
        console.log(`[${type}] ${message}`);
      }
    };
  }
  return context;
}

const toastConfig = {
  success: {
    icon: "check-circle" as const,
    bg: "bg-green-50",
    border: "border-green-200",
    iconColor: "text-green-500",
    textColor: "text-green-800",
  },
  error: {
    icon: "error" as const,
    bg: "bg-red-50",
    border: "border-red-200",
    iconColor: "text-red-500",
    textColor: "text-red-800",
  },
  warning: {
    icon: "info" as const,
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    iconColor: "text-yellow-500",
    textColor: "text-yellow-800",
  },
  info: {
    icon: "info" as const,
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconColor: "text-blue-500",
    textColor: "text-blue-800",
  },
};

function ToastItem({ toast, onClose }: { toast: ToastMessage; onClose: () => void }) {
  const config = toastConfig[toast.type];

  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${config.bg} ${config.border} animate-slide-in`}
    >
      <Icon name={config.icon} size="md" className={config.iconColor} />
      <p className={`flex-1 text-sm font-medium ${config.textColor}`}>{toast.message}</p>
      <button
        onClick={onClose}
        className="p-1 rounded-full hover:bg-white/50 transition-colors"
      >
        <Icon name="close" size="sm" className={config.iconColor} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [counter, setCounter] = useState(0);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = counter;
    setCounter((c) => c + 1);
    setToasts((prev) => [...prev, { id, type, message }]);
  }, [counter]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
