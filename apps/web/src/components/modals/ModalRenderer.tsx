import { useModalStore } from '../../store/modalStore';
import { CreateDebtModal } from './CreateDebtModal';
import { EditDebtModal } from './EditDebtModal';
import { DeleteDebtModal } from './DeleteDebtModal';
import { AddPaymentModal } from './AddPaymentModal';
import { CreateContactModal } from './CreateContactModal';
import { EditContactModal } from './EditContactModal';
import { DebtConfirmationModal } from './DebtConfirmationModal';

export const ModalRenderer = () => {
  const { type } = useModalStore();

  return (
    <>
      {type === 'CREATE_DEBT' && <CreateDebtModal />}
      {type === 'EDIT_DEBT' && <EditDebtModal />}
      {type === 'DELETE_DEBT' && <DeleteDebtModal />}
      {type === 'ADD_PAYMENT' && <AddPaymentModal />}
      {type === 'CREATE_CONTACT' && <CreateContactModal />}
      {type === 'EDIT_CONTACT' && <EditContactModal />}
      {type === 'DEBT_CONFIRMATION' && <DebtConfirmationModal />}
    </>
  );
};