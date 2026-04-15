import { toast } from 'sonner';

export const isDesignMode = import.meta.env.VITE_DESIGN_MODE === 'true';

export const showDesignModeToast = (message: string) => {
  toast.info(message);
};
