import { useNotification } from "@/components/NotificationProvider";

export const useSnackbar = () => {
  const { showNotification } = useNotification();

  return {
    success: (message: string) => showNotification(message, "success"),
    error: (message: string) => showNotification(message, "error"),
    warning: (message: string) => showNotification(message, "warning"),
    info: (message: string) => showNotification(message, "info"),
  };
};
