import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

export const TelegramOnly = () => {
  const botUsername = import.meta.env.VITE_BOT_USERNAME || 'Qarznazoratibot';

  const openInTelegram = () => {
    window.open(`https://t.me/${botUsername}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📱</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Bu ilova faqat Telegram orqali ishlaydi
            </h1>
            <p className="text-gray-600">
              Quyidagi tugmani bosib oching:
            </p>
          </div>

          <Button
            onClick={openInTelegram}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            size="lg"
          >
            Telegram da ochish
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
