'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignsApi } from '@/services/campaigns';
import { ApiError } from '@/services/api';

export function useCampaign(id: string) {
  const queryClient = useQueryClient();

  const { data, isLoading: loading, error } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignsApi.getOne(id),
    enabled: !!id,
  });

  const generateMutation = useMutation({
    mutationFn: ({ contactId }: { contactId: string }) => 
      campaignsApi.generate(id, contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
    },
  });

  return {
    data,
    loading,
    error: error instanceof ApiError ? error.message : error?.message || null,
    generateMutation,
  };
}
