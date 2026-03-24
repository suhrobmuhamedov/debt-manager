import axios from 'axios';

const serverUrl = process.env.SERVER_URL || 'http://localhost:3001';

const internalClient = axios.create({
  baseURL: serverUrl,
  timeout: 12000,
  headers: {
    'x-internal-api-key': process.env.INTERNAL_API_KEY,
  },
});

type ConfirmationDetailsResponse =
  | {
      isValid: true;
      isExpired: false;
      creatorFirstName: string;
      amount: number;
      currency: string;
      returnDate: string;
      typeLabel: string;
      status: 'pending';
    }
  | {
      isValid: false;
      isExpired: boolean;
      status?: 'not_required' | 'pending' | 'confirmed' | 'denied';
    };

export const getConfirmationDetails = async (token: string): Promise<ConfirmationDetailsResponse> => {
  const response = await internalClient.get(`/api/internal/confirmation/${token}`);
  return response.data as ConfirmationDetailsResponse;
};

export const confirmDebtByToken = async (payload: {
  token: string;
  telegramId: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}) => {
  const response = await internalClient.post('/api/internal/confirm-debt', payload);
  return response.data as { success: boolean; receiverUserId: number };
};

export const denyDebtByToken = async (payload: {
  token: string;
  telegramId: string;
  denierName?: string;
}) => {
  const response = await internalClient.post('/api/internal/deny-debt', payload);
  return response.data as { success: boolean };
};
