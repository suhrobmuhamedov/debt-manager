import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { getInitials, formatPhone } from '../../lib/contact-utils';

const gradients = [
  'from-sky-500 to-cyan-400',
  'from-emerald-500 to-teal-400',
  'from-fuchsia-500 to-pink-400',
  'from-amber-500 to-orange-400',
  'from-indigo-500 to-violet-400',
  'from-rose-500 to-red-400',
];

const getGradient = (name: string) => {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash << 5) - hash + name.charCodeAt(index);
    hash |= 0;
  }

  return gradients[Math.abs(hash) % gradients.length];
};

type User = {
  id: number;
  telegramId: string;
  firstName: string;
  lastName?: string | null;
  username?: string | null;
  phone?: string | null;
  languageCode?: string | null;
  createdAt?: string | null;
  photoUrl?: string | null;
};

type UserAvatarCardProps = {
  user: User;
  language: 'uz' | 'ru';
};

export const UserAvatarCard = ({ user, language }: UserAvatarCardProps) => {
  const { t } = useTranslation();
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || t('profile.userFallback');
  const joinedDate = user.createdAt
    ? new Intl.DateTimeFormat(language === 'ru' ? 'ru-RU' : 'uz-UZ', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date(user.createdAt))
    : null;

  return (
    <Card className="overflow-hidden border-gray-300 bg-white/90 shadow-sm dark:border-gray-600 dark:bg-gray-800/90">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {user.photoUrl ? (
            <img
              src={user.photoUrl}
              alt={fullName}
              className="h-20 w-20 rounded-full object-cover ring-2 ring-white/60 dark:ring-gray-800"
            />
          ) : (
            <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getGradient(fullName)}`}>
              <span className="text-2xl font-bold text-white">{getInitials(fullName)}</span>
            </div>
          )}

          <div className="min-w-0 flex-1 space-y-2">
            <div>
              <h1 className="truncate text-xl font-bold text-gray-900 dark:text-white">{fullName}</h1>
              {user.username ? (
                <p className="truncate text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
              ) : null}
            </div>

            {user.phone ? (
              <a href={`tel:${user.phone}`} className="flex items-center gap-2 text-sm text-gray-700 transition-colors hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
                <span aria-hidden>📞</span>
                <span>{formatPhone(user.phone)}</span>
              </a>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-xs">
                ID: {user.telegramId}
              </Badge>
              {joinedDate ? (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {t('profile.joinedAt')}: {joinedDate}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
