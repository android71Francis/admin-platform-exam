import { useQuery } from '@tanstack/react-query';
import type { AuthMeResponse } from '@exam/types';
import { api } from '../lib/axios';
import { useOrg } from '../context/OrgContext';

export const usePermission = () => {
  const { activeOrg } = useOrg();

  const { data } = useQuery({
    queryKey: ['auth-me', activeOrg?.id],
    queryFn: async () => (await api.get<AuthMeResponse>('/auth/me')).data,
    enabled: !!activeOrg,
  });

  return {
    role: data?.membership?.role ?? null,
    canWrite: data?.membership?.role === 'FULL',
    canRead: !!data?.membership,
  };
};
