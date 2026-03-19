import { useRoute } from 'wouter';
import { AppLayout } from '../components/layout/AppLayout';

export const DebtDetail = () => {
  const [match, params] = useRoute('/debts/:id');

  if (!match) return null;

  const debtId = params?.id;

  return (
    <AppLayout>
      <div className='p-4 space-y-4'>
        <h1 className='text-2xl font-bold text-gray-900'>Qarz tafsilotlari</h1>
        <p className='text-gray-600'>Qarz ID: {debtId}</p>
        <p className='text-gray-600 mt-4'>Bu sahifa tez orada tayyor bo'ladi</p>
      </div>
    </AppLayout>
  );
};
