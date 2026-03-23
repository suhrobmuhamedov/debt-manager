import { create } from 'zustand';

export type ModalType =
  | 'CREATE_DEBT'
  | 'EDIT_DEBT'
  | 'DELETE_DEBT'
  | 'CREATE_CONTACT'
  | 'EDIT_CONTACT'
  | 'ADD_PAYMENT'
  | 'DEBT_CONFIRMATION';

interface ModalStore {
  type: ModalType | null;
  data?: Record<string, unknown>;
  open: (type: ModalType, data?: Record<string, unknown>) => void;
  close: () => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  type: null,
  data: undefined,
  open: (type, data) => set({ type, data }),
  close: () => set({ type: null, data: undefined }),
}));
