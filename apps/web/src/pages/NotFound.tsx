import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '../components/ui/button';
import { useLocation } from 'wouter';

export const NotFound = () => {
  const [, setLocation] = useLocation();

  return (
    <AppLayout>
      <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Sahifa topilmadi</h1>
        <p className="text-gray-600 mb-6">Siz qidirgan sahifa mavjud emas</p>
        <Button
          onClick={() => setLocation('/')}
          className="bg-blue-500 hover:bg-blue-600"
        >
          Bosh sahifaga qaytish
        </Button>
      </div>
    </AppLayout>
  );
};
