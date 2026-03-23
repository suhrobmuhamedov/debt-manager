import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';

type AboutSheetMode = 'about' | 'privacy';

type AboutSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: AboutSheetMode;
};

export const AboutSheet = ({ open, onOpenChange, mode }: AboutSheetProps) => {
  const { t } = useTranslation();
  const isAbout = mode === 'about';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl border-gray-200 bg-white px-4 pb-6 dark:border-gray-800 dark:bg-gray-900">
        <SheetHeader className="px-0">
          <SheetTitle>{isAbout ? t('profile.about') : t('profile.privacyPolicy')}</SheetTitle>
          <SheetDescription>
            {isAbout ? t('profile.aboutDescription') : t('profile.privacyDescription')}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-1">
          {isAbout ? (
            <>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/60">
                <p className="text-base font-semibold text-gray-900 dark:text-white">{t('profile.appName')}</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">v1.0.0</p>
              </div>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <p>{t('profile.aboutDescription')}</p>
                <p><span className="font-medium">{t('profile.developer')}:</span> SUHROB</p>
                <p><span className="font-medium">{t('profile.channel')}:</span> @qarzdaftarim</p>
              </div>
              <Button asChild className="w-full">
                <a href="https://t.me/qarzdaftarim" target="_blank" rel="noreferrer">
                  {t('common.open')}
                </a>
              </Button>
            </>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-300">
              <p>{t('profile.privacyDescription')}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
