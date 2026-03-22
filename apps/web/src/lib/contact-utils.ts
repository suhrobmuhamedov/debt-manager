export const getInitials = (name: string): string => {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return '?';

  return parts
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
};

export const getAvatarColor = (name: string): string => {
  const palette = [
    'bg-sky-100 text-sky-800',
    'bg-emerald-100 text-emerald-800',
    'bg-amber-100 text-amber-800',
    'bg-rose-100 text-rose-800',
    'bg-indigo-100 text-indigo-800',
    'bg-teal-100 text-teal-800',
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }

  return palette[Math.abs(hash) % palette.length];
};

export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('998') && cleaned.length === 12) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10, 12)}`;
  }

  if (phone.startsWith('+')) return phone;
  return cleaned;
};

export const normalizePhone = (phone: string): string => {
  const cleaned = phone.replace(/\s+/g, '');
  return cleaned;
};

export const isValidPhone = (phone: string): boolean => {
  return /^\+?\d{7,15}$/.test(normalizePhone(phone));
};
