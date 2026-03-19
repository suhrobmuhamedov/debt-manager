import { useModalStore } from '../../store/modalStore';

export const AddPaymentModal = () => {
  const { close } = useModalStore();

  return (
    <div className='fixed inset-0 bg-black/50 flex items-end z-50'>
      <div className='bg-white w-full rounded-t-lg p-6 space-y-4'>
        <h2 className='text-xl font-bold'>To\'lov qo\'shish</h2>
        <p className='text-gray-600'>Bu sahifa tez orada tayyor bo\'ladi</p>
        <button
          onClick={close}
          className='w-full bg-gray-200 hover:bg-gray-300 text-gray-900 py-2 rounded-lg'
        >
          Yopish
        </button>
      </div>
    </div>
  );
};