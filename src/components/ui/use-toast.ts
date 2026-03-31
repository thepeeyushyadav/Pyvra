// Shim: wraps Sonner's `toast` function to match the shadcn/ui `useToast` API.
// This allows components written for the old `use-toast` hook to work seamlessly
// with the Sonner-based toast system used by this project.

import { toast as sonnerToast } from "sonner";

type ToastOptions = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  className?: string;
};

export const toast = ({ title, description, variant }: ToastOptions) => {
  if (variant === "destructive") {
    sonnerToast.error(title, { description });
  } else {
    sonnerToast(title, { description });
  }
};

export function useToast() {
  return {
    toast
  };
}
