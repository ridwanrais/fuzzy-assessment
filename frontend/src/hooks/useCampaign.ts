'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignsApi, Campaign } from '@/services/campaigns';
import { ApiError } from '@/services/api';

export function useCampaign(id: string) {
  const queryClient = useQueryClient();

  const { data, isLoading: loading, error } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignsApi.getOne(id),
    enabled: !!id,
  });

  const generateMutation = useMutation({
    mutationFn: ({ contactId, overrideTemplate }: { contactId: string; overrideTemplate?: string }) => 
      campaignsApi.generate(id, contactId, overrideTemplate),
    onMutate: async ({ contactId }) => {
      await queryClient.cancelQueries({ queryKey: ['campaign', id] });
      const previousCampaign = queryClient.getQueryData<Campaign>(['campaign', id]);
      if (previousCampaign) {
        queryClient.setQueryData<Campaign>(['campaign', id], {
          ...previousCampaign,
          contacts: previousCampaign.contacts.map((c) =>
            c.contactId === contactId
              ? { ...c, status: 'pending', generatedMessage: undefined, error: undefined }
              : c
          ),
        });
      }
      return { previousCampaign };
    },
    onError: (err, variables, context) => {
      if (context?.previousCampaign) {
        queryClient.setQueryData(['campaign', id], context.previousCampaign);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
    },
  });

  const attachMutation = useMutation({
    mutationFn: (contactIds: string[]) => campaignsApi.attachContacts(id, contactIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
    },
  });

  return {
    data,
    loading,
    error: error instanceof ApiError ? error.message : error?.message || null,
    generateMutation,
    attachMutation,
  };
}
